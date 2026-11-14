Unit 01 Teaching Mode Report
1. What this unit does
Unit 01 creates a runnable FastAPI service with five mock API endpoints:

Health status
Space-weather data
Assistant chat
Decision evaluation
Mission evaluation
The responses use Pydantic schemas and fallback mock data. No real NASA calls, LLM calls, or game logic are included yet.

2. File by file
pyproject.toml — project dependencies and uv dev dependency group.
uv.lock — locked dependency versions.
README.md — uv setup and run instructions.
.env.example — optional future API-key placeholders.
.gitignore — excludes .env, virtual environments, and caches.
app/main.py — FastAPI app, CORS, body-size limit, and validation errors.
app/config.py — environment configuration.
app/schemas/models.py — Pydantic request and response models.
app/routers/health.py — health endpoint.
app/routers/space_weather.py — mock space-weather endpoint.
app/routers/assistant.py — mock assistant endpoint.
app/routers/evaluation.py — mock decision and mission evaluation.
tests/test_api.py — endpoint and validation tests.
contracts/ — request/response JSON examples for integration.
3. How the pieces connect
Example request flow:

Unity sends POST /v1/assistant/chat.
FastAPI validates the JSON using AssistantChatRequest.
The assistant router returns a mock AssistantChatResponse.
Invalid values, such as a message over 300 characters, return { "error": "..." }.
4. Manual steps for you
From the ai-service directory:


No API keys are needed for Unit 01. Do not create a .env file yet.

The API will be available at:


Open the API documentation at:


5. How to verify
Requirement	Result
uv sync	PASS
uv run pytest	PASS — 7 tests passed
uv run ruff check .	PASS — all checks passed
Uvicorn starts	PASS
/docs lists all 5 endpoints	PASS
Health endpoint responds	PASS
Contract JSON files parse	PASS
Validation returns 422 error shape	PASS — covered by tests
.env is ignored	PASS — verified by project files
LAN access from another machine	Not run
Python version	uv used CPython 3.14.6; bare python is not on PATH
Pytest emitted one Starlette/httpx deprecation warning, but all tests passed.

6. Concepts worth knowing
Pydantic models validate incoming and outgoing JSON automatically.
FastAPI routers keep each endpoint group small and organized.
uv manages the Python environment, dependencies, lock file, and command execution without needing bare pip or python.

Unit 02 Teaching Mode Report
1. What this unit does
Migrated the AI service from contract v1 to v2 mock endpoints.

Replaced free-text chat with menu-driven assistant questions.
Added explanations to assistant and evaluator responses.
Added event profile and mission statistics mocks.
Removed fallback_used, llm, and LLM configuration.
Committed as bd28c5c.
2. File by file
models.py — v2 Pydantic schemas.
main.py — v2 routers and {error} HTTP handling.
assistant.py — questions and answers endpoints.
events.py — event profile mock.
evaluation.py — explanations and mission stats.
health.py — v2 health response.
space_weather.py — updated mock response.
config.py — removed LLM configuration.
.env.example — now contains only NASA_API_KEY.
test_api.py — v2 endpoint, validation, and 404 tests.
README.md — v2 endpoint list.
contracts/ — regenerated v2 request/response examples; old chat response removed.
progress-tracker.md — Unit 02 marked completed.
No .env file was read, printed, or committed.

3. How the pieces connect
Example:

Unity posts a snapshot to /v1/assistant/questions.
FastAPI validates the v2 snapshot, including perspective_id and scene_id.
Unity selects a question and posts it to /v1/assistant/answer.
The response includes an answer, source type, and explanation showing the simulated rule that fired.
4. Manual steps for me
Push the committed branch:


On GitHub, open the repository, select the newly pushed branch, click Compare & pull request, review the changes, and merge the PR into main.

Return to your local repository:


No API keys or additional installs are required for Unit 02.

