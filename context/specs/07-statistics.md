# Unit 07: Statistics

## Goal

Add deterministic statistics for mission debriefs and preserve the existing
curated event-profile behavior. The service must calculate resource
mean/min/trend, decision-rating counts, the most costly decision, event
exposure, and optional perspective comparisons from the history supplied by
Unity.

Populate the existing `stats` field in the `POST /v1/evaluate/mission`
response when the supplied history is valid. Keep the existing request and
response contract unchanged: no new endpoint, field, resource, or event
shape is introduced in this unit.

Do not invent NASA event frequencies or facts. Any event-frequency work must
be based on reviewed real samples saved before implementation. Statistics
must remain deterministic, explainable, and independent of LLMs, randomness,
network calls, and persistent player state.

## Design

### Evidence-first inputs

Before implementing event-frequency calculations, the human must save reviewed
real samples under `ai-service/data/samples/`:

1. Save 2-3 small DONKI response samples covering the event types the game
   actually uses, such as a flare, CME, or geomagnetic storm only when those
   types are present in the real responses. Preserve the complete provider
   JSON without rewriting fields.
2. Save a manifest recording each sample's provider URL or endpoint, event
   type as returned by the provider, retrieval date, response status, and
   filename. Never include `.env` or an API key in the sample or manifest.
3. Save a small reviewed debrief fixture containing contract-shaped mission
   history, ratings, decision ids, snapshots, outcome, and any
   `other_runs` values needed to exercise perspective comparison. Build this
   fixture from the existing contract and Pydantic models, not from guessed
   fields.
4. Record which real DONKI fields support each normalized event label and
   which fields are intentionally ignored. Do not turn sample counts into
   health findings, radiation measurements, or NASA facts.

The implementation must be written against those saved samples, the existing
`ai-service/app/schemas/models.py`, and `context/api-contract.md`. The
committed OSDR topic index remains the source for the current
`/v1/events/profile` endpoint. Do not silently replace its OSDR labels with
DONKI labels; a contract change would be required for that behavior.

### Pure debrief statistics

- Keep calculation code in `ai-service/app/stats/` and keep it independent of
  FastAPI, file I/O, network clients, environment variables, and randomness.
- Treat the history in the request as the only source of player-run data.
- For each resource (`power`, `oxygen`, `shielding`), calculate:
  - `mean`: arithmetic mean of the recorded snapshot values, as a float;
  - `min`: the lowest recorded value, as an integer;
  - `trend`: `up`, `down`, or `flat`, using the first and last recorded values.
- Count `great`, `ok`, and `risky` ratings using the existing rating values.
- Select `most_costly_decision_id` deterministically from the decision with the
  largest total negative resource effect, including delayed effects when the
  request contains enough information to calculate them. Return `null` when
  no decision has a measurable negative cost.
- Count `event_exposure_sols` from history snapshots with an active event,
  counting each sol at most once if repeated snapshots represent that sol.
- Copy `other_runs` into deterministic `perspective_comparison` output when
  supplied, with stable ordering and no invented runs. Return an empty list
  when it is omitted.
- Empty history remains a valid mission evaluation with score 0 and a
  contract-valid `stats` object or the existing documented null behavior,
  according to the agreed schema in the current models. The implementation
  must not divide by zero or fabricate resource values.
- Preserve the existing evaluator score, feedback, explanation, and
  `data_source` semantics. Statistics describe the run; they do not change
  the score or mutate snapshots.

### Event profile boundary

The existing `GET /v1/events/profile` endpoint continues to use the Unit 04
curated OSDR topic snapshot, whose weights are normalized from the committed
metadata index. Unit 07 may add regression tests around reproducibility and
non-negative weights, but must not change its response shape or label source
based on unreviewed DONKI samples.

If reviewed DONKI samples demonstrate that a separate non-story event sampler
is needed, keep that calculation as an internal pure helper and document the
mapping. Do not expose a new API field or claim that a metadata frequency is a
physical risk probability.

### Explanation and kid-facing behavior

Statistics are returned through the existing mission response and do not add
new player-facing NASA claims. Any summary or lesson text remains short,
encouraging, and consistent with the evaluator's fixed templates. The
statistics object contains measurements and identifiers; it must not expose
raw provider responses or secrets.

## Implementation

1. **Prepare and review evidence**
   - Add or update a sample manifest under `ai-service/data/samples/` with the
     real DONKI samples, source URLs, retrieval dates, and field mappings.
   - Add a small reviewed debrief fixture based on the existing contract
     models. Do not invent provider fields or NASA facts.
   - Stop and report the gap if the samples do not contain enough information
     to support a proposed event mapping.
2. **Add pure statistics helpers**
   - Create `ai-service/app/stats/` with typed helpers for resource summaries,
     rating counts, decision cost selection, event exposure, and perspective
     comparison.
   - Use the standard library `statistics` module unless an existing
     dependency is demonstrably required. Do not add pandas, a database, an
     LLM SDK, or a new runtime service.
   - Define behavior for empty history, repeated sols, missing active events,
     delayed effects, ties, and malformed values through explicit validation
     or the repository's standard error path.
