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

## Unity (C#) — owner: game devs
- Defined by game devs in `context/unity-standards.md` (to be added). Minimum agreed rules:
  all AI calls via one `AIClient` class, async with 3 s timeout, local fallback text for every failure.

## API
- Contract changes follow `api-contract.md` process. Consistent error shape. Max body 20 KB.

## File Organization
- `ai-service/app/routers|schemas|evaluator|llm|nasa/` · `ai-service/tests/` · `ai-service/data/curated/`
- `contracts/` JSON examples · `context/specs/NN-name.md` per unit

## Python Tooling
- Package/env manager: **uv**. Dependencies in `pyproject.toml`, lockfile `uv.lock` committed.
- Run everything via `uv run ...`. Do not use `pip install` or hand-made venvs.
- `pyproject.toml` is the source of truth for dependencies. uv is the recommended tool;
  a teammate not using uv may install with pip from `pyproject.toml`, but must not
  commit changes to dependencies except by editing `pyproject.toml` (then run `uv lock`
  or ask the uv user to). Agents run commands using the tool that teammate has installed
  (detect first) and never create a second lockfile or requirements.txt.
