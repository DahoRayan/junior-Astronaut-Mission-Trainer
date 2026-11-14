# Junior Astronaut AI Service

## Run locally

From `ai-service/`:

```powershell
uv sync
uv run uvicorn app.main:app --reload --host 0.0.0.0
```

The API is available at `http://localhost:8000/v1`. Open `/docs` to inspect the
contract endpoints. The service reads the curated OSDR topic index without importing
the offline pipeline or pandas. The endpoint paths are:

- `GET /v1/health`
- `GET /v1/space-weather`
- `GET /v1/events/profile?site=moon`
- `POST /v1/assistant/questions`
- `POST /v1/assistant/answer`
- `POST /v1/evaluate/decision`
- `POST /v1/evaluate/mission`

`GET /v1/space-weather` reports neutral OSDR science evidence coverage, not live
space-weather risk. `GET /v1/events/profile` normalizes OSDR topic counts from the
committed metadata snapshot. Both responses are marked `data_source: "curated"`.

## OSDR science snapshot

The offline OSDR pipeline writes source tables under `data/osdr/tables/` and an
explainable topic index at `data/knowledge/osdr_topic_index.json`. The API reads
that JSON index and falls back to `data/curated/osdr_topic_snapshot.json`.
Topic counts describe keyword mentions in study metadata, not scientific findings
or hazard levels. Rebuild the offline snapshot with:

```powershell
uv run python -m osdr_pipeline all
```

## Deterministic evaluator

The evaluator calculates a 0-100 survivability index from resource safety,
event pressure, and resource balance. Decision ratings compare the index before
and after a choice and account for delayed costs. Mission scores combine the
average index, decision ratings, and mission outcome.

Every evaluator response includes an explanation with stable rule IDs, the
inputs used, and a simulated game-rules source. Tune thresholds, event pressure,
and penalties in `app/evaluator/config.py`; the scoring functions in
`app/evaluator/` contain no network calls, randomness, or LLM use.

## Expert system

Mission Buddy is a deterministic menu-driven expert system. Its questions and
rules are versioned in `data/knowledge/questions.json` and
`data/knowledge/rules.json`. NASA-derived text is limited to facts with a
source, retrieval date, and evidence reference in `data/knowledge/facts.json`.
The current facts use the committed OSDR metadata snapshot under `data/osdr/`;
topic counts are metadata labels, not findings or measurements.

Validate the knowledge base with:

```powershell
uv run python scripts/validate_knowledge.py
```

## Verify

```powershell
uv run pytest
uv run ruff check .
```
