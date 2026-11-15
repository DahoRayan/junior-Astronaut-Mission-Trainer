# Unit V03: Scene

## Goal

Replace the V01 placeholder diorama with the V03 low-poly lunar scene:

- a rounded floating moon slab and buildable 6x6 grid;
- six readable building models matching the six module types;
- four chibi crew members and MILO;
- day/night lighting and visual storm/quake feedback;
- bounded orthographic pan, zoom, and recenter controls.

The scene must be a presentational layer only. It receives serializable state
and dispatch callbacks from a future store/UI layer; it never changes
simulation state directly and does not implement the PLAN/GO/REPORT flow.

## Design

### Boundary and data

- Keep all simulation logic in `game/src/sim/`. V03 may import its public
  types, but must not add React, Three.js, DOM, `Date`, `Math.random`, or I/O to
  that directory.
- Keep scene code in `game/src/scene/`. It may use React Three Fiber and Drei,
  but it must not call `sim.step` or mutate a `State`.
- Use the existing module definitions in
  [`game/public/data/modules.json`](../../game/public/data/modules.json) and
  the matching typed source data in `game/src/data/modules.json` for module
  identity and player-facing summaries. Do not duplicate costs or simulation
  effects in scene components; costs remain in
  [`game/public/data/balance.json`](../../game/public/data/balance.json).
- Use module IDs, role IDs, and event IDs from the existing data files. The
  scene may show visual state for an event, but V03 must not implement event
  choices or write new event text.
- V03 must not display NASA facts. Do not create or consume `facts.json`,
  DONKI snapshots, OSDR data, or science-card copy in this unit. If a later
  scene receives a sourced fact, it must require the existing
  `source`, `retrieved date`, and `verified_by_human: true` fields described in
  `science-education.md`; no fallback facts may be written from memory.

### Scene composition

Create small components with this shape:

- `Terrain`: floating rounded moon slab, cached blob decals, and the 6x6 grid.
- `BuildingModels`: one low-poly model per module type:
  Solar Panel, Battery, Air Maker, Radiation Wall, Greenhouse, and Brick
  Rover. Use the forms and palette in `visual-style.md`; procedural primitives
  are sufficient.
- `CrewAndMilo`: four astronauts using the suit colors in `visual-style.md`
  and a friendly white-blue MILO. Use simple idle motion only while animation
  is active.
- `DayNight`: update light color/intensity and a small star treatment from
  the current day and forecast. Do not add a second terrain or shadow map.
- `CameraRig`: fixed-angle orthographic camera with bounded pan, scroll/pinch
  zoom, and double-tap or an explicit callback to recenter.
- `SceneEffects`: lightweight build pop, low-meter pulse, storm tint/shake,
  and quake dust. Respect `prefers-reduced-motion`.

The visual scene must remain a Candy Moon diorama: saturated, chunky,
flat-shaded, readable at a glance, and not realistic or dark. Do not add
textures, post-processing, shadow maps, or a new rendering library.

### Public scene contract

Define a scene props type in `game/src/scene/` that contains only serializable
presentation data and callbacks, for example:

- `day`, `solarFactor`, `storm`, and `quake` visual flags;
- `modules` with `id`, `type`, `tile`, and `online`;
- crew health/status values needed for visual expressions;
- optional selected module ID;
- `onTileClick(tile)`, `onModuleClick(id)`, and `onRecenter()`.

The exact prop names may follow the existing code, but the invariant is that
the scene emits intent through callbacks and never edits the passed objects.
`V04` will connect these callbacks to the zustand/store and the V02
`legalActions`/`step` API.

### Performance and accessibility

- Preserve `<Canvas orthographic frameloop="demand" dpr={[1, 1.5]}>` and
  `PerformanceMonitor` from V01.
- Invalidate only during an active visual animation; an idle scene must stop
  rendering.
- Use instancing for repeated craters/rocks and keep the existing V01 budgets:
  fewer than 150,000 total triangles, fewer than 100 draw calls, each building
  below 1,500 triangles, each character below 3,000 triangles.
- Do not use textures except a small shared atlas/gradient if one is actually
  required. Fonts remain local; no CDN requests.
