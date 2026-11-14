# AI Workflow Rules

## Approach
Spec-driven and incremental. Context files define what and how; implement against them.
Do not invent behavior. Hackathon time is short: smallest working version first, then improve.

## Repo and Git
- One monorepo. Branches: `feat/ai-NN-name` (AI service), `feat/game-NN-name` (Unity).
- Never commit `.env`. Unity: use Git LFS for large assets and the standard Unity `.gitignore`.
- Merge `api-contract.md` changes before code that depends on them.

## Scoping Rules
- One unit at a time. Small verifiable increments. No speculative changes.
- Do not combine: contract changes + implementation; evaluator logic + LLM prompts; NASA client + routers.

## Mocks First
Unit 01 ships the full contract with mock responses so Unity can integrate immediately.
Real logic replaces mocks behind the same schemas.

## Handling Missing Requirements
- Do not invent product behavior. Ambiguous -> fix the context file. Missing -> add to Open Questions in `progress-tracker.md`.

## Protected Files
Do not modify without explicit instruction: anything in `game/`, `context/api-contract.md` (unless the task is a contract change), `story/story-bible.json` content (owned by game devs), `data/curated/*` and `data/knowledge/facts.json` content (every fact must be sourced and dated, never written from memory).

## Keeping Docs in Sync
Update context files when architecture, contract, standards, or scope change.

## Before Moving to the Next Unit
1. Works end to end in scope. 2. No invariant violated. 3. Tests + ruff pass.
4. Contract examples in `contracts/` still valid. 5. `progress-tracker.md` updated.

## Multi-tool use
Any agent may continue where another stopped: start every session with
"Read AGENTS.md and resume." State lives in the files, not in any chat.

## Reporting and Verification
- Follow "Teaching mode" in `AGENTS.md` at the end of every unit.
- Never report a Verify item as done unless the command was actually run and its output seen.
- The human reviews `git diff --stat`: changes outside the unit's boundary are a defect.

## Secrets and Manual Steps
- The agent creates `.env.example` with variable names only; the human creates `.env`.
- Agents must not read, print, or commit `.env`.

## Parallel Work (two people + agents in `ai-service/`)
- One unit = one owner = one branch (`feat/ai-NN-name`). Each person works in their own
  clone (or `git worktree`). Two agents never share one working directory or branch.
- Ownership is recorded in the table in `progress-tracker.md`. Do not touch another owner's unit.
- Each unit adds code in its own package/files (`app/evaluator/`, `app/nasa/`, `app/llm/`).
  Shared hot spots: `app/main.py` (router registration), `app/schemas/`, `pyproject.toml`,
  `uv.lock`, `progress-tracker.md`. Keep edits there minimal and merge small and often.
- Schema or contract changes: one person, one PR, merged first, then others rebase.
- Rebase on `main` before starting a unit and before opening a PR.
- If `uv.lock` conflicts, do not hand-edit: resolve `pyproject.toml`, then run `uv lock`.
- Each person updates only their own row/section in `progress-tracker.md`.
