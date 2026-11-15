# v3 pack: how to adopt (safe order)

Folder map after adoption:
```
repo-root/
  AGENTS.md  CLAUDE.md          <- from this pack (replace)
  context/                      <- from this pack (replace)
  docs/legacy-context/          <- your OLD context/ and old AGENTS.md, moved here (kept, not deleted)
  game/                         <- your current web game: DO NOT touch by hand; the agent audits it first (P0)
  ai-service/                   <- keep as is (osdr_pipeline, scripts, data/); renaming is optional and later
  story/  tools/  orchestrator/ <- keep as is
```
Steps:
1. Commit everything you have (`git status` must be clean).
2. Safety tag: `git tag legacy-before-v3` and `git push origin legacy-before-v3`.
3. Branch: `git checkout -b docs/v3-replan`.
4. Move the old context: `mkdir docs` then `git mv context docs/legacy-context` and `git mv AGENTS.md docs/legacy-context/AGENTS.old.md`.
5. Copy this pack's `AGENTS.md`, `CLAUDE.md` and `context/` folder into the repo root.
6. `git status` must show only: renamed old context, new AGENTS.md/CLAUDE.md/context. Nothing under `game/`.
7. Commit, push, merge the pull request on GitHub, then `git checkout main` and `git pull`.
8. Run prompt P0 (audit only), read the report, approve, then P1 for V01.
Before the demo: run P3 (kid-UX review) and P4 (performance pass).
