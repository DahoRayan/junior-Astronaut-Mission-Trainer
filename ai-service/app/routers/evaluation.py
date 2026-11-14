from fastapi import APIRouter

from app.evaluator.decision import evaluate_decision as evaluate_decision_rules
from app.evaluator.mission import evaluate_mission as evaluate_mission_rules
from app.schemas.models import (
    EvaluateDecisionRequest,
    EvaluateDecisionResponse,
    EvaluateMissionRequest,
    EvaluateMissionResponse,
)

router = APIRouter()


@router.post("/evaluate/decision", response_model=EvaluateDecisionResponse)
def evaluate_decision(request: EvaluateDecisionRequest) -> EvaluateDecisionResponse:
    return evaluate_decision_rules(request.before, request.after, request.decision)


@router.post("/evaluate/mission", response_model=EvaluateMissionResponse)
def evaluate_mission(request: EvaluateMissionRequest) -> EvaluateMissionResponse:
    return evaluate_mission_rules(request)
