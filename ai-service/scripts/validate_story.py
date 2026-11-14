import argparse
import json
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

SUPPORTED_SITES = {"moon", "mars"}
RESOURCES = {"power", "oxygen", "shielding"}
DEFAULT_PATH = Path(__file__).resolve().parents[2] / "story" / "story-bible.json"

TOP_LEVEL_FIELDS = {
    "schema_version",
    "status",
    "meta",
    "mission",
    "characters",
    "systems",
    "timeline",
    "facts",
    "decisions",
    "perspectives",
    "ambient_triggers",
    "failure_states",
    "certificate",
    "ui",
    "review_flags",
    "open_questions",
}


@dataclass
class ValidationReport:
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    summary: dict[str, Any] = field(default_factory=dict)

    @property
    def valid(self) -> bool:
        return not self.errors

    def output(self) -> str:
        lines = []
        for warning in self.warnings:
            lines.append(f"WARNING {warning}")
        for error in self.errors:
            lines.append(f"ERROR {error}")
        summary = self.summary
        lines.append(
            "Story validation "
            f"{'passed' if self.valid else 'failed'}: "
            f"site={summary.get('site')}, "
            f"length_sols={summary.get('length_sols')}, "
            f"events={summary.get('events')}, "
            f"facts={summary.get('facts')}, "
            f"perspectives={summary.get('perspectives')}, "
            f"scenes={summary.get('scenes')}, "
            f"convergence_event_id={summary.get('convergence_event_id')}"
        )
        return "\n".join(lines)


def _read(path: Path) -> dict[str, Any]:
    try:
        with path.open(encoding="utf-8") as handle:
            value = json.load(handle)
    except (OSError, json.JSONDecodeError) as exc:
        raise ValueError(f"{path}: cannot read JSON ({type(exc).__name__})") from exc
    if not isinstance(value, dict):
        raise ValueError(f"{path}: root must be an object")
    return value


def _text(value: Any, path: str, report: ValidationReport) -> bool:
    if not isinstance(value, str) or not value.strip():
        report.errors.append(f"{path}: expected non-empty text")
        return False
    return True


def _integer(value: Any, path: str, report: ValidationReport) -> bool:
    if not isinstance(value, int) or isinstance(value, bool):
        report.errors.append(f"{path}: expected integer")
        return False
    return True


def _unique(
    items: list[Any],
    field_name: str,
    path: str,
    report: ValidationReport,
) -> dict[str, dict[str, Any]]:
    values: dict[str, dict[str, Any]] = {}
    for index, item in enumerate(items):
        item_path = f"{path}[{index}]"
        if not isinstance(item, dict):
            report.errors.append(f"{item_path}: expected object")
            continue
        value = item.get(field_name)
        if not _text(value, f"{item_path}.{field_name}", report):
            continue
        if value in values:
            report.errors.append(f"{item_path}.{field_name}: duplicate id {value}")
        else:
            values[value] = item
    return values


def _review_issue(
    report: ValidationReport,
    path: str,
    message: str,
    strict: bool,
) -> None:
    (report.errors if strict else report.warnings).append(f"{path}: {message}")


def _validate_decision(
    decision: dict[str, Any],
    path: str,
    report: ValidationReport,
    strict: bool,
) -> None:
    _text(decision.get("label"), f"{path}.label", report)
    deltas = decision.get("deltas")
    if deltas is not None:
        if not isinstance(deltas, dict):
            report.errors.append(f"{path}.deltas: expected object or null")
        else:
            for resource, value in deltas.items():
                if resource not in RESOURCES:
                    report.errors.append(f"{path}.deltas.{resource}: unsupported resource")
                elif not _integer(value, f"{path}.deltas.{resource}", report):
                    continue
    delayed = decision.get("delayed_effects")
    if not isinstance(delayed, list):
        report.errors.append(f"{path}.delayed_effects: expected list")
        delayed = []
    for index, effect in enumerate(delayed):
        effect_path = f"{path}.delayed_effects[{index}]"
        if not isinstance(effect, dict):
            report.errors.append(f"{effect_path}: expected object")
            continue
        resource = effect.get("resource")
        if resource not in RESOURCES:
            report.errors.append(f"{effect_path}.resource: unsupported resource")
        _integer(effect.get("sol_offset"), f"{effect_path}.sol_offset", report)
        _integer(effect.get("delta"), f"{effect_path}.delta", report)

    immediate_cost = isinstance(deltas, dict) and any(
        isinstance(value, int) and value < 0
        for resource, value in deltas.items()
        if resource in RESOURCES
    )
    delayed_cost = any(
        isinstance(effect, dict)
        and isinstance(effect.get("delta"), int)
        and effect["delta"] < 0
        for effect in delayed
    )
    if not immediate_cost and not delayed_cost:
        _review_issue(
            report,
            path,
            "decision has no negative immediate or delayed cost",
            strict,
        )


