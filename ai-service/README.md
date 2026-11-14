# Junior Astronaut AI Service

## Run locally

From `ai-service/`:

```powershell
uv sync
uv run uvicorn app.main:app --reload --host 0.0.0.0
```

The API is available at `http://localhost:8000/v1`. Open `/docs` to inspect the
contract endpoints. The service currently returns contract-valid v2 mock responses:
health, space weather, event profile, assistant questions, assistant answers,
decision evaluation, and mission evaluation. The endpoint paths are:

- `GET /v1/health`
- `GET /v1/space-weather`
- `GET /v1/events/profile?site=moon`
- `POST /v1/assistant/questions`
- `POST /v1/assistant/answer`
- `POST /v1/evaluate/decision`
- `POST /v1/evaluate/mission`

## Deterministic evaluator

The evaluator calculates a 0-100 survivability index from resource safety,
event pressure, and resource balance. Decision ratings compare the index before
and after a choice and account for delayed costs. Mission scores combine the
average index, decision ratings, and mission outcome.

Every evaluator response includes an explanation with stable rule IDs, the
inputs used, and a simulated game-rules source. Tune thresholds, event pressure,
and penalties in `app/evaluator/config.py`; the scoring functions in
`app/evaluator/` contain no network calls, randomness, or LLM use.

## Verify

```powershell
uv run pytest
uv run ruff check .
```
