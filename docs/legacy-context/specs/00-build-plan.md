# Build Plan - AI Service (v2)

| # | Unit | Depends on | Notes |
|---|---|---|---|
| 01 | Skeleton + mocks (v1 contract) | - | DONE, awaiting verification |
| 02 | Contract v2 migration (mocks) | 01 | Do first so Unity integrates against the new contract |
| 03 | Deterministic evaluator + explanations | 02 | rules engine for decisions/missions |
| 04 | NASA data layer + curated dataset | 02 | DONKI client, cache, curated fallback, curated facts |
| 05 | Expert system | 02 (04 for facts) | question catalog, knowledge base, rule engine |
| 06 | Story bible schema + validator | 02 + agreed story schema | `scripts/validate_story.py`, tests with good/bad examples |
| 07 | Statistics | 03, 04 | event profile endpoint + debrief `stats` |
| 08 | Hardening + deploy | all | rate limit, input caps, logging, hosting, demo script |

Parallel after 02: units 03, 04, 06 are independent. 05 can start with a seed knowledge base. 07 waits for 03 + 04.
Each unit gets `NN-name.md` just before building (use `_template.md`).
Game-side units are planned by the game devs; sync at every contract or story-schema change.
