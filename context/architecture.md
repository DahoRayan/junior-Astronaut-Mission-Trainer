# Architecture Context (v2)

## Stack
| Layer | Technology | Role |
|---|---|---|
| Game | Unity (C#) | 3D game, story flow, authoritative simulation, all UI |
| AI service | Python 3.11+, FastAPI, Pydantic v2, uv | Evaluator, expert system, data, statistics |
| Knowledge base | versioned JSON in `ai-service/data/knowledge/` | Questions, rules, facts (all sourced) |
| NASA data | httpx -> DONKI (+ curated OSDR/RadLab) | Real space weather and science facts |
| Statistics | stdlib `statistics` (numpy only if needed) | Event weights, debrief analysis |
| Story | `story/story-bible.json` | Canonical timeline + perspectives (shared) |
| Tests | pytest, ruff | Quality |
No LLM, no LLM key, no generative component at runtime.

## System Boundaries
- `game/` Unity project (game devs).
- `ai-service/` FastAPI app:
  `app/routers/` HTTP only · `app/schemas/` Pydantic = contract · `app/evaluator/` pure scoring
  `app/expert/` question catalog + rule engine · `app/nasa/` DONKI client + cache + fallback
  `app/stats/` event profile + debrief stats · `data/knowledge/` questions/rules/facts
  `data/curated/` saved NASA samples (source + retrieval date) · `scripts/validate_story.py`
- `story/` story bible (content owned by game devs, schema + validator owned by AI side).
- `context/` shared specs · `contracts/` JSON examples of every request/response.

## Storage Model
- No database. Game state lives in Unity and is sent as a snapshot per request.
- Service is stateless; only an in-memory TTL cache for NASA calls.
- Knowledge base and curated data are versioned files; `knowledge_base_version` is returned by `/health`.
- Secrets in `.env` (never committed): only the NASA API key.

## Auth and Access
- No accounts. Service serves the game only. NASA key lives server-side only.
- Per-IP rate limit and max request size on the service.

## Invariants
1. Unity is the single source of truth for game state; the service never changes it.
2. Everything the service computes is deterministic: same input -> same output.
3. Every evaluation and assistant answer includes an `explanation` (rules fired, inputs, sources).
4. Anything depending on NASA APIs has a curated fallback; the game never blocks on the service.
5. `data_source` is truthful: `live` only if fetched live, `curated` for saved NASA data, `simulated` for game-rule output.
6. Every fact shown to the player has a source and retrieval date in the knowledge base; never invent NASA facts.
7. Player-facing text is plain language for ages 7-12; terms explained inline.
8. The story bible is the only source of story truth; every perspective is validated against it before release.
9. The assistant is menu-driven (question ids), never free text.
10. No keys in code or in the Unity build.
11. Contract changes go through `api-contract.md` first.
