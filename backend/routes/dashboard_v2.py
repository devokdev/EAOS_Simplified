from fastapi import APIRouter
from ..database import get_db

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/overview")
async def overview():
    async with get_db().acquire() as conn:
        datasets = await conn.fetchval("SELECT COUNT(*) FROM datasets")
        contacts = await conn.fetchval("SELECT COUNT(*) FROM dataset_contacts")
        total_sent = await conn.fetchval("SELECT COUNT(*) FROM email_logs WHERE direction = 'sent' AND status = 'sent'")
        replies = await conn.fetchval("SELECT COUNT(*) FROM email_logs WHERE direction = 'received'")
        needs_attention = await conn.fetchval("SELECT COUNT(*) FROM email_logs WHERE needs_attention = TRUE")
        recent_activity_rows = await conn.fetch(
            """
            SELECT action, recipient, status, timestamp
            FROM activity_logs
            ORDER BY timestamp DESC
            LIMIT 8
            """
        )
        recent_logs = await conn.fetch(
            """
            SELECT l.id, l.subject, l.direction, l.created_at, l.needs_attention, c.name, c.email
            FROM email_logs l
            LEFT JOIN dataset_contacts c ON c.id = l.contact_id
            ORDER BY l.last_interaction_at DESC
            LIMIT 8
            """
        )
    response_rate = round((replies / total_sent) * 100, 2) if total_sent else 0
    return {
        "stats": {
            "datasets": datasets,
            "contacts": contacts,
            "total_sent": total_sent,
            "replies": replies,
            "response_rate": response_rate,
            "needs_attention": needs_attention,
        },
        "recent_activity": [
            {
                "action": row["action"],
                "recipient": row["recipient"],
                "status": row["status"],
                "timestamp": row["timestamp"],
            }
            for row in recent_activity_rows
        ],
        "recent_logs": [
            {
                "id": str(row["id"]),
                "subject": row["subject"],
                "direction": row["direction"],
                "timestamp": row["created_at"],
                "needs_attention": row["needs_attention"],
                "contact_name": row.get("name", ""),
                "recipient_email": row.get("email", ""),
            }
            for row in recent_logs
        ],
    }
