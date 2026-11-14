from fastapi import APIRouter

from app.schemas.models import (
    EvaluateDecisionRequest,
    EvaluateDecisionResponse,
    EvaluateMissionRequest,
    EvaluateMissionResponse,
    Explanation,
    ExplanationRule,
    ExplanationSource,
    MissionStats,
    PerspectiveComparison,
    ResourceStats,
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
        fact=None,
        explanation=Explanation(
            rules_fired=[
                ExplanationRule(
                    rule_id="R-EVENT-SHIELD",
                    text="The evaluator compares resource costs with the current mission state.",
                )
            ],
            inputs={"decision_id": request.decision.id, "deltas": deltas.model_dump()},
            sources=[ExplanationSource(name="Mission rules", kind="simulated")],
        ),
        data_source="simulated",
    )


@router.post("/evaluate/mission", response_model=EvaluateMissionResponse)
def evaluate_mission(request: EvaluateMissionRequest) -> EvaluateMissionResponse:
    score = 80 if request.outcome == "survived" else 40
    return EvaluateMissionResponse(
        survivability_score=score,
        strengths=["You kept making careful choices."],
        lessons=["Check all three resources before your next decision."],
        summary="You completed a mission lesson by balancing important resources.",
        stats=MissionStats(
            resource_stats={
                "power": ResourceStats(mean=75.0, min=60, trend="flat"),
                "oxygen": ResourceStats(mean=82.0, min=70, trend="up"),
                "shielding": ResourceStats(mean=68.0, min=50, trend="down"),
            },
            rating_counts={"great": 1, "ok": 1, "risky": 0},
            most_costly_decision_id=None,
            event_exposure_sols=1,
            perspective_comparison=[
                PerspectiveComparison(
                    perspective_id=request.perspective_id,
                    survivability_score=score,
                )
            ],
        ),
        explanation=Explanation(
            rules_fired=[
                ExplanationRule(
                    rule_id="R-MISSION-SUMMARY",
                    text="The debrief summarizes the mission outcome and choices.",
                )
            ],
            inputs={"site": request.site, "perspective_id": request.perspective_id},
            sources=[ExplanationSource(name="Mission rules", kind="simulated")],
        ),
    )
