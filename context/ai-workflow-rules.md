# AI Workflow Rules

## Approach
Spec-driven and incremental. Context files define what and how; implement against them.
Do not invent behavior. Hackathon time is short: smallest working version first, then improve.

## Repo and Git
- One monorepo. Branches: `feat/ai-NN-name` (AI service), `feat/game-NN-name` (Web Game).
- Never commit `.env`. Web Game: ignore `node_modules/`, `dist/`, and local build caches.
- Merge `api-contract.md` changes before code that depends on them.

## Scoping Rules
- One unit at a time. Small verifiable increments. No speculative changes.
- Do not combine: contract changes + implementation; evaluator logic + LLM prompts; NASA client + routers.

## Mocks First
Unit 01 ships the full contract with mock responses so the web game client can integrate immediately.
Real logic replaces mocks behind the same schemas.

## Handling Missing Requirements
- Do not invent product behavior. Ambiguous -> fix the context file. Missing -> add to Open Questions in `progress-tracker.md`.

## Protected Files
Do not modify without explicit instruction: anything in `game/`, `context/api-contract.md` (unless the task is a contract change), `data/curated/*` content (facts must be sourced).

## Keeping Docs in Sync
Update context files when architecture, contract, standards, or scope change.

## Before Moving to the Next Unit
1. Works end to end in scope. 2. No invariant violated. 3. Tests + ruff pass.
4. Contract examples in `contracts/` still valid. 5. `progress-tracker.md` updated.

## Multi-tool use
Any agent may continue where another stopped: start every session with
"Read AGENTS.md and resume." State lives in the files, not in any chat.
