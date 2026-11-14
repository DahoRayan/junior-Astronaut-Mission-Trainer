from fastapi import APIRouter, HTTPException

from app.expert import ExpertSystem, load_catalog
from app.schemas.models import (
    AssistantAnswerRequest,
    AssistantAnswerResponse,
    AssistantQuestionsRequest,
    AssistantQuestionsResponse,
)

router = APIRouter()
expert_system = ExpertSystem(load_catalog())


@router.post("/assistant/questions", response_model=AssistantQuestionsResponse)
def questions(request: AssistantQuestionsRequest) -> AssistantQuestionsResponse:
    return AssistantQuestionsResponse(questions=expert_system.questions(request.snapshot))


@router.post("/assistant/answer", response_model=AssistantAnswerResponse)
def answer(request: AssistantAnswerRequest) -> AssistantAnswerResponse:
    result = expert_system.answer(request.question_id, request.snapshot)
    if result is None:
        raise HTTPException(status_code=404, detail="Unknown question_id.")
    return AssistantAnswerResponse(
        answer=result.answer,
        fact=result.fact,
        explanation=result.explanation,
        data_source=result.data_source,
    )
