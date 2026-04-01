from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class BulkPreviewRequest(BaseModel):
    dataset_id: str
    template_key: str = ""
    subject: str = ""
    body: str = ""
    recipient_ids: list[str] = []
    custom_template_html: str = ""
    improve_content: bool = False
    improvement_notes: str = ""


class BulkSendRequest(BulkPreviewRequest):
    batch_size: int = 20
    pause_seconds: float = 1.0


class ReplySuggestionRequest(BaseModel):
    email_log_id: str
    notes: str = ""


class SingleSendRequest(BaseModel):
    email_log_id: str
    subject: str
    body: str


class LogEntryOut(BaseModel):
    id: str
    dataset_id: Optional[str] = None
    dataset_name: str = ""
    contact_id: Optional[str] = None
    contact_name: str = ""
    recipient_email: str = ""
    direction: str
    subject: str
    body: str
    rendered_html: str = ""
    template_key: str = ""
    status: str = ""
    timestamp: datetime
    reply_received: bool = False
    reply_content: str = ""
    reply_summary: str = ""
    reply_suggestion: str = ""
    last_interaction_time: datetime
    needs_attention: bool = False
    thread_key: str = ""
