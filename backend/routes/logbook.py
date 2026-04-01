from fastapi import APIRouter
from ..database import get_db
from ..models.logbook import LogEntryOut

router = APIRouter(prefix="/api/logs", tags=["logs"])


@router.get("/", response_model=list[LogEntryOut])
async def list_logs(search: str = "", filter_by: str = "all", limit: int = 200):
    if filter_by == "replied":
        query = """
        WITH ranked_replies AS (
            SELECT
                l.*,
                COALESCE(c.name, '') AS contact_name,
                COALESCE(c.email, '') AS recipient_email,
                ROW_NUMBER() OVER (
                    PARTITION BY COALESCE(l.contact_id::text, ''), COALESCE(NULLIF(l.thread_key, ''), l.id::text)
                    ORDER BY l.last_interaction_at DESC, l.created_at DESC
                ) AS row_num
            FROM email_logs l
            LEFT JOIN dataset_contacts c ON c.id = l.contact_id
            WHERE l.direction = 'received'
              AND l.needs_attention = TRUE
              AND (
                $1 = '' OR
                LOWER(COALESCE(c.email, '')) LIKE LOWER($2) OR
                LOWER(COALESCE(c.name, '')) LIKE LOWER($2) OR
                LOWER(COALESCE(l.subject, '')) LIKE LOWER($2) OR
                LOWER(COALESCE(l.body, '')) LIKE LOWER($2)
              )
        )
        SELECT *
        FROM ranked_replies
        WHERE row_num = 1
        ORDER BY last_interaction_at DESC
        LIMIT $3
        """
        values = [search.strip(), f"%{search.strip()}%", limit]
        async with get_db().acquire() as conn:
            rows = await conn.fetch(query, *values)
        return [
            LogEntryOut(
                id=str(row["id"]),
                dataset_id=str(row["dataset_id"]) if row["dataset_id"] else None,
                contact_id=str(row["contact_id"]) if row["contact_id"] else None,
                contact_name=row.get("contact_name", ""),
                recipient_email=row.get("recipient_email", ""),
                direction=row["direction"],
                subject=row["subject"],
                body=row["body"],
                rendered_html=row.get("rendered_html", ""),
                template_key=row.get("template_key", ""),
                status=row.get("status", ""),
                timestamp=row["created_at"],
                reply_received=row.get("reply_received", False),
                reply_content=row.get("reply_content", ""),
                reply_summary=row.get("reply_summary", ""),
                reply_suggestion=row.get("reply_suggestion", ""),
                last_interaction_time=row["last_interaction_at"],
                needs_attention=row.get("needs_attention", False),
            )
            for row in rows
        ]

    query = """
    SELECT l.*, COALESCE(c.name, '') AS contact_name, COALESCE(c.email, '') AS recipient_email
    FROM email_logs l
    LEFT JOIN dataset_contacts c ON c.id = l.contact_id
    WHERE (
        $1 = '' OR
        LOWER(COALESCE(c.email, '')) LIKE LOWER($2) OR
        LOWER(COALESCE(c.name, '')) LIKE LOWER($2) OR
        LOWER(COALESCE(l.subject, '')) LIKE LOWER($2)
    )
    """
    values = [search.strip(), f"%{search.strip()}%", limit]
    if filter_by == "needs_attention":
        query += " AND l.needs_attention = TRUE"
    elif filter_by in {"sent", "received"}:
        query += " AND l.direction = $4"
        values.append(filter_by)
    query += " ORDER BY l.last_interaction_at DESC LIMIT $3"

    async with get_db().acquire() as conn:
        rows = await conn.fetch(query, *values)
    return [
        LogEntryOut(
            id=str(row["id"]),
            dataset_id=str(row["dataset_id"]) if row["dataset_id"] else None,
            contact_id=str(row["contact_id"]) if row["contact_id"] else None,
            contact_name=row.get("contact_name", ""),
            recipient_email=row.get("recipient_email", ""),
            direction=row["direction"],
            subject=row["subject"],
            body=row["body"],
            rendered_html=row.get("rendered_html", ""),
            template_key=row.get("template_key", ""),
            status=row.get("status", ""),
            timestamp=row["created_at"],
            reply_received=row.get("reply_received", False),
            reply_content=row.get("reply_content", ""),
            reply_summary=row.get("reply_summary", ""),
            reply_suggestion=row.get("reply_suggestion", ""),
            last_interaction_time=row["last_interaction_at"],
            needs_attention=row.get("needs_attention", False),
        )
        for row in rows
    ]


