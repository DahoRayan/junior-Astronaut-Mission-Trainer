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

## Web Game Client (TypeScript 5+ / Vite) — owner: Game Devs
- Directory: `game/`. Modern ESM, strict TypeScript (`strict: true`, no `any`).
- Engine architecture: Decoupled 3-Manager system (Narrative, Simulation, Mission) coordinated via `EventBus`.
- Simulation & rendering: Three.js and HTML5 Canvas for 60fps 3D lunar terrain, tilemap grid, free camera pan/zoom, and animated power cable pulses.
- UI layer: Semantic HTML5 / CSS DOM overlay for responsive Perimeter HUD, character expression portraits, visual novel theater, and M.I.L.O. terminal.
- AI communication: All AI service calls channeled through `AIClient.ts` using `fetch()` with an `AbortController` (timeout <= 3.0s) and bundled local fallback responses for 100% offline reliability.
- Asset handling: 4K PBR lunar textures, sprites, audio, and narrative chapter JSON loaded via Vite asset pipelines.
- Zero secrets in client code, bundler configs, or browser storage.

## Story data
- `story/samples/story-bible.json` and dialogue files must pass `scripts/validate_story.py` before merge.

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
