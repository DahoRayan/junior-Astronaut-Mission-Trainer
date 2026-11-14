from dataclasses import dataclass
from typing import Any

from app.expert.knowledge import KnowledgeCatalog
from app.schemas.models import (
    AssistantQuestion,
    Explanation,
    ExplanationRule,
    ExplanationSource,
    GameSnapshot,
)


@dataclass(frozen=True)
class ExpertAnswer:
    answer: str
    fact: dict[str, str] | None
    explanation: Explanation
    data_source: str


def _snapshot_values(snapshot: GameSnapshot) -> dict[str, Any]:
    event = snapshot.active_event
    return {
        "site": snapshot.site,
        "perspective_id": snapshot.perspective_id,
        "scene_id": snapshot.scene_id,
        "event_type": event.type if event else None,
        "event_severity": event.severity if event else None,
        "resources": snapshot.resources.model_dump(),
    }


def _matches(predicates: dict[str, Any], values: dict[str, Any]) -> bool:
    event_severity = values["event_severity"]
    for key, expected in predicates.items():
        if key in {"site", "perspective_id", "scene_id"} and values[key] != expected:
            return False
        if key == "event_type" and values["event_type"] != expected:
            return False
        if key == "event_present" and (values["event_type"] is not None) != expected:
            return False
        if key == "min_event_severity" and (
            event_severity is None or event_severity < expected
        ):
            return False
        if key == "max_event_severity" and (
            event_severity is None or event_severity > expected
        ):
            return False
        if key == "resource_below_any" and not any(
            values["resources"][resource] < threshold
            for resource, threshold in expected.items()
        ):
            return False
    return True


class ExpertSystem:
    def __init__(self, catalog: KnowledgeCatalog):
        self.catalog = catalog

    def questions(self, snapshot: GameSnapshot) -> list[AssistantQuestion]:
        values = _snapshot_values(snapshot)
        matched = [
            question
            for question in self.catalog.questions
            if _matches(question["applies_when"], values)
        ]
        selected = matched[:5]
        if len(selected) < 3:
            selected_ids = {question["id"] for question in selected}
            selected.extend(
                question
                for question in self.catalog.questions
                if question["fallback"]
                and question["id"] not in selected_ids
                and len(selected) < 5
            )
        return [
            AssistantQuestion(id=question["id"], text=question["text"])
            for question in selected[:5]
        ]

    def answer(self, question_id: str, snapshot: GameSnapshot) -> ExpertAnswer | None:
        question_ids = {question["id"] for question in self.catalog.questions}
        if question_id not in question_ids:
            return None
        values = _snapshot_values(snapshot)
        rule = next(
            (
                rule
                for rule in self.catalog.rules
                if rule["question_id"] == question_id
                and _matches(rule["conditions"], values)
            ),
            None,
        )
        if rule is None:
            return None
        fact_data = self.catalog.facts.get(rule.get("fact_id"))
        fact = (
            {"text": fact_data["text"], "source": fact_data["source"]}
            if fact_data
            else None
        )
        sources = [
            ExplanationSource(name="Mission rules", kind="simulated"),
        ]
        if fact_data:
            sources.append(ExplanationSource(name=fact_data["source"], kind="curated"))
        explanation = Explanation(
            rules_fired=[ExplanationRule(rule_id=rule["id"], text=rule["text"])],
            inputs={
                "site": snapshot.site,
                "perspective_id": snapshot.perspective_id,
                "scene_id": snapshot.scene_id,
                "active_event": (
                    snapshot.active_event.model_dump() if snapshot.active_event else None
                ),
                "resources": snapshot.resources.model_dump(),
            },
            sources=sources,
        )
        return ExpertAnswer(
            answer=rule["answer"],
            fact=fact,
            explanation=explanation,
            data_source="curated" if fact_data else "simulated",
        )
