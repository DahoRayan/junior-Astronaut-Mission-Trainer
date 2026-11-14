"""Builds context-bundle.md: all shared context files in one file you can paste into a chat model.

Run from the repo root:
    python tools/make_bundle.py                      (or: uv run python tools/make_bundle.py)
    python tools/make_bundle.py context/specs/03-deterministic-evaluator.md   (add extra files)
Do NOT commit context-bundle.md (add it to .gitignore).
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = [
    "AGENTS.md",
    "context/project-overview.md",
    "context/architecture.md",
    "context/api-contract.md",
    "context/game-design.md",
    "context/code-standards.md",
    "context/ai-workflow-rules.md",
    "context/progress-tracker.md",
    "context/specs/00-build-plan.md",
]

def main() -> None:
    files = BASE + sys.argv[1:]
    parts = []
    for rel in files:
        p = ROOT / rel
        if not p.exists():
            print(f"WARNING: missing {rel}, skipped")
            continue
        parts.append(f"\n\n=== FILE: {rel} ===\n\n{p.read_text(encoding='utf-8')}")
    out = ROOT / "context-bundle.md"
    text = "# CONTEXT BUNDLE (generated, do not edit)\n" + "".join(parts)
    out.write_text(text, encoding="utf-8")
    print(f"Wrote {out} ({len(text)} chars, about {len(text)//4} tokens)")

if __name__ == "__main__":
    main()
