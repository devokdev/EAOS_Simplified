import asyncio
from fastapi import APIRouter
from ..database import get_db

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


async def _stats():
    pool = get_db()
    async with pool.acquire() as conn:
        contacts_total = await conn.fetchval("SELECT count(*) FROM contacts")
        emails_sent = await conn.fetchval("SELECT count(*) FROM emails WHERE direction = 'sent'")
        emails_received = await conn.fetchval("SELECT count(*) FROM emails WHERE direction = 'received'")
        campaigns_total = await conn.fetchval("SELECT count(*) FROM campaigns")
        campaigns_active = await conn.fetchval("SELECT count(*) FROM campaigns WHERE status = 'running'")
    return {
        "contacts": contacts_total,
        "emails_sent": emails_sent,
        "emails_received": emails_received,
        "campaigns_total": campaigns_total,
        "campaigns_active": campaigns_active,
    }


async def _recent_activity(limit: int = 20):
    pool = get_db()
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT $1", limit)
        
    return [
        {
            "action": row["action"],
            "recipient": row["recipient"],
            "status": row["status"],
            "timestamp": row["timestamp"].isoformat() if row.get("timestamp") else None,
        }
        for row in rows
    ]


async def _campaign_analytics():
    pool = get_db()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT id as _id, name, status,
                   COALESCE((metrics->>'emails_sent')::int, 0) as emails_sent,
                   COALESCE((metrics->>'replies')::int, 0) as replies,
                   COALESCE((metrics->>'conversions')::int, 0) as conversions
            FROM campaigns
        """)
        
    result = []
    for r in rows:
        emails = r["emails_sent"]
        replies = r["replies"]
        rate = (replies / emails * 100) if emails > 0 else 0
        result.append({
            "_id": str(r["_id"]),
            "name": r["name"],
            "status": r["status"],
            "emails_sent": emails,
            "replies": replies,
            "conversions": r["conversions"],
            "reply_rate": rate
        })
    return result


async def _top_contacts(limit: int = 10):
    pool = get_db()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT id, name, email, company, 
                   COALESCE((ai_profile->>'engagement_score')::float, 0) as engagement_score,
                   COALESCE((ai_profile->>'response_probability')::float, 0) as response_probability
            FROM contacts
            ORDER BY COALESCE((ai_profile->>'engagement_score')::float, 0) DESC
            LIMIT $1
        """, limit)
        
    return [
        {
            "id": str(r["id"]),
            "name": r["name"],
            "email": r["email"],
            "company": r["company"],
            "ai_profile": {
                "engagement_score": r["engagement_score"],
                "response_probability": r["response_probability"]
            }
        }
        for r in rows
    ]


async def _memory_logs(limit: int = 20):
    pool = get_db()
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM memory_logs ORDER BY timestamp DESC LIMIT $1", limit)
        
    return [
        {
            "id": str(row["id"]),
            "contact_id": str(row["contact_id"]),
            "interaction_summary": row["interaction_summary"],
            "sentiment": row["sentiment"],
            "recommended_action": row["recommended_action"],
            "timestamp": row["timestamp"].isoformat() if row.get("timestamp") else None,
        }
        for row in rows
    ]


@router.get("/stats")
async def get_stats():
    return await _stats()


@router.get("/overview")
async def dashboard_overview():
    stats, activity, contacts, memory, analytics = await asyncio.gather(
        _stats(),
        _recent_activity(limit=8),
        _top_contacts(limit=6),
        _memory_logs(limit=6),
        _campaign_analytics(),
    )
    return {
        "stats": stats,
        "recent_activity": activity,
        "top_contacts": contacts,
        "memory_logs": memory,
        "campaign_analytics": analytics,
    }


@router.get("/recent-activity")
async def recent_activity(limit: int = 20):
    return await _recent_activity(limit)


@router.get("/campaign-analytics")
async def campaign_analytics():
    return await _campaign_analytics()


@router.get("/top-contacts")
async def top_contacts(limit: int = 10):
    return await _top_contacts(limit)


@router.get("/memory-logs")
async def memory_logs(contact_id: str = None, limit: int = 20):
    if contact_id:
        pool = get_db()
        async with pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT * FROM memory_logs 
                WHERE contact_id = $1::uuid 
                ORDER BY timestamp DESC 
                LIMIT $2
            """, contact_id, limit)
            
        return [
            {
                "id": str(doc["id"]),
                "contact_id": str(doc["contact_id"]),
                "interaction_summary": doc.get("interaction_summary", ""),
                "sentiment": doc.get("sentiment", ""),
                "recommended_action": doc.get("recommended_action", ""),
                "timestamp": doc["timestamp"].isoformat() if doc.get("timestamp") else None,
            }
            for doc in rows
        ]
    return await _memory_logs(limit)
