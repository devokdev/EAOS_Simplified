from fastapi import APIRouter, HTTPException
from datetime import datetime
from ..database import get_db
from ..models.email_doc import (
    EmailCreate,
    EmailDraftOut,
    EmailDraftRequest,
    EmailOut,
    ReplySuggestionOut,
    ReplySuggestionRequest,
)
from ..services.gemini_service import analyze_email, generate_email_draft, suggest_reply_with_context
from ..services.gmail_service import send_email, fetch_inbox

router = APIRouter(prefix="/api/emails", tags=["emails"])


async def _safe_analyze_email(subject: str, body: str) -> dict:
    try:
        return await analyze_email(subject, body)
    except Exception:
        return {
            "summary": "",
            "intent": "Other",
            "tone": "Neutral",
            "priority": 5,
        }


@router.get("/", response_model=list[EmailOut])
async def list_emails(contact_id: str = None, limit: int = 50):
    pool = get_db()
    async with pool.acquire() as conn:
        if contact_id:
            rows = await conn.fetch("SELECT * FROM emails WHERE contact_id = $1::uuid ORDER BY timestamp DESC LIMIT $2", contact_id, limit)
        else:
            rows = await conn.fetch("SELECT * FROM emails ORDER BY timestamp DESC LIMIT $1", limit)
    return [EmailOut.from_db(dict(row)) for row in rows]


