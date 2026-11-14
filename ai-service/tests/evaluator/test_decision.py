from app.evaluator.decision import evaluate_decision
from app.schemas.models import ActiveEvent, DelayedEffect


def test_solar_flare_with_low_shielding_is_risky(snapshot_factory, decision_factory):
    before = snapshot_factory(
        power=100,
        oxygen=100,
        shielding=100,
        event=ActiveEvent(type="solar_flare", severity=3),
    )
    after = snapshot_factory(
        power=100,
        oxygen=100,
        shielding=15,
        event=ActiveEvent(type="solar_flare", severity=3),
    )
    result = evaluate_decision(before, after, decision_factory(shielding=-85))
    assert result.rating == "risky"
    assert "R-EVENT-SHIELD" in {rule.rule_id for rule in result.explanation.rules_fired}


def test_balanced_positive_decision_is_great(snapshot_factory, decision_factory):
    before = snapshot_factory(power=30, oxygen=30, shielding=30)
    after = snapshot_factory(power=40, oxygen=40, shielding=40)
    result = evaluate_decision(before, after, decision_factory(power=10, oxygen=10, shielding=10))
    assert result.rating == "great"
    assert result.survival_delta >= 3


def test_neutral_decision_is_ok(snapshot_factory, decision_factory):
    snapshot = snapshot_factory()
    result = evaluate_decision(snapshot, snapshot, decision_factory())
    assert result.rating == "ok"


def test_survival_delta_is_clamped(snapshot_factory, decision_factory):
    before = snapshot_factory(power=0, oxygen=0, shielding=0)
    after = snapshot_factory(power=100, oxygen=100, shielding=100)
    result = evaluate_decision(
        before,
        after,
        decision_factory(power=100, oxygen=100, shielding=100),
    )
    assert result.survival_delta == 20


def test_delayed_debt_is_explained(snapshot_factory, decision_factory):
    before = snapshot_factory(power=50, oxygen=50, shielding=50)
    after = snapshot_factory(power=45, oxygen=50, shielding=50)
    decision = decision_factory(
        power=-5,
        delayed_effects=[DelayedEffect(sol_offset=1, resource="power", delta=-10)],
    )
    result = evaluate_decision(before, after, decision)
    assert result.rating == "risky"
    assert "R-DELAYED-DEBT" in {rule.rule_id for rule in result.explanation.rules_fired}


def test_unknown_event_rule_is_explained(snapshot_factory, decision_factory):
    snapshot = snapshot_factory(
        event=ActiveEvent(type="unknown-event", severity=1)
    )
    result = evaluate_decision(snapshot, snapshot, decision_factory())
    assert "R-UNKNOWN-EVENT" in {rule.rule_id for rule in result.explanation.rules_fired}


def test_decision_is_deterministic(snapshot_factory, decision_factory):
    snapshot = snapshot_factory()
    decision = decision_factory(power=5, oxygen=-2)
    first = evaluate_decision(snapshot, snapshot, decision).model_dump()
    second = evaluate_decision(snapshot, snapshot, decision).model_dump()
    assert first == second


def test_every_decision_has_explanation_rules(snapshot_factory, decision_factory):
    result = evaluate_decision(
        snapshot_factory(),
        snapshot_factory(),
        decision_factory(),
    )
    assert result.explanation.rules_fired
