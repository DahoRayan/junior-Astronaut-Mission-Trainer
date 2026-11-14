# Code Standards

## General
- Small single-purpose modules. Fix root causes, no layered workarounds.
- Do not mix unrelated boundaries in one change. Never edit a boundary you don't own.

## AI Service (Python) — owner: Ibrahim
- Python 3.11+, full type hints, `ruff` clean, `pytest` for evaluator and routers.
- Pydantic v2 models in `app/schemas/` are the contract; routers return only those models.
- Routers: parse/validate, call a service function, return. No logic in routers.
- `async` for all I/O (httpx, LLM). Explicit timeouts on every external call (LLM <= 2.5 s, NASA <= 3 s).
- Config via env (`pydantic-settings`). No secrets in code or logs.
- Evaluator functions are pure (no I/O, no randomness) and unit-tested.
- LLM prompts live in `app/llm/prompts/` as files, versioned, with kid-tone rules; LLM output is validated/truncated before returning.
- Every external-dependent path has a fallback returning a valid response with `fallback_used=true`.
- Log request ids and fallback reasons; never log full player text at info level.

## Web Game Client (TypeScript 5+ / Vite) — owner: Game Devs
- Directory: `game/`. Modern ESM, strict TypeScript (`strict: true`, no `any`).
- Engine architecture: Decoupled 3-Manager system (Narrative, Simulation, Mission) coordinated via `EventBus`.
- Simulation & rendering: HTML5 Canvas 2D (`image-rendering: pixelated`) for 60fps tilemap grid, free camera pan/zoom, and animated power cable pulses.
- UI layer: Semantic HTML5 / CSS DOM overlay for responsive Perimeter HUD, character expression portraits, and M.I.L.O. terminal.
- AI communication: All AI service calls channeled through `AIClient.ts` using `fetch()` with an `AbortController` (timeout <= 3.0s) and bundled local fallback responses for 100% offline reliability.
- Asset handling: Pixel-art textures, sprites, audio, and narrative chapter JSON loaded via Vite asset pipelines.
- Zero secrets in client code, bundler configs, or browser storage.

## API
- Contract changes follow `api-contract.md` process. Consistent error shape. Max body 20 KB.

## File Organization
- `ai-service/app/routers|schemas|evaluator|llm|nasa/` · `ai-service/tests/` · `ai-service/data/curated/`
- `contracts/` JSON examples · `context/specs/NN-name.md` per unit
