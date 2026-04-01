from fastapi import APIRouter, HTTPException
from ..database import get_db
from ..models.logbook import LogEntryOut

router = APIRouter(prefix="/api/logs", tags=["logs"])


THREAD_STATUS_SQL = """
CASE
    WHEN COUNT(*) FILTER (WHERE l.direction = 'received' AND l.needs_attention = TRUE) > 0 THEN 'pending'
    WHEN COUNT(*) FILTER (WHERE l.direction = 'received') > 0 THEN 'received'
    ELSE 'sent'
END
"""


def _row_to_log_entry(row) -> LogEntryOut:
    return LogEntryOut(
        id=str(row["id"]),
        dataset_id=str(row["dataset_id"]) if row["dataset_id"] else None,
        dataset_name=row.get("dataset_name", ""),
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
        thread_key=row.get("thread_key", ""),
    )


@router.get("/", response_model=list[LogEntryOut])
async def list_logs(
    search: str = "",
    filter_by: str = "all",
    dataset_id: str = "",
    user_query: str = "",
    limit: int = 200,
):
    if filter_by == "replied":
        filter_by = "pending"

    query = f"""
    WITH thread_status AS (
        SELECT
            l.contact_id,
            COALESCE(NULLIF(l.thread_key, ''), 'no-subject') AS thread_key,
            {THREAD_STATUS_SQL} AS thread_status
        FROM email_logs l
        GROUP BY l.contact_id, COALESCE(NULLIF(l.thread_key, ''), 'no-subject')
    ),
    ranked_replies AS (
        SELECT
            l.*,
            COALESCE(c.name, '') AS contact_name,
            COALESCE(c.email, '') AS recipient_email,
            COALESCE(d.name, '') AS dataset_name,
            ts.thread_status,
            ROW_NUMBER() OVER (
                PARTITION BY COALESCE(l.contact_id::text, ''), COALESCE(NULLIF(l.thread_key, ''), l.id::text)
                ORDER BY l.last_interaction_at DESC, l.created_at DESC
            ) AS row_num
        FROM email_logs l
        LEFT JOIN dataset_contacts c ON c.id = l.contact_id
        LEFT JOIN datasets d ON d.id = l.dataset_id
        JOIN thread_status ts
          ON ts.contact_id IS NOT DISTINCT FROM l.contact_id
         AND ts.thread_key = COALESCE(NULLIF(l.thread_key, ''), 'no-subject')
        WHERE l.direction = 'received'
          AND (
            $1 = '' OR
            LOWER(COALESCE(l.subject, '')) LIKE LOWER($2) OR
            LOWER(COALESCE(l.body, '')) LIKE LOWER($2)
          )
          AND (
            $3 = '' OR
            l.dataset_id = $3::uuid
          )
          AND (
            $4 = '' OR
            LOWER(COALESCE(c.email, '')) LIKE LOWER($5) OR
            LOWER(COALESCE(c.name, '')) LIKE LOWER($5)
          )
          AND (
            $6 = 'all'
            OR ts.thread_status = $6
          )
    )
    SELECT *
    FROM ranked_replies
    WHERE row_num = 1
    ORDER BY last_interaction_at DESC
    LIMIT $7
    """
    values = [
        search.strip(),
        f"%{search.strip()}%",
        dataset_id.strip(),
        user_query.strip(),
        f"%{user_query.strip()}%",
        filter_by.strip(),
        limit,
    ]
    async with get_db().acquire() as conn:
        rows = await conn.fetch(query, *values)
    return [_row_to_log_entry(row) for row in rows]


