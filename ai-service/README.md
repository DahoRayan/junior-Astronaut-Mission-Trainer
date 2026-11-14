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

## Verify

```powershell
uv run pytest
uv run ruff check .
```
