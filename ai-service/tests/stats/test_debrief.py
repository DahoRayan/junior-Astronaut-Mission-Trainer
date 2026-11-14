import pytest

from app.schemas.models import (
    EvaluateMissionRequest,
    GameSnapshot,
    MissionHistoryItem,
    OtherRun,
    Resources,
)
from app.stats.debrief import build_mission_stats


@pytest.fixture
def snapshot_factory():
    def make(power=50, oxygen=50, shielding=50, sol=1, active_event=None):
        return GameSnapshot(
            sol=sol,
            mission_length=10,
            site="moon",
            perspective_id="engineer",
            scene_id="scene-1",
            resources=Resources(power=power, oxygen=oxygen, shielding=shielding),
            crew=2,
            active_event=active_event,
        )

    return make


def make_request(snapshots, ratings=None, other_runs=None):
    ratings = ratings or ["great"] * len(snapshots)
    return EvaluateMissionRequest(
        site="moon",
        perspective_id="engineer",
        history=[
            MissionHistoryItem(
                snapshot=snapshot,
                decision_id=f"decision-{index}",
                rating=ratings[index],
            )
            for index, snapshot in enumerate(snapshots)
        ],
        outcome="survived",
        other_runs=other_runs,
    )


def test_stats_cover_resource_summaries_ratings_and_event_exposure(snapshot_factory):
    request = make_request(
        [
            snapshot_factory(power=80, oxygen=40, shielding=70),
            snapshot_factory(power=60, oxygen=50, shielding=70),
        ],
        ratings=["great", "risky"],
    )
    request.history[1].snapshot.sol = 2
    request.history[1].snapshot.active_event = {"type": "solar_flare", "severity": 1}

    stats = build_mission_stats(request)

    assert stats.resource_stats["power"].mean == 70.0
    assert stats.resource_stats["power"].min == 60
    assert stats.resource_stats["power"].trend == "down"
    assert stats.resource_stats["oxygen"].trend == "up"
    assert stats.rating_counts == {"great": 1, "ok": 0, "risky": 1}
    assert stats.event_exposure_sols == 1
    assert stats.most_costly_decision_id == "decision-0"


def test_stats_count_repeated_event_sol_once_and_sort_comparisons(snapshot_factory):
    snapshots = [
        snapshot_factory(power=50, oxygen=50, shielding=50),
        snapshot_factory(power=50, oxygen=50, shielding=50),
    ]
    snapshots[0].active_event = {"type": "solar_flare", "severity": 1}
    snapshots[1].active_event = {"type": "solar_flare", "severity": 1}
    other_runs = [
        OtherRun(perspective_id="z", survivability_score=80),
        OtherRun(perspective_id="a", survivability_score=60),
    ]

    stats = build_mission_stats(make_request(snapshots, other_runs=other_runs))

    assert stats.event_exposure_sols == 1
    assert [run.perspective_id for run in stats.perspective_comparison] == ["a", "z"]


def test_stats_return_none_for_empty_history():
    assert build_mission_stats(make_request([])) is None


def test_stats_tie_keeps_first_decision(snapshot_factory):
    snapshots = [
        snapshot_factory(power=80, oxygen=80, shielding=80),
        snapshot_factory(power=70, oxygen=80, shielding=80),
        snapshot_factory(power=70, oxygen=70, shielding=80),
    ]

    stats = build_mission_stats(make_request(snapshots))

    assert stats.most_costly_decision_id == "decision-0"