3. **Integrate the mission evaluator**
   - Replace only the Unit 03 `stats: null` placeholder in the mission
     evaluation path.
   - Reuse the existing Pydantic request/response models and evaluator
     explanation flow. Do not modify `context/api-contract.md` or invent
     compatibility fields.
   - Keep the router thin and keep statistics deterministic and unit-testable.
4. **Preserve and test the event profile**
   - Add regression coverage proving the existing OSDR-backed event profile
     remains reproducible, non-negative, and normalized.
   - If an internal DONKI frequency helper is justified by reviewed samples,
     test its field mapping and label normalization separately without
     changing `/v1/events/profile`.
5. **Add focused tests and documentation**
   - Test every resource trend, mean, and minimum branch; rating counts;
     delayed and immediate costs; ties; repeated event sols; empty history;
     comparison ordering; deterministic repeated requests; and malformed
     inputs.
   - Add API tests proving the mission response remains contract-valid and
     that the existing score and explanation are unchanged by statistics.
   - Update the AI service README with the statistics rules, sample provenance
     workflow, and commands used to run the focused tests.
   - Confirm the FastAPI app does not import pandas, `osdr_pipeline`, or any
     LLM SDK for this unit.
6. **Keep the contract boundary unchanged**
   - Verify that no Pydantic contract model, endpoint path, or JSON example
     needs modification.
   - If a contract change is genuinely required, stop and list the proposed
     change separately instead of editing `context/api-contract.md`.

## Manual steps for the human (keys, env, installs)

1. Open the official DONKI pages or API documentation and save 2-3 real
   responses for the event types the game will use under
   `ai-service/data/samples/`. Record each source URL and retrieval date in a
   manifest. If the provider requires a key, put it only in
   `ai-service/.env`; never paste it into chat or commit it.
2. Review the saved responses with the game and science reviewers. Approve the
   exact event labels and field mappings, and confirm that metadata
   frequencies are not presented as physical risk probabilities or NASA
   findings.
3. From `ai-service/`, synchronize and run the focused checks:
   ```powershell
   uv sync --all-groups
   uv run pytest tests/evaluator tests/nasa tests/test_api.py
   uv run ruff check .
   ```
   Expected output is a passing test run and `All checks passed!`.

## Dependencies

- Unit 02 contract v2 is merged and verified.
- Unit 03 deterministic evaluator is merged and available.
- Unit 04/04b curated OSDR metadata and the existing
  `/v1/events/profile` implementation are available.
- The current Pydantic mission request/response models and contract examples
  are available for the debrief fixture.
- 2-3 reviewed real DONKI response samples and their provenance manifest have
  been saved under `ai-service/data/samples/`.
- A reviewed contract-shaped debrief fixture is available.
- `pytest` and `ruff` are available through uv. No new runtime dependency is
  expected.
- `ai-service/.env` remains human-owned and is never read, printed, or
  committed by the agent.

## Verify when done

- `uv run pytest tests/evaluator tests/nasa tests/test_api.py`
  - Expected: all evaluator, statistics integration, OSDR profile, and API
    tests pass.
- `uv run pytest`
  - Expected: the complete AI-service suite passes with no regressions.
- `uv run ruff check .`
  - Expected: `All checks passed!`.
- Send the same valid mission-evaluation request twice.
  - Expected: byte-for-byte identical JSON, including `stats`.
- Send a history containing known resource values and ratings.
  - Expected: resource mean/min/trend, rating counts, and event exposure match
    hand-calculated values.
- Send a history with immediate and delayed decision costs.
  - Expected: `most_costly_decision_id` is selected deterministically, with
    ties resolved by the documented stable rule.
- Send empty history and repeated snapshots for one sol.
  - Expected: a valid response without division-by-zero errors, and event
    exposure counts unique sols rather than duplicate snapshots.
- Send `other_runs` in two different input orders.
  - Expected: `perspective_comparison` uses the documented stable ordering and
    contains no invented entries.
- `GET /v1/events/profile?site=moon`
  - Expected: the existing OSDR-backed response remains reproducible,
    non-negative, normalized to a weight sum of 1, and unchanged in shape.
- Review the saved DONKI sample manifest and field-mapping test.
  - Expected: every used provider field points to a saved real sample, source
    URL, and retrieval date; no raw response or secret is exposed to players.
- `rg "pandas|osdr_pipeline|openai|anthropic|random|httpx" ai-service/app/stats`
  - Expected: no matches in the pure statistics package.
- `git diff --stat`
  - Expected: only Unit 07 statistics code, tests, README/sample provenance,
    and directly related context changes; no `game/`, `.env`, or unreviewed
    NASA data.
- `git status --short`
  - Expected: no `.env` changes, no generated caches, and no unreviewed
    samples.
- `context/progress-tracker.md` is updated and the Teaching mode report is
  provided.

No API-contract change is proposed for Unit 07.
