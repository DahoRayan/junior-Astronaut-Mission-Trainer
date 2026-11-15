# Agent Prompts (v3) - copy, replace NN / name. New agent session per unit. Agents never push or merge.

## P0. Kickoff audit (run once, before V01)
```
Read AGENTS.md and every file in context/. Do NOT write code yet. Detect my environment (OS, shell, node, package manager).
Audit the current game/ folder and the repo root: stack, packages, what runs, what data files exist (OSDR topic index, DONKI, facts).
Produce a short report: (1) what to keep, port, delete; (2) conflicts between the existing code and the context files (especially the
kid-UX guardrails in AGENTS.md); (3) risks for the performance budgets; (4) the exact manual steps I must do. Then wait for my OK.
```

## P1. Implement a unit
```
Read AGENTS.md and follow it exactly. Read context/specs/VNN-name.md. Check its Dependencies; if one is missing, STOP and tell me.
`git status` must be clean (else STOP). `git checkout main`, `git pull`, `git checkout -b feat/web-NN-name`.
Mark the unit in progress in context/progress-tracker.md. Implement exactly as specified, nothing beyond it.
Run every "Verify when done" item for real; report pass / fail / not run with actual output (include measured fps and bundle size when asked).
If all pass: update the tracker, `git add -A`, commit "feat(web): <name> (unit VNN)". Never push or merge. Never read or print .env.
Finish with the Teaching-mode report and, in "Manual steps for me", only what I must still do by hand.
```

## P2. Generate the next spec
```
Read AGENTS.md, context/specs/00-build-plan.md, _template.md, game-design.md, sim-rules.md, visual-style.md, science-education.md, architecture.md and the code that exists.
Write context/specs/VNN-name.md following the template. Rules: stay inside the context files; if something must change, list it as a proposal at the end instead of changing it.
Never write NASA facts or numbers from memory: reference public/data files and their sources. Manual steps must assume I know nothing.
Output only the spec, then the 3 manual actions I must do before running P1.
```

## P3. Kid-UX review (fresh session, read-only)
```
Read AGENTS.md (kid-UX guardrails) and context/game-design.md. Run the app. Without editing, check each screen against every guardrail:
typing anywhere, words per bubble, modals per day, HUD item count, build buttons, jargon units, touch target sizes, color-only signals, reduced motion.
Report violations with the file and a screenshot description, ordered by severity.
```

## P4. Performance pass (fresh session)
```
Read AGENTS.md and context/architecture.md (performance budgets). Measure at normal speed and at Chrome 4x CPU throttle: fps, renderer.info triangles and draw calls,
idle CPU (frameloop demand), bundle size. Find the top 3 costs, fix them without changing the look, and re-measure. Report before/after numbers.
```

## P5. Review a unit (fresh session, read-only)
```
Read AGENTS.md, architecture.md and the spec context/specs/VNN-name.md. Review branch feat/web-NN-name against main WITHOUT editing.
Run all Verify items, check invariants, scope creep, magic numbers outside balance.json, literals outside strings files, unsourced facts, secrets.
Report blockers, should-fix, nice-to-have with file and line.
```

## P6. Resume / sync
```
Read AGENTS.md and resume. Read context/progress-tracker.md, git status, git log -5. Tell me in 5 lines where we are and what is next. Change nothing.
```