5. How to verify
Requirement	Result
uv run pytest	PASS — 9 passed
uv run ruff check .	PASS — All checks passed
/docs lists exactly 7 v2 endpoints	PASS
/v1/assistant/chat returns 404	PASS
fallback_used absent from schemas/examples	PASS
Unknown question returns 404 with {error}	PASS — status=404 body={'error': 'Unknown question_id.'}
All v2 endpoints respond	PASS
Contract examples validate against models	PASS — all examples valid
git diff --stat scope	PASS — only ai-service/, contracts/, and context/ changed
Progress tracker updated	PASS
Commit created	PASS — bd28c5c
Push or merge	Not run
Pytest reported one existing Starlette/httpx deprecation warning; tests still passed.

6. Concepts worth knowing
Contract migration changes the shared JSON agreement before Unity integrates.
Pydantic models ensure requests and responses match the v2 shape.
Explainability makes each answer or evaluation show which simulated rule and inputs were used

Unit 03 Teaching Mode Report
1. What this unit does
Unit 03 replaces evaluator mocks with deterministic rules.

Decision scores use resource safety, event pressure, balance, and delayed costs.
Ratings are great, ok, or risky.
Mission scores combine survivability, decision ratings, and outcome.
Every evaluator response includes stable rule IDs and inputs.
No evaluator code uses I/O, randomness, HTTP, or an LLM.
Commit created: 09e10e2 feat(ai): deterministic-evaluator (unit 03).

2. File by file
config.py — thresholds, penalties, event table, and score weights.
scoring.py — survivability index, event pressure, and delayed debt.
decision.py — deterministic decision evaluation.
mission.py — deterministic mission scoring.
text.py — fixed kid-friendly feedback templates.
explain.py — explanation builder.
evaluation.py — routers now delegate to evaluator functions.
test_scoring.py — index tables, event pressure, unknown events, delayed debt.
test_decision.py — rating branches, clamping, determinism, explanations.
test_mission.py — mission scoring, empty history, failed cap, lessons.
conftest.py — shared test fixtures.
README.md — evaluator behavior and tuning instructions.
evaluate-decision.response.json — regenerated decision example.
evaluate-mission.response.json — regenerated mission example with stats: null.
progress-tracker.md — Unit 03 marked completed.
3. How the pieces connect
For /v1/evaluate/decision:

The router validates the request.
The pure evaluator calculates before/after indexes.
It applies event and delayed-cost rules.
It returns a rating, feedback, and explanation.
Example: shielding at 15 during a severity-3 solar_flare returns risky and fires R-EVENT-SHIELD.

4. Manual steps for me
Push the branch:


On GitHub, open the repository, click Compare & pull request, review the PR, and merge it into main.

Update your local branch:


No API keys or additional installs are required. No .env file was read, printed, or committed.

