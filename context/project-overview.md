# Beyond Earth: First Light — Junior Astronaut Mission Trainer

> **Full Narrative & Spoken Script:** See the complete story bible, character sheets, and all dialogue in [context/story-bible.md](file:///C:/Users/acer%20i7/Programation/2026/NASA%20-%20OutPost/context/story-bible.md).

## Overview
A 2D top-down pixel-art colony builder and network simulation for kids aged 7–12 (NASA Space Apps Challenge 2026: "Build a Junior Astronaut Mission Trainer"). The player takes on the role of Junior Mission Commander directing an expedition of four astronauts and their AI companion, **M.I.L.O.** (*Mission Intelligence & Logistics Operator*), at the Lunar South Pole (Shackleton Crater Rim).

The game combines physical network simulation (power grids, life support conduits, thermal balance, water recycling) with an authored 5-chapter story campaign. Every choice and spatial placement carries real scientific trade-offs grounded in authentic NASA (DONKI, RadLab, OSDR) and CSA data.

A decoupled Python FastAPI service (`ai-service/`) provides an intelligent Mission Control advisor (M.I.L.O.), live space weather telemetry, deterministic construction/decision evaluations, and comprehensive educational mission debriefs.

## Goals
1. Player experiences authentic space survival trade-offs (Power, Oxygen, Thermal, Radiation Shielding, Water, Food).
2. At least one gameplay event is driven by real NASA space weather data (DONKI CME/solar flare) and labeled LIVE or CURATED.
3. M.I.L.O. answers in-game questions in <= 3 short, encouraging sentences at a 7–12 reading level.
4. Non-punitive, positive educational failure: system breakdowns trigger diagnostic debriefs explaining the underlying NASA science and offering recovery paths.
5. The game is **100% playable offline** without requiring external AI or internet connectivity.

## Core User Flow
1. **Prologue**: Touchdown at Shackleton Rim, establish comms, meet the 4-astronaut crew and M.I.L.O.
2. **Chapter 1 ("First Light")**: Deploy solar arrays, connect power cables to the oxygen electrolyzer, resolve first electrical fault.
3. **Chapter 2 ("The Long Night")**: Manage 48-hour lunar night, battery depth-of-discharge, and power load-shedding priorities.
4. **Chapter 3 ("The Invisible Threat")**: Respond to NASA DONKI solar storm warning, bury habitats with lunar regolith, shelter crew in the subterranean vault.
5. **Chapter 4 ("Growing Beyond Earth")**: Extract ice water, run CSA hydroponic plant growth (Outredgeous lettuce), harvest food for crew morale.
6. **Chapter 5 ("A Home Among the Stars")**: Handle compound hazards (shadow + life-support spike), expand the base to full sustainability, graduate.
7. **Epilogue & Sandbox Mode**: Graduation ceremony, post-credits Mars mission teaser, unlockable creative sandbox mode.

## Features & Ownership
### Game Client (`game/` — Game Team)
- 2D top-down pixel-art viewport with free camera pan/zoom and recenter controls.
- Three decoupled client engines:
  - **Narrative Manager**: Dialogue UI, character portraits (Elena, Amir, Nia, Daniel, M.I.L.O.), chapter scripts, ambient banter.
  - **Simulation Engine**: Grid tilemap, building placement, cable/pipe networks, continuous rate calculations (kW, kg/h, L).
  - **Mission Manager**: Objectives, failure diagnostics, chapter progression, offline fallback engine.
- Responsive HUD layout: Top bar (resources/time), Left panel (structure catalog), Right panel (M.I.L.O. chat & radar), Bottom bar (speed/controls).

### AI Service (`ai-service/` — Ibrahim)
- `/v1/health`: Service health and provider status.
- `/v1/space-weather`: Real or curated NASA DONKI solar flare/CME alerts.
- `/v1/assistant/chat`: M.I.L.O. kid-friendly prompt engine with local fallback.
- `/v1/evaluate/decision`: Deterministic scoring of building placement, grid connectivity, and trade-offs.
- `/v1/evaluate/mission`: Comprehensive mission debrief scoring (survivability, efficiency, sustainability, lessons).

## Scope
### In Scope
- Lunar South Pole (Shackleton Crater Rim) setting.
- 5-Chapter linear story campaign + Prologue + Epilogue + Sandbox Mode.
- 4 named astronauts: Capt. Elena Ruiz, Amir Haddad, Dr. Nia Okafor, Dr. Daniel Park.
- M.I.L.O. AI companion.
- Real NASA DONKI, RadLab, OSDR, and CSA data integration.
- 100% offline standalone playability with bundled deterministic fallbacks.

### Out of Scope
- Playable Mars surface in v1 (Mars is strictly a narrative post-credits teaser).
- 3D graphics or realistic photorealism (100% 2D pixel art).
- Multiplayer, user accounts, cloud database persistence.
- Punitive permadeath or violent failure states.
- Any direct AI control over authoritative game simulation state.

## Success Criteria
1. A child aged 7–12 can independently play through the Prologue and Chapter 1 without external instructions.
2. The entire game remains fully playable if the internet or AI service is disconnected.
3. Evaluator scores and mission debriefs are deterministic, reproducible, and scientifically grounded.
4. All NASA and CSA data sources are visibly credited in-game with badges distinguishing LIVE from CURATED data.
5. System failures empower the child with curiosity and knowledge to retry and succeed.
