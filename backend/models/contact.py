from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


class AIProfile(BaseModel):
    summary: str = ""
    engagement_score: float = 0.0
    response_probability: float = 0.0
    interest_tags: List[str] = []


class ContactMetadata(BaseModel):
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_contacted: Optional[datetime] = None
    follow_up_count: int = 0


class ContactCreate(BaseModel):
    name: str
    email: str
    company: Optional[str] = ""
    tags: List[str] = []


class ContactUpdate(BaseModel):
    name: Optional[str] = None
    company: Optional[str] = None
    tags: Optional[List[str]] = None
    ai_profile: Optional[AIProfile] = None


class ContactOut(BaseModel):
    id: str
    name: str
    email: str
    company: str = ""
    tags: List[str] = []
    ai_profile: AIProfile = Field(default_factory=AIProfile)
    metadata: ContactMetadata = Field(default_factory=ContactMetadata)

    @classmethod
    def from_db(cls, doc: dict) -> "ContactOut":
        doc["id"] = str(doc.get("id", doc.get("_id", "")))
        doc.setdefault("ai_profile", {})
        doc.setdefault("metadata", {})
        return cls(**doc)
