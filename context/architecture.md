# Architecture Context (v2) — Beyond Earth: First Light

## Stack
| Layer | Technology | Role |
|---|---|---|
| Game Client | Web Application (TypeScript 5+, Vite, Three.js / HTML5 Canvas + DOM/CSS HUD) | Authoritative simulation, 3D lunar terrain, UI frames, sound |
| AI Service | Python 3.11+, FastAPI, Pydantic v2, uv | Evaluator, expert system, data, statistics |
| Knowledge Base | versioned JSON in `ai-service/data/knowledge/` | Questions, rules, facts (all sourced) |
| NASA & CSA Data | httpx -> DONKI (+ curated OSDR/RadLab) | Real space weather, biology and science facts |
| Statistics | stdlib `statistics` | Event weights, debrief analysis |
| Story | `story/samples/story-bible.json` | Canonical timeline + perspectives (shared) |
| Tests | pytest, ruff, vitest/tsc | Code standards and contract validation |

No runtime generative LLM required: expert system + deterministic evaluator with full explainability.

## Client Software Architecture: Decoupled 3-Manager System
The game client architecture is organized into three independent engines communicating through a centralized **Event Bus**:

```
┌────────────────────────────────────────────────────────────────────────┐
│               Player Interface (HUD, Grid Viewport, Panels)             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Events / Commands
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Event Bus & Game State Dispatcher               │
└───────────────┬───────────────────┬───────────────────┬────────────────┘
                │                   │                   │
                ▼                   ▼                   ▼
┌───────────────────────┐ ┌───────────────────┐ ┌────────────────────────┐
│   Narrative Manager   │ │ Simulation Engine │ │    Mission Manager     │
│ • Dialogue Trees      │ │ • Tilemap Grid    │ │ • Chapter Objectives   │
│ • Expression Portraits│ │ • Power Cable Net │ │ • Failure Diagnostics │
│ • Chapter Scripts     │ │ • Physical Rates  │ │ • Debrief Scoring      │
│ • Ambient Crew Banter │ │ • Load Shedding   │ │ • Offline Fallbacks    │
└───────────────────────┘ └───────────────────┘ └────────────────────────┘
```

## System Boundaries
- `game/` Web Game client project (TypeScript + Vite). Owns simulation, viewport rendering, audio, and all UI.
- `ai-service/` FastAPI app:
  `app/routers/` HTTP only · `app/schemas/` Pydantic = contract · `app/evaluator/` pure scoring
  `app/expert/` question catalog + rule engine · `app/nasa/` DONKI client + cache + fallback
  `app/stats/` event profile + debrief stats · `data/knowledge/` questions/rules/facts
  `data/curated/` saved NASA samples (source + retrieval date) · `scripts/validate_story.py`
- `story/` story bible and dialogue scripts (shared between client and AI).
- `context/` shared specs · `contracts/` JSON examples of every request/response.

## Storage Model
- No database. Game state lives in the game client and is sent as a snapshot per request.
- Service is stateless; only an in-memory TTL cache for NASA calls.
- Knowledge base and curated data are versioned files; `knowledge_base_version` is returned by `/health`.
- Secrets in `.env` (never committed): only the NASA API key.

## Invariants
1. The Game Client is the single source of truth for simulation state; the service never mutates it.
2. Everything the service computes is deterministic: same input -> same output.
3. Every evaluation and assistant answer includes an `explanation` (rules fired, inputs, sources).
4. 100% Offline-First: Anything depending on NASA APIs has a curated fallback; the game never blocks on the service.
5. `data_source` is truthful: `live` only if fetched live, `curated` for saved NASA data, `simulated` for game-rule output.
6. Every fact shown to the player has a source and retrieval date in the knowledge base; never invent NASA facts.
7. Player-facing text is plain language for ages 7-12; terms explained inline.
8. The story bible is the only source of story truth; every perspective is validated against it before release.
9. Zero secrets in client builds.
10. Contract changes go through `api-contract.md` first.
