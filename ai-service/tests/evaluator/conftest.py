import pytest

from app.schemas.models import Decision, DecisionDeltas, GameSnapshot, Resources


@pytest.fixture
def snapshot_factory():
    def make(power=50, oxygen=50, shielding=50, event=None):
        return GameSnapshot(
            sol=1,
            mission_length=10,
            site="moon",
            perspective_id="engineer",
            scene_id="scene-1",
            resources=Resources(power=power, oxygen=oxygen, shielding=shielding),
            crew=2,
            active_event=event,
        )

    return make


@pytest.fixture
def decision_factory():
    def make(power=0, oxygen=0, shielding=0, delayed_effects=None):
        return Decision(
            id="test-decision",
            label="Test decision",
            deltas=DecisionDeltas(power=power, oxygen=oxygen, shielding=shielding),
            delayed_effects=[] if delayed_effects is None else delayed_effects,
        )

    return make
