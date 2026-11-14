# Unit 01: AI Service Skeleton + Contract Mocks

## Goal
A runnable FastAPI service in `ai-service/` that exposes every endpoint in
`context/api-contract.md` returning valid, hardcoded mock data, so Unity devs can
integrate immediately. No real logic, no LLM, no NASA calls yet.

## Design
No UI. Structure follows `architecture.md` boundaries. Mock texts must already follow
the kid tone in `game-design.md` (short, friendly, no unexplained jargon) and every
mock response sets `fallback_used=true` and `data_source="curated"`.

## Implementation

### Project setup
- `ai-service/` with `pyproject.toml` (Python 3.11+), `app/main.py`, `app/config.py`,
  `app/routers/`, `app/schemas/`, `tests/`, `.env.example`, `README.md` (run instructions).
- `app/config.py`: `pydantic-settings`, reads env; fields for LLM key and NASA key are
  optional for now. `.env` is gitignored.

### Schemas (`app/schemas/`)
- Pydantic v2 models for every type in `api-contract.md`: GameSnapshot, Decision,
  assistant chat, evaluate decision, evaluate mission, space weather, health, error.
- Enforce bounds from the contract: resources 0-100, message <= 300 chars,
  history <= 6, feedback/reply length caps as validators.

### Routers (`app/routers/`)
- `GET /v1/health`, `GET /v1/space-weather`, `POST /v1/assistant/chat`,
  `POST /v1/evaluate/decision`, `POST /v1/evaluate/mission`.
- Each returns a fixed mock that validates against its response model.
- Mock evaluator varies `rating` by a trivial rule on the decision's deltas (e.g.
  any delta <= -30 -> "risky") so Unity sees all three states.
- Consistent error shape `{error: string}` via exception handlers; max body 20 KB.

### CORS
- Allow all origins in dev (needed for Unity WebGL builds); tighten in Unit 06.

### Contract examples (`contracts/`)
- One request and one response JSON file per endpoint, generated from the models,
  e.g. `evaluate-decision.request.json` / `.response.json`.

### Tests (`tests/`)
- One pytest per endpoint using `TestClient`: 200 on valid input, 422 on out-of-range input,
  and a check that every mock response validates against its model.

## Dependencies
- fastapi, uvicorn[standard], pydantic, pydantic-settings, pytest, httpx (TestClient), ruff

## Verify when done
- [ ] `uvicorn app.main:app --reload` starts; `/docs` lists all 5 endpoints
- [ ] Every endpoint returns data valid against `api-contract.md`
- [ ] Out-of-range inputs return 422 with `{error}` shape
- [ ] `contracts/*.json` examples exist and match the models
- [ ] `pytest` and `ruff check` pass
- [ ] No keys in code; `.env` gitignored
- [ ] Friend can run `curl` against it from another machine on the LAN
- [ ] `progress-tracker.md` updated
