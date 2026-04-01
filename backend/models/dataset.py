from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ContactInput(BaseModel):
    name: str = ""
    email: str


class ContactUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None


class DatasetCreate(BaseModel):
    name: str


class DatasetOut(BaseModel):
    id: str
    name: str
    source_filename: str = ""
    created_at: datetime
    contact_count: int = 0


class DatasetContactOut(BaseModel):
    id: str
    dataset_id: str
    name: str = ""
    email: str
    created_at: datetime


class CsvImportOut(BaseModel):
    dataset: DatasetOut
    imported: int
    skipped: int
