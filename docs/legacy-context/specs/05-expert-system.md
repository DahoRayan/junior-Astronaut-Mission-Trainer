# Unit 05: Expert System

## Goal

Replace the mock Mission Buddy implementation for `POST /v1/assistant/questions` and
`POST /v1/assistant/answer` with a deterministic, menu-driven expert system.
Questions, rules, and facts must come from versioned knowledge files, and every
answer must include the contract's explanation and truthful source metadata.

The system must be useful for ages 7-12 without using an LLM, free text
generation, randomness, network calls, or hidden game state. The same knowledge
files and snapshot must always produce the same questions and answer.

Do not change `context/api-contract.md` in this unit. If implementation reveals a
contract problem, record the proposed change separately at the end of the work
and stop before changing the contract.

## Design

### Evidence-first knowledge workflow

Before writing `facts.json`, first save real samples under
`ai-service/data/samples/`:

1. Save 2-3 real OSDR metadata responses or the already collected OSDR metadata
   samples used to derive the topic index. Preserve the complete response,
   source URL, and retrieval date in a sidecar manifest.
2. Save 2-3 real RadLab responses covering the radiation-related evidence needed
   by the planned questions. Use the actual response fields returned by the
   service; do not assume field names or units.
3. Save a small human-readable review record mapping each proposed fact to its
   sample file, source URL, retrieval date, and exact supporting field or text.

The implementation must be written against those saved samples. Do not write
NASA facts, measurements, units, or provider response fields from memory. If
the samples do not contain enough evidence for a fact, omit the fact and report
the gap rather than guessing. The existing OSDR topic index may be used as
curated metadata context, but its caveat remains: topic counts are metadata
keyword counts, not experimental findings or effect sizes.

### Knowledge files

Create these versioned files under `ai-service/data/knowledge/` after the human
has reviewed the real samples:

- `questions.json`: question id, kid-friendly text, and deterministic
  `applies_when` predicates over the request snapshot.
- `rules.json`: stable rule id, conditions over the snapshot and selected
  question, answer template, and optional fact ids.
- `facts.json`: only sourced facts supported by the saved samples. Every fact
  includes its source name or URL, retrieval date, evidence/sample reference,
  and data kind (`curated` or another truthful `DataSource` value).
- `knowledge_base_version.json`: a short version identifier and the source
  files used to build the knowledge base.

Keep predicates declarative and small: site, perspective id, scene id, active
event type/severity, and resource thresholds are sufficient for this unit.
Unknown fields or malformed entries must fail validation before serving.
Question and rule ordering must be explicit in the files or made stable by
sorting ids; never depend on filesystem or dictionary iteration order.

### Inference behavior

- Select 3-5 applicable questions for the supplied snapshot.
- A question is applicable only when all of its declared predicates match.
- Return questions in stable catalog order, with a deterministic fallback set
  when fewer than 3 specialized questions match.
- For an answer, reject an unknown question id with the existing contract error
  response and HTTP 404.
- Match rules in stable priority/order. Use the first applicable rule for the
  selected question, then render its fixed template and optional sourced fact.
- Keep the answer within the contract's length limit and no more than three
  short sentences.
- If no specialized rule matches, use a safe generic rule from the knowledge
  base; do not invent an answer or silently call an external service.
- Build `explanation.rules_fired` from the matched rule ids and plain-language
  rule text. `inputs` must identify the relevant snapshot conditions without
  logging private or unnecessary player data. `sources` must name the rule
  source and any fact source.
- Set `data_source` to `curated` when a saved NASA fact is included and
  `simulated` when the response uses only game rules. Never label saved data
  as live.

### Boundary and safety

Put catalog loading and validation in a small knowledge module, pure matching
and rendering in `app/expert/`, and HTTP parsing/error handling in the router.
The rule engine must not import FastAPI, perform I/O during matching, use
randomness, or make network requests. Load validated knowledge once at service
startup or through an explicitly testable loader; do not read `.env`.

The expert system may explain a game decision but must not mutate the snapshot,
change resources, or replace the deterministic evaluator. It must not turn
OSDR metadata counts into health claims or radiation measurements.

## Implementation

1. **Prepare evidence before coding facts**
   - Add a sample README/manifest under `ai-service/data/samples/` explaining
     source URL, retrieval date, provider, and which knowledge entry uses each
     sample.
   - Fetch and save the real OSDR and RadLab samples manually using the provider
     responses, without committing `.env` or secrets.
   - Review the samples and write only evidence-backed entries into
     `data/knowledge/facts.json`.
2. **Add knowledge models and validation**
   - Add typed internal models or validation helpers for questions, rules,
     facts, and knowledge version metadata.
   - Validate unique ids, non-empty text, supported predicate names, valid fact
     references, source plus retrieval date on every fact, and deterministic
     ordering.
   - Add a validation command or script that exits non-zero with a clear error
     for malformed knowledge files.
