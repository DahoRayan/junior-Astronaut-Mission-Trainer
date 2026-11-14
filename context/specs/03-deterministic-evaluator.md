# Unit 03: Deterministic Evaluator + Explanations

## Goal
Replace the mock logic of `POST /v1/evaluate/decision` and `/v1/evaluate/mission` with a pure,
deterministic rules engine. Same input -> same output; no I/O, no randomness, no LLM.
Feedback text comes from fixed kid-friendly templates. Every result carries an `explanation`.
`stats` stays null (Unit 07).

## Design
All constants live in `app/evaluator/config.py` (tunable with the game devs). Each scoring rule has
a stable `rule_id` and a plain-language text template used in `explanation.rules_fired`.

### Survivability index (0-100) for a snapshot
- Per-resource risk `risk_r = clamp((SAFE_LEVEL - value_r)/SAFE_LEVEL, 0, 1)`, SAFE_LEVEL = 40;
  CRITICAL_LEVEL = 20.
- Event pressure: config table event type -> (protecting resource, required level for severity 1/2/3);
  e.g. `solar_flare` -> shielding, 40/60/80. `event_risk = clamp((required - value)/required, 0, 1)`.
  Unknown event type -> no pressure (and listed in `explanation.inputs.unknown_event_type`).
- Balance penalty if `max - min > 50`.
- `index = 100 - 100*(0.5*mean_risk + 0.3*worst_risk + 0.2*event_risk) - balance_penalty`, clamped.

### Decision
- `index_before`, `index_after` (after also subtracts a config penalty for each delayed negative
  effect whose projected value falls under SAFE_LEVEL).
- `survival_delta = clamp(round(index_after - index_before), -20, 20)`.
- `rating`: `risky` if any resource critical after, OR event_risk after > 0.5, OR delta <= -5;
  `great` if delta >= 3 AND no resource under SAFE_LEVEL AND event_risk after == 0; else `ok`.
- `tradeoff`: gained = largest positive delta, cost = largest negative delta (else worst delayed
  effect, else an "extra risk later" template). Texts in `app/evaluator/text.py`.
- `explanation.rules_fired`: e.g. `R-CRITICAL`, `R-EVENT-SHIELD`, `R-BALANCE`, `R-DELAYED-DEBT`,
  `R-DELTA-GOOD`; `inputs`: before/after resources, event, delta, thresholds used;
  `sources`: `[{name:"Game rules", kind:"simulated"}]`. `data_source="simulated"`. `fact=null` in this unit.

### Mission
- `avg_index` over history; `rating_points` great=100/ok=60/risky=20 averaged.
- `score = 0.6*avg_index + 0.3*rating_points + (10 if survived)`, clamped; cap 60 if failed.
- `strengths`/`lessons` (<=3 each) by rules (e.g. shielding stayed above required during events;
  the resource most often under SAFE_LEVEL). `summary`: 2 encouraging sentences.
- `explanation` lists the rules/inputs behind the score. Empty history -> valid body, score 0.

## Implementation
1. `app/evaluator/`: `config.py`, `scoring.py` (pure), `decision.py`, `mission.py`, `text.py`, `explain.py` (builds Explanation).
2. Routers only call evaluator functions; remove the mock logic for these two endpoints.
3. Tests in `tests/evaluator/`: determinism; each rating branch; clamping; delayed debt; no event;
   unknown event type; empty history; resources 0 and 100; 6+ hand-computed table examples;
   every response contains a non-empty `rules_fired`.
4. README section: how scoring and explanations work; where to tune constants.

## Manual steps for the human
- None for keys. Send the game devs `config.py` and the event table: their event type names and the
  resource that counters each must match. Ask for the exact list.
- Try 5-10 hand-made requests in `/docs` and check ratings and explanations feel sensible.

## Dependencies
- Unit 02 merged. No new packages.

## Verify when done
- [ ] `uv run pytest` and `uv run ruff check .` pass
- [ ] Same request twice -> identical JSON
- [ ] Shielding drops to 15 during a severity-3 `solar_flare` -> `risky`, with `R-EVENT-SHIELD` in `rules_fired`
- [ ] Balanced decision, all resources >= 40, positive delta -> `great`
- [ ] Empty mission history -> 200 with valid body
- [ ] Responses validate against `api-contract.md`; `contracts/*.json` updated
- [ ] No evaluator function does I/O or randomness (`grep random httpx "open("`)
- [ ] `git diff --stat` only `ai-service/`, `contracts/`, `context/`
- [ ] `progress-tracker.md` updated; Teaching mode report given
