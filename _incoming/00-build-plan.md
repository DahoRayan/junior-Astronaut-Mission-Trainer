# Build Plan (v3, web game)

| # | Unit | Depends on | Cut line |
|---|---|---|---|
| V01 | Scaffold + perf harness (Vite, R3F, zustand, vitest, empty diorama, budgets) | - | MVP |
| V02 | Sim core (pure TS: rules, events, roles, explain, bot tests) | V01 | MVP |
| V03 | Scene: terrain, grid, 6 low-poly buildings, crew, MILO, day/night, camera | V01 (V02 types) | MVP |
| V04 | Game loop UI: HUD, build bar, toggles, event card, GO, day report, Why?, lose/rewind | V02, V03 | MVP |
| V05 | Knowledge: MILO chips, Science Cards, Science Corner, sourced facts.json | V02 | MVP |
| V06 | Real data: DONKI badge (saved + optional live), OSDR "what scientists study", sources | V05 | MVP-lite (saved only) |
| V07 | Roles + debrief stats + stars + rewind polish | V04 | MVP |
| V08 | Polish: audio, read-aloud, reduced motion, i18n keys, perf pass at 4x throttle, deploy (static host) | all | before demo |
| V09 | Stretch: RadLab ISS-vs-Moon bar, hard mode, French/Arabic strings, Mars teaser | V08 | stretch |

Order of work: V01 -> V02 and V03 in parallel (different owners) -> V04 -> V05 -> V07 -> V06 -> V08.
Specs are generated one at a time, just before building (prompt P2), because later specs depend on what earlier units really produce.
Python side (data-pipeline): keep `osdr_pipeline` and the DONKI/RadLab sample scripts; their outputs feed `game/public/data/`. The earlier FastAPI units (contract v2, evaluator, expert system) are superseded by V02 and V05; reuse their formulas and the story-bible review flags as references.
