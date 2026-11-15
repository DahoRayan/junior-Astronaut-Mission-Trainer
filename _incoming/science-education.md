# Science and Education (v3)

## Principle
The mechanic teaches the constraint; text only labels it. In-game numbers are simplified. Real values live only in sourced Science Cards.
Never present a made-up number as real. If it is a game number, it is shown as a bar, not as a real unit.

## Concepts, mechanics, and what must be sourced
| Concept | Where the player feels it | Science Card needs a sourced fact about |
|---|---|---|
| Solar power and lunar night | panels stop at night; batteries save energy; overflow wasted | lunar night / south-pole illumination (NASA) |
| Oxygen is made with power | Air Maker uses power, crew uses air daily | oxygen generation on the ISS (NASA) |
| Radiation and shielding | storm damage vs shield; regolith/water walls; shelter | radiation dose, regolith/water shielding (NASA), ISS vs Moon dose (curated seed facts) |
| Space weather | Storm chip + forecast + day-9 storm | DONKI, flare classes (NASA) |
| Plants for life support | Greenhouse adds air and health | plant growth on the ISS (NASA/CSA food-production resources) |
| Trade-offs and planning | limited bricks, 1 choice per event | (none: systems thinking) |
| Bodies in space | debrief only | OSDR studies (bone, muscle, etc.) |

## Science Cards
Format: icon + <= 12 words + "Why?" (<= 3 short steps) + a data badge (LIVE / SAVED + date) + "Source" link in the Science Corner.
Max 1 card per day, triggered the first time a rule fires (e.g. R-SOLAR-NIGHT -> lunar night card). Cards are collectible; the Science Corner shows collected ones with full source lines.

## MILO (expert system, no LLM)
Up to 3 tappable question chips per moment, chosen by `applies_when` rules over the sim state (low air, night ahead, storm forecast, role).
Each answer: <= 2 short sentences + optional fact + explanation (rules fired, inputs, sources). Answers come only from `data/knowledge/` (questions.json, rules.json) and `public/data/facts.json`.

## Real data (all optional at runtime, honest labels)
1. DONKI: Storm chip shows current risk (low/medium/high) from the latest snapshot or live call, with badge and date. Live mode (V06) maps the strongest recent flare class to day-9 storm severity.
2. OSDR: debrief shows "What scientists study" cards from `osdr_topic_index.json` (topic, number of studies, 1-2 example titles with links). It counts studies whose metadata mention a topic; it does not claim findings.
3. RadLab/ISS dose: optional comparison bar (ISS vs Moon) once values are verified and sourced.
4. Facts: only entries in `facts.json` with source URL, retrieved date and `verified_by_human: true`.

## Statistics (simple, in the debrief)
Per-day line chart of the 3 meters, best and worst day, how often each rule fired, stars per role, comparison of roles played. Computed in `sim/stats.ts` (pure), rendered with small SVG (no chart library).

## Explainability contract
Every report and answer carries: rules_fired[{id, kidText}], inputs{...}, sources[{name, kind: live|saved|simulated}]. "Why?" renders it as Because -> So -> Try.

## Known issues from the Story Bible (do not carry into the game)
Fictional radiation numbers (80 / 140 mSv/h, "fatal in 15 minutes") are inconsistent with real dose scales; the game uses an abstract Shield meter and sourced real-dose cards instead. "Sol" is a Mars term: say "Day" (Moon day in game terms). Epilogue stats must come from the sim.
