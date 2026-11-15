# Architecture (v3)

## Stack
| Layer | Choice | Why |
|---|---|---|
| App | Vite + React 18 + TypeScript (strict) | already in use; fast dev |
| 2.5D rendering | three + @react-three/fiber + @react-three/drei | low-poly flat-shaded 3D with an orthographic isometric camera = 2.5D; declarative; instancing |
| State | zustand | tiny, no boilerplate |
| UI | HTML/CSS overlay (Tailwind + CSS variables as design tokens) | crisp text, accessible, cheap |
| Animation | CSS + react-spring for UI; manual tweens in scene | no heavy libs |
| Audio | howler (small SFX + 1 music loop) | |
| Tests | vitest (+ @testing-library/react for UI smoke) | sim must be heavily tested |
| Data pipeline | existing Python in `ai-service/` (`osdr_pipeline/`, DONKI/RadLab scripts) via uv | offline; outputs JSON into `game/public/data/` |
| Optional proxy | FastAPI `/v1/space-weather` ONLY if live DONKI needs a hidden key | the game must work without it |

Fallback if low-end devices fail the perf budget: keep `sim/`, `data/`, `ui/` unchanged and replace only `scene/` with PixiJS isometric sprites.

## Repo layout
```
repo/
  game/                      # the web game (Vite)
    src/
      sim/                   # PURE TypeScript. No React, no three. Rules, events, roles, step(), explain(), RNG
      data/                  # balance.json, modules.json, events.json, roles.json, strings.en.json, knowledge/*.json
      store/                 # zustand: phase machine + sim state wrapper
      scene/                 # R3F: Terrain, Grid, models/, CrewAndMilo, Effects, CameraRig, DayNight
      ui/                    # HUD, BuildBar, EventCard, DayReport, WhyPanel, MiloChips, ScienceCard, Debrief, ScienceCorner, Settings
      services/              # spaceWeather.ts (live/saved), audio.ts, readAloud.ts, storage.ts
      i18n/                  # strings loader (en first; keys only in code)
    public/data/             # generated JSON: donki-snapshot.json, osdr_topic_index.json, facts.json (sourced)
  ai-service/                # keep this folder name for now (optional rename to data-pipeline/ later): Python tooling that produces public/data/*.json
  context/  tools/
```

## Invariants
1. `sim/` is pure and deterministic (seeded RNG, no Date.now, no Math.random, no I/O). Everything else only calls it.
2. All tunable numbers live in `data/balance.json`; all player-facing text in `data/strings.*.json` / knowledge files. No magic numbers or literals in components.
3. The scene and UI never mutate sim state; they dispatch plans to the store, which calls `sim.step`.
4. Every report, answer or score includes an `explanation` (rules fired with ids, inputs, sources).
5. Facts shown to players come only from `public/data/facts.json` entries having source, retrieved date, and `verified_by_human: true`. Never write NASA facts from memory.
6. `data_source` badges are truthful: `live` only if fetched live this session; `saved` for bundled snapshots (show the date); `simulated` for game-rule output.
7. The game is fully playable offline with zero network calls. Network (DONKI) is optional and has a 3 s timeout + saved fallback.
8. No secrets in the client bundle.
9. No typed input. No blocking cutscenes (see AGENTS.md guardrails).

## Performance budgets (enforced in review)
- Scene: <= 150k triangles total, <= 100 draw calls, <= 1500 triangles per building, <= 3000 per character; flat shading + vertex colors, no textures except one small shared atlas/gradient; instancing for rocks/craters.
- No shadow maps. Fake soft shadows with cached blob decals. No post-processing. DPR capped at 1.5.
- `<Canvas frameloop="demand">`; call `invalidate()` only while something animates. Use drei `<PerformanceMonitor>` to lower DPR automatically.
- Initial load < 3 MB; lazy-load Science Corner, Debrief charts and rarely used models. Fonts bundled locally (no CDN).
- Targets: 60 fps desktop, >= 30 fps on a low-end laptop (test with Chrome DevTools CPU throttle 4x-6x and a real low-end device if available).
