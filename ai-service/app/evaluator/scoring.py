from dataclasses import dataclass

from app.evaluator.config import (
    BALANCE_PENALTY,
    BALANCE_SPREAD,
    CRITICAL_LEVEL,
    EVENT_PRESSURE,
    SAFE_LEVEL,
)
from app.schemas.models import GameSnapshot, ResourceName


@dataclass(frozen=True)
class IndexResult:
    index: float
    mean_risk: float
    worst_risk: float
    event_risk: float
    required_event_level: int | None
    unknown_event_type: str | None
    under_safe_resources: tuple[ResourceName, ...]
    critical_resources: tuple[ResourceName, ...]
    balance_penalty: int


def clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))


def event_risk(snapshot: GameSnapshot) -> tuple[float, int | None, str | None]:
    if snapshot.active_event is None:
        return 0.0, None, None
    event_config = EVENT_PRESSURE.get(snapshot.active_event.type)
    if event_config is None:
        return 0.0, None, snapshot.active_event.type
    _, required_levels = event_config
    required = required_levels[snapshot.active_event.severity - 1]
    value = getattr(snapshot.resources, event_config[0])
    return clamp((required - value) / required, 0.0, 1.0), required, None


def survivability_index(snapshot: GameSnapshot) -> IndexResult:
    resources = {
        "power": snapshot.resources.power,
        "oxygen": snapshot.resources.oxygen,
        "shielding": snapshot.resources.shielding,
    }
    risks = {
        name: clamp((SAFE_LEVEL - value) / SAFE_LEVEL, 0.0, 1.0)
        for name, value in resources.items()
    }
    event_pressure, required, unknown_event = event_risk(snapshot)
    balance_penalty = (
        BALANCE_PENALTY if max(resources.values()) - min(resources.values()) > BALANCE_SPREAD else 0
    )
    index = (
        100
        - 100
        * (
            0.5 * (sum(risks.values()) / len(risks))
            + 0.3 * max(risks.values())
            + 0.2 * event_pressure
        )
        - balance_penalty
    )
    return IndexResult(
        index=clamp(index, 0.0, 100.0),
        mean_risk=sum(risks.values()) / len(risks),
        worst_risk=max(risks.values()),
        event_risk=event_pressure,
        required_event_level=required,
        unknown_event_type=unknown_event,
        under_safe_resources=tuple(name for name, value in resources.items() if value < SAFE_LEVEL),
        critical_resources=tuple(
            name for name, value in resources.items() if value < CRITICAL_LEVEL
        ),
        balance_penalty=balance_penalty,
    )


def delayed_debt(snapshot: GameSnapshot, decision) -> int:
    debt = 0
    resources = {
        "power": snapshot.resources.power,
        "oxygen": snapshot.resources.oxygen,
        "shielding": snapshot.resources.shielding,
    }
    for effect in decision.delayed_effects:
        if effect.delta < 0 and resources[effect.resource] + effect.delta < SAFE_LEVEL:
            debt += 1
    return debt
