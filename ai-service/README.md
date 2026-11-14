# Junior Astronaut AI Service

## Run locally

From `ai-service/`:

```powershell
uv sync
uv run uvicorn app.main:app --reload --host 0.0.0.0
```

The API is available at `http://localhost:8000/v1`. Open `/docs` to inspect the
contract endpoints. The service currently returns contract-valid mock responses.

## Verify

```powershell
uv run pytest
uv run ruff check .
```
