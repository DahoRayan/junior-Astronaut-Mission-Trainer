## Application Building Context

Entry point for ALL coding agents (opencode, Codex, GitHub Copilot, Claude Code).
`CLAUDE.md` just points here.

Read in order before implementing or making any architectural decision:

1. `context/project-overview.md` — product, goals, scope
2. `context/architecture.md` — stack, boundaries, invariants
3. `context/api-contract.md` — the Unity <-> AI service contract (shared, sacred)
4. `context/game-design.md` — resources, trade-offs, kid tone (replaces ui-context)
5. `context/code-standards.md` — rules per boundary (AI service / Unity)
6. `context/ai-workflow-rules.md` — scoping and delivery rules
7. `context/progress-tracker.md` — current state and next steps

Then read the spec you were given in `context/specs/`.

Know which boundary you own. If your task is in `ai-service/`, do not edit `game/`
(and vice versa). Contract changes need a PR touching `api-contract.md` first.

Update `context/progress-tracker.md` after each meaningful change.
If implementation changes architecture, scope, or contract, update the relevant
context file BEFORE continuing.
