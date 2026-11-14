import copy
import json
from pathlib import Path

from scripts.validate_story import validate_story

SAMPLE_PATH = Path(__file__).resolve().parents[3] / "story" / "samples" / "story-bible.json"


def load_sample():
    return json.loads(SAMPLE_PATH.read_text(encoding="utf-8"))


def test_existing_draft_is_structurally_valid_with_review_warnings():
    report = validate_story(load_sample())

    assert report.valid
    assert report.warnings
    assert report.summary["events"] == 14
    assert report.summary["perspectives"] == 5


def test_strict_mode_blocks_unsigned_draft_review_issues():
    report = validate_story(load_sample(), strict=True)

    assert not report.valid
    assert any("expected exactly 3" in error for error in report.errors)
    assert any("no negative immediate or delayed cost" in error for error in report.errors)


def test_missing_event_and_sol_mismatch_are_reported():
    story = load_sample()
    story["perspectives"][0]["scenes"][0]["event_id"] = "missing"
    story["perspectives"][0]["scenes"][1]["sol"] = 99

    report = validate_story(story)

    assert any("unknown event" in error for error in report.errors)
    assert any("does not match timeline event sol" in error for error in report.errors)


def test_reveal_timing_duplicate_ids_and_contradiction_are_reported():
    story = load_sample()
    story["facts"][0]["revealed_at_sol"] = 99
    story["facts"].append(copy.deepcopy(story["facts"][0]))
    story["perspectives"][0]["scenes"][0]["type"] = "contradictory"

    report = validate_story(story)

    assert any("fact revealed too early" in error for error in report.errors)
    assert any("duplicate id" in error for error in report.errors)
    assert any("conflicts with canonical timeline" in error for error in report.errors)


def test_missing_convergence_and_no_cost_fail_in_strict_mode():
    story = load_sample()
    story["perspectives"][0]["scenes"] = [
        scene
        for scene in story["perspectives"][0]["scenes"]
        if scene["event_id"] != story["mission"]["convergence_event_id"]
    ]

    report = validate_story(story, strict=True)

    assert any("does not reach the convergence event" in error for error in report.errors)
    assert any("no negative immediate or delayed cost" in error for error in report.errors)


def test_validation_is_deterministic_and_does_not_mutate_input():
    story = load_sample()
    original = copy.deepcopy(story)

    first = validate_story(story).output()
    second = validate_story(story).output()

    assert first == second
    assert story == original
