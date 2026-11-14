from typing import Literal

from pydantic import BaseModel, Field

Site = Literal["moon", "mars"]
ResourceName = Literal["power", "oxygen", "shielding"]
RiskLevel = Literal["low", "medium", "high"]
Rating = Literal["great", "ok", "risky"]
Outcome = Literal["survived", "failed"]
DataSource = Literal["live", "curated", "simulated"]


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
    perspective_id: str
    scene_id: str
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


class ExplanationRule(BaseModel):
    rule_id: str
    text: str


class ExplanationSource(BaseModel):
    name: str
    kind: DataSource


class Explanation(BaseModel):
    rules_fired: list[ExplanationRule]
    inputs: dict
    sources: list[ExplanationSource]


class HealthResponse(BaseModel):
    status: Literal["ok"]
    nasa_live: bool
    knowledge_base_version: str


class SpaceWeather(BaseModel):
    science_status: Literal["limited", "moderate", "rich"]
    headline: str
    evidence: list[dict[str, int | str]]
    data_source: DataSource
    source_name: str
    as_of: str


class EventProfileWeight(BaseModel):
    event_type: str
    weight: float = Field(ge=0, le=1)
    basis: str


class EventProfileResponse(BaseModel):
    weights: list[EventProfileWeight]
    data_source: DataSource
    as_of: str


class AssistantQuestionsRequest(BaseModel):
    snapshot: GameSnapshot


class AssistantQuestion(BaseModel):
    id: str
    text: str


class AssistantQuestionsResponse(BaseModel):
    questions: list[AssistantQuestion] = Field(min_length=3, max_length=5)


class AssistantAnswerRequest(BaseModel):
    question_id: str
    snapshot: GameSnapshot


class Fact(BaseModel):
    text: str
    source: str


class AssistantAnswerResponse(BaseModel):
    answer: str = Field(max_length=500)
    fact: Fact | None
    explanation: Explanation
    data_source: DataSource


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
    explanation: Explanation
    data_source: DataSource


class MissionHistoryItem(BaseModel):
    snapshot: GameSnapshot
    decision_id: str
    rating: str


class OtherRun(BaseModel):
    perspective_id: str
    survivability_score: int = Field(ge=0, le=100)


class EvaluateMissionRequest(BaseModel):
    site: Site
    perspective_id: str
    history: list[MissionHistoryItem]
    outcome: Outcome
    other_runs: list[OtherRun] | None = None


class ResourceStats(BaseModel):
    mean: float
    min: int
    trend: Literal["up", "down", "flat"]


class PerspectiveComparison(BaseModel):
    perspective_id: str
    survivability_score: int = Field(ge=0, le=100)


class MissionStats(BaseModel):
    resource_stats: dict[ResourceName, ResourceStats]
    rating_counts: dict[Rating, int]
    most_costly_decision_id: str | None
    event_exposure_sols: int
    perspective_comparison: list[PerspectiveComparison]


class MissionExplanation(Explanation):
    pass


class EvaluateMissionResponse(BaseModel):
    survivability_score: int = Field(ge=0, le=100)
    strengths: list[str] = Field(max_length=3)
    lessons: list[str] = Field(max_length=3)
    summary: str
    stats: MissionStats | None
    explanation: Explanation


class ErrorResponse(BaseModel):
    error: str
