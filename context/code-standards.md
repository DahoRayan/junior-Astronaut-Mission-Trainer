# Code Standards

## General
- Small single-purpose modules. Fix root causes, no layered workarounds.
- Never edit a boundary you don't own; do not mix unrelated boundaries in one change.

## AI Service (Python)
- Python 3.11+, full type hints, `ruff` clean, `pytest` for evaluator, expert system, routers, validator.
- Pydantic v2 models in `app/schemas/` are the contract; routers return only those models.
- Routers parse/validate, call a service function, return. No logic in routers.
- `async` for external I/O (httpx). Explicit timeouts on every external call (NASA <= 3 s).
- Config via env (`pydantic-settings`); no secrets in code or logs.
- Evaluator, rule engine and statistics are pure functions (no I/O, no randomness), unit-tested.
- Knowledge base entries (`data/knowledge/`, `data/curated/`) always include source and retrieval date;
  facts are never written from memory. A test verifies every fact has both.
- Every result that evaluates or answers includes an `Explanation`.
- NASA-dependent paths fall back to curated data and set `data_source="curated"` truthfully.
- Log request ids; do not log player data at info level.

## Unity (C#)
- Defined by game devs in `context/unity-standards.md` (to be added). Minimum: all service calls via one
  `AIClient` class, async, 3 s timeout, local fallback text for every failure.

## Story data
- `story/story-bible.json` must pass `scripts/validate_story.py` before merge.

## API
- Contract changes follow `api-contract.md` process. Consistent error shape. Max body 20 KB.

## File Organization
- `ai-service/app/{routers,schemas,evaluator,expert,nasa,stats}/` · `ai-service/data/{knowledge,curated}/`
- `ai-service/scripts/` · `ai-service/tests/` · `contracts/` · `story/` · `context/specs/NN-name.md`

## Python Tooling
- Package/env manager: **uv**. Dependencies in `pyproject.toml`, `uv.lock` committed. Run via `uv run ...`.
- `pyproject.toml` is the source of truth. A teammate without uv may install from it with pip, but
  must not create a second lockfile or `requirements.txt`; dependency changes go in `pyproject.toml`
  (then `uv lock`, or ask the uv user). Agents detect which tool is installed first.
