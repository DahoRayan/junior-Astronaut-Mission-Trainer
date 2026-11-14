from fastapi import APIRouter

from app.schemas.models import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", nasa_live=False, knowledge_base_version="mock-v2")
