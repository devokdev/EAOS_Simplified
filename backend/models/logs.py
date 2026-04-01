from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class MemoryLogCreate(BaseModel):
    contact_id: str
    interaction_summary: str
    sentiment: str = "neutral"
    recommended_action: str = ""


class MemoryLogOut(BaseModel):
    id: str
    contact_id: str
    interaction_summary: str
    sentiment: str
    recommended_action: str
    timestamp: datetime

    @classmethod
    def from_db(cls, doc: dict) -> "MemoryLogOut":
        doc["id"] = str(doc.get("id", doc.get("_id", "")))
        doc["contact_id"] = str(doc.get("contact_id", ""))
        return cls(**doc)


class ActivityLogOut(BaseModel):
    id: str
    action: str
    recipient: str
    status: str
    timestamp: datetime

    @classmethod
    def from_db(cls, doc: dict) -> "ActivityLogOut":
        doc["id"] = str(doc.get("id", doc.get("_id", "")))
        return cls(**doc)
