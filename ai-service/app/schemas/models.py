from typing import Literal

from pydantic import BaseModel, Field

Site = Literal["moon", "mars"]
ResourceName = Literal["power", "oxygen", "shielding"]
RiskLevel = Literal["low", "medium", "high"]
Rating = Literal["great", "ok", "risky"]
Outcome = Literal["survived", "failed"]


class Resources(BaseModel):
    power: int = Field(ge=0, le=100)
    oxygen: int = Field(ge=0, le=100)
    shielding: int = Field(ge=0, le=100)


class ActiveEvent(BaseModel):
    type: str
    severity: int = Field(ge=1, le=3)


class GameSnapshot(BaseModel):
    sol: int
    mission_length: int
    site: Site
    resources: Resources
    crew: int
    active_event: ActiveEvent | None = None


class DelayedEffect(BaseModel):
    sol_offset: int
    resource: ResourceName
    delta: int


class DecisionDeltas(BaseModel):
    power: int
    oxygen: int
    shielding: int


class Decision(BaseModel):
    id: str
    label: str
    deltas: DecisionDeltas
    delayed_effects: list[DelayedEffect]


class HistoryMessage(BaseModel):
    role: str
    text: str


class AssistantChatRequest(BaseModel):
    snapshot: GameSnapshot
    message: str = Field(max_length=300)
    history: list[HistoryMessage] = Field(max_length=6)


class AssistantChatResponse(BaseModel):
    reply: str = Field(max_length=500)
    data_source: Literal["live", "curated"]
    fallback_used: bool


class SpaceWeather(BaseModel):
    risk_level: RiskLevel
    headline: str
    data_source: Literal["live", "curated"]
    source_name: str
    as_of: str


class HealthResponse(BaseModel):
    status: Literal["ok"]
    llm: bool
    nasa_live: bool


class SpaceWeatherInput(BaseModel):
    risk_level: RiskLevel


class EvaluateDecisionRequest(BaseModel):
    before: GameSnapshot
    after: GameSnapshot
    decision: Decision
    space_weather: SpaceWeatherInput | None = None


class Tradeoff(BaseModel):
    gained: str
    cost: str


class Fact(BaseModel):
    text: str
    source: str


class EvaluateDecisionResponse(BaseModel):
    rating: Rating
    survival_delta: int = Field(ge=-20, le=20)
    tradeoff: Tradeoff
    feedback: str = Field(max_length=500)
    fact: Fact | None
    data_source: Literal["live", "curated"]
    fallback_used: bool


class MissionHistoryItem(BaseModel):
    snapshot: GameSnapshot
    decision_id: str
    rating: Rating


class EvaluateMissionRequest(BaseModel):
    site: Site
    history: list[MissionHistoryItem]
    outcome: Outcome


class EvaluateMissionResponse(BaseModel):
    survivability_score: int = Field(ge=0, le=100)
    strengths: list[str] = Field(max_length=3)
    lessons: list[str] = Field(max_length=3)
    summary: str
    fallback_used: bool


class ErrorResponse(BaseModel):
    error: str
