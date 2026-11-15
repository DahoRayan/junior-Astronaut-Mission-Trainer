# Beyond Earth: First Light — Junior Astronaut Mission Trainer (v2)

## Overview
A colony builder and mission trainer for kids aged 7–12 (NASA Space Apps Challenge 2026: "Build a Junior Astronaut Mission Trainer"). The player takes on the role of Junior Mission Commander directing an expedition of astronauts and their AI companion, **M.I.L.O.** (*Mission Intelligence & Logistics Operator*), at the Lunar South Pole (Shackleton Crater Rim).

The game combines physical network simulation (power grids, life support conduits, thermal balance, water recycling) with a rich story campaign. Every choice and spatial placement carries real scientific trade-offs grounded in authentic NASA (DONKI, RadLab, OSDR) and CSA data.

A decoupled Python FastAPI service (`ai-service/`) provides an intelligent Mission Control advisor (M.I.L.O.), live space weather telemetry, deterministic construction/decision evaluators, and educational mission debriefs with full explainability.

## Goals
1. Player experiences authentic space survival trade-offs (Power, Oxygen, Thermal, Radiation Shielding, Water, Food).
2. At least one gameplay event is driven by real NASA space weather data (DONKI CME/solar flare) and labeled LIVE or CURATED.
3. M.I.L.O. answers in-game questions in <= 3 short, encouraging sentences at a 7–12 reading level.
4. Non-punitive, positive educational failure: system breakdowns trigger diagnostic debriefs explaining the underlying NASA science and offering recovery paths.
5. The game is **100% playable offline** without requiring external AI or internet connectivity.

## Core User Flow
1. **Prologue / Story Intro**: Touchdown at Shackleton Rim, meet the crew and M.I.L.O.
2. **First Light**: Place solar arrays, connect power cables to the oxygen electrolyzer, resolve electrical and life support challenges.
3. **The Long Night**: Manage lunar night storage, battery depth-of-discharge, and power load-shedding priorities.
4. **The Invisible Threat**: Respond to NASA DONKI solar storm warning, bury habitats with lunar regolith, shelter crew in the subterranean vault.
5. **Growing Beyond Earth & Sustainable Expansion**: Extract water ice, run hydroponic plant growth, harvest food for crew morale.
6. **Graduation Debrief**: Final mission debrief, survivability score, and creative sandbox mode.

## Boundaries & Ownership
- **Web Game Client (`game/`)**: Web Game application (TypeScript + Vite + Three.js / Canvas 2D + DOM HUD). Owns simulation, viewport rendering, audio, and all UI.
- **AI Service (`ai-service/` — Ibrahim)**: Evaluator, expert system, NASA data layer, statistics, and story validator.
- **Story (`story/`)**: Story bible and dialogue scripts shared across the project.
- **Context (`context/`)**: Architecture, contracts, design rules, and progress tracking.

## Scope
### In Scope
- Lunar South Pole setting.
- Core resources: Power, Stored O₂, Water, Food, Shielding/Radiation, Thermal.
- Visual Novel story theater with branching dialogue choices and character portraits.
- Real NASA DONKI, RadLab, and OSDR data integration with curated offline fallbacks.
- 100% offline standalone playability with bundled deterministic fallbacks.

### Out of Scope
- Runtime generative LLMs (expert system + deterministic rules for 100% reliability and speed).
- Multiplayer, cloud user accounts.
- Punitive permadeath or violent failure states.
