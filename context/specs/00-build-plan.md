# Build Plan — AI Service (draft; Ibrahim's units)

1. **Skeleton + contract mocks** — FastAPI app, config, Pydantic schemas, all endpoints returning valid mock data, `contracts/*.json`, `/health`. Depends on: none.
2. **Deterministic evaluator** — pure scoring for decision rating/survival_delta/tradeoff + mission score; unit tests. Depends on: 1.
3. **NASA data layer** — DONKI client with TTL cache, risk-level mapping, curated fallback JSON (OSDR/RadLab facts with sources). Depends on: 1.
4. **LLM client + assistant chat** — provider wrapper, kid-tone prompt, grounding on snapshot, timeout + fallback. Depends on: 1.
5. **LLM feedback narration** — wrap evaluator output into 2-sentence feedback + fact; mission debrief endpoint. Depends on: 2, 3, 4.
6. **Hardening + deploy** — rate limit, input caps, injection guard, logging, deployment, demo script. Depends on: 5.

Game-side units are listed by the game devs in their own plan; sync at each contract change.
Each unit gets `NN-name.md` generated just before building (Goal, Design, Implementation, Dependencies, Verify when done).
