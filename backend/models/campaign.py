from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class CampaignMetrics(BaseModel):
    emails_sent: int = 0
    replies: int = 0
    conversions: int = 0

    @property
    def reply_rate(self) -> float:
        return (self.replies / self.emails_sent * 100) if self.emails_sent else 0.0


class ABVariant(BaseModel):
    variant: str
    subject: str
    body_template: str = ""
    performance: float = 0.0


class CampaignCreate(BaseModel):
    name: str
    subject_template: str
    body_template: str
    contact_tags: List[str] = []
    ab_tests: List[ABVariant] = []


class CampaignOut(BaseModel):
    id: str
    name: str
    subject_template: str
    body_template: str
    contact_tags: List[str] = []
    status: str = "draft"
    metrics: CampaignMetrics = Field(default_factory=CampaignMetrics)
    ab_tests: List[ABVariant] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

    @classmethod
    def from_db(cls, doc: dict) -> "CampaignOut":
        doc["id"] = str(doc.get("id", doc.get("_id", "")))
        doc.setdefault("metrics", {})
        return cls(**doc)
