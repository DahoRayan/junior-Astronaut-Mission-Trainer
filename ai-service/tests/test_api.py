from fastapi.testclient import TestClient

from app.main import app
from app.schemas.models import (
    AssistantChatResponse,
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


def test_assistant_endpoint_returns_model():
    response = client.post(
        "/v1/assistant/chat",
        json={"snapshot": SNAPSHOT, "message": "What should I do?", "history": []},
    )
    assert response.status_code == 200
    chat = AssistantChatResponse.model_validate(response.json())
    assert chat.fallback_used is True


def test_decision_endpoint_returns_model_and_allows_risky_rule():
    risky_decision = {**DECISION, "deltas": {"power": -30, "oxygen": 0, "shielding": 0}}
    response = client.post(
        "/v1/evaluate/decision",
        json={
            "before": SNAPSHOT,
            "after": SNAPSHOT,
            "decision": risky_decision,
            "space_weather": None,
        },
    )
    assert response.status_code == 200
    decision = EvaluateDecisionResponse.model_validate(response.json())
    assert decision.rating == "risky"


def test_mission_endpoint_returns_model():
    response = client.post(
        "/v1/evaluate/mission",
        json={"site": "moon", "history": [], "outcome": "survived"},
    )
    assert response.status_code == 200
    mission = EvaluateMissionResponse.model_validate(response.json())
    assert mission.fallback_used is True


def test_out_of_range_resource_returns_contract_error():
    invalid_snapshot = {**SNAPSHOT, "resources": {**SNAPSHOT["resources"], "power": 101}}
    response = client.post(
        "/v1/assistant/chat",
        json={"snapshot": invalid_snapshot, "message": "Help", "history": []},
    )
    assert response.status_code == 422
    assert set(response.json()) == {"error"}


def test_message_over_limit_returns_contract_error():
    response = client.post(
        "/v1/assistant/chat",
        json={"snapshot": SNAPSHOT, "message": "x" * 301, "history": []},
    )
    assert response.status_code == 422
    assert set(response.json()) == {"error"}