5. How to verify
Requirement	Result
uv run pytest	PASS — 31 passed
uv run ruff check .	PASS — All checks passed
Same request twice	PASS — identical JSON
Severity-3 solar flare with shielding 15	PASS — risky, R-EVENT-SHIELD
Balanced positive decision	PASS — great
Empty mission history	PASS — HTTP 200, stats=None
Responses validate against contract	PASS
Contract examples updated	PASS
No evaluator I/O/randomness	PASS — no random, httpx, or open( references
Diff scope	PASS — only ai-service/, contracts/, and context/
Progress tracker updated	PASS
Commit created	PASS — 09e10e2
Push/PR/merge	Not run
Pytest reported one existing Starlette/httpx deprecation warning; all tests passed.

6. Concepts worth knowing
Pure functions always return the same result for the same input and are easy to test.
Rule IDs make explanations stable and understandable to Unity and players.
Clamping keeps scores and deltas within the contract’s allowed limits.

Unit 04b Teaching mode report
1. What this unit does
Fetches OSDR study metadata and file listings only.
Converts metadata into CSV and Parquet tables.
Applies deterministic keyword labels with matched terms.
Generates a profile report and explainable topic index.
FastAPI does not import pandas or osdr_pipeline.
2. File by file
parse.py: adapted to real assay and organism structures.
config.py: paths, API settings, ID parsing.
tables.py: CSV/Parquet persistence.
tests/osdr/: synthetic and real OSD-1 tests.
schema_notes.md: live schema differences.
osdr_profile.md: generated data-science report.
osdr_topic_index.json: explainable topic index.
progress-tracker.md: partial-corpus status.
pyproject.toml, uv.lock: pipeline dependencies.
3. Results from available data
The fetch was stopped by you after exceeding an hour. Processed partial corpus:


Profile highlights:

Release years: 2004–2025
Labeled studies: 395
Unlabeled studies: 29
Topics: 12
Mission-duration rows: 114
Chi-square exploratory result: chi2=674.9, dof=60, p=7.14e-105
The 20 random labeled studies with matched_terms were printed from the tables using random_state=42.

Most frequent unlabeled title words:


4. Taxonomy proposals — not applied
Add bacillus to the existing microbes topic.
Consider a new genomics topic using genome, sequencing, rna, sequence, assembly, and expression.
Do not add generic terms such as space, station, mission, or international.
5. Verification
uv run pytest tests/osdr: PASS — 4 passed
CSV and Parquet tables: PASS
Profile report: PASS — 424 rows
rg pandas app: PASS — no matches
Topic index metadata: PASS — verified_by_human: false, caveat present
Repeated all generation: PASS — tables identical
Raw files ignored: PASS
No OSDR data files downloaded: PASS — metadata/listings only
Full fetch: NOT COMPLETED — stopped by user
uv run ruff check .: FAIL — 75 existing style errors in pipeline/download scripts

Teaching mode report — Unit 04
Environment
OS: Windows
Shell: PowerShell
Python: CPython 3.14.6 via uv
uv: 0.11.29
Branch: feat/ai-04-nasa-data-layer
Implemented
OSDR snapshot loader with TTL cache and curated fallback.
Curated /v1/space-weather science evidence.
Normalized /v1/events/profile OSDR topic weights.
Updated contract, specification, README, tests, and progress tracker.
No .env was read or printed.
Commit: 801fa24
Verification
Check	Result
uv run pytest	PASS — 39 passed
uv run ruff check .	PASS
Uvicorn startup	PASS on port 8001; port 8000 was already occupied
OpenAPI endpoint verification	PASS
/v1/space-weather	PASS — curated, rich, ISO timestamp
/v1/events/profile?site=moon	PASS — weights sum to 1.0
Forced primary snapshot failure	PASS — both endpoints returned curated fallback
pandas/osdr_pipeline app imports	PASS — none found
verified_by_human: false and caveat	PASS
Worktree	Clean
Files:

OSDR service
Unit 04 tests
API contract
Progress tracker

eaching mode report — Unit 05
1. What this unit does
Replaces assistant mocks with a deterministic, menu-driven expert system.
Uses versioned questions, rules, and OSDR-backed knowledge files.
Returns explanations, source metadata, and truthful data_source values.
No LLM, randomness, network calls, or .env access.
2. File by file
app/expert/engine.py — deterministic matching and answer generation.
app/expert/knowledge.py — catalog loading and validation.
app/routers/assistant.py — connects API endpoints to the expert system.
data/knowledge/ — questions, rules, OSDR-backed facts, and version metadata.
data/samples/MANIFEST_osdr.json — provenance for the committed OSDR tables/reports.
scripts/validate_knowledge.py — validates the knowledge base.
tests/expert/test_expert.py — expert-system tests.
README.md — documents the workflow.
progress-tracker.md — Unit 05 marked completed.
3. How the pieces connect
A snapshot reaches /v1/assistant/questions, the catalog selects applicable questions deterministically, and /v1/assistant/answer matches a rule and returns its answer, explanation, and source.

OSDR-derived answers use data_source: "curated"; game-rule answers use simulated.

4. Manual steps for you
Review the OSDR fact wording and provenance in facts.json.
Push the branch:

Open and merge the Pull Request on GitHub.
Return locally:

No API key is required for the current OSDR metadata facts.

5. Verification
Knowledge validation: PASS
version=osdr-metadata-v1, questions=6, rules=9, facts=2
Targeted tests: PASS
13 passed
Full tests: PASS
43 passed, 1 warning
Ruff: PASS
All checks passed!
Reload-mode Uvicorn and OpenAPI: PASS
Both assistant paths present.
Deterministic questions: PASS
4 questions; repeated responses identical.
Assistant answers: PASS
All returned questions answered successfully.
Unknown question: PASS
HTTP 404.
Malformed catalog rejection: PASS
Forbidden imports: PASS
No pandas, osdr_pipeline, LLM SDK, or randomness imports.
Git worktree: PASS
Clean after commit.
Commit: 43bde7a feat(ai): expert-system.md (unit 05)

6. Concepts worth knowing
Rule engine: fixed conditions produce predictable answers.
Curated data: saved evidence is clearly distinguished from live data.
Validation boundary: malformed knowledge files fail before producing answers.

Teaching mode report unit 6
1. What this unit does
Adds deterministic validation for the story bible.
Checks timeline, facts, perspectives, scenes, decisions, costs, convergence, and contradictions.
Supports draft mode and strict release mode.
Does not modify API contracts or story content.
2. File by file
validate_story.py: validator CLI and rules.
test_validate_story.py: validator tests.
init.py: test package marker.
README.md: validation commands.
progress-tracker.md: Unit 06 marked completed, pending human story sign-off.
3. How the pieces connect
Run the validator against the story JSON. It loads the file, checks all cross-references and costs, then prints a deterministic summary and exits non-zero on errors.

4. Manual steps for you
Have the story team review and create the release file:
story/story-bible.json
Push the branch:

Open a PR from feat/ai-06-story-bible into main, then merge it after review.
5. How to verify
Existing draft validation: PASS
Story validation passed
events=14, facts=32, perspectives=5, scenes=49
Draft strict mode: EXPECTED FAIL
Draft has five perspectives, missing costs, and one non-converging perspective.
Story tests: PASS — 6 passed.
Full tests: PASS — 49 passed.
Targeted Ruff: PASS — All checks passed!
Full Ruff: PASS — All checks passed!
Determinism check: PASS — identical output and exit codes.
File mutation check: PASS — SHA-256 unchanged.
API-boundary search: PASS — no matches.
Worktree: PASS — clean after commit.
Release file validation: NOT RUN / BLOCKED — story/story-bible.json does not exist and must not be invented.
Explicit invalid fixture commands: NOT RUN — current tests use programmatic invalid cases rather than separate fixture files.
The root-level uv run pytest ai-service\tests\story and Ruff equivalent could not spawn tools because the repository root is not the uv project. The same checks pass from ai-service, the configured project directory.

Teaching mode report
1. What this unit does
Adds deterministic mission debrief statistics.
Calculates resource mean/min/trend, rating counts, event exposure, perspective comparisons, and observed decision costs.
Preserves the existing OSDR-backed /v1/events/profile behavior.
Keeps the API contract unchanged.
2. File by file
debrief.py: pure statistics logic.
test_debrief.py: focused statistics tests.
debrief_history.json: contract-shaped fixture.
mission.py: integrates stats into mission responses.
test_api.py: API determinism and OSDR profile regression tests.
README.md: statistics documentation.
07-statistics.md: aligned evidence workflow with the existing OSDR data.
progress-tracker.md: Unit 07 completed.
3. How the pieces connect
Unity sends mission history to /v1/evaluate/mission. The evaluator computes the score, while app/stats/debrief.py computes deterministic debrief values from the same history.

Observed decision cost is calculated from resource drops between consecutive snapshots because the existing contract sends decision IDs but not decision definitions.

4. Manual steps for you
Push the branch:

Open a PR from feat/ai-07-statistics into main.
Merge the PR after review. No API key or .env action is required.
5. Verification
Focused tests: PASS — 38 passed.
Full test suite: PASS — 56 passed, 1 existing dependency warning.
Ruff: PASS — All checks passed!
Debrief fixture validation: PASS.
Repeated mission request determinism: PASS.
Empty history and repeated event-sol handling: PASS.
Perspective comparison ordering: PASS.
OSDR event profile reproducibility and normalization: PASS.
Forbidden imports in app/stats: PASS.
.env and contract files: unchanged.
Final worktree: clean.