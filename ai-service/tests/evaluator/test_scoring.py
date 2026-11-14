import pytest

from app.evaluator.scoring import delayed_debt, event_risk, survivability_index
from app.schemas.models import ActiveEvent, DelayedEffect


@pytest.mark.parametrize(
    ("resources", "expected"),
    [
        ((100, 100, 100), 100.0),
        ((0, 0, 0), 20.0),
        ((40, 40, 40), 100.0),
        ((30, 30, 30), 80.0),
        ((20, 40, 60), 76.6666666667),
        ((0, 50, 100), 43.3333333333),
    ],
)
def test_hand_computed_survivability_table(snapshot_factory, resources, expected):
    result = survivability_index(snapshot_factory(*resources))
    assert result.index == pytest.approx(expected)


def test_severity_three_solar_flare_applies_shielding_pressure(snapshot_factory):
    snapshot = snapshot_factory(
        power=100,
        oxygen=100,
        shielding=15,
        event=ActiveEvent(type="solar_flare", severity=3),
    )
    result = survivability_index(snapshot)
    assert result.required_event_level == 80
    assert result.event_risk == pytest.approx(0.8125)


def test_unknown_event_has_no_pressure_and_is_recorded(snapshot_factory):
    result = survivability_index(
        snapshot_factory(event=ActiveEvent(type="unknown-event", severity=2))
    )
    assert result.event_risk == 0
    assert result.unknown_event_type == "unknown-event"


def test_no_event_has_no_pressure(snapshot_factory):
    result = survivability_index(snapshot_factory())
    assert event_risk(snapshot_factory())[0] == 0
    assert result.unknown_event_type is None


def test_delayed_negative_effect_below_safe_level_creates_debt(snapshot_factory, decision_factory):
    decision = decision_factory(
        delayed_effects=[DelayedEffect(sol_offset=1, resource="power", delta=-10)]
    )
    assert delayed_debt(snapshot_factory(power=45), decision) == 1
