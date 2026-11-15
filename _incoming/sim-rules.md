# Simulation Rules (v3) - the logic

Starting values below are TUNABLE (`data/balance.json`). The agent must tune them with bot tests until the acceptance criteria at the bottom hold.

## State
day (1..12), power (stored, 0..capacity), capacity, air (0..100), shield (derived), crewHealth (0..100), bricks, modules[], toggles, roleId, specialUsed, rngState, history[].

## Constants
| Name | Value |
|---|---|
| mission_days | 12 |
| night_days | 5, 6 (solar factor 0) |
| base_capacity | 40 (+40 per Battery, max 3) |
| habitat_upkeep (always on) | 10 power/day |
| crew_air_use | 10 air/day |
| base_brick_income | +10/day |
| base_shield | 15 |
| Solar Panel | cost 20, +14 power on sun days (max 6) |
| Battery | cost 20, +40 capacity (max 3) |
| Air Maker | cost 40, uses 10 power, +15 air; toggle |
| Greenhouse | cost 50, uses 6 power, +5 air, +3 crew heal; toggle |
| Brick Rover | cost 30, uses 4 power, +20 bricks; toggle |
| Radiation Wall | cost 25, +25 shield (max 3), no power |
Grid: 6x6 buildable tiles, max 12 buildings. Starting bricks 40 for every role.

## Day step (deterministic order)
1. Scheduled event effects (see timeline) and the player's choice are applied.
2. Solar: gen = panels * 14 * solarFactor (1 on sun days, 0 on night days, 0.5 on day 12 after the quake unless fixed).
3. Power pool = min(capacity, stored + gen). Overflow is WASTED (report it: "Battery full: power wasted").
4. Consumers in priority order: Habitat (10) -> Air Maker (10) -> Greenhouse (6) -> Rover (4). A consumer runs only if toggled ON and the pool covers it; otherwise OFFLINE (reported). If the pool cannot even cover the Habitat: BLACKOUT (pool = 0, crew -20 "cold").
5. Air: air += (Air Maker online ? 15 : 0) + (Greenhouse online ? 5 : 0) - 10 (+ event effects); clamp 0..100. If air < 25: crew -10 ("thin air"). If air == 0: crew -25.
6. Storm: only on storm days. required = {1: 40, 2: 60, 3: 80}[severity]. shield_eff = shield + (shelter ? 30 : 0). damage = round(max(0, required - shield_eff) * 0.8). Shelter costs 12 power and puts the Rover OFFLINE that day.
7. Heal: +2 crew if air >= 40 and no blackout and no storm damage (+3 more if Greenhouse online); cap 100.
8. Bricks += 10 + (Rover online ? 20 : 0).
9. End: crewHealth <= 0 -> failed; day == 12 done -> success.

## Timeline (shared by all roles)
| Day | Event | Effect / choice |
|---|---|---|
| 1 | landing | tutorial only |
| 2 | oxygen leak | air -20 immediately. Choice A "Call Earth": -20 bricks now, +40 air at the start of day 4. Choice B "Patch it": -10 bricks, -15 power, leak reduced to -5 air. No choice = full leak |
| 4 | forecast: night | info |
| 5,6 | long night | solar factor 0 |
| 8 | forecast: storm | info (+ data badge) |
| 9 | solar storm, severity 2 (3 on hard) | choice: Shelter (+30 shield, -12 power, Rover off) or Stay |
| 10 | first harvest | +5 crew heal if a Greenhouse exists |
| 12 | moonquake | solar factor 0.5, air -10. Choice: "Quick repair" (-10 bricks) cancels both, or keep going |
Live mode (optional, spec V06): storm severity on day 9 follows the strongest recent real flare class (below M -> 1, M -> 2, X -> 3), clearly labeled.

## Explanation rules (each has an id, a <= 10-word kid text, and a cause chain)
R-SOLAR-SUN, R-SOLAR-NIGHT, R-BATTERY-FULL-WASTE, R-POWER-SHORT-OFFLINE, R-BLACKOUT-COLD, R-AIR-BALANCE, R-AIR-THIN, R-STORM-SHIELD, R-SHELTER-TRADE, R-QUAKE-DUST, R-LEAK-CHOICE, R-HARVEST.
Report = meter deltas + the 2 rules that moved the meters most + inputs (numbers) + sources (simulated / data badge). "Why?" shows: Because (cause) -> So (effect) -> Try (one hint), each <= 10 words.

## API (pure TS)
`createInitialState(roleId, seed)`, `forecast(state, daysAhead)`, `legalActions(state)`, `step(state, plan) -> { state, report }`,
`Plan = { builds: {type, tile}[], removes: id[], toggles: Record<id, boolean>, choice?: ChoiceId, useSpecial?: boolean, shelter?: boolean }`.
`report = { deltas, events, reasons: RuleFired[], explanation, outcome: "continue"|"success"|"failed", stars? }`.

## Balance check already done (throwaway Python prototype, NOT the TS sim)
With the numbers above (Medic starts with air 80): a "do nothing" bot fails for all three roles (days 7 / 9 / 12); a "mediocre" bot (builds Air Maker + solar, no walls, no night toggling) survives with about 54-70 crew health; a "good" bot wins with 90-100. The TypeScript bot tests must reproduce this shape; re-tune `balance.json` if they do not.

## Acceptance (bot tests in vitest)
1. Determinism: same state + plan + seed => identical report.
2. "Do nothing" bot FAILS for every role.
3. A heuristic "good" bot wins for every role with >= 1 star; the three-star path exists but needs a real choice (not all stars from one fixed script).
4. Each trade-off matters: (a) skipping batteries leads to night blackout; (b) shelter vs stay changes storm damage and brick income; (c) leaving Greenhouse/Rover ON at night drains power vs turning them OFF saves it.
5. Bricks cannot afford everything by day 8 (forces prioritization).
6. No meter ever leaves its range; no NaN; every rule id referenced exists in strings.
