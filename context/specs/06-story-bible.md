# Unit 06: Story Bible Schema + Validator

## Goal

Create the deterministic validator for the shared `story/story-bible.json`.
The validator protects one canonical mission timeline while allowing three
perspectives to begin at different sols, reveal different facts, make different
decisions, and converge on the same critical event.

This unit owns the story-schema validator and its tests. Story content remains
owned by the game developers. Do not invent narrative events, NASA facts,
perspectives, decisions, or API response fields in the implementation.

Do not change `context/api-contract.md` in this unit. The validator is offline
tooling and does not add or change an HTTP endpoint. If an API change appears
necessary, list it separately as a proposal and stop before changing the
contract.

## Design

### Evidence-first story inputs

Before creating or validating the release story bible, the human and game
developers must save reviewed story samples under `story/samples/`. These are
the source material for the implementation and must not be invented by the
validator author:

1. Save one small JSON sample for each of the three agreed perspectives,
   including its role, starting sol, representative scenes, scene ids, event
   ids, revealed fact ids, and decision ids.
2. Save a canonical timeline sample containing at least the agreed opening,
   mid-mission, and convergence events. Preserve the exact event type names,
   sols, severities, and kid-friendly summaries supplied by the game team.
3. Save a decision sample for every decision referenced by those scenes,
   including its resource deltas and delayed effects. Each decision must have a
   real cost: a negative resource delta or a negative delayed effect.
4. Save the fact sample with each fact's id, reveal sol, and approved player
   text. If a fact makes a NASA claim, it must reference an already reviewed
   sourced entry in the knowledge base and its saved evidence; this unit must
   not create or paraphrase NASA facts.

Record the owner, review date, and source filename in
`story/samples/README.md`. The validator must be written against these samples
and the schema in `context/game-design.md`, not against guessed story content.
The samples are fixtures for schema and consistency tests; they are not a
replacement for the game team's final story bible.

### Canonical story model

The release file is `story/story-bible.json` and remains the only source of
story truth. Its required top-level areas follow the documented game-design
schema:

- `mission`: `site`, positive `length_sols`, and
  `convergence_event_id`.
- `timeline`: unique `event_id`, `sol`, `type`, `severity` from 1 to 3, and
  kid-friendly `summary`.
- `facts`: unique `fact_id`, `revealed_at_sol`, and approved `text`.
- `perspectives`: the agreed three unique perspective ids, roles, start sols,
  and ordered scenes.
- Each scene has a unique `scene_id`, `sol`, `event_id`, `reveals`, and
  `decision_ids`.

The decision representation must be agreed before implementation. If decisions
are stored in the story bible, validate their ids, deltas, and delayed effects
against the existing `Decision` shape. If the game team stores them in a
separate reviewed story-content file, the validator must receive that file
explicitly and report its path. Do not silently add a new contract or story
field to resolve this choice.

### Deterministic consistency rules

`validate_story.py` must reject malformed or contradictory input with a
non-zero exit and actionable path-based errors. It must check:

1. The mission site is one of the supported story sites and mission length is
   positive.
2. Every timeline event id, fact id, perspective id, scene id, and decision id
   is unique in its required scope.
3. Every event sol and fact reveal sol is within the mission and every
   perspective start sol is within the mission.
4. Every scene references an existing timeline event and its `scene.sol`
   exactly matches that event's sol.
5. Every revealed fact exists and is not revealed after the scene sol.
6. Every perspective's scenes are in non-decreasing sol order and include the
   shared `convergence_event_id`.
7. All perspectives refer to the same canonical timeline event data. No
   perspective may introduce a conflicting event type, sol, severity, or
   summary for an existing event.
8. Every referenced decision exists and has at least one cost: a negative
   immediate delta or a negative delayed effect. Delayed offsets and resource
   names must follow the existing game decision model.
9. Strings are non-empty, lists have the expected shape, and unknown fields or
   invalid enum/range values are reported rather than silently ignored.

The validator must be deterministic, use no network or randomness, and never
rewrite the story file. It should report all discoverable errors in one run,
with JSON paths such as `perspectives[1].scenes[2].event_id`.

### Boundary and ownership

Keep story content in `story/`, validator code in
`ai-service/scripts/validate_story.py`, and validator tests in
`ai-service/tests/story/`. The validator may reuse typed internal helpers but
must not import FastAPI, the expert-system runtime, pandas, `osdr_pipeline`, or
an LLM SDK. It must not change Unity files, API schemas, or player state.

## Implementation

1. **Prepare reviewed story samples**
   - Add `story/samples/README.md` and the small JSON samples supplied by the
     game developers.
   - Confirm the exact three perspective ids, event type list, mission length,
     convergence event, decision representation, and fact ownership.
   - Do not put unsourced NASA claims into the story samples. Reference
     reviewed knowledge-base fact ids when science text is needed.
