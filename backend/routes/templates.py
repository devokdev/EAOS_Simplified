from fastapi import APIRouter
from ..models.template import TemplateOut
from ..services.templates_service import list_templates

router = APIRouter(prefix="/api/templates", tags=["templates"])


@router.get("/", response_model=list[TemplateOut])
async def get_templates():
    return [TemplateOut(**template) for template in list_templates()]
