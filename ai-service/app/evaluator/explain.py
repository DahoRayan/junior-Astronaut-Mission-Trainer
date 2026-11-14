from collections.abc import Iterable

from app.schemas.models import Explanation, ExplanationRule, ExplanationSource


def build_explanation(
    rules: Iterable[tuple[str, str]],
    inputs: dict,
) -> Explanation:
    return Explanation(
        rules_fired=[ExplanationRule(rule_id=rule_id, text=text) for rule_id, text in rules],
        inputs=inputs,
        sources=[ExplanationSource(name="Game rules", kind="simulated")],
    )
