from app.evaluator.config import (
    CRITICAL_LEVEL,
    DELAYED_DEBT_PENALTY,
    SAFE_LEVEL,
    SURVIVAL_DELTA_LIMIT,
)
from app.evaluator.explain import build_explanation
from app.evaluator.scoring import delayed_debt, survivability_index
from app.evaluator.text import (
    cost_text,
    delayed_cost_text,
    extra_risk_text,
    feedback_text,
    gained_text,
)
from app.schemas.models import (
    Decision,
    EvaluateDecisionResponse,
    GameSnapshot,
    Tradeoff,
)


def _tradeoff(decision: Decision) -> tuple[str, str]:
    deltas = decision.deltas.model_dump()
    positive = [(value, resource) for resource, value in deltas.items() if value > 0]
    negative = [(value, resource) for resource, value in deltas.items() if value < 0]
    if positive:
        gained = gained_text(max(positive)[1])
    else:
        gained = "time to plan"
    if negative:
        cost = cost_text(min(negative)[1])
    elif decision.delayed_effects:
        effect = min(decision.delayed_effects, key=lambda item: item.delta)
        cost = delayed_cost_text(effect.resource)
    else:
        cost = extra_risk_text()
    return gained, cost


def evaluate_decision(
    before: GameSnapshot,
    after: GameSnapshot,
    decision: Decision,
) -> EvaluateDecisionResponse:
    before_index = survivability_index(before)
    after_index = survivability_index(after)
    debt_count = delayed_debt(after, decision)
    after_score = after_index.index - DELAYED_DEBT_PENALTY * debt_count
    survival_delta = max(
        -SURVIVAL_DELTA_LIMIT,
        min(SURVIVAL_DELTA_LIMIT, round(after_score - before_index.index)),
    )
    if (
        after_index.critical_resources
        or after_index.event_risk > 0.5
        or survival_delta <= -5
    ):
        rating = "risky"
    elif (
        survival_delta >= 3
        and not after_index.under_safe_resources
        and after_index.event_risk == 0
    ):
        rating = "great"
    else:
        rating = "ok"

    rules: list[tuple[str, str]] = []
    if after_index.critical_resources:
        rules.append(("R-CRITICAL", "A resource is below the critical level."))
    if after_index.required_event_level is not None:
        rules.append(("R-EVENT-SHIELD", "The active event sets a protection level."))
    if after_index.balance_penalty:
        rules.append(("R-BALANCE", "The resources are far apart, so balance is lower."))
    if debt_count:
        rules.append(("R-DELAYED-DEBT", "A delayed cost pushes a resource below the safe level."))
    if survival_delta >= 3:
        rules.append(("R-DELTA-GOOD", "The choice improves the survivability index."))
    if after_index.unknown_event_type:
        rules.append(("R-UNKNOWN-EVENT", "The event type has no configured pressure."))
    if not rules:
        rules.append(("R-RESOURCE-CHECK", "The evaluator checked all three resources."))
    gained, cost = _tradeoff(decision)
    return EvaluateDecisionResponse(
        rating=rating,
        survival_delta=survival_delta,
        tradeoff=Tradeoff(gained=gained, cost=cost),
        feedback=feedback_text(rating, gained, cost),
        fact=None,
        explanation=build_explanation(
            rules,
            {
                "before_resources": before.resources.model_dump(),
                "after_resources": after.resources.model_dump(),
                "event": after.active_event.model_dump() if after.active_event else None,
                "survival_delta": survival_delta,
                "thresholds": {
                    "safe_level": SAFE_LEVEL,
                    "critical_level": CRITICAL_LEVEL,
                },
            },
        ),
        data_source="simulated",
    )
