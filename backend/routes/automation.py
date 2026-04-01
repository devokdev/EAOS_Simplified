import asyncio
from datetime import datetime
import html
import re
from fastapi import APIRouter, HTTPException
from starlette.concurrency import run_in_threadpool
from ..database import get_db
from ..models.logbook import BulkPreviewRequest, BulkSendRequest, ReplySuggestionRequest, SingleSendRequest
from ..services.gmail_service import fetch_inbox, send_email
from ..services.gemini_service import refine_email_copy, suggest_reply_with_context, summarize_reply_with_context
from ..services.templates_service import get_template, render_placeholders, wrap_with_template

router = APIRouter(prefix="/api/automation", tags=["automation"])

INBOX_SYNC_LIMIT = 10
INBOX_SYNC_SINCE_DAYS = 30
INBOX_SYNC_TIMEOUT_SECONDS = 45
_sync_lock = asyncio.Lock()


def _extract_latest_reply_text(raw_body: str) -> str:
    if not raw_body:
        return ""
    text = raw_body.replace("\r\n", "\n").strip()
    text = re.sub(r"(?is)^--[^\n]+\n(?:[^\n:]+:.*\n)+\n", "", text).strip()
    text = re.sub(r"(?is)\n--[^\n]+.*$", "", text).strip()
    lines = []
    for line in text.split("\n"):
        stripped = line.strip()
        if re.match(r"^On .+ wrote:$", stripped):
            break
        if stripped.startswith(">"):
            continue
        if re.match(r"^(mime-version|content-type|content-transfer-encoding):", stripped, flags=re.IGNORECASE):
            continue
        if stripped.startswith("--"):
            continue
        if stripped in {"-----Original Message-----", "From:", "Sent:", "Subject:", "To:"}:
            break
        lines.append(line)
    cleaned = "\n".join(lines).strip()
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned or text[:1000]


def _normalize_subject(subject: str) -> str:
    cleaned = (subject or "").strip()
    cleaned = re.sub(r"^(?:(?:re|fw|fwd)\s*:\s*)+", "", cleaned, flags=re.IGNORECASE)
    return re.sub(r"\s+", " ", cleaned).strip().lower()


def _resolve_thread_key(subject: str, provider_thread_key: str = "") -> str:
    return provider_thread_key or _normalize_subject(subject) or "no-subject"


def _fallback_reply_summary(reply_text: str) -> str:
    clean = " ".join(reply_text.split())
    if not clean:
        return "No clear reply content found."
    if "?" in clean:
        question = clean.split("?")[0].strip()
        return f"The recipient replied with a question: {question}?"
    if len(clean) <= 120:
        return f"The recipient replied: {clean}"
    return f"The recipient replied and shared: {clean[:117]}..."


def _fallback_reply_suggestion(contact_name: str, reply_text: str) -> str:
    clean = " ".join((reply_text or "").split()).strip()
    if not clean:
        return f"Hi {contact_name},\n\nThanks for your reply.\n\nBest,\nYour team"
    lower = clean.lower()
    if "haha" in lower or "lol" in lower:
        return (
            f"Hi {contact_name},\n\n"
            "Haha, got it. Thanks for the quick reply.\n\n"
            "If you want, I can send the next details here.\n\n"
            "Best,\nYour team"
        )
    if "when" in lower:
        return (
            f"Hi {contact_name},\n\n"
            "Thanks for asking. I can share the exact timing and details with you here.\n\n"
            "If helpful, I can send the full schedule in my next message.\n\n"
            "Best,\nYour team"
        )
    if "what" in lower:
        return (
            f"Hi {contact_name},\n\n"
            "Happy to clarify. Here is the quick context behind my earlier note.\n\n"
            "If you want, I can also explain it in a little more detail.\n\n"
            "Best,\nYour team"
        )
    if re.search(r"\b(yes|sure|sounds good|i accept|i can join)\b", lower):
        return (
            f"Hi {contact_name},\n\n"
            "Thanks for confirming. Glad to hear that.\n\n"
            "I will share the next details with you shortly.\n\n"
            "Best,\nYour team"
        )
    if "?" in clean:
        return (
            f"Hi {contact_name},\n\n"
            "Thanks for your reply. I will get back to you with the details shortly.\n\n"
            "Best,\nYour team"
        )
    return (
        f"Hi {contact_name},\n\n"
        "Thanks for your reply. I appreciate it.\n\n"
        "Happy to share more detail or answer any specific questions if that would be useful.\n\n"
        "Best,\nYour team"
    )


