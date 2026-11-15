## Application Building Context

Entry point for ALL coding agents (opencode, Codex, GitHub Copilot, Claude Code).
`CLAUDE.md` just points here.

Read in order before implementing or making any architectural decision:

1. `context/project-overview.md` — product, goals, scope
2. `context/architecture.md` — stack, boundaries, invariants
3. `context/api-contract.md` — the Game Client <-> AI service contract (shared, sacred)
4. `context/game-design.md` — resources, Kaleidoscope story structure, expert system, kid tone (replaces ui-context)
5. `context/code-standards.md` — rules per boundary (AI service / Web Game Client)
6. `context/ai-workflow-rules.md` — scoping and delivery rules
7. `context/progress-tracker.md` — current state and next steps

Then read the spec you were given in `context/specs/`.

Know which boundary you own. If your task is in `ai-service/`, do not edit `game/`
(and vice versa). Contract changes need a PR touching `api-contract.md` first.

Update `context/progress-tracker.md` after each meaningful change.
If implementation changes architecture, scope, or contract, update the relevant
context file BEFORE continuing.

## Environment first
Before running or suggesting any command, detect the environment: OS and shell,
and for Python check `uv --version` (this project uses **uv**, never bare pip/venv),
`python --version`, and whether `pytest`/`ruff` run through `uv run`. If a tool is
missing, say exactly what to install and why; do not skip verification silently.
Commands: `uv sync`, `uv run pytest`, `uv run ruff check .`, `uv run uvicorn app.main:app --reload`.

## Teaching mode (the human is learning)
For every unit, after implementing, end with a report using this structure:
1. **What this unit does** (plain language, 3-5 lines)
2. **File by file**: each file created/changed and why it exists
3. **How the pieces connect** (request flow, one short example)
4. **Manual steps for you**: anything the human must do themselves (API keys,
   `.env` values, installs, accounts, running commands), with exact steps and where
   to get each value. Never ask the human to paste secrets into chat.
5. **How to verify**: exact commands and expected output for each item in the
   spec's "Verify when done", marking each pass/fail honestly (say "not run" if not run).
6. **Concepts worth knowing**: 2-3 ideas used in this unit, explained simply.
Keep it concise. Do not claim a check passed unless you ran it.
