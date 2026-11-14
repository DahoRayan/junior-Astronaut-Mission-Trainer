# Architecture Context

## Stack
| Layer | Technology | Role |
|---|---|---|
| Game | Unity (C#) | 3D game, authoritative simulation, all UI |
| AI service | Python 3.11+, FastAPI, Pydantic v2 | HTTP API for assistant + evaluator |
| LLM | [TBD provider — see progress-tracker] | Narration/explanation only |
| NASA data | httpx -> DONKI / OSDR APIs | Real space weather + science facts |
| Cache | in-memory TTL cache | Avoid rate limits, survive outages |
| Tests | pytest, ruff | AI service quality |
| Hosting | local for dev; [TBD] for demo | Reachable by Unity build |

## System Boundaries
- `game/` — Unity project. Owns simulation, UI, scenes. Owned by game devs.
- `ai-service/` — FastAPI app. Owns evaluator, assistant, NASA data. Owned by Ibrahim.
  - `app/routers/` HTTP only · `app/evaluator/` deterministic rules · `app/llm/` provider client + prompts
  - `app/nasa/` DONKI/OSDR clients + `data/curated/` fallback JSON · `app/schemas/` Pydantic = contract
- `context/` — shared specs and agent instructions (everyone)
- `contracts/` — JSON examples mirroring `api-contract.md` (used by both sides for mocks)

## Storage Model
- No database. Game state lives in Unity memory and is sent as a snapshot per request.
- Service is stateless per request; only cache is in-memory TTL.
- Curated NASA data: versioned JSON in `ai-service/data/curated/` with source + retrieval date.
- Secrets in `.env` (never committed): LLM key, NASA API key.

## Auth and Access Model
- No user accounts. Service accepts requests from the game only.
- NASA and LLM keys exist only server-side; never in the Unity build.
- Basic per-IP rate limit + max request size on the service (public demo exposure).

## Invariants
1. Unity is the single source of truth for game state. The AI service never mutates or dictates it.
2. Survivability/trade-off scores come from deterministic Python rules, never from the LLM. The LLM only phrases feedback.
3. Every AI endpoint has a timeout and returns a valid fallback response; the game never blocks on AI.
4. All API responses match `api-contract.md` exactly, including `fallback_used` and `data_source`.
5. Data labeled `live` must be fetched live; curated or simulated data is never presented as live.
6. All player-facing text is plain language for ages 7–12; unavoidable terms are explained inline.
7. No API keys, in-code or in the Unity build.
8. Player free text is untrusted input: length-capped, never able to change system instructions.
