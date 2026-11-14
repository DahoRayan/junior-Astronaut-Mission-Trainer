import json
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Any

SERVICE_ROOT = Path(__file__).resolve().parents[2]
KNOWLEDGE_ROOT = SERVICE_ROOT / "data" / "knowledge"

_PREDICATE_KEYS = {
    "site",
    "perspective_id",
    "scene_id",
    "event_type",
    "min_event_severity",
    "max_event_severity",
    "event_present",
    "resource_below_any",
}


class KnowledgeValidationError(ValueError):
    """Raised when a versioned expert-system file is malformed."""


@dataclass(frozen=True)
class KnowledgeCatalog:
    version: str
    questions: tuple[dict[str, Any], ...]
    rules: tuple[dict[str, Any], ...]
    facts: dict[str, dict[str, Any]]


def _read_json(path: Path) -> Any:
    try:
        with path.open(encoding="utf-8") as handle:
            return json.load(handle)
    except (OSError, json.JSONDecodeError) as exc:
        raise KnowledgeValidationError(f"Cannot read {path.name}: {type(exc).__name__}") from exc


def _require_text(value: Any, field: str, entry_id: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise KnowledgeValidationError(f"{entry_id}: {field} must be non-empty text")
    return value


def _validate_predicates(predicates: Any, entry_id: str) -> None:
    if not isinstance(predicates, dict):
        raise KnowledgeValidationError(f"{entry_id}: predicates must be an object")
    unknown = set(predicates) - _PREDICATE_KEYS
    if unknown:
        raise KnowledgeValidationError(f"{entry_id}: unsupported predicates {sorted(unknown)}")
    for key, value in predicates.items():
        if key in {"min_event_severity", "max_event_severity"}:
            if not isinstance(value, int) or value not in (1, 2, 3):
                raise KnowledgeValidationError(f"{entry_id}: {key} must be 1, 2, or 3")
        elif key == "resource_below_any":
            if not isinstance(value, dict) or not value:
                raise KnowledgeValidationError(f"{entry_id}: resource_below_any must be non-empty")
            for resource, threshold in value.items():
                if resource not in {"power", "oxygen", "shielding"}:
                    raise KnowledgeValidationError(f"{entry_id}: unsupported resource {resource}")
                if not isinstance(threshold, int) or not 0 <= threshold <= 100:
                    raise KnowledgeValidationError(f"{entry_id}: invalid resource threshold")
        elif key == "event_present":
            if not isinstance(value, bool):
                raise KnowledgeValidationError(f"{entry_id}: event_present must be boolean")
        else:
            _require_text(value, key, entry_id)


def _validate_questions(raw: Any) -> tuple[dict[str, Any], ...]:
    if not isinstance(raw, dict) or not isinstance(raw.get("questions"), list):
        raise KnowledgeValidationError("questions.json must contain a questions list")
    questions = raw["questions"]
    ids: set[str] = set()
    for question in questions:
        if not isinstance(question, dict):
            raise KnowledgeValidationError("question entries must be objects")
        question_id = _require_text(question.get("id"), "id", "question")
        if question_id in ids:
            raise KnowledgeValidationError(f"duplicate question id: {question_id}")
        ids.add(question_id)
        _require_text(question.get("text"), "text", question_id)
        if not isinstance(question.get("order"), int):
            raise KnowledgeValidationError(f"{question_id}: order must be an integer")
        _validate_predicates(question.get("applies_when", {}), question_id)
        if not isinstance(question.get("fallback"), bool):
            raise KnowledgeValidationError(f"{question_id}: fallback must be boolean")
    return tuple(sorted(questions, key=lambda item: (item["order"], item["id"])))


def _validate_rules(
    raw: Any,
    question_ids: set[str],
    fact_ids: set[str],
) -> tuple[dict[str, Any], ...]:
    if not isinstance(raw, dict) or not isinstance(raw.get("rules"), list):
        raise KnowledgeValidationError("rules.json must contain a rules list")
    rules = raw["rules"]
    ids: set[str] = set()
    for rule in rules:
        if not isinstance(rule, dict):
            raise KnowledgeValidationError("rule entries must be objects")
        rule_id = _require_text(rule.get("id"), "id", "rule")
        if rule_id in ids:
            raise KnowledgeValidationError(f"duplicate rule id: {rule_id}")
        ids.add(rule_id)
        question_id = _require_text(rule.get("question_id"), "question_id", rule_id)
        if question_id not in question_ids:
            raise KnowledgeValidationError(f"{rule_id}: unknown question {question_id}")
        if not isinstance(rule.get("priority"), int):
            raise KnowledgeValidationError(f"{rule_id}: priority must be an integer")
        _validate_predicates(rule.get("conditions", {}), rule_id)
        _require_text(rule.get("text"), "text", rule_id)
        answer = _require_text(rule.get("answer"), "answer", rule_id)
        if len(answer) > 500 or answer.count(". ") + (1 if answer.endswith(".") else 0) > 3:
            raise KnowledgeValidationError(
                f"{rule_id}: answer must be at most 3 sentences and 500 chars"
            )
        fact_id = rule.get("fact_id")
        if fact_id is not None and fact_id not in fact_ids:
            raise KnowledgeValidationError(f"{rule_id}: unknown fact {fact_id}")
    return tuple(
        sorted(rules, key=lambda item: (item["question_id"], item["priority"], item["id"]))
    )


def _validate_facts(raw: Any) -> dict[str, dict[str, Any]]:
    if not isinstance(raw, dict) or not isinstance(raw.get("facts"), list):
        raise KnowledgeValidationError("facts.json must contain a facts list")
    facts: dict[str, dict[str, Any]] = {}
    for fact in raw["facts"]:
        if not isinstance(fact, dict):
            raise KnowledgeValidationError("fact entries must be objects")
        fact_id = _require_text(fact.get("id"), "id", "fact")
        if fact_id in facts:
            raise KnowledgeValidationError(f"duplicate fact id: {fact_id}")
        _require_text(fact.get("text"), "text", fact_id)
        _require_text(fact.get("source"), "source", fact_id)
        _require_text(fact.get("evidence"), "evidence", fact_id)
        retrieved_at = fact.get("retrieved_at")
        try:
            date.fromisoformat(retrieved_at)
        except (TypeError, ValueError) as exc:
            raise KnowledgeValidationError(
                f"{fact_id}: retrieved_at must be YYYY-MM-DD"
            ) from exc
        if fact.get("data_source") != "curated":
            raise KnowledgeValidationError(f"{fact_id}: data_source must be curated")
        facts[fact_id] = fact
    return facts


def load_catalog(root: Path = KNOWLEDGE_ROOT) -> KnowledgeCatalog:
    version = _read_json(root / "knowledge_base_version.json")
    if not isinstance(version, dict):
        raise KnowledgeValidationError("knowledge_base_version.json must be an object")
    version_id = _require_text(version.get("version"), "version", "knowledge_base")
    facts = _validate_facts(_read_json(root / "facts.json"))
    questions = _validate_questions(_read_json(root / "questions.json"))
    rules = _validate_rules(
        _read_json(root / "rules.json"),
        {question["id"] for question in questions},
        set(facts),
    )
    return KnowledgeCatalog(version_id, questions, rules, facts)