async def _count_open_reply_threads() -> int:
    async with get_db().acquire() as conn:
        return await conn.fetchval(
            """
            SELECT COUNT(*) FROM (
                SELECT id
                FROM (
                    SELECT
                        l.id,
                        ROW_NUMBER() OVER (
                            PARTITION BY COALESCE(l.contact_id::text, ''), COALESCE(NULLIF(l.thread_key, ''), l.id::text)
                            ORDER BY l.last_interaction_at DESC, l.created_at DESC
                        ) AS row_num
                    FROM email_logs l
                    WHERE l.direction = 'received'
                      AND l.needs_attention = TRUE
                ) ranked
                WHERE row_num = 1
            ) open_threads
            """
        )


def _build_thread_history(rows) -> str:
    parts = []
    for row in rows:
        direction = row["direction"]
        subject = row["subject"] or "(No subject)"
        body = " ".join((row["body"] or "").split())
        parts.append(f"[{direction}] {subject}: {body[:320]}")
    return " | ".join(parts)


def _build_thread_transcript(rows) -> str:
    messages = []
    for row in rows:
        direction = "You" if row["direction"] == "sent" else "Recipient"
        subject = row["subject"] or "(No subject)"
        body = (row["body"] or "").strip()
        if row["direction"] == "received":
            body = _extract_latest_reply_text(body)
        body = re.sub(r"\s+", " ", body).strip()
        messages.append(f"{direction} | Subject: {subject} | Message: {body[:600]}")
    return "\n".join(messages)


def _build_pending_reply_text(rows) -> str:
    pending = []
    for row in reversed(list(rows)):
        if row["direction"] == "sent":
            break
        cleaned = _extract_latest_reply_text(row.get("body", ""))
        if cleaned:
            pending.append(cleaned)
    pending.reverse()
    return "\n\n".join(pending).strip()


def _plain_to_html(text: str) -> str:
    escaped = html.escape(text or "")
    blocks = [block.strip() for block in escaped.split("\n\n") if block.strip()]
    if not blocks:
        return ""
    return "".join(f"<p style='margin:0 0 16px;'>{block.replace(chr(10), '<br />')}</p>" for block in blocks)


def _render_contact_content(template_key: str, subject: str, body: str, contact: dict):
    template = get_template(template_key)
    rendered_subject = render_placeholders(subject.strip(), name=contact.get("name", ""), email=contact.get("email", ""))
    rendered_body = render_placeholders(body.strip(), name=contact.get("name", ""), email=contact.get("email", ""))
    if template:
        rendered_output = wrap_with_template(template["body"], _plain_to_html(rendered_body), name=contact.get("name", ""), email=contact.get("email", ""))
    else:
        rendered_output = rendered_body
    return rendered_subject, rendered_body, rendered_output


@router.post("/preview")
async def preview_bulk_email(data: BulkPreviewRequest):
    async with get_db().acquire() as conn:
        dataset = await conn.fetchrow("SELECT * FROM datasets WHERE id = $1::uuid", data.dataset_id)
        if not dataset:
            raise HTTPException(404, "Dataset not found")
        if data.recipient_ids:
            first_contact = await conn.fetchrow(
                """
                SELECT * FROM dataset_contacts
                WHERE dataset_id = $1::uuid AND id = ANY($2::uuid[])
                ORDER BY created_at ASC
                LIMIT 1
                """,
                data.dataset_id,
                data.recipient_ids,
            )
            count = await conn.fetchval(
                """
                SELECT COUNT(*) FROM dataset_contacts
                WHERE dataset_id = $1::uuid AND id = ANY($2::uuid[])
                """,
                data.dataset_id,
                data.recipient_ids,
            )
        else:
            first_contact = await conn.fetchrow(
                "SELECT * FROM dataset_contacts WHERE dataset_id = $1::uuid ORDER BY created_at ASC LIMIT 1",
                data.dataset_id,
            )
            count = await conn.fetchval("SELECT COUNT(*) FROM dataset_contacts WHERE dataset_id = $1::uuid", data.dataset_id)
    if not first_contact or not count:
        raise HTTPException(400, "Dataset has no contacts")
    preview_subject = data.subject
    preview_body = data.body
    if data.improve_content:
        refined = await refine_email_copy(
            data.subject,
            data.body,
            data.improvement_notes,
            contact_name=first_contact.get("name", ""),
            contact_email=first_contact.get("email", ""),
            dataset_name=dataset.get("name", ""),
            recipient_count=count,
        )
        preview_subject = refined["subject"]
        preview_body = refined["body"]
    rendered_subject, rendered_body, rendered_output = _render_contact_content(
        data.template_key,
        preview_subject,
        preview_body if not data.custom_template_html else preview_body,
        dict(first_contact),
    )
    if data.custom_template_html:
        rendered_output = wrap_with_template(
            data.custom_template_html,
            _plain_to_html(rendered_body),
            name=first_contact.get("name", ""),
            email=first_contact.get("email", ""),
        )
    return {
        "dataset": {"id": str(dataset["id"]), "name": dataset["name"]},
        "contact_count": count,
        "subject": rendered_subject,
        "body": preview_body,
        "preview_contact": {"name": first_contact.get("name", ""), "email": first_contact["email"]},
        "rendered_html": rendered_output,
        "rendered_body": rendered_body,
        "template_key": data.template_key,
        "is_html": bool(data.template_key or data.custom_template_html),
    }


