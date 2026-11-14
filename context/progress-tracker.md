# Progress Tracker

Update after every meaningful change (only your own unit/row).

## Current Phase
- Plan v2 adopted (story-driven, expert system, statistics). Unit 01 awaiting verification.

## Current Goal
- Unit 08 hardening + deploy (see `specs/00-build-plan.md`)

## Completed
- Unit 01 implemented (v1 contract mocks); verification pending
- Unit 02 contract v2 migration (mocks)
- Unit 03 deterministic evaluator
- Unit 04b OSDR metadata pipeline implemented; 424-study partial corpus generated

## In Progress
- Unit 04b OSDR corpus is partial because the rate-limited full fetch was stopped;
  taxonomy review is pending human approval.

## Open Questions
- Names of the 3 perspectives and number of scenes each (game devs)
- Who writes the story content, and the final story-bible schema sign-off
- Exact event type list and which resource counters each (game devs + AI side)
- Mission length (sols) and the convergence event
- Which curated facts to include (OSDR/RadLab picks) and who selects them
- WebGL or desktop build; where the service is hosted for judging
- Stretch: Mars, food resource, `stats` perspective comparison depth

## Architecture Decisions
- Single monorepo with folder ownership; shared context at root.
- No LLM at runtime: expert system + deterministic evaluator; explainability on every result (mentor feedback, agreed by team).
- Kaleidoscope storytelling via a shared story bible validated by script.
- Mocks first, then real logic behind the same schemas.

## Unit Ownership
| Unit | Owner | Branch | Status |
|---|---|---|---|
| 01 skeleton + mocks (v1) | Ibrahim | feat/ai-01-skeleton | in verification |
| 02 contract v2 migration | Ibrahim | feat/ai-02-contract-v2 | completed |
| 03 deterministic evaluator | Ibrahim | feat/ai-03-deterministic-evaluator | completed |
| 04b OSDR metadata pipeline | Ibrahim | feat/ai-04b-osdr-pipeline | partial corpus; review pending |
| 04 NASA data layer | Ibrahim | feat/ai-04-nasa-data-layer | completed |
| 05 expert system | Ibrahim | feat/ai-05-expert-system | completed |
| 06 story validator | Ibrahim | feat/ai-06-story-bible | completed; release story file pending human sign-off |
| 07 statistics | Ibrahim | feat/ai-07-statistics | completed; OSDR-backed profile preserved |
| 08 hardening + deploy | TBD | | not started |

## Session Notes
- Resume with: "Read AGENTS.md and resume."