2. **Implement schema and consistency validation**
   - Add `ai-service/scripts/validate_story.py` with typed parsing and
     path-based validation errors.
   - Validate the required mission, timeline, facts, perspectives, scenes, and
     agreed decision source without changing the shared API contract.
   - Support an explicit input path, defaulting to
     `story/story-bible.json`, and return exit code 0 only when valid.
   - Print a concise success summary containing the mission site, mission
     length, event count, fact count, perspective count, scene count, and
     convergence event id. Derive every number from the loaded file.
3. **Create focused fixtures and tests**
   - Add one small valid fixture assembled from the reviewed samples.
   - Add invalid fixtures for missing event, sol mismatch, fact revealed too
     early, missing convergence, conflicting event data, duplicate ids, and a
     decision with no cost.
   - Test that valid input passes, invalid input fails with the relevant path,
     output is deterministic, and the validator does not mutate files.
4. **Add the release-file workflow**
   - Add or validate `story/story-bible.json` only after the game team supplies
     reviewed content. Do not generate story content from memory.
   - Document the exact validator command in the AI service README or the
     story sample README without changing API documentation.
5. **Keep the contract boundary unchanged**
   - Verify that no Pydantic API model, endpoint, or file in `contracts/`
     requires modification.
   - If a contract change is genuinely required, stop and list the proposed
     change separately instead of editing `context/api-contract.md`.

## Manual steps for the human (keys, env, installs)

1. Ask the game developers to provide the reviewed story samples and agree on
   the exact three perspective ids, event type names, mission length, and
   convergence event. Save them under `story/samples/`; do not ask the
   validator to invent missing content.
2. Decide whether the canonical decisions live inside
   `story/story-bible.json` or in a separate reviewed story-content file.
   Ensure every decision has a negative immediate or delayed cost and uses the
   existing resource names: `power`, `oxygen`, and `shielding`.
3. For any NASA-related story sentence, open the cited knowledge-base source,
   confirm the saved evidence and retrieval date, and reference the approved
   fact id. Never paste secrets into chat and never commit `.env`.
4. From the repository root, synchronize the existing uv environment:
   `uv sync`. No new package is expected for this unit.
5. After the validator is implemented, review the generated error messages and
   run it against the team's story file before asking Unity developers to use
   the story bible.

## Dependencies

- Unit 02 contract v2 is merged and verified.
- The game-design story schema and consistency rules are agreed by the game
  developers.
- Unit 03 decision/resource model is available for validating decision costs.
- Unit 05 knowledge-base provenance is available if story text references
  curated NASA facts.
- Three perspective samples, a canonical timeline sample, reviewed facts, and
  cost-bearing decisions have been saved under `story/samples/`.
- `pytest` and `ruff` are available through uv. No network, NASA key, database,
  or new runtime dependency is needed.

## Verify when done

- `uv run python ai-service/scripts/validate_story.py story/story-bible.json`
  - Expected: exit code 0 and a deterministic summary derived from the story
    file, including the perspective count and convergence event id.
- `uv run pytest ai-service/tests/story`
  - Expected: all valid and invalid story fixtures pass, including duplicate
    ids, sol mismatches, reveal timing, convergence, contradictions, and
    decision-cost checks.
- `uv run ruff check ai-service/scripts/validate_story.py ai-service/tests/story`
  - Expected: `All checks passed!`.
- Run the validator twice on the same file:
  `uv run python ai-service/scripts/validate_story.py story/story-bible.json`
  - Expected: identical stdout and exit code on both runs.
- Copy the story file to a temporary path, run the validator, and compare the
  file contents.
  - Expected: validation does not rewrite or normalize the story file.
- Run each invalid fixture explicitly:
  `uv run python ai-service/scripts/validate_story.py <fixture>`
  - Expected: non-zero exit and an error containing the relevant JSON path.
- `uv run pytest`
  - Expected: the complete AI-service suite passes with no regressions.
- `uv run ruff check .`
  - Expected: `All checks passed!`.
- `rg "api-contract|FastAPI|APIRouter" ai-service/scripts/validate_story.py`
  - Expected: no runtime/API dependency in the offline validator.
- Review `git diff --stat`.
  - Expected: only Unit 06 validator code, story samples/content supplied by
    the game team, tests, README/context updates, and no `game/` changes,
    `.env`, or NASA raw data.
- `git status --short`
  - Expected: no `.env` changes, no generated cache files, and no unreviewed
    story content.
- `context/progress-tracker.md` is updated and the Teaching mode report is
  provided.

No API-contract change is proposed for Unit 06.