@router.post("/send", response_model=EmailOut, status_code=201)
async def send_and_store(data: EmailCreate):
    pool = get_db()
    async with pool.acquire() as conn:
        contact = await conn.fetchrow("SELECT * FROM contacts WHERE id = $1::uuid", data.contact_id)
        if not contact:
            raise HTTPException(404, "Contact not found")
            
    # Send via Gmail
    ok = send_email(
        to=contact.get("email", ""),
        subject=data.subject,
        body=data.body,
    )
    
    async with pool.acquire() as conn:
        await conn.execute("""
            INSERT INTO activity_logs (action, recipient, status)
            VALUES ($1, $2, $3)
        """, "email_sent", contact.get("email", ""), "success" if ok else "smtp_failed")
        
    if not ok:
        raise HTTPException(502, "Email send failed. Check Gmail configuration.")

    # Analyze with Gemini
    analysis = await _safe_analyze_email(data.subject, data.body)
    
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO emails (contact_id, direction, subject, body, ai_analysis, campaign_id)
            VALUES ($1::uuid, 'sent', $2, $3, $4, $5::uuid)
            RETURNING *
        """, data.contact_id, data.subject, data.body, analysis, data.campaign_id or None)
        
        metadata = contact.get("metadata", {})
        metadata["last_contacted"] = datetime.utcnow().isoformat()
        metadata["follow_up_count"] = metadata.get("follow_up_count", 0) + 1
        
        await conn.execute("""
            UPDATE contacts 
            SET metadata = $2 
            WHERE id = $1::uuid
        """, contact["id"], metadata)
        
    return EmailOut.from_db(dict(row))


@router.post("/generate-draft", response_model=EmailDraftOut)
async def generate_draft(data: EmailDraftRequest):
    pool = get_db()
    async with pool.acquire() as conn:
        contact = await conn.fetchrow("SELECT * FROM contacts WHERE id = $1::uuid", data.contact_id)
        if not contact:
            raise HTTPException(404, "Contact not found")
            
        recent_emails = await conn.fetch("""
            SELECT direction, subject, ai_analysis 
            FROM emails 
            WHERE contact_id = $1::uuid 
            ORDER BY timestamp DESC 
            LIMIT 3
        """, data.contact_id)

    history_summary = " | ".join(
        f"[{email.get('direction', '?')}] {email.get('subject', '')}: {email.get('ai_analysis', {}).get('summary', '')}"
        for email in recent_emails
    )
    profile_summary = (contact.get("ai_profile") or {}).get("summary", "")

    try:
        body = await generate_email_draft(
            contact_name=contact["name"],
            company=contact.get("company", ""),
            subject=data.subject,
            context=data.context,
            instructions=data.instructions,
            tags=contact.get("tags", []),
            profile_summary=profile_summary,
            history_summary=history_summary,
        )
    except Exception as exc:
        raise HTTPException(502, f"Draft generation failed: {exc}") from exc

    return EmailDraftOut(body=body)


@router.post("/analyze/{email_id}")
async def analyze_stored_email(email_id: str):
    pool = get_db()
    async with pool.acquire() as conn:
        doc = await conn.fetchrow("SELECT * FROM emails WHERE id = $1::uuid", email_id)
        if not doc:
            raise HTTPException(404, "Email not found")
            
        analysis = await analyze_email(doc["subject"], doc["body"])
        
        await conn.execute("""
            UPDATE emails 
            SET ai_analysis = $2 
            WHERE id = $1::uuid
        """, email_id, analysis)
        
    return {"email_id": email_id, "ai_analysis": analysis}


@router.post("/{email_id}/reply", response_model=ReplySuggestionOut)
async def ai_reply(email_id: str, data: ReplySuggestionRequest | None = None):
    pool = get_db()
    async with pool.acquire() as conn:
        doc = await conn.fetchrow("SELECT * FROM emails WHERE id = $1::uuid", email_id)
        if not doc:
            raise HTTPException(404, "Email not found")
            
        contact = await conn.fetchrow("SELECT * FROM contacts WHERE id = $1::uuid", doc["contact_id"])
        
        history_docs = await conn.fetch("""
            SELECT direction, subject, ai_analysis, body 
            FROM emails 
            WHERE contact_id = $1::uuid 
            ORDER BY timestamp DESC 
            LIMIT 6
        """, doc["contact_id"])

    history_summary = " | ".join(
        f"[{email.get('direction', '?')}] {email.get('subject', '')}: {email.get('ai_analysis', {}).get('summary', '') or email.get('body', '')[:140]}"
        for email in history_docs
    )
    try:
        reply = await suggest_reply_with_context(
            contact_name=contact["name"] if contact else "there",
            company=contact.get("company", "") if contact else "",
            original_subject=doc["subject"],
            original_body=doc["body"],
            history_summary=history_summary,
            notes=(data.notes if data else ""),
        )
    except Exception as exc:
        raise HTTPException(502, f"Reply suggestion failed: {exc}") from exc
    return ReplySuggestionOut(**reply)


@router.post("/sync-inbox")
async def sync_inbox():
    """Fetch Gmail inbox and store new emails in PostgreSQL."""
    pool = get_db()
    inbox = fetch_inbox(limit=30)
    stored = 0
    
    async with pool.acquire() as conn:
        for msg in inbox:
            from_email = msg["from"]
            if "<" in from_email:
                from_email = from_email.split("<")[1].rstrip(">")
                
            contact = await conn.fetchrow("SELECT id FROM contacts WHERE email = $1", from_email)
            if not contact:
                continue
                
            existing = await conn.fetchrow("""
                SELECT id FROM emails 
                WHERE contact_id = $1::uuid AND subject = $2
            """, contact["id"], msg["subject"])
            
            if existing:
                continue
                
            analysis = await _safe_analyze_email(msg["subject"], msg["body"])
            
            await conn.execute("""
                INSERT INTO emails (contact_id, direction, subject, body, ai_analysis, campaign_id)
                VALUES ($1::uuid, 'received', $2, $3, $4, NULL)
            """, contact["id"], msg["subject"], msg["body"], analysis)
            
            await conn.execute("""
                INSERT INTO memory_logs (contact_id, interaction_summary, sentiment, recommended_action)
                VALUES ($1::uuid, $2, $3, $4)
            """, contact["id"], analysis.get("summary", msg["subject"]), analysis.get("tone", "neutral").lower(), f"Intent: {analysis.get('intent','?')}. Priority: {analysis.get('priority',5)}/10")
            
            stored += 1
            
        await conn.execute("""
            INSERT INTO activity_logs (action, recipient, status)
            VALUES ($1, $2, $3)
        """, "inbox_sync", "gmail", "success")
        
    return {"synced": stored, "total_checked": len(inbox)}
