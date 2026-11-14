# Junior Astronaut AI Service

## Run locally

From `ai-service/`:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
uvicorn app.main:app --reload --host 0.0.0.0
```

The API is available at `http://localhost:8000/v1`. Open `/docs` to inspect the
contract endpoints. The service currently returns contract-valid mock responses.

## Verify

```powershell
pytest
ruff check .
```
