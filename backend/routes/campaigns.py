from fastapi import APIRouter, HTTPException
import json
from datetime import datetime
from ..database import get_db
from ..models.campaign import CampaignCreate, CampaignOut
from ..services.gemini_service import generate_campaign_email
from ..services.gmail_service import send_email

router = APIRouter(prefix="/api/campaigns", tags=["campaigns"])


@router.get("/", response_model=list[CampaignOut])
async def list_campaigns():
    pool = get_db()
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM campaigns ORDER BY created_at DESC")
    return [CampaignOut.from_db(dict(row)) for row in rows]


@router.post("/", response_model=CampaignOut, status_code=201)
async def create_campaign(data: CampaignCreate):
    pool = get_db()
    doc = data.model_dump()
    status = "draft"
    metrics = {"emails_sent": 0, "replies": 0, "conversions": 0}
    
    async with pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO campaigns (name, subject_template, body_template, contact_tags, ab_tests, status, metrics)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        """, doc["name"], doc["subject_template"], doc["body_template"], doc.get("contact_tags", []), doc.get("ab_tests", []), status, metrics)
        
    return CampaignOut.from_db(dict(row))


@router.post("/{campaign_id}/launch")
async def launch_campaign(campaign_id: str):
    pool = get_db()
    async with pool.acquire() as conn:
        campaign = await conn.fetchrow("SELECT * FROM campaigns WHERE id = $1::uuid", campaign_id)
        if not campaign:
            raise HTTPException(404, "Campaign not found")
        if campaign["status"] == "running":
            raise HTTPException(400, "Campaign already running")

        await conn.execute("UPDATE campaigns SET status = 'running' WHERE id = $1::uuid", campaign_id)
        
        if campaign.get("contact_tags"):
            tags_array = campaign["contact_tags"]
            # match if tags overlap
            contacts = await conn.fetch("SELECT * FROM contacts WHERE tags ?| $1", tags_array)
        else:
            contacts = await conn.fetch("SELECT * FROM contacts LIMIT 500")

    sent_count = 0
    for contact in contacts:
        body = await generate_campaign_email(
            template=campaign["body_template"],
            contact_name=contact["name"],
            company=contact.get("company", ""),
            tags=contact.get("tags", []),
        )
        subject = campaign["subject_template"].replace("{name}", contact["name"])
        ok = send_email(
            to=contact["email"],
            subject=subject,
            body=body,
        )
        
        async with pool.acquire() as conn:
            if ok:
                sent_count += 1
                await conn.execute("""
                    INSERT INTO emails (contact_id, direction, subject, body, ai_analysis, campaign_id)
                    VALUES ($1, 'sent', $2, $3, $4, $5)
                """, contact["id"], subject, body, {"summary": "Campaign email", "intent": "Outreach", "tone": "Neutral", "priority": 5}, campaign_id)
                
                metadata = contact.get("metadata", {})
                metadata["last_contacted"] = datetime.utcnow().isoformat()
                metadata["follow_up_count"] = metadata.get("follow_up_count", 0) + 1
                
                await conn.execute("""
                    UPDATE contacts 
                    SET metadata = $2
                    WHERE id = $1::uuid
                """, contact["id"], metadata)
                
            await conn.execute("""
                INSERT INTO activity_logs (action, recipient, status)
                VALUES ($1, $2, $3)
            """, "campaign_email_sent", contact["email"], "success" if ok else "failed")

    async with pool.acquire() as conn:
        metrics = dict(campaign.get("metrics", {}))
        metrics["emails_sent"] = sent_count
        await conn.execute("""
            UPDATE campaigns 
            SET status = 'completed', metrics = $2
            WHERE id = $1::uuid
        """, campaign_id, metrics)
        
    return {"campaign_id": campaign_id, "emails_sent": sent_count}


@router.get("/{campaign_id}", response_model=CampaignOut)
async def get_campaign(campaign_id: str):
    pool = get_db()
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM campaigns WHERE id = $1::uuid", campaign_id)
        if not row:
            raise HTTPException(404, "Campaign not found")
    return CampaignOut.from_db(dict(row))


@router.delete("/{campaign_id}")
async def delete_campaign(campaign_id: str):
    pool = get_db()
    async with pool.acquire() as conn:
        status = await conn.execute("DELETE FROM campaigns WHERE id = $1::uuid", campaign_id)
        if status == "DELETE 0":
            raise HTTPException(404, "Campaign not found")
    return {"message": "Deleted"}
