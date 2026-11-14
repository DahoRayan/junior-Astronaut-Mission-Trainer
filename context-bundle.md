# CONTEXT BUNDLE (generated, do not edit)


=== FILE: AGENTS.md ===

## Application Building Context

Entry point for ALL coding agents (opencode, Codex, GitHub Copilot, Claude Code).
`CLAUDE.md` just points here.

Read in order before implementing or making any architectural decision:

1. `context/project-overview.md` — product, goals, scope
2. `context/architecture.md` — stack, boundaries, invariants
3. `context/api-contract.md` — the Unity <-> AI service contract (shared, sacred)
4. `context/game-design.md` — resources, Kaleidoscope story structure, expert system, kid tone (replaces ui-context)
5. `context/code-standards.md` — rules per boundary (AI service / Unity)
6. `context/ai-workflow-rules.md` — scoping and delivery rules
7. `context/progress-tracker.md` — current state and next steps

Then read the spec you were given in `context/specs/`.

Know which boundary you own. If your task is in `ai-service/`, do not edit `game/`
(and vice versa). Contract changes need a PR touching `api-contract.md` first.

Update `context/progress-tracker.md` after each meaningful change.
If implementation changes architecture, scope, or contract, update the relevant
context file BEFORE continuing.

## Environment first
Before running or suggesting any command, detect the environment: OS and shell,
and for Python check `uv --version` (this project uses **uv**, never bare pip/venv),
`python --version`, and whether `pytest`/`ruff` run through `uv run`. If a tool is
missing, say exactly what to install and why; do not skip verification silently.
Commands: `uv sync`, `uv run pytest`, `uv run ruff check .`, `uv run uvicorn app.main:app --reload`.

## Teaching mode (the human is learning)
For every unit, after implementing, end with a report using this structure:
1. **What this unit does** (plain language, 3-5 lines)
2. **File by file**: each file created/changed and why it exists
3. **How the pieces connect** (request flow, one short example)
4. **Manual steps for you**: anything the human must do themselves (API keys,
   `.env` values, installs, accounts, running commands), with exact steps and where
   to get each value. Never ask the human to paste secrets into chat.
5. **How to verify**: exact commands and expected output for each item in the
   spec's "Verify when done", marking each pass/fail honestly (say "not run" if not run).
6. **Concepts worth knowing**: 2-3 ideas used in this unit, explained simply.
Keep it concise. Do not claim a check passed unless you ran it.


=== FILE: context/project-overview.md ===

# Junior Astronaut Mission Trainer (v2 plan)