@router.get("/sent-records")
async def list_sent_records(
    search: str = "",
    dataset_id: str = "",
    status: str = "all",
    user_query: str = "",
    limit: int = 200,
):
    query = f"""
    WITH thread_rollup AS (
        SELECT
            l.dataset_id,
            l.contact_id,
            COALESCE(NULLIF(l.thread_key, ''), 'no-subject') AS thread_key,
            COUNT(*) FILTER (WHERE l.direction = 'sent' AND l.status = 'sent') AS sent_count,
            COUNT(*) FILTER (WHERE l.direction = 'received') AS reply_count,
            COUNT(*) FILTER (WHERE l.direction = 'received' AND l.needs_attention = TRUE) AS pending_replies,
            MAX(l.last_interaction_at) FILTER (WHERE l.direction = 'sent') AS latest_sent_at,
            MAX(l.last_interaction_at) FILTER (WHERE l.direction = 'received') AS latest_reply_at,
            {THREAD_STATUS_SQL} AS thread_status
        FROM email_logs l
        GROUP BY l.dataset_id, l.contact_id, COALESCE(NULLIF(l.thread_key, ''), 'no-subject')
    ),
    latest_sent AS (
        SELECT DISTINCT ON (l.contact_id, COALESCE(NULLIF(l.thread_key, ''), 'no-subject'))
            l.id,
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
        ls.id,
        ls.dataset_id,
        COALESCE(d.name, '') AS dataset_name,
        ls.contact_id,
        COALESCE(c.name, '') AS contact_name,
        COALESCE(c.email, '') AS recipient_email,
        ls.thread_key,
        COALESCE(ls.subject, '') AS subject,
        COALESCE(ls.body, '') AS body,
        tr.sent_count,
        tr.reply_count,
        tr.pending_replies,
        tr.latest_sent_at,
        tr.latest_reply_at,
        tr.thread_status AS status
    FROM latest_sent ls
    JOIN thread_rollup tr
      ON tr.contact_id = ls.contact_id
     AND tr.thread_key = ls.thread_key
    LEFT JOIN dataset_contacts c ON c.id = ls.contact_id
    LEFT JOIN datasets d ON d.id = ls.dataset_id
    WHERE (
        $1 = '' OR
        LOWER(COALESCE(ls.subject, '')) LIKE LOWER($2) OR
        LOWER(COALESCE(ls.body, '')) LIKE LOWER($2)
    )
      AND (
        $3 = '' OR
        ls.dataset_id = $3::uuid
      )
      AND (
        $4 = 'all' OR
        tr.thread_status = $4
      )
      AND (
        $5 = '' OR
        LOWER(COALESCE(c.email, '')) LIKE LOWER($6) OR
        LOWER(COALESCE(c.name, '')) LIKE LOWER($6)
      )
    ORDER BY COALESCE(tr.latest_reply_at, tr.latest_sent_at) DESC NULLS LAST
    LIMIT $7
    """
    values = [
        search.strip(),
        f"%{search.strip()}%",
        dataset_id.strip(),
        status.strip(),
        user_query.strip(),
        f"%{user_query.strip()}%",
        limit,
    ]
    async with get_db().acquire() as conn:
        rows = await conn.fetch(query, *values)
    return [
        {
            "id": str(row["id"]),
            "dataset_id": str(row["dataset_id"]) if row["dataset_id"] else None,
            "dataset_name": row.get("dataset_name", ""),
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
            "status": row["status"],
        }
        for row in rows
    ]


@router.post("/{log_id}/mark-received")
async def mark_thread_received(log_id: str):
    async with get_db().acquire() as conn:
        current = await conn.fetchrow("SELECT * FROM email_logs WHERE id = $1::uuid", log_id)
        if not current:
            raise HTTPException(404, "Log entry not found")
        await conn.execute(
            """
            UPDATE email_logs
            SET needs_attention = FALSE,
                last_interaction_at = last_interaction_at,
                status = CASE
                    WHEN direction = 'received' THEN 'received'
                    ELSE status
                END
            WHERE contact_id IS NOT DISTINCT FROM $1::uuid
              AND COALESCE(NULLIF(thread_key, ''), 'no-subject') = $2
              AND direction = 'received'
            """,
            current["contact_id"],
            current.get("thread_key") or "no-subject",
        )
    return {"message": "Thread marked as received"}


@router.get("/{log_id}/thread")
async def get_thread(log_id: str):
    async with get_db().acquire() as conn:
        current = await conn.fetchrow("SELECT * FROM email_logs WHERE id = $1::uuid", log_id)
        if not current:
            return {"messages": []}
        rows = await conn.fetch(
            """
            SELECT
                l.*,
                COALESCE(c.name, '') AS contact_name,
                COALESCE(c.email, '') AS recipient_email,
                COALESCE(d.name, '') AS dataset_name
            FROM email_logs l
            LEFT JOIN dataset_contacts c ON c.id = l.contact_id
            LEFT JOIN datasets d ON d.id = l.dataset_id
            WHERE l.contact_id = $1::uuid
              AND (
                COALESCE($2, '') = ''
                OR COALESCE(NULLIF(l.thread_key, ''), 'no-subject') = $2
              )
            ORDER BY l.created_at ASC
            """,
            current["contact_id"],
            current.get("thread_key") or "no-subject",
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
                "dataset_name": row.get("dataset_name", ""),
                "status": row.get("status", ""),
                "thread_key": row.get("thread_key", ""),
            }
            for row in rows
        ]
    }
