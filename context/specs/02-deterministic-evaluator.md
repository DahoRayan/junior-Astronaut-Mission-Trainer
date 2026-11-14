# Unit 02: Deterministic Evaluator

## Goal
Replace the mock logic of `POST /v1/evaluate/decision` and `POST /v1/evaluate/mission`
with a pure, deterministic rules engine. Same input -> same output, no I/O, no LLM.
Feedback text comes from fixed kid-friendly templates (Unit 05 will let an LLM rephrase them).
Assistant chat and space-weather stay mocks.

## Design
The evaluator scores how safe the outpost is, not how "good" the player is. Every
number comes from `app/evaluator/config.py` so it can be tuned with the game devs
without touching logic. Rules below are a first version; thresholds are starting values.

### Survivability index (0-100) for a snapshot
- Per-resource risk: `risk_r = clamp((SAFE_LEVEL - value_r) / SAFE_LEVEL, 0, 1)`, SAFE_LEVEL = 40.
  A resource <= CRITICAL_LEVEL (20) counts as critical.
- Event pressure: config table maps event type -> (resource that protects against it,
  required level by severity). Example: `solar_flare` -> shielding, required 40/60/80 for severity 1/2/3.
  `event_risk = clamp((required - value) / required, 0, 1)`; no event -> 0.
- Balance penalty: if `max(resources) - min(resources) > 50`, add a small penalty.
- `index = 100 - 100 * (0.5 * mean_resource_risk + 0.3 * worst_resource_risk + 0.2 * event_risk) - balance_penalty`, clamped 0-100.
  (Weights in config.)

### Decision evaluation
- `index_before`, `index_after` (index_after also subtracts delayed-debt: for each negative
  delayed effect whose projected value `after + delta` falls under SAFE_LEVEL, apply a small config penalty).
- `survival_delta = clamp(round(index_after - index_before), -20, 20)`.
- `rating`:
  - `risky` if any resource is critical after, OR event_risk after > 0.5, OR survival_delta <= -5
  - `great` if survival_delta >= 3 AND no resource under SAFE_LEVEL AND event_risk after == 0
  - else `ok`
- `tradeoff`: gained = resource with the largest positive delta; cost = largest negative delta
  (if no negative delta, cost = the worst delayed effect; if none, cost = "extra risk later" template).
  Text from per-resource templates in `app/evaluator/text.py` (plain language, no jargon).
- `feedback`: max 2 sentences from templates keyed by rating + cost resource.
- `fact`: null in this unit (curated facts arrive in Unit 03).
- `data_source = "simulated"`, `fallback_used = false`.

### Mission evaluation
- `avg_index` over history snapshots; `rating_points` great=100, ok=60, risky=20 averaged.
- `score = 0.6*avg_index + 0.3*rating_points + (10 if survived else 0)`, clamped 0-100;
  if outcome is `failed`, cap at 60.
- `strengths` (max 3) and `lessons` (max 3) picked by rules, e.g. strength: shielding stayed
  above required during events; lesson: the resource most often below SAFE_LEVEL.
  `summary`: 2 sentences, encouraging, framed as lessons, never punishing.
- Empty history -> valid response with score 0 and a gentle summary, no crash.

## Implementation
1. Contract change first (separate commit): `data_source` on evaluate/decision allows
   `"simulated"` (already edited in `api-contract.md`); update `contracts/*.json` and the
   Pydantic model to match.
2. `app/evaluator/` : `config.py` (all constants), `scoring.py` (pure index functions),
   `decision.py`, `mission.py`, `text.py` (templates).
3. Routers call evaluator functions only; remove the old mock rule for these two endpoints.
4. Tests in `tests/evaluator/`: determinism (same input twice), each rating branch,
   clamping bounds, delayed-effect debt, no-event case, empty mission history, resources at
   0 and 100, and a table-driven test with 6+ hand-computed examples.
5. `README` section: how the scoring works, and where to tune constants.

## Manual steps for the human
- None for keys or env in this unit.
- Do this: agree the rubric with your game devs. Send them `config.py` and the event table:
  their event names and the resource that counters each must match what Unity sends.
  Mismatched event names fall back to "no event pressure", so ask them for the exact list.
- Do this: play with 5-10 hand-made requests via `/docs` and check ratings feel sensible.

## Dependencies
- Unit 01 complete and verified. No new packages.

## Verify when done
- [ ] `uv run pytest` passes, including determinism and every rating branch
- [ ] `uv run ruff check .` clean
- [ ] Same request posted twice returns identical JSON
- [ ] A decision that drops shielding to 15 during a severity-3 solar_flare returns `risky`
- [ ] A balanced decision keeping all resources >= 40 with positive delta returns `great`
- [ ] Mission with empty history returns 200 with a valid body
- [ ] Responses still validate against `api-contract.md`; `contracts/*.json` updated
- [ ] No evaluator function does I/O or randomness (grep for `random`, `httpx`, `open(`)
- [ ] `git diff --stat` shows only `ai-service/`, `contracts/`, `context/`
- [ ] `progress-tracker.md` updated
