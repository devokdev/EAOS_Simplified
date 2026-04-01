from pydantic import BaseModel


class TemplateOut(BaseModel):
    key: str
    name: str
    description: str
    subject: str
    body: str