3. **Implement the pure expert engine**
   - Add `ai-service/app/expert/` with a loader boundary, predicate matcher,
     question selector, rule matcher, fixed-template renderer, and explanation
     builder.
   - Keep all matching deterministic and unit-testable with synthetic snapshots;
     do not duplicate NASA facts in tests.
   - Test relevant questions, fallback questions, event/severity predicates,
     low-resource predicates, perspective/scene predicates, unknown question
     ids, no-match fallback, sourced facts, and reproducibility.
4. **Replace only the assistant router mock logic**
   - Keep the existing request and response schemas from
     `app/schemas/models.py`.
   - Make `/v1/assistant/questions` call the selector and
     `/v1/assistant/answer` call the answer engine.
   - Preserve the existing 404 `{error}` behavior and the contract's 3-5
     question, answer, explanation, and data-source requirements.
5. **Add documentation and contract examples**
   - Update the AI service README with the knowledge-file workflow, validation
     command, and how curated facts are attributed.
   - Update only the assistant request/response examples in `contracts/` if the
     implementation exposes a previously missing example; do not alter the
     shared contract or invent response fields.
6. **Test the boundary**
   - Confirm the FastAPI app imports the expert package but not pandas,
     `osdr_pipeline`, or any LLM SDK.
   - Confirm malformed knowledge files fail explicitly and do not produce a
     success-shaped answer.
   - Confirm all player-facing NASA-derived text has a source and retrieval
     date in the knowledge base.

## Manual steps for the human (keys, env, installs)

1. Open the NASA OSDR and RadLab provider pages in a browser and save the exact
   real responses requested in the evidence-first workflow into
   `ai-service/data/samples/`. If a provider requires a key, create it in that
   provider's account and put it only in `ai-service/.env`; never paste the key
   into chat or commit `.env`.
2. For every proposed fact, record the provider URL, retrieval date, sample
   filename, and the exact response field or text supporting it. Delete any
   proposed fact that cannot be traced to a saved sample.
3. Review the question ids, rule ids, kid-friendly wording, and fact
   attributions before implementation. Confirm that no entry describes a
   metadata count as a health effect, hazard level, or measured dose.
4. From `ai-service/`, install/synchronize dependencies with:
   `uv sync`. No new package is expected for this unit.
5. After implementation, try the two assistant endpoints in `/docs` with the
   saved sample-backed knowledge and confirm that unknown question ids return
   the documented 404 error.

## Dependencies

- Unit 02 contract v2 is merged and verified.
- Unit 03 deterministic evaluator is merged; the expert system must not
  duplicate or replace evaluator logic.
- Unit 04/04b curated OSDR metadata and its caveat are available.
- Real OSDR and RadLab samples have been saved under
  `ai-service/data/samples/` before facts are authored.
- `ai-service/.env` remains human-owned and is never read, printed, or
  committed by the agent.
- Existing `fastapi`, `pydantic`, `pytest`, and `ruff` dependencies are
  available through uv; no LLM dependency is allowed.

## Verify when done

- `uv run python scripts/validate_knowledge.py`
  - Expected: exits 0 and reports the knowledge files are valid, with the
    knowledge-base version and counts of questions, rules, and facts.
- `uv run pytest tests/expert tests/test_api.py`
  - Expected: all expert-engine and assistant-router tests pass, including
    deterministic selection, rule matching, fallback behavior, source/date
    validation, unknown-question 404, and contract model validation.
- `uv run pytest`
  - Expected: the complete existing suite passes with no regressions.
- `uv run ruff check .`
  - Expected: `All checks passed!`.
- `uv run uvicorn app.main:app --reload`
  - Expected: the service starts, `/docs` lists the existing v2 assistant
    endpoints, and no LLM service or NASA request is required at startup.
- `curl` or the PowerShell equivalent for
  `POST /v1/assistant/questions` with a valid snapshot
  - Expected: HTTP 200 with 3-5 deterministic question ids and texts.
- Repeat the same questions request twice.
  - Expected: byte-for-byte identical JSON responses.
- `curl` or the PowerShell equivalent for
  `POST /v1/assistant/answer` using each returned question id
  - Expected: HTTP 200, an answer of no more than three sentences, a
    non-empty explanation, and truthful `data_source`.
- Send an unknown question id to `/v1/assistant/answer`.
  - Expected: HTTP 404 with exactly the existing `{ "error": string }` shape.
- Temporarily point the loader at a malformed knowledge fixture and run the
  validation command.
  - Expected: non-zero exit with the invalid file and reason; no successful
    answer is returned from malformed data.
- `rg "pandas|osdr_pipeline|openai|anthropic|random" ai-service/app/expert.py ai-service/app/routers/assistant.py`
  - Expected: no matches for forbidden data/LLM/random dependencies in the
    expert request path.
- `rg "source|retrieved|retrieval" ai-service/data/knowledge/facts.json`
  - Expected: every fact contains its source and retrieval-date metadata, and
    each source points to a saved real sample or provider record.
- `git diff --stat`
  - Expected: only Unit 05 files, assistant contract examples/README updates,
    tests, and directly related context changes are present; no `.env` or raw
    NASA data files appear.
- `git status --short`
  - Expected: no `.env` changes and no untracked raw response files outside
    the intentionally reviewed sample files.
- `context/progress-tracker.md` is updated and the Teaching mode report is
  provided.
