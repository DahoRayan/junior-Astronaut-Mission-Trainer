## Application Building Context (v3: browser game)

Entry point for ALL coding agents (Copilot, Codex, opencode, Claude Code). `CLAUDE.md` points here.

Read in order before implementing or making any decision:
1. `context/project-overview.md`   2. `context/architecture.md`   3. `context/game-design.md`
4. `context/sim-rules.md`   5. `context/visual-style.md`   6. `context/science-education.md`
7. `context/code-standards.md`   8. `context/ai-workflow-rules.md`   9. `context/progress-tracker.md`
Then read the spec you were given in `context/specs/`.

## Hard kid-UX guardrails (never violate; they beat any convenience)
- Audience is ages 7-12. A child must know what to do within 5 seconds of any screen.
- ZERO typing. No free-text inputs anywhere. Questions are tappable chips.
- Max 12 words per speech bubble, max 2 bubbles per event, auto-dismiss in 3 s, tap anywhere to skip. No blocking cutscenes.
- At most ONE blocking modal per game day, and only for a decision (2 big buttons, icons + <= 6 words each).
- Max 3 meters + day + storm chip in the HUD. Max 6 build buttons. No scrolling side panels. No jargon units on the map (no kg/h, L, kPa).
- Every number the player sees has an icon; color is never the only signal.
- Science is shown as short cards (<= 12 words) with a "Why?" button; details live one tap deeper.

## Environment first
Before running any command detect OS, shell, Node version and the package manager (from the lockfile: package-lock.json = npm, pnpm-lock.yaml = pnpm, yarn.lock = yarn). Use only that one. Python (data pipeline) uses uv.
If a tool is missing, say exactly what to install and why. Never skip verification silently.

## Teaching mode (the human is learning)
After each unit, end with: 1) What this unit does 2) File by file 3) How the pieces connect 4) Manual steps for the human
(keys, installs, commands, where to click; never ask for secrets in chat) 5) How to verify: exact commands + expected output, marking
each item pass / fail / not run honestly 6) 2-3 concepts worth knowing. Never claim a check passed unless you ran it.

Update `context/progress-tracker.md` after each meaningful change. If implementation changes architecture, rules or scope, update
the context file BEFORE continuing.