@router.get("/sent-records")
async def list_sent_records(search: str = "", limit: int = 200):
    query = """
    WITH sent_threads AS (
        SELECT
            l.contact_id,
            COALESCE(NULLIF(l.thread_key, ''), 'no-subject') AS thread_key,
            COUNT(*) FILTER (WHERE l.direction = 'sent' AND l.status = 'sent') AS sent_count,
            COUNT(*) FILTER (WHERE l.direction = 'received') AS reply_count,
            COUNT(*) FILTER (WHERE l.direction = 'received' AND l.needs_attention = TRUE) AS pending_replies,
            MAX(l.last_interaction_at) FILTER (WHERE l.direction = 'sent') AS latest_sent_at,
            MAX(l.last_interaction_at) FILTER (WHERE l.direction = 'received') AS latest_reply_at
        FROM email_logs l
        GROUP BY l.contact_id, COALESCE(NULLIF(l.thread_key, ''), 'no-subject')
    ),
    latest_sent AS (
        SELECT DISTINCT ON (l.contact_id, COALESCE(NULLIF(l.thread_key, ''), 'no-subject'))
            l.dataset_id,
            l.contact_id,
            COALESCE(NULLIF(l.thread_key, ''), 'no-subject') AS thread_key,
            l.subject,
            l.body,
            l.created_at,
            l.last_interaction_at
        FROM email_logs l
        WHERE l.direction = 'sent'
        ORDER BY l.contact_id, COALESCE(NULLIF(l.thread_key, ''), 'no-subject'), l.last_interaction_at DESC, l.created_at DESC
    )
    SELECT
        ls.dataset_id,
        ls.contact_id,
        COALESCE(c.name, '') AS contact_name,
        COALESCE(c.email, '') AS recipient_email,
        ls.thread_key,
        COALESCE(ls.subject, '') AS subject,
        COALESCE(ls.body, '') AS body,
        st.sent_count,
        st.reply_count,
        st.pending_replies,
        st.latest_sent_at,
        st.latest_reply_at
    FROM latest_sent ls
    JOIN sent_threads st
      ON st.contact_id = ls.contact_id
     AND st.thread_key = ls.thread_key
    LEFT JOIN dataset_contacts c ON c.id = ls.contact_id
    WHERE (
        $1 = '' OR
        LOWER(COALESCE(c.email, '')) LIKE LOWER($2) OR
        LOWER(COALESCE(c.name, '')) LIKE LOWER($2) OR
        LOWER(COALESCE(ls.subject, '')) LIKE LOWER($2)
    )
    ORDER BY COALESCE(st.latest_reply_at, st.latest_sent_at) DESC NULLS LAST
    LIMIT $3
    """
    values = [search.strip(), f"%{search.strip()}%", limit]
    async with get_db().acquire() as conn:
        rows = await conn.fetch(query, *values)
    return [
        {
            "dataset_id": str(row["dataset_id"]) if row["dataset_id"] else None,
            "contact_id": str(row["contact_id"]) if row["contact_id"] else None,
            "contact_name": row.get("contact_name", ""),
            "recipient_email": row.get("recipient_email", ""),
            "thread_key": row["thread_key"],
            "subject": row["subject"],
            "body": row["body"],
            "sent_count": row["sent_count"] or 0,
            "reply_count": row["reply_count"] or 0,
            "pending_replies": row["pending_replies"] or 0,
            "latest_sent_at": row["latest_sent_at"],
            "latest_reply_at": row["latest_reply_at"],
        }
        for row in rows
    ]


@router.get("/{log_id}/thread")
async def get_thread(log_id: str):
    async with get_db().acquire() as conn:
        current = await conn.fetchrow("SELECT * FROM email_logs WHERE id = $1::uuid", log_id)
        if not current:
            return {"messages": []}
        rows = await conn.fetch(
            """
            SELECT l.*, COALESCE(c.name, '') AS contact_name, COALESCE(c.email, '') AS recipient_email
            FROM email_logs l
            LEFT JOIN dataset_contacts c ON c.id = l.contact_id
            WHERE l.contact_id = $1::uuid
              AND (
                COALESCE($2, '') = ''
                OR l.thread_key = $2
              )
            ORDER BY l.created_at ASC
            """,
            current["contact_id"],
            current.get("thread_key", ""),
        )
    return {
        "messages": [
            {
                "id": str(row["id"]),
                "direction": row["direction"],
                "subject": row["subject"],
                "body": row["body"],
                "rendered_html": row.get("rendered_html", ""),
                "timestamp": row["created_at"],
                "contact_name": row.get("contact_name", ""),
                "recipient_email": row.get("recipient_email", ""),
            }
            for row in rows
        ]
    }
