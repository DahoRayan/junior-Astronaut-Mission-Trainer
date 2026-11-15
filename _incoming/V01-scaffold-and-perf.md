# Unit V01: Scaffold + performance harness

## Goal
A clean Vite + React + TypeScript app in `game/` that renders an empty 2.5D lunar diorama with a measured performance baseline,
the folder structure from architecture.md, loaded (empty) data files, and tests/lint wired up.

## Design
Start from the current prototype only for what is worth keeping. Do not port its UI. The first screen shows the diorama and nothing else.

## Implementation
1. Audit: tag the current state `legacy-react-prototype` (`git tag`), list what exists in `game/` (stack, packages, data files, OSDR/DONKI integrations). Write `game/MIGRATION.md`: keep / delete / port, one line each. STOP and show it to the human before deleting anything.
2. After OK: clean `game/` into the layout of architecture.md (`src/sim|data|store|scene|ui|services|i18n`, `public/data`). Keep any generated data JSON the old app used (for example the OSDR topic index) under `public/data/`.
3. Dependencies: react, react-dom, three, @react-three/fiber, @react-three/drei, zustand, howler; dev: vite, typescript, vitest, eslint, prettier, @testing-library/react, rollup-plugin-visualizer. Detect the package manager from the lockfile and keep to it.
4. Scene: `<Canvas orthographic frameloop="demand" dpr={[1,1.5]}>` with isometric camera rig (yaw 45, pitch ~35, zoom limits, pan bounds), one directional light + hemisphere light, the floating moon slab (rounded square), ~30 instanced craters/rocks, one test building (flat-shaded cylinder) to prove the style. `<PerformanceMonitor>` lowers DPR on slow frames. Dev-only `<Stats/>`.
5. Tokens: `ui/tokens.css` with the palette from visual-style.md; bundle fonts Fredoka and Nunito locally; a page background of space color.
6. `data/` stubs: `balance.json`, `strings.en.json`, `modules.json`, `events.json`, `roles.json` (empty shapes with a validator that fails loudly in dev).
7. Add `game/PERF.md`: triangles, draw calls (from `renderer.info`), fps at normal and at 4x CPU throttle, bundle size report.
8. Scripts: `dev`, `build`, `preview`, `test`, `lint`, `typecheck`.

## Manual steps for the human
- Install Node LTS if `node -v` fails (nodejs.org). Run `npm install` (or your lockfile's tool) inside `game/`, then `npm run dev` and open the printed URL.
- To measure throttled fps: Chrome DevTools -> Performance -> gear icon -> CPU: 4x slowdown. Note the fps shown by the dev Stats.
- If you have a low-end laptop or Chromebook, open the `npm run preview` URL on it and report fps.

## Dependencies
None (first web unit).

## Verify when done
- [ ] `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` all pass
- [ ] App shows the diorama; pan, zoom and recenter work with mouse and touch
- [ ] With the scene idle, the render loop is idle (frameloop="demand"): GPU/CPU near zero in the DevTools Performance panel
- [ ] `renderer.info` numbers recorded in PERF.md: triangles < 150k and draw calls < 100
- [ ] Build output: initial JS + assets < 3 MB (visualizer report saved)
- [ ] `MIGRATION.md` exists and the human approved it; legacy tag exists
- [ ] No secrets in the bundle; no network call at startup (check the Network tab)
- [ ] tracker updated; Teaching-mode report given
