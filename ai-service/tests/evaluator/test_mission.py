from app.evaluator.mission import evaluate_mission
from app.schemas.models import EvaluateMissionRequest, MissionHistoryItem


def make_request(snapshot, outcome="survived", history=None):
    return EvaluateMissionRequest(
        site="moon",
        perspective_id="engineer",
        history=[
            MissionHistoryItem(
                snapshot=item,
                decision_id=f"decision-{index}",
                rating="great",
            )
            for index, item in enumerate(history or [])
        ],
        outcome=outcome,
    )


def test_empty_mission_history_returns_valid_zero_score(snapshot_factory):
    result = evaluate_mission(make_request(snapshot_factory()))
    assert result.survivability_score == 0
    assert result.stats is None
    assert result.explanation.rules_fired


def test_survived_mission_combines_index_and_rating(snapshot_factory):
    result = evaluate_mission(
        make_request(
            snapshot_factory(power=100, oxygen=100, shielding=100),
            history=[snapshot_factory(power=100, oxygen=100, shielding=100)],
        )
    )
    assert result.survivability_score == 100


def test_failed_mission_score_is_capped(snapshot_factory):
    request = make_request(
        snapshot_factory(power=100, oxygen=100, shielding=100),
        outcome="failed",
        history=[snapshot_factory(power=100, oxygen=100, shielding=100)],
    )
    result = evaluate_mission(request)
    assert result.survivability_score == 60
    assert any(rule.rule_id == "R-MISSION-FAILED" for rule in result.explanation.rules_fired)


def test_mission_reports_low_resource_lesson(snapshot_factory):
    result = evaluate_mission(
        make_request(
            snapshot_factory(power=10, oxygen=50, shielding=50),
            history=[snapshot_factory(power=10, oxygen=50, shielding=50)],
        )
    )
    assert any("power" in lesson for lesson in result.lessons)


def test_mission_includes_deterministic_stats(snapshot_factory):
    result = evaluate_mission(
        make_request(
            snapshot_factory(power=80, oxygen=80, shielding=80),
            history=[
                snapshot_factory(power=80, oxygen=80, shielding=80),
                snapshot_factory(power=70, oxygen=80, shielding=80),
            ],
        )
    )

    assert result.stats is not None
    assert result.stats.most_costly_decision_id == "decision-0"
