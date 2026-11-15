# Unit V02: Simulation core (pure TypeScript)

## Goal
Implement the day step, events, roles, forecasts, explanations, stars and statistics exactly as in `context/sim-rules.md`, as a pure, deterministic, heavily tested module in `game/src/sim/`.

## Design
No React, no three, no DOM, no Date/Math.random. State is plain serializable JSON. Numbers come from `data/balance.json` (values from sim-rules.md); rule texts from `data/strings.en.json`. Public API: `createInitialState`, `forecast`, `legalActions`, `step`, `computeStats`.

## Implementation
1. `sim/types.ts` (State, Plan, Report, RuleFired, Explanation, Outcome), `sim/rng.ts` (mulberry32), `sim/balance.ts` (typed loader + validation), `sim/step.ts` (the 9-step order from sim-rules.md), `sim/events.ts` (timeline, choices), `sim/roles.ts`, `sim/explain.ts` (rules fired with ids, kid text, inputs, sources), `sim/stats.ts` (per-day series, best/worst day, rule frequency, stars).
2. `data/balance.json`, `data/events.json`, `data/roles.json`, `data/modules.json` filled from sim-rules.md. Rule ids must exist as string keys in `strings.en.json` (<= 10 words each, plus Because/So/Try lines).
3. Reports mention WASTED power, OFFLINE modules, BLACKOUT, thin air, storm damage and shelter trade-offs with the matching rule ids.
4. Tests (vitest), including the bot suite from sim-rules.md: determinism, range safety (no NaN, no out-of-range), each rule in isolation, each event and choice, each role, do-nothing bot fails for all roles, mediocre bot survives, good bot wins, bricks cannot afford everything by day 8, stars logic.
5. Coverage report; target >= 90% lines in `sim/`.
6. Do NOT change numbers silently. If the bot tests fail with the given numbers, adjust only `balance.json`, explain the change, and record it in `game/BALANCE.md` with before/after results.

## Manual steps for the human
- None for keys. Read `BALANCE.md` and the printed bot results; tell the agent if the difficulty feels wrong after you playtest in V04.

## Dependencies
V01 merged.

## Verify when done
- [ ] `npm run test` passes with coverage >= 90% for `src/sim/`
- [ ] Same state + plan + seed twice gives identical reports (test)
- [ ] Do-nothing bot loses for all 3 roles; good bot wins for all 3; mediocre bot survives with reduced crew health
- [ ] `grep -rE "Math.random|Date.now|from 'react'|from 'three'" src/sim` finds nothing
- [ ] Every rule id used in reports exists in `strings.en.json`
- [ ] tracker updated; Teaching-mode report given
