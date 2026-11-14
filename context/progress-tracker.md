# Progress Tracker

Update after every meaningful change.

## Current Phase
- Setup (context files, repo structure)

## Current Goal
- Unit 01: AI service skeleton with mock endpoints (see specs/01-ai-service-skeleton.md)

## Completed
- None yet.

## In Progress
- None yet.

## Next Up
- Unit 01 (see `specs/01-ai-service-skeleton.md`)

## Open Questions
- LLM provider and model (cost/quota, latency)?
- Final core resources: power, oxygen, shielding — add food or not?
- Moon only, or Mars too?
- How is the game built/shipped (WebGL vs desktop) and where is the service hosted for judging?
- Mission length (sols) and event pool — owned by game devs, agree with AI side.
- Confirm Unity-side standards file owner.

## Architecture Decisions
- Single monorepo with folder ownership; shared context at root.
- Evaluator scoring is deterministic; LLM narrates only (keeps feedback accurate and testable).
- Mocks first so the two sides unblock each other.

## Session Notes
- Resume with: "Read AGENTS.md and resume."