@router.post("/send")
async def send_bulk_email(data: BulkSendRequest):
    async with get_db().acquire() as conn:
        dataset = await conn.fetchrow("SELECT * FROM datasets WHERE id = $1::uuid", data.dataset_id)
        if not dataset:
            raise HTTPException(404, "Dataset not found")
        if data.recipient_ids:
            contacts = await conn.fetch(
                """
                SELECT * FROM dataset_contacts
                WHERE dataset_id = $1::uuid AND id = ANY($2::uuid[])
                ORDER BY created_at ASC
                """,
                data.dataset_id,
                data.recipient_ids,
            )
        else:
            contacts = await conn.fetch(
                "SELECT * FROM dataset_contacts WHERE dataset_id = $1::uuid ORDER BY created_at ASC",
                data.dataset_id,
            )
    if not contacts:
        raise HTTPException(400, "Dataset has no contacts")

    sent = 0
    failed = 0
    batch_size = max(1, min(data.batch_size, 100))
    pause_seconds = max(0, min(data.pause_seconds, 10))

    for index, contact in enumerate(contacts, start=1):
        source_subject = data.subject
        source_body = data.body
        thread_key = _resolve_thread_key(data.subject)
        if data.improve_content:
            refined = await refine_email_copy(
                data.subject,
                data.body,
                data.improvement_notes,
                contact_name=contact.get("name", ""),
                contact_email=contact.get("email", ""),
                dataset_name=dataset.get("name", ""),
                recipient_count=len(contacts),
            )
            source_subject = refined["subject"]
            source_body = refined["body"]
            thread_key = _resolve_thread_key(source_subject)
        rendered_subject, rendered_body, rendered_output = _render_contact_content(
            data.template_key,
            source_subject,
            source_body,
            dict(contact),
        )
        if data.custom_template_html:
            rendered_output = wrap_with_template(
                data.custom_template_html,
                _plain_to_html(rendered_body),
                name=contact.get("name", ""),
                email=contact.get("email", ""),
            )
        ok = await run_in_threadpool(
            send_email,
            contact["email"],
            rendered_subject,
            rendered_output if (data.template_key or data.custom_template_html) else rendered_body,
            bool(data.template_key or data.custom_template_html),
        )
        async with get_db().acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO email_logs (
                    dataset_id, contact_id, direction, subject, body, rendered_html, template_key,
                    status, created_at, last_interaction_at, thread_key
                )
                VALUES ($1::uuid, $2::uuid, 'sent', $3, $4, $5, $6, $7, $8, $8, $9)
                RETURNING id
                """,
                data.dataset_id,
                contact["id"],
                rendered_subject,
                rendered_body,
                rendered_output,
                data.template_key,
                "sent" if ok else "failed",
                datetime.utcnow(),
                thread_key,
            )
            await conn.execute(
                """
                INSERT INTO activity_logs (action, recipient, status, details)
                VALUES ($1, $2, $3, $4)
                """,
                "bulk_email_sent",
                contact["email"],
                "success" if ok else "failed",
                {"dataset_id": data.dataset_id, "email_log_id": str(row["id"])},
            )
        if ok:
            sent += 1
        else:
            failed += 1
        if index % batch_size == 0 and index < len(contacts):
            await asyncio.sleep(pause_seconds)

    return {"sent": sent, "failed": failed, "total": len(contacts), "batch_size": batch_size}


@router.post("/sync-inbox")
async def sync_inbox():
    if _sync_lock.locked():
        return {
            "checked": 0,
            "matched": 0,
            "new_replies": [],
            "awaiting_replies": await _count_open_reply_threads(),
            "message": "Inbox sync already in progress",
        }

    async with _sync_lock:
        try:
            inbox = await asyncio.wait_for(
                run_in_threadpool(fetch_inbox, INBOX_SYNC_LIMIT, INBOX_SYNC_SINCE_DAYS),
                timeout=INBOX_SYNC_TIMEOUT_SECONDS,
            )
        except TimeoutError:
            return {
                "checked": 0,
                "matched": 0,
                "new_replies": [],
                "awaiting_replies": await _count_open_reply_threads(),
                "message": "Inbox sync timed out",
            }
        matched = 0
        new_replies = []

        async with get_db().acquire() as conn:
            for message in inbox:
                sender = (message.get("from_email") or "").lower().strip()
                if not sender:
                    continue
                contact = await conn.fetchrow(
                    """
                    SELECT c.*, d.id AS dataset_id
                    FROM dataset_contacts c
                    JOIN datasets d ON d.id = c.dataset_id
                    WHERE LOWER(c.email) = $1
                    LIMIT 1
                    """,
                    sender,
                )
                if not contact:
                    continue

                thread_key = _resolve_thread_key(message.get("subject", ""), message.get("thread_key", ""))
                existing = await conn.fetchrow(
                    """
                    SELECT id FROM email_logs
                    WHERE contact_id = $1::uuid
                      AND direction = 'received'
                      AND (
                        ($2 <> '' AND provider_message_id = $2)
                        OR (
                          $2 = '' AND thread_key = $3 AND subject = $4 AND body = $5
                        )
                      )
                    """,
                    contact["id"],
                    message.get("message_id", ""),
                    thread_key,
                    message.get("subject", ""),
                    _extract_latest_reply_text(message.get("body", "")),
                )
                if existing:
                    continue

                cleaned_reply = _extract_latest_reply_text(message.get("body", ""))
                sent_anchor = await conn.fetchrow(
                    """
                    SELECT * FROM email_logs
                    WHERE contact_id = $1::uuid AND direction = 'sent' AND thread_key = $2
                    ORDER BY created_at DESC
                    LIMIT 1
                    """,
                    contact["id"],
                    thread_key,
                )
                if not sent_anchor:
                    continue
                thread_rows = await conn.fetch(
                    """
                    SELECT id, direction, subject, body, created_at
                    FROM email_logs
                    WHERE contact_id = $1::uuid AND thread_key = $2
                    ORDER BY created_at ASC
                    """,
                    contact["id"],
                    thread_key,
                )
                pending_reply_text = _build_pending_reply_text([*thread_rows, {"direction": "received", "subject": message.get("subject", ""), "body": cleaned_reply}])
                latest_pending_text = pending_reply_text or cleaned_reply
                thread_history = _build_thread_history([*thread_rows, {"direction": "received", "subject": message.get("subject", ""), "body": cleaned_reply}])
                reply_summary = await summarize_reply_with_context(
                    original_subject=message.get("subject", ""),
                    original_body=latest_pending_text,
                    history_summary=thread_history,
                )
                suggestion_text = _fallback_reply_suggestion(contact.get("name", "") or "there", latest_pending_text)
                inserted = await conn.fetchrow(
                    """
                    INSERT INTO email_logs (
                        dataset_id, contact_id, direction, subject, body, rendered_html, status,
                        provider_message_id, thread_key, reply_summary, reply_suggestion, needs_attention,
                        created_at, last_interaction_at
                    )
                    VALUES (
                        $1::uuid, $2::uuid, 'received', $3, $4, $4, 'received',
                        $5, $6, $7, $8, TRUE, $9, $9
                    )
                    RETURNING id
                    """,
                    contact["dataset_id"],
                    contact["id"],
                    message.get("subject", ""),
                    cleaned_reply,
                    message.get("message_id", ""),
                    thread_key,
                    reply_summary,
                    suggestion_text,
                    datetime.utcnow(),
                )
                await conn.execute(
                    """
                    UPDATE email_logs
                    SET reply_received = TRUE,
                        reply_content = $2,
                        reply_summary = $3,
                        reply_suggestion = $4,
                        needs_attention = TRUE,
                        last_interaction_at = $5
                    WHERE id = $1::uuid
                    """,
                    sent_anchor["id"],
                    latest_pending_text,
                    reply_summary,
                    suggestion_text,
                    datetime.utcnow(),
                )
                await conn.execute(
                    """
                    INSERT INTO activity_logs (action, recipient, status, details)
                    VALUES ($1, $2, $3, $4)
                    """,
                    "reply_detected",
                    sender,
                    "success",
                    {"email_log_id": str(inserted["id"])},
                )
                new_replies.append({"email": sender, "subject": message.get("subject", "")})
                matched += 1

        awaiting_replies = await _count_open_reply_threads()

    return {
        "checked": len(inbox),
        "matched": matched,
        "new_replies": new_replies,
        "awaiting_replies": awaiting_replies,
    }


@router.post("/reply-suggestion")
async def get_reply_suggestion(data: ReplySuggestionRequest):
    async with get_db().acquire() as conn:
        email_log = await conn.fetchrow(
            """
            SELECT l.*, c.name AS contact_name, c.email AS recipient_email
            FROM email_logs l
            LEFT JOIN dataset_contacts c ON c.id = l.contact_id
            WHERE l.id = $1::uuid
            """,
            data.email_log_id,
        )
        if not email_log:
            raise HTTPException(404, "Email log not found")
        history = await conn.fetch(
            """
            SELECT id, subject, body, direction, created_at, thread_key
            FROM email_logs
            WHERE contact_id = $1::uuid
              AND (
                COALESCE($2, '') = ''
                OR thread_key = $2
              )
            ORDER BY created_at ASC
            """,
            email_log["contact_id"],
            email_log.get("thread_key", ""),
        )
    latest_inbound_body = _build_pending_reply_text(history)
    if not latest_inbound_body:
        latest_inbound_body = _extract_latest_reply_text(email_log.get("reply_content") or email_log["body"])
    history_summary = _build_thread_history(history)
    thread_transcript = _build_thread_transcript(history)
    suggestion = await suggest_reply_with_context(
        contact_name=email_log.get("contact_name", "") or "there",
        company="",
        original_subject=email_log["subject"],
        original_body=latest_inbound_body,
        history_summary=history_summary,
        thread_transcript=thread_transcript,
        notes=f"{data.notes}\nUse the whole conversation thread to answer naturally.",
    )
    async with get_db().acquire() as conn:
        await conn.execute(
            "UPDATE email_logs SET reply_suggestion = $2 WHERE id = $1::uuid",
            data.email_log_id,
            suggestion.get("suggested_reply", ""),
        )
    return suggestion


@router.post("/send-single-reply")
async def send_single_reply(data: SingleSendRequest):
    async with get_db().acquire() as conn:
        anchor = await conn.fetchrow(
            """
            SELECT l.*, c.email AS recipient_email, c.dataset_id
            FROM email_logs l
            JOIN dataset_contacts c ON c.id = l.contact_id
            WHERE l.id = $1::uuid
            """,
            data.email_log_id,
        )
        if not anchor:
            raise HTTPException(404, "Email log not found")
    ok = await run_in_threadpool(send_email, anchor["recipient_email"], data.subject, data.body, False)
    if not ok:
        raise HTTPException(502, "Failed to send reply")
    async with get_db().acquire() as conn:
        await conn.execute(
            """
            INSERT INTO email_logs (
                dataset_id, contact_id, direction, subject, body, rendered_html, status,
                created_at, last_interaction_at, needs_attention, thread_key
            )
            VALUES ($1::uuid, $2::uuid, 'sent', $3, $4, $4, 'sent', $5, $5, FALSE, $6)
            """,
            anchor["dataset_id"],
            anchor["contact_id"],
            data.subject,
            data.body,
            datetime.utcnow(),
            anchor.get("thread_key") or _resolve_thread_key(data.subject),
        )
        await conn.execute(
            """
            UPDATE email_logs
            SET needs_attention = FALSE, last_interaction_at = $2
            WHERE id = $1::uuid
               OR (
                 contact_id = $3::uuid
                 AND thread_key = $4
                 AND direction = 'received'
                 AND created_at <= $2
               )
            """,
            data.email_log_id,
            datetime.utcnow(),
            anchor["contact_id"],
            anchor.get("thread_key") or _resolve_thread_key(anchor.get("subject", "")),
        )
    return {"message": "Reply sent"}