- Buildings must be identifiable by silhouette and palette, not color alone.
  Selection needs an outline, scale, or marker.
- Touch targets and any scene selection affordance must be at least 48px in
  the HTML overlay. Do not add typed input, a scrolling catalog, or a second
  HUD.

## Implementation

1. Read the current `MoonDiorama` and `App` implementation and preserve the
   V01 camera/performance invariants while moving scene responsibilities into
   focused files under `game/src/scene/`.
2. Add typed visual data adapters for the existing module JSON. Validate
   unknown module types loudly in development instead of silently rendering a
   generic building.
3. Implement the 6x6 tile projection and bounded orthographic camera. Verify
   drag pan, wheel/pinch zoom, and recenter without changing the fixed camera
   angle.
4. Implement all six procedural building models with flat shading and the
   visual-style colors. Place each module by its V02 tile; an offline
   toggleable module must have a clear visual state.
5. Add four chibi crew figures and MILO with low-cost idle motion. Keep the
   motion demand-driven and disable it when reduced motion is requested.
6. Add day/night lighting from the `solarFactor`/day presentation inputs:
   warm sunlight on sun days, cool low light on night days, and a small star
   treatment. Add storm and quake feedback as reversible scene effects only.
7. Add scene interaction callbacks for tile selection, module selection, and
   recentering. Do not add build costs, event choices, reports, or store logic;
   those belong to V04.
8. Add focused tests for pure tile projection/data mapping where practical.
   Add a browser smoke test or documented manual check for visible models,
   camera controls, callback dispatch, reduced motion, and idle rendering.
9. Record measured triangles, draw calls, and idle behavior in
   `game/PERF.md`. Keep the initial bundle under 3 MB and do not add external
   network requests.

### Proposed changes requiring approval

None. V03 can be implemented within the current architecture and V02 public
types. If the scene requires a new state field, add it to the V02 contract
first and stop before implementing that dependency.

## Manual steps for the human (keys, env, installs)

Assume a fresh Windows PowerShell machine:

1. Install Node.js LTS from `https://nodejs.org/` if `node -v` fails. Close
   and reopen PowerShell after installation.
2. Open the repository in VS Code. In the integrated terminal, run:
   ```powershell
   cd game
   npm install
   npm run dev
   ```
3. Open the printed local URL in Chrome. Drag the moon to pan, use the mouse
   wheel or two-finger pinch to zoom, double-tap or use the recenter control,
   and click each building. Confirm the scene remains understandable without
   typing.
4. To check reduced motion, open Chrome DevTools, press `Ctrl+Shift+P`, run
   “Emulate CSS prefers-reduced-motion: reduce”, and repeat the interaction.
5. To measure the low-end target, open DevTools Performance, select CPU 4x
   slowdown, record while panning and zooming, and write the observed FPS and
   renderer metrics in `game/PERF.md`.

## Dependencies

- V01 scaffold and performance harness on the current `game/` client.
- V02 public simulation types and state shape from
  `game/src/sim/types.ts`.
- Existing module, balance, event, role, and string data in
  `game/src/data/` and `game/public/data/`.
- No new NASA data, API key, FastAPI route, or contract change.

## Verify when done

- `npm run typecheck` exits 0 with no TypeScript errors.
- `npm run lint` exits 0 with no ESLint errors.
- `npm run test` passes all existing and new tests.
- `npm run build` exits 0 and reports the initial JS/assets bundle below 3 MB.
- `rg "Math\\.random|Date\\.now" game/src/scene` returns no matches.
- Start the app with `npm run dev`; Chrome visibly shows the slab, 6x6 grid,
  six building silhouettes, four crew members, and MILO with no console errors.
- Browser interaction check passes: bounded pan, wheel/pinch zoom, fixed-angle
  camera, recenter, tile/module callback dispatch, and reduced-motion behavior.
- `renderer.info` recorded in `game/PERF.md`: fewer than 150,000 triangles and
  fewer than 100 draw calls; each building remains below 1,500 triangles.
- With the scene untouched for one second, no new demand-render frames occur.
- No external network request occurs at startup, and no NASA claim appears in
  the V03 scene.
- `git status --short` is clean after the implementation commit.