def validate_story(data: dict[str, Any], strict: bool = False) -> ValidationReport:
    report = ValidationReport()
    unknown = set(data) - TOP_LEVEL_FIELDS
    for field_name in sorted(unknown):
        report.errors.append(f"{field_name}: unknown top-level field")

    mission = data.get("mission")
    if not isinstance(mission, dict):
        report.errors.append("mission: expected object")
        mission = {}
    site = mission.get("site")
    if site not in SUPPORTED_SITES:
        report.errors.append("mission.site: expected moon or mars")
    length_sols = mission.get("length_sols")
    if not _integer(length_sols, "mission.length_sols", report) or length_sols <= 0:
        report.errors.append("mission.length_sols: must be positive")
    convergence_id = mission.get("convergence_event_id")
    _text(convergence_id, "mission.convergence_event_id", report)

    draft = str(data.get("status", "")).startswith("draft")
    if not strict and not draft:
        strict = True
    if draft:
        _review_issue(
            report,
            "status",
            "story is draft and requires human sign-off",
            strict,
        )

    timeline_raw = data.get("timeline")
    if not isinstance(timeline_raw, list):
        report.errors.append("timeline: expected list")
        timeline_raw = []
    timeline = _unique(timeline_raw, "event_id", "timeline", report)
    for index, event in enumerate(timeline_raw):
        if not isinstance(event, dict):
            continue
        path = f"timeline[{index}]"
        sol = event.get("sol")
        if not _integer(sol, f"{path}.sol", report):
            continue
        if isinstance(length_sols, int) and not 1 <= sol <= length_sols:
            report.errors.append(f"{path}.sol: outside mission length")
        _text(event.get("type"), f"{path}.type", report)
        severity = event.get("severity")
        if not _integer(severity, f"{path}.severity", report) or severity not in (1, 2, 3):
            report.errors.append(f"{path}.severity: expected 1, 2, or 3")
        _text(event.get("summary"), f"{path}.summary", report)
    if convergence_id not in timeline:
        report.errors.append("mission.convergence_event_id: event does not exist")

    facts_raw = data.get("facts")
    if not isinstance(facts_raw, list):
        report.errors.append("facts: expected list")
        facts_raw = []
    facts = _unique(facts_raw, "fact_id", "facts", report)
    for index, fact in enumerate(facts_raw):
        if not isinstance(fact, dict):
            continue
        path = f"facts[{index}]"
        reveal_sol = fact.get("revealed_at_sol")
        if not _integer(reveal_sol, f"{path}.revealed_at_sol", report):
            continue
        if isinstance(length_sols, int) and not 1 <= reveal_sol <= length_sols:
            report.errors.append(f"{path}.revealed_at_sol: outside mission length")
        _text(fact.get("text"), f"{path}.text", report)

    decisions_raw = data.get("decisions")
    if not isinstance(decisions_raw, list):
        report.errors.append("decisions: expected list")
        decisions_raw = []
    decisions = _unique(decisions_raw, "decision_id", "decisions", report)
    for index, decision in enumerate(decisions_raw):
        if isinstance(decision, dict):
            _validate_decision(decision, f"decisions[{index}]", report, strict)

    perspectives_raw = data.get("perspectives")
    if not isinstance(perspectives_raw, list):
        report.errors.append("perspectives: expected list")
        perspectives_raw = []
    perspectives = _unique(perspectives_raw, "id", "perspectives", report)
    if len(perspectives) != 3:
        _review_issue(
            report,
            "perspectives",
            "expected exactly 3 agreed perspectives",
            strict,
        )

    scene_ids: dict[str, str] = {}
    total_scenes = 0
    for perspective_index, perspective in enumerate(perspectives_raw):
        if not isinstance(perspective, dict):
            continue
        perspective_path = f"perspectives[{perspective_index}]"
        start_sol = perspective.get("start_sol")
        if not _integer(start_sol, f"{perspective_path}.start_sol", report):
            start_sol = None
        if isinstance(start_sol, int) and isinstance(length_sols, int):
            if not 1 <= start_sol <= length_sols:
                report.errors.append(f"{perspective_path}.start_sol: outside mission length")
        scenes = perspective.get("scenes")
        if not isinstance(scenes, list) or not scenes:
            report.errors.append(f"{perspective_path}.scenes: expected non-empty list")
            continue
        previous_sol: int | None = None
        reaches_convergence = False
        for scene_index, scene in enumerate(scenes):
            total_scenes += 1
            scene_path = f"{perspective_path}.scenes[{scene_index}]"
            if not isinstance(scene, dict):
                report.errors.append(f"{scene_path}: expected object")
                continue
            scene_id = scene.get("scene_id")
            if _text(scene_id, f"{scene_path}.scene_id", report):
                if scene_id in scene_ids:
                    report.errors.append(f"{scene_path}.scene_id: duplicate id {scene_id}")
                else:
                    scene_ids[scene_id] = scene_path
            scene_sol = scene.get("sol")
            if not _integer(scene_sol, f"{scene_path}.sol", report):
                continue
            if previous_sol is not None and scene_sol < previous_sol:
                report.errors.append(f"{scene_path}.sol: scenes are not in non-decreasing order")
            previous_sol = scene_sol
            event_id = scene.get("event_id")
            event = timeline.get(event_id)
            if event is None:
                report.errors.append(f"{scene_path}.event_id: unknown event {event_id}")
            else:
                if scene_sol != event.get("sol"):
                    report.errors.append(f"{scene_path}.sol: does not match timeline event sol")
                if event_id == convergence_id:
                    reaches_convergence = True
                for field_name in ("type", "severity", "summary"):
                    if field_name in scene and scene[field_name] != event.get(field_name):
                        report.errors.append(
                            f"{scene_path}.{field_name}: conflicts with canonical timeline"
                        )
            reveals = scene.get("reveals", [])
            if not isinstance(reveals, list):
                report.errors.append(f"{scene_path}.reveals: expected list")
                reveals = []
            for fact_id in reveals:
                if fact_id not in facts:
                    report.errors.append(f"{scene_path}.reveals: unknown fact {fact_id}")
                elif facts[fact_id].get("revealed_at_sol", scene_sol) > scene_sol:
                    report.errors.append(f"{scene_path}.reveals: fact revealed too early")
            decision_ids = scene.get("decision_ids", [])
            if not isinstance(decision_ids, list):
                report.errors.append(f"{scene_path}.decision_ids: expected list")
                decision_ids = []
            for decision_id in decision_ids:
                if decision_id not in decisions:
                    report.errors.append(
                        f"{scene_path}.decision_ids: unknown decision {decision_id}"
                    )
        if not reaches_convergence:
            _review_issue(
                report,
                perspective_path,
                "perspective does not reach the convergence event",
                strict,
            )

    report.summary = {
        "site": site,
        "length_sols": length_sols,
        "events": len(timeline),
        "facts": len(facts),
        "perspectives": len(perspectives),
        "scenes": total_scenes,
        "convergence_event_id": convergence_id,
    }
    return report


def validate_path(path: Path, strict: bool = False) -> ValidationReport:
    return validate_story(_read(path), strict=strict)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Validate the story bible.")
    parser.add_argument("path", nargs="?", type=Path, default=DEFAULT_PATH)
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Treat draft review warnings as release-blocking errors.",
    )
    args = parser.parse_args(argv)
    try:
        report = validate_path(args.path, strict=args.strict)
    except ValueError as exc:
        print(f"ERROR {exc}")
        return 1
    print(report.output())
    return 0 if report.valid else 1


if __name__ == "__main__":
    sys.exit(main())
