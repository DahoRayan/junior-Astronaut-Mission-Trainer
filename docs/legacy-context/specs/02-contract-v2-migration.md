# Unit 02: Contract v2 Migration (mocks)

## Goal
Update the Unit 01 skeleton to the v2 contract in `context/api-contract.md`, still returning
valid hardcoded mocks, so Unity can integrate against the real shape now.

## Design
Mocks only; no real logic. Mock texts follow the kid tone. Mock `explanation` objects are
realistic (rule ids like `R-EVENT-SHIELD`, inputs echoing the request, source kind `simulated`).

## Implementation
1. Schemas: add `perspective_id`, `scene_id` to GameSnapshot; add Explanation and DataSource;
   remove `fallback_used` everywhere; remove `llm` from health and add `knowledge_base_version`.
2. Remove `POST /v1/assistant/chat`. Add `POST /v1/assistant/questions` (3 mock questions) and
   `POST /v1/assistant/answer` (known mock ids -> answer; unknown -> 404 `{error}`).
3. Add `GET /v1/events/profile` with mock weights summing to 1.
4. Evaluate endpoints: add `explanation`; mission response gets `stats` (mock) and accepts optional `other_runs`.
5. Keep validation bounds from the contract; keep CORS, body limit, error shape.
6. Regenerate all `contracts/*.json` examples; remove the old chat examples.
7. Tests: every endpoint (200 valid, 422 invalid, 404 unknown question); every mock validates against its model.
8. Remove any LLM-related config/env placeholders; `.env.example` keeps only `NASA_API_KEY`.
9. README: update endpoint list and run instructions (uv).

## Manual steps for the human
- None for keys. Send your friends the "Breaking changes vs v1" list from `api-contract.md`
  and the new `contracts/*.json` so Unity updates its client and models.

## Dependencies
- Unit 01 verified and merged.

## Verify when done
- [ ] `uv run pytest` and `uv run ruff check .` pass
- [ ] `/docs` lists exactly the v2 endpoints; `/v1/assistant/chat` is gone (404)
- [ ] `fallback_used` appears nowhere in schemas or examples (`grep -r fallback_used`)
- [ ] Unknown `question_id` returns 404 with `{error}`
- [ ] Every response validates against `api-contract.md`; `contracts/*.json` regenerated
- [ ] `git diff --stat` only touches `ai-service/`, `contracts/`, `context/`
- [ ] `progress-tracker.md` updated; Teaching mode report given
