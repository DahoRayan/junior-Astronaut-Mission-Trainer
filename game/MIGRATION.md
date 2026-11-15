# V3 migration audit

Audit tag: `legacy-react-prototype`  
Audit branch: `docs/v3-replan`  
Audit date: 2026-11-15

## Stack and current contents

- Keep `game/` as the web-client root: it is a Vite + TypeScript browser app,
  but it currently uses direct DOM, Canvas 2D, and WebGL classes rather than
  React or React Three Fiber.
- Keep `game/package.json` and `game/package-lock.json` as legacy references;
  they contain `three`, `typescript`, and `vite`, but not the v3 React/R3F
  stack.
- Keep `game/src/simulation/` as migration reference only; its state model has
  many v2 resources and timer-driven behavior that conflicts with v3 pure
  `sim/step`.
- Port the useful deterministic rules and event ideas from
  `game/src/simulation/` into the v3 `sim/` boundary only after the V01
  scaffold exists.
- Port the current camera/build interaction ideas from `game/src/render/` and
  `game/src/mission/` selectively; do not port their DOM/canvas architecture.
- Port the current story data only after it is mapped to the v3 shared timeline;
  do not treat the current `StoryData.ts` dialogue as signed-off v3 content.
- Port the current sound feedback concepts from `game/src/core/SoundManager.ts`
  later, after reduced-motion and mute behavior are specified.
- Port reviewed OSDR topic data from `ai-service/data/knowledge/` and
  `ai-service/data/osdr/` into `game/public/data/` only as generated,
  human-reviewed JSON; do not copy raw OSDR files.
- Port only verified knowledge facts with source, retrieval date, and
  `verified_by_human: true`; the current hardcoded science strings are not
  sufficient evidence.
- Delete after human approval: `game/src/ui/MILOTerminal.ts` and its matching
  typed chat markup/styles; v3 requires tappable question chips and zero typing.
- Delete after human approval: the nine crew-operation controls and their
  handlers; v3 limits the interaction surface to the six building buttons and
  one event choice.
- Delete after human approval: the legacy direct-canvas renderer stack once the
  v3 scene renders the replacement diorama; no files are deleted in this audit.
- Delete after human approval: obsolete v2 contract types and `/assistant/chat`
  client calls; they conflict with the current service contract.

## Conflicts with v3 context and kid-UX guardrails

- `game/index.html` contains a free-text MILO input and Send button, violating
  the zero-typing rule.
- The current HUD and markup expose more than three resource meters and include
  jargon-heavy labels such as power, oxygen, water, radiation, and materials.
- The current UI exposes nine crew-operation buttons plus a catalog panel,
  exceeding the six-build-button and one-choice interaction limits.
- `game/src/core/types.ts` still models the v2 API, including `fallback_used`,
  `/assistant/chat`, old resource names, and unsourced science fields.
- `game/src/network/AIClient.ts` calls the removed `/assistant/chat` endpoint
  and uses a response shape that is not the v3 contract.
- `game/src/main.ts` sends legacy decision payloads and performs network work
  directly from click handling instead of through the v3 service boundary.
- `game/src/core/Constants.ts`, `MissionManager.ts`, and `StoryData.ts` contain
  NASA or radiation claims that must be replaced by reviewed data files.
- The current `game/` package is not React despite the v3 architecture requiring
  React 18, React Three Fiber, Zustand, and the v3 test/lint toolchain.
- The current story uses legacy chapters/sol terminology and must use the v3
  day-based shared timeline.

## Performance risks

- `ViewportRenderer` runs a continuous `requestAnimationFrame` loop; this
  conflicts with `frameloop="demand"` and can consume CPU while idle.
- The app creates two canvases and renders terrain plus the game view, so draw
  calls and fill rate need a fresh baseline.
- Four large lunar texture assets are present, including 4K displacement and
  diffuse images; they threaten the initial-load budget and v3 texture limits.
- `Math.random()` is used for sound and confetti, preventing deterministic
  replay and making performance tests less reproducible.
- `setInterval`, `setTimeout`, and timer-driven visual novel text can keep work
  alive after UI state changes.
- DOM updates append chat history without a bounded list, which can grow during
  play.
- No `renderer.info` baseline, bundle visualizer report, or throttled FPS
  measurement exists yet.
- Node is not installed or available on this machine, so npm install/build and
  browser performance measurements were not run during this audit.

## Manual steps for the human

1. Install Node.js LTS so `node -v` and `npm -v` work, then run `npm install`
   inside `game/` after V01 changes the package manifest.
2. Review and approve the deletion candidates above; no deletion was performed.
3. Confirm whether the existing legacy NASA wording may be removed or must be
   replaced by specific reviewed facts.
4. Review the v3 pack gap: `_incoming/v3/CLAUDE.md` and
   `_incoming/v3/context/` were not supplied; the available flattened pack
   documents were adopted instead.
5. After approval, run P1 from a new `feat/web-01-scaffold` branch.
