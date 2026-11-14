from app.expert import ExpertSystem, load_catalog
from app.schemas.models import GameSnapshot


def snapshot(**overrides):
    value = {
        "sol": 1,
        "mission_length": 10,
        "site": "moon",
        "perspective_id": "engineer",
        "scene_id": "power-check",
        "resources": {"power": 80, "oxygen": 90, "shielding": 70},
        "crew": 2,
        "active_event": None,
    }
    value.update(overrides)
    return GameSnapshot.model_validate(value)


def test_questions_include_specialized_and_fallback_items():
    system = ExpertSystem(load_catalog())
    result = system.questions(
        snapshot(
            resources={"power": 30, "oxygen": 90, "shielding": 70},
            active_event={"type": "solar_flare", "severity": 2},
        )
    )

    assert 3 <= len(result) <= 5
    assert [item.id for item in result][:3] == [
        "resource-balance",
        "event-risk",
        "perspective-plan",
    ]


def test_questions_are_reproducible_and_have_fallbacks():
    system = ExpertSystem(load_catalog())
    first = system.questions(snapshot(perspective_id="doctor", scene_id="health-check"))
    second = system.questions(snapshot(perspective_id="doctor", scene_id="health-check"))

    assert first == second
    assert len(first) == 3


def test_sourced_answer_has_curated_fact_and_explanation():
    system = ExpertSystem(load_catalog())
    result = system.answer("science-evidence", snapshot())

    assert result is not None
    assert result.data_source == "curated"
    assert result.fact is not None
    assert result.explanation.rules_fired[0].rule_id == "R-OSDR-COVERAGE"
    assert len(result.answer.split(". ")) <= 3


def test_unknown_or_inapplicable_question_returns_none():
    system = ExpertSystem(load_catalog())

    assert system.answer("unknown", snapshot()) is None
    assert system.answer("event-risk", snapshot()) is not None
