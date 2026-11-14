from fastapi import APIRouter

from app.schemas.models import (
    EvaluateDecisionRequest,
    EvaluateDecisionResponse,
    EvaluateMissionRequest,
    EvaluateMissionResponse,
    Fact,
    Tradeoff,
)

router = APIRouter()


@router.post("/evaluate/decision", response_model=EvaluateDecisionResponse)
def evaluate_decision(request: EvaluateDecisionRequest) -> EvaluateDecisionResponse:
    deltas = request.decision.deltas
    rating = "risky" if min(deltas.power, deltas.oxygen, deltas.shielding) <= -30 else "ok"
    if sum((deltas.power, deltas.oxygen, deltas.shielding)) >= 0:
        rating = "great"
    survival_delta = max(-20, min(20, sum((deltas.power, deltas.oxygen, deltas.shielding)) // 3))
    return EvaluateDecisionResponse(
        rating=rating,
        survival_delta=survival_delta,
        tradeoff=Tradeoff(gained="time to work", cost="some resources"),
        feedback="You gained time to act, but it cost some resources. Keep watching your supplies.",
        fact=Fact(
            text="Shielding helps protect astronauts from radiation dose, or space energy.",
            source="NASA RadLab",
        ),
        data_source="curated",
        fallback_used=True,
    )


@router.post("/evaluate/mission", response_model=EvaluateMissionResponse)
def evaluate_mission(request: EvaluateMissionRequest) -> EvaluateMissionResponse:
    score = 80 if request.outcome == "survived" else 40
    return EvaluateMissionResponse(
        survivability_score=score,
        strengths=["You kept making careful choices."],
        lessons=["Check all three resources before your next decision."],
        summary="You completed a mission lesson by balancing important resources.",
        fallback_used=True,
    )
