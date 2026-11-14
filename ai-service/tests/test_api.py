from fastapi.testclient import TestClient

from app.main import app
from app.schemas.models import (
    AssistantAnswerResponse,
    AssistantQuestionsResponse,
    EvaluateDecisionResponse,
    EvaluateMissionResponse,
    HealthResponse,
    SpaceWeather,
)

client = TestClient(app)

SNAPSHOT = {
    "sol": 1,
    "mission_length": 10,
    "site": "moon",
    "perspective_id": "engineer",
    "scene_id": "power-check",
    "resources": {"power": 80, "oxygen": 90, "shielding": 70},
    "crew": 2,
    "active_event": None,
}
DECISION = {
    "id": "save-power",
    "label": "Save power",
    "deltas": {"power": -10, "oxygen": 2, "shielding": 0},
    "delayed_effects": [],
}


def test_health_endpoint_returns_model():
    response = client.get("/v1/health")
    assert response.status_code == 200
    HealthResponse.model_validate(response.json())


def test_space_weather_endpoint_returns_model():
    response = client.get("/v1/space-weather")
    assert response.status_code == 200
    weather = SpaceWeather.model_validate(response.json())
    assert weather.data_source == "curated"
    assert weather.science_status == "rich"
    assert weather.evidence


def test_event_profile_endpoint_returns_normalized_weights():
    response = client.get("/v1/events/profile?site=moon")
    assert response.status_code == 200
    profile = response.json()
    assert sum(item["weight"] for item in profile["weights"]) == 1
    assert profile["data_source"] == "curated"
    assert all(
        item["basis"].startswith("Curated OSDR metadata snapshot:") for item in profile["weights"]
    )


def test_questions_endpoint_returns_model():
    response = client.post("/v1/assistant/questions", json={"snapshot": SNAPSHOT})
    assert response.status_code == 200
    questions = AssistantQuestionsResponse.model_validate(response.json())
    assert 3 <= len(questions.questions) <= 5


def test_answer_endpoint_returns_model():
    response = client.post(
        "/v1/assistant/answer",
        json={"question_id": "resource-balance", "snapshot": SNAPSHOT},
    )
    assert response.status_code == 200
    AssistantAnswerResponse.model_validate(response.json())


def test_unknown_question_returns_contract_error():
    response = client.post(
        "/v1/assistant/answer",
        json={"question_id": "unknown", "snapshot": SNAPSHOT},
    )
    assert response.status_code == 404
    assert set(response.json()) == {"error"}


def test_decision_endpoint_returns_model():
    response = client.post(
        "/v1/evaluate/decision",
        json={
            "before": SNAPSHOT,
            "after": SNAPSHOT,
            "decision": DECISION,
            "space_weather": None,
        },
    )
    assert response.status_code == 200
    EvaluateDecisionResponse.model_validate(response.json())


def test_mission_endpoint_returns_model():
    response = client.post(
        "/v1/evaluate/mission",
        json={
            "site": "moon",
            "perspective_id": "engineer",
            "history": [],
            "outcome": "survived",
        },
    )
    assert response.status_code == 200
    EvaluateMissionResponse.model_validate(response.json())


def test_out_of_range_resource_returns_contract_error():
    invalid_snapshot = {**SNAPSHOT, "resources": {**SNAPSHOT["resources"], "power": 101}}
    response = client.post(
        "/v1/assistant/questions",
        json={"snapshot": invalid_snapshot},
    )
    assert response.status_code == 422
    assert set(response.json()) == {"error"}
