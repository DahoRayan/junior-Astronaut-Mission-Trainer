from collections import Counter

from app.evaluator.config import (
    FAILED_SCORE_CAP,
    MISSION_INDEX_WEIGHT,
    MISSION_RATING_WEIGHT,
    RATING_POINTS,
    SAFE_LEVEL,
    SURVIVED_BONUS,
)
from app.evaluator.explain import build_explanation
from app.evaluator.scoring import survivability_index
from app.evaluator.text import mission_summary
from app.schemas.models import EvaluateMissionRequest, EvaluateMissionResponse


def evaluate_mission(request: EvaluateMissionRequest) -> EvaluateMissionResponse:
    if not request.history:
        return EvaluateMissionResponse(
            survivability_score=0,
            strengths=[],
            lessons=["Start by checking power, oxygen, and shielding."],
            summary=mission_summary(request.outcome),
            stats=None,
            explanation=build_explanation(
                [("R-MISSION-EMPTY", "There are no decisions in the mission log yet.")],
                {"history_count": 0, "outcome": request.outcome},
            ),
        )

    indices = [survivability_index(item.snapshot) for item in request.history]
    avg_index = sum(item.index for item in indices) / len(indices)
    rating_points = sum(
        RATING_POINTS.get(item.rating, 0) for item in request.history
    ) / len(request.history)
    survival_bonus = SURVIVED_BONUS if request.outcome == "survived" else 0
    score = round(
        MISSION_INDEX_WEIGHT * avg_index
        + MISSION_RATING_WEIGHT * rating_points
        + survival_bonus
    )
    score = max(0, min(100, score))
    if request.outcome == "failed":
        score = min(FAILED_SCORE_CAP, score)

    low_resources = Counter(
        resource
        for index in indices
        for resource in index.under_safe_resources
    )
    strengths = []
    if all(not index.under_safe_resources for index in indices):
        strengths.append("You kept all three resources above the safe level.")
    if any(index.event_risk == 0 for index in indices):
        strengths.append("You made at least one choice without extra event pressure.")
    lessons = []
    if low_resources:
        lessons.append(f"Watch {low_resources.most_common(1)[0][0]} before it falls too low.")
    else:
        lessons.append("Keep checking all three resources before each choice.")
    if request.outcome == "failed":
        lessons.append("Use the next mission to test a safer trade-off.")
    rules = [("R-MISSION-SCORE", "The score combines resource safety, ratings, and outcome.")]
    if request.outcome == "survived":
        rules.append(("R-MISSION-SURVIVED", "The mission outcome adds a survival bonus."))
    else:
        rules.append(("R-MISSION-FAILED", "A failed mission has a score cap."))
    if low_resources:
        rules.append(("R-MISSION-RESOURCE", "A resource fell below the safe level in the log."))
    return EvaluateMissionResponse(
        survivability_score=score,
        strengths=strengths[:3],
        lessons=lessons[:3],
        summary=mission_summary(request.outcome),
        stats=None,
        explanation=build_explanation(
            rules,
            {
                "history_count": len(request.history),
                "average_index": avg_index,
                "outcome": request.outcome,
                "rating_points": rating_points,
                "safe_level": SAFE_LEVEL,
            },
        ),
    )
