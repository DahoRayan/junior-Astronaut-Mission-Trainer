# Progress Tracker - Beyond Earth: First Light v3

Update after every meaningful change.

## Current phase
- v3 plan adoption is complete.
- Unit V01 scaffold and performance harness are in progress.

## Completed
- v3 documentation adoption and legacy preservation.
- P0 legacy web-game audit in `game/MIGRATION.md`.
- AI-service Units 01-07 remain preserved under `ai-service/`.

## In progress
- Unit V01: React + TypeScript + React Three Fiber scaffold and performance
  baseline. Automated checks pass; manual 4x CPU-throttle FPS measurement
  remains.
- Unit V02: pure deterministic simulation core. Implemented and verified with
  14 tests and 93.86% line coverage in `src/sim/`.

## Decisions
- The current Vite/TypeScript game is preserved at `legacy/web-prototype/`.
- The active `game/` client is being rebuilt from the v3 architecture.
- OSDR and other science data remain sourced from the existing AI-service
  pipeline; no NASA facts are invented in the web client.

## Unit ownership
| Unit | Owner | Branch | Status |
|---|---|---|---|
| V01 scaffold + perf harness | Ibrahim | feat/web-01-scaffold | implemented; manual FPS pending |
| V02 simulation core | Ibrahim | feat/web-02-sim-core | implemented |

## Pack gaps
- `_incoming/v3/CLAUDE.md` was not supplied.
- `_incoming/v3/context/` was not supplied; flattened v3 documents were adopted
  from `_incoming/`.
