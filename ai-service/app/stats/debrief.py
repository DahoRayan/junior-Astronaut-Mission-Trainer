from statistics import mean
from typing import Final

from app.schemas.models import (
    EvaluateMissionRequest,
    MissionStats,
    PerspectiveComparison,
    Rating,
    ResourceName,
    ResourceStats,
)

RESOURCE_NAMES: Final[tuple[ResourceName, ...]] = ("power", "oxygen", "shielding")
RATINGS: Final[tuple[Rating, ...]] = ("great", "ok", "risky")


def _resource_values(request: EvaluateMissionRequest, resource: ResourceName) -> list[int]:
    return [getattr(item.snapshot.resources, resource) for item in request.history]


def _trend(values: list[int]) -> str:
    if values[-1] > values[0]:
        return "up"
    if values[-1] < values[0]:
        return "down"
    return "flat"


def _resource_stats(request: EvaluateMissionRequest) -> dict[ResourceName, ResourceStats]:
    return {
        resource: ResourceStats(
            mean=float(mean(values)),
            min=min(values),
            trend=_trend(values),
        )
        for resource in RESOURCE_NAMES
        for values in [_resource_values(request, resource)]
    }


def _rating_counts(request: EvaluateMissionRequest) -> dict[Rating, int]:
    counts = {rating: 0 for rating in RATINGS}
    for item in request.history:
        if item.rating in counts:
            counts[item.rating] += 1
    return counts


def _observed_decision_costs(request: EvaluateMissionRequest) -> dict[str, int]:
    costs: dict[str, int] = {}
    for current, following in zip(request.history, request.history[1:]):
        cost = sum(
            max(
                getattr(current.snapshot.resources, resource)
                - getattr(following.snapshot.resources, resource),
                0,
            )
            for resource in RESOURCE_NAMES
        )
        if cost:
            costs[current.decision_id] = costs.get(current.decision_id, 0) + cost
    return costs


def _most_costly_decision_id(request: EvaluateMissionRequest) -> str | None:
    costs = _observed_decision_costs(request)
    if not costs:
        return None
    order = {item.decision_id: index for index, item in enumerate(request.history)}
    return max(costs, key=lambda decision_id: (costs[decision_id], -order[decision_id]))


def _event_exposure_sols(request: EvaluateMissionRequest) -> int:
    return len(
        {
            item.snapshot.sol
            for item in request.history
            if item.snapshot.active_event is not None
        }
    )


def _perspective_comparison(request: EvaluateMissionRequest) -> list[PerspectiveComparison]:
    runs = request.other_runs or []
    return [
        PerspectiveComparison(
            perspective_id=run.perspective_id,
            survivability_score=run.survivability_score,
        )
        for run in sorted(runs, key=lambda run: (run.perspective_id, run.survivability_score))
    ]


def build_mission_stats(request: EvaluateMissionRequest) -> MissionStats | None:
    if not request.history:
        return None
    return MissionStats(
        resource_stats=_resource_stats(request),
        rating_counts=_rating_counts(request),
        most_costly_decision_id=_most_costly_decision_id(request),
        event_exposure_sols=_event_exposure_sols(request),
        perspective_comparison=_perspective_comparison(request),
    )
