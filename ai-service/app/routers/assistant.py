from fastapi import APIRouter

from app.schemas.models import AssistantChatRequest, AssistantChatResponse

router = APIRouter()


@router.post("/assistant/chat", response_model=AssistantChatResponse)
def chat(_: AssistantChatRequest) -> AssistantChatResponse:
    return AssistantChatResponse(
        reply="Mission Buddy says: protect oxygen first, then plan your power use.",
        data_source="curated",
        fallback_used=True,
    )