## Overview
A story-driven 3D Unity game for kids aged 7-12 (NASA Space Apps 2026, "Build a Junior
Astronaut Mission Trainer"). The player lives one lunar mission, told Kaleidoscope-style:
ONE canonical story, several starting points (crew roles). Each perspective sees a different
slice and makes different decisions, and all of them stay consistent with the same timeline and
converge on a shared critical event. Every decision is a trade-off between power, oxygen and
radiation shielding.
A Python FastAPI service provides the "science brain", with NO LLM at runtime:
- an **expert system** built from curated NASA data that answers the player's questions,
- a **deterministic evaluator** that judges decisions and explains why,
- a **statistics layer**: event probabilities from real data + a post-mission analysis,
- a **story consistency validator** for the shared story bible.
Everything the service says is explainable: the rules fired, the inputs, and the data source.

## Goals
1. Player sees >= 3 distinct trade-offs where saving one resource costs another.
2. >= 3 starting points (perspectives) of the same mission; each playable, all consistent.
3. Every evaluation and every assistant answer comes with a visible "why" (rules + inputs + source).
4. At least one event frequency or fact comes from real NASA data (DONKI / RadLab / OSDR), labeled live or saved.
5. Post-mission debrief shows simple statistics on the player's choices and compares perspectives.
6. The game is fully playable with the service offline (Unity ships local fallback text).

## Core User Flow
1. Player picks a starting point (e.g. engineer, doctor, commander) with a short intro.
2. Story scenes advance sol by sol; each scene may carry an event and a decision.
3. Player chooses; resources change; some costs land later.
4. Evaluator returns rating + trade-off + explanation ("Why?" button shows the rules).
5. Player can open "Mission Buddy": tappable questions relevant to the current scene.
6. All perspectives converge on the shared critical event.
7. Debrief: survivability score, lessons, simple statistics, comparison with other perspectives played.
8. Replay from another starting point to see the same story from a different side.

## Features
### Game (Unity - friends)
Scenes, story flow, HUD, decisions UI, "Why?" and Mission Buddy UI, perspective select, debrief UI.
### AI service (FastAPI - Ibrahim + teammate)
Evaluator, expert system, NASA data layer, statistics, story validator.

## Scope
### In scope
- 3 core resources (power, oxygen, shielding); one site (Moon); ~10-15 sol mission
- 3 perspectives, one canonical timeline, one convergence event
- Tappable-question assistant (no free text); deterministic rules; curated NASA facts
- DONKI integration with curated fallback; simple statistics (stdlib / light numpy)
### Out of scope
- LLM chatbot or any generative text at runtime; free-text chat
- Accounts, persistence, multiplayer, voice; Mars (stretch); food resource (stretch)
- AI control of game state

## Success Criteria
1. A judge can play 2 perspectives and see the same story from two sides.
2. Any answer/score can be explained with its rules and sources.
3. Killing the service mid-game does not block the game.
4. Same inputs always give the same outputs.
5. Story validator passes: no contradictions across perspectives.
6. Data sources are credited in-game and in the submission write-up.


=== FILE: context/architecture.md ===

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


=== FILE: context/api-contract.md ===

# API Contract (v2) - Unity <-> AI Service

Change this file first, in its own PR, before changing either side.
Base `/v1`, JSON only, resources 0-100. v2 replaces the LLM chat endpoint with an expert system.
Breaking changes vs v1: `/assistant/chat` removed; `fallback_used` removed; `llm` removed from health;
`explanation` added; snapshot gains `perspective_id` and `scene_id`.

## Shared types
GameSnapshot: { sol:int, mission_length:int, site:"moon"|"mars", perspective_id:string, scene_id:string,
  resources:{power:int, oxygen:int, shielding:int}, crew:int,
  active_event:{type:string, severity:1-3}|null }
Decision: { id:string, label:string, deltas:{power:int, oxygen:int, shielding:int},
  delayed_effects:[{sol_offset:int, resource:string, delta:int}] }
Explanation: { rules_fired:[{rule_id:string, text:string}], inputs:object,
  sources:[{name:string, kind:"live"|"curated"|"simulated"}] }
DataSource = "live" | "curated" | "simulated"

## GET /v1/health
-> { status:"ok", nasa_live:bool, knowledge_base_version:string }

## GET /v1/space-weather
-> { risk_level:"low"|"medium"|"high", headline:string, data_source:DataSource, source_name:string, as_of:ISO8601 }

## GET /v1/events/profile?site=moon
-> { weights:[{event_type:string, weight:float, basis:string}], data_source:DataSource, as_of:ISO8601 }
(weights sum to 1; derived from real frequencies; Unity uses them to pick randomized events)

## POST /v1/assistant/questions
Request: { snapshot:GameSnapshot }
Response: { questions:[{id:string, text:string}] }  (3-5, relevant to scene/event/resources)

## POST /v1/assistant/answer
Request: { question_id:string, snapshot:GameSnapshot }
Response: { answer:string (<=3 sentences), fact:{text:string, source:string}|null,
  explanation:Explanation, data_source:DataSource }
Unknown question_id -> 404 { error }.

## POST /v1/evaluate/decision
Request: { before:GameSnapshot, after:GameSnapshot, decision:Decision, space_weather:{risk_level}|null }
Response: { rating:"great"|"ok"|"risky", survival_delta:int(-20..20),
  tradeoff:{gained:string, cost:string}, feedback:string (<=2 sentences),
  fact:{text:string, source:string}|null, explanation:Explanation, data_source:DataSource }

## POST /v1/evaluate/mission
Request: { site, perspective_id:string,
  history:[{snapshot:GameSnapshot, decision_id:string, rating:string}],
  outcome:"survived"|"failed",
  other_runs:[{perspective_id:string, survivability_score:int}] (optional) }
Response: { survivability_score:int(0-100), strengths:[string<=3], lessons:[string<=3], summary:string,
  stats:{ resource_stats:{power|oxygen|shielding:{mean:float, min:int, trend:"up"|"down"|"flat"}},
          rating_counts:{great:int, ok:int, risky:int}, most_costly_decision_id:string|null,
          event_exposure_sols:int, perspective_comparison:[{perspective_id, survivability_score}] }|null,
  explanation:Explanation }
(`stats` is null until the statistics unit ships.)

## Errors
{ error:string } with 4xx/5xx. Unity treats any error or >3 s timeout as "use local fallback text".


=== FILE: context/game-design.md ===

# Game Design Context (v2: story + perspectives)

## Audience and Tone
Ages 7-12. Short sentences, friendly, encouraging, never punishing: failure = "mission lesson".
Explain terms inline once ("radiation dose: how much invisible space energy reaches your body").
"Mission Buddy" = friendly face of the expert system. It only answers from the knowledge base.

## Core Resources (3)
| Resource | Real constraint it teaches | Spent by / protects |
|---|---|---|
| Power | Solar/battery limited, lunar night | Runs life support, comms, science, shielding |
| Oxygen | Life support is finite and powered | Drains with crew/activity; made with power |
| Shielding | Radiation risk spikes with solar events | Costs power/time; protects crew |
Every decision must lower a resource or raise a risk. Some effects land 1-2 sols later.

## Kaleidoscope Structure
- ONE canonical timeline (the "story bible"): a list of events per sol, with a single critical
  convergence event (e.g. a major solar storm).
- 3 perspectives (starting points), e.g. Engineer (power), Doctor (radiation/health), Commander (comms/decisions).
  Each perspective starts at a different place/sol, knows different facts, sees different scenes,
  faces different decisions, but is consistent with the same timeline and ends at the convergence event.
- Replay value: see the same events from another side; debrief compares perspectives.
- Scope guard: 3 perspectives x ~5 scenes. More is stretch.

### `story/story-bible.json` (schema, owned jointly; content by game devs)
{ "mission": {"site", "length_sols", "convergence_event_id"},
  "timeline": [{"event_id", "sol", "type", "severity", "summary"}],
  "facts": [{"fact_id", "revealed_at_sol", "text"}],
  "perspectives": [{"id", "role", "start_sol",
     "scenes": [{"scene_id", "sol", "event_id", "reveals":[fact_id], "decision_ids":[...]}]}] }

### Consistency rules (checked by `scripts/validate_story.py`)
1. Every scene's `event_id` exists in the timeline and the scene `sol` matches the event's sol.
2. Every `reveals` fact exists; a fact is never used before its `revealed_at_sol`.
3. Every perspective reaches the convergence event.
4. No two perspectives disagree on a timeline fact (same event, same sol, same severity).
5. Every scene id and decision id is unique; every decision has at least one cost (a negative delta or delayed effect).
6. Scenes within a perspective are in non-decreasing sol order.

## Expert System (Mission Buddy)
- Knowledge base: `ai-service/data/knowledge/`: `questions.json` (id, text, applies_when),
  `rules.json` (rule_id, conditions on the snapshot, answer template, fact ids), `facts.json`
  (fact_id, text, source, retrieved date, kind).
- Each scene shows 3-5 tappable questions picked by `applies_when` (event, low resource, perspective).
- Inference: simple forward chaining over the snapshot; the answer is the matched rule's template + fact.
- Always returns `explanation`: rules fired, inputs, sources. "Why am I seeing this?" is always answerable.

## Evaluator Rubric
See `specs/03-deterministic-evaluator.md`. Deterministic. Ratings great/ok/risky. Every rating lists the rules behind it.

## Statistics (simple)
- Event weights: relative frequency of event types in real DONKI data (flares, CMEs, geomagnetic storms) -> randomized (non-story) events.
- Debrief: per-resource mean/min/trend, rating counts, costliest decision, exposure to events, perspective comparison.

## Data Attribution
In-game "Science Corner" lists sources (DONKI, OSDR, RadLab). Badge each item LIVE or SAVED NASA DATA.
Never show saved data as live.


=== FILE: context/code-standards.md ===

# Code Standards

## General
- Small single-purpose modules. Fix root causes, no layered workarounds.
- Never edit a boundary you don't own; do not mix unrelated boundaries in one change.

## AI Service (Python)
- Python 3.11+, full type hints, `ruff` clean, `pytest` for evaluator, expert system, routers, validator.
- Pydantic v2 models in `app/schemas/` are the contract; routers return only those models.
- Routers parse/validate, call a service function, return. No logic in routers.
- `async` for external I/O (httpx). Explicit timeouts on every external call (NASA <= 3 s).
- Config via env (`pydantic-settings`); no secrets in code or logs.
- Evaluator, rule engine and statistics are pure functions (no I/O, no randomness), unit-tested.
- Knowledge base entries (`data/knowledge/`, `data/curated/`) always include source and retrieval date;
  facts are never written from memory. A test verifies every fact has both.
- Every result that evaluates or answers includes an `Explanation`.
- NASA-dependent paths fall back to curated data and set `data_source="curated"` truthfully.
- Log request ids; do not log player data at info level.

## Unity (C#)
- Defined by game devs in `context/unity-standards.md` (to be added). Minimum: all service calls via one
  `AIClient` class, async, 3 s timeout, local fallback text for every failure.

## Story data
- `story/story-bible.json` must pass `scripts/validate_story.py` before merge.

## API
- Contract changes follow `api-contract.md` process. Consistent error shape. Max body 20 KB.

## File Organization
- `ai-service/app/{routers,schemas,evaluator,expert,nasa,stats}/` · `ai-service/data/{knowledge,curated}/`
- `ai-service/scripts/` · `ai-service/tests/` · `contracts/` · `story/` · `context/specs/NN-name.md`

## Python Tooling
- Package/env manager: **uv**. Dependencies in `pyproject.toml`, `uv.lock` committed. Run via `uv run ...`.
- `pyproject.toml` is the source of truth. A teammate without uv may install from it with pip, but
  must not create a second lockfile or `requirements.txt`; dependency changes go in `pyproject.toml`
  (then `uv lock`, or ask the uv user). Agents detect which tool is installed first.


=== FILE: context/ai-workflow-rules.md ===

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


=== FILE: context/progress-tracker.md ===

# Progress Tracker

Update after every meaningful change (only your own unit/row).

## Current Phase
- Plan v2 adopted (story-driven, expert system, statistics). Unit 01 awaiting verification.

## Current Goal
- Verify Unit 01, then Unit 02 (contract v2 migration, see specs/02-contract-v2-migration.md)

## Completed
- Unit 01 implemented (v1 contract mocks); verification pending

## In Progress
- None

## Open Questions
- Names of the 3 perspectives and number of scenes each (game devs)
- Who writes the story content, and the final story-bible schema sign-off
- Exact event type list and which resource counters each (game devs + AI side)
- Mission length (sols) and the convergence event
- Which curated facts to include (OSDR/RadLab picks) and who selects them
- WebGL or desktop build; where the service is hosted for judging
- Stretch: Mars, food resource, `stats` perspective comparison depth

## Architecture Decisions
- Single monorepo with folder ownership; shared context at root.
- No LLM at runtime: expert system + deterministic evaluator; explainability on every result (mentor feedback, agreed by team).
- Kaleidoscope storytelling via a shared story bible validated by script.
- Mocks first, then real logic behind the same schemas.

## Unit Ownership
| Unit | Owner | Branch | Status |
|---|---|---|---|
| 01 skeleton + mocks (v1) | Ibrahim | feat/ai-01-skeleton | in verification |
| 02 contract v2 migration | TBD | | not started |
| 03 deterministic evaluator | TBD | | not started |
| 04 NASA data layer | TBD | | not started |
| 05 expert system | TBD | | not started |
| 06 story validator | TBD | | not started |
| 07 statistics | TBD | | not started |
| 08 hardening + deploy | TBD | | not started |

## Session Notes
- Resume with: "Read AGENTS.md and resume."


=== FILE: context/specs/00-build-plan.md ===

# Build Plan - AI Service (v2)

| # | Unit | Depends on | Notes |
|---|---|---|---|
| 01 | Skeleton + mocks (v1 contract) | - | DONE, awaiting verification |
| 02 | Contract v2 migration (mocks) | 01 | Do first so Unity integrates against the new contract |
| 03 | Deterministic evaluator + explanations | 02 | rules engine for decisions/missions |
| 04 | NASA data layer + curated dataset | 02 | DONKI client, cache, curated fallback, curated facts |
| 05 | Expert system | 02 (04 for facts) | question catalog, knowledge base, rule engine |
| 06 | Story bible schema + validator | 02 + agreed story schema | `scripts/validate_story.py`, tests with good/bad examples |
| 07 | Statistics | 03, 04 | event profile endpoint + debrief `stats` |
| 08 | Hardening + deploy | all | rate limit, input caps, logging, hosting, demo script |

Parallel after 02: units 03, 04, 06 are independent. 05 can start with a seed knowledge base. 07 waits for 03 + 04.
Each unit gets `NN-name.md` just before building (use `_template.md`).
Game-side units are planned by the game devs; sync at every contract or story-schema change.
