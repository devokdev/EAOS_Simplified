from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class AIAnalysis(BaseModel):
    summary: str = ""
    intent: str = ""
    tone: str = ""
    priority: int = 5


class EmailCreate(BaseModel):
    contact_id: str
    direction: str = "sent"  # sent | received
    subject: str
    body: str
    campaign_id: Optional[str] = None


class EmailDraftRequest(BaseModel):
    contact_id: str
    subject: str
    context: str = ""
    instructions: str = ""


class EmailDraftOut(BaseModel):
    body: str


class ReplySuggestionRequest(BaseModel):
    notes: str = ""


class ReplySuggestionOut(BaseModel):
    thread_summary: str = ""
    key_points: List[str] = []
    suggested_subject: str = ""
    suggested_reply: str = ""


class EmailOut(BaseModel):
    id: str
    contact_id: str
    direction: str
    subject: str
    body: str
    ai_analysis: AIAnalysis = Field(default_factory=AIAnalysis)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    campaign_id: Optional[str] = None

    @classmethod
    def from_db(cls, doc: dict) -> "EmailOut":
        doc["id"] = str(doc.get("id", doc.get("_id", "")))
        doc["contact_id"] = str(doc.get("contact_id", ""))
        if doc.get("campaign_id"):
            doc["campaign_id"] = str(doc["campaign_id"])
        doc.setdefault("ai_analysis", {})
        return cls(**doc)
