# Progress Tracker — Beyond Earth: First Light

Update after every meaningful change (only your own unit/row).

## Current Phase
- Integrating Web Game Client with Contract v2, Story Bible narrative data, and Lunar Outpost Equipment Specification.

## Completed
### AI Service (Units 01-07)
- **Unit 01**: Skeleton + Mocks (v1).
- **Unit 02**: Contract v2 migration (expert system, explanations, questions/answer models).
- **Unit 03**: Deterministic Evaluator (`app/evaluator/`).
- **Unit 04**: NASA Data Layer (DONKI space weather + cache + curated fallback).
- **Unit 04b**: OSDR Metadata pipeline.
- **Unit 05**: Expert System (`app/expert/`) with question catalog and rule engine.
- **Unit 06**: Story Bible Validator (`scripts/validate_story.py`) and schema.
- **Unit 07**: Statistics and Debrief Analysis (`app/stats/`).

### Web Game Client (`game/`)
- **Git Sync & Main Merge**: Merged `origin/main` into `OUAZENE-2026/initial-setup`, resolved all contract v2 and shared documentation conflicts, and pushed to remote (`1541656`, `0c61eee`).
- **3D Lunar Ground Texture (Zero-Horizon Invariant)**: Integrated Three.js `Ground3DRenderer.ts` rendering authentic 4K textures (`moon_01_diff_4k.jpg`, `moon_01_disp_4k.png`) with grazing lunar polar sun lighting. Mathematically constrained camera and dynamic centering ensure NO horizon line, dark outer void, or ground plane boundaries are ever visible.
- **Full Story Integration (`story/samples/`)**: Integrated all 14 campaign scenes (`S-PRO-1` through `S-EPI-2`) into `StoryData.ts` with characters (Captain Leo Ruiz, Amir, Nia, Daniel, MILO, Narrator), moods, SFX, and interactive branching choices.
- **Pre-Built Base System & Dual Mode Selector**:
  - Implemented `loadPrebuiltBase()` and `clearBaseForScratch()` in `SimulationEngine.ts`. At startup, player immediately sees a complete reference base featuring all 12 machines + habitat connected by power cables, generating 160 kW with 850 kWh storage and active life-support loops.
  - Replaced the objectives section in the right HUD panel with two interactive mode buttons: **"Start building my own base"** (clears grid, grants 1400 materials, and provides an open sandbox without restrictions) and **"Start by pre-built base"** (restores full base and plays guided tour).
  - Authored comprehensive in-character systems guide in `dialogue.json` (`S-BASE-TOUR`) where M.I.L.O., Captain Leo, Amir, Daniel, and Nia tour the base, teaching the player about each component, its operational role, and its importance to keeping the astronauts alive.
- **Interactive Guided Power Tutorial & HUD Focus System**:
  - Replaced legacy prologue conversation with streamlined, punchy dialogue focused strictly on base survival and establishing power.
  - Implemented `TutorialManager.ts` state machine: highlights Solar Array catalog button ➔ Spot 1 on Moon `(10, 7)` ➔ Spot 2 on Moon `(12, 7)` ➔ Cable button ➔ Spot between `(11, 7)`.
  - Removed pre-placed building at start so the map begins completely clean.
  - Implemented auto-scroll: Catalog panel smoothly scrolls directly to the highlighted button (`block: 'center'`), and the camera auto-scrolls and centers on the active Moon beacon tile (`focusTile`).
  - Enforced strict grid placement restriction: during tutorial, clicks on non-highlighted tiles are rejected with friendly guidance feedback.
  - Implemented dynamic 3D Moon surface holographic beacon rings in `ViewportRenderer.ts` with floating labels and restriction warning reticles.
  - Implemented HUD metric focus mode: hides Oxygen, Water, Shield, Health, and Morale metrics during the onboarding phase, spotlighting the Power bar until $+40\text{ kW}$ connection completes.
- **14 Canonical Timeline Events & Story Crises (`MissionManager.ts`)**:
  - Implemented all 14 timeline events (`E-LANDING` through `E-MARS-TRANSMISSION`) triggered by exact Sol and hour.
  - Wired simulation crisis states: primary cryo-valve fracture leak (`E-O2-VALVE-FRACTURE`), 48-hour mountain shadow eclipse with -180°C freeze (`E-LONG-NIGHT-START`, `E-BATTERY-FREEZE`), NASA DONKI CME X-class flare and storm vault evacuation (`E-SOLAR-FLARE`, `E-RADIATION-IMPACT`), ration depletion & ice extraction (`E-RATIONS-LOW`, `E-HYDROPONICS`), and compound moonquake catastrophe with Leo rescue (`E-CATASTROPHE`, `E-RESCUE`).
  - Corrected `MissionManager` dependency injection in `main.ts` (`simulation` + `narrative`), eliminated double-firing prologue race conditions, and updated debrief payload fields.
- **Accurate Lunar Day Cycle & Solar Azimuth Engine**:
  - Added 3 switchable day modes: `shackleton_polar` (canonical 86% grazing sun at 89.9°S with 360° azimuth over 708h + 48h Sol 7-8 eclipse), `lunar_synodic` (29.5-day synodic month), and `compressed_24h` (12h Day / 12h Night).
  - Wired day/night atmospheric lighting to `ViewportRenderer.ts`: dynamic low-angle polar shadows rotating with the sun azimuth, deep lunar night darkness overlay (`rgba(4, 7, 18, 0.72)`), and glowing radial warmth halos around powered habitat modules and windows.
- **Equipment & Machine Specification & Full 18-Variable Telemetry Engine**:
  - Implemented complete 12-machine catalogue with exact materials costs, priorities (P1, P2, P3), and production/consumption rates.
  - Implemented strict 7-step evaluation order per tick (§6.1): Clock (`is_daylight`) ➔ Solar Generation (`max_power_per_sol * (1 - dust)`) ➔ Habitat Baseline Load (14 kW / 10 kW / 2 kW / 0 kW) ➔ Machine Demand & Priority Allocation (P1/P2/P3 with lockouts <25, <20, ==0) ➔ Scaled Outputs & `time` Block Drains ➔ Consequence Thresholds ➔ Clamping all 18 gauges to 0-100.
  - Temporarily disabled dialogue popups from startup and mode selection (`isDialogueEnabled = false`) so gameplay and telemetry inspection remain uninterrupted.
  - Built a dedicated "OUTPOST TELEMETRY [18 VARS]" monitor in the right panel with interactive tab switcher, live values, color-coded threshold status (`normal`, `warning`, `critical`), dynamic progress tracks, and per-hour net rate indicators.
  - Wired all 18 variables (`power`, `stored_o2`, `oxygen`, `co2`, `temperature`, `pressure`, `water`, `food`, `food_growth`, `radiation`, `radiation_protection`, `shield`, `dust`, `light_cycle`, `saturation`, `quenching`, `enthusiasm`, `health`) to real-time HUD data bindings.
  - Implemented all 9 crew operations: `eat`, `drink`, `clean`, `reshield`, `farm`, `harvast`, `toggleShelter`, `demandEarthOxygenResupply`, `demandEarthWaterResupply`.
  - Added dedicated high-detail building rendering for Emergency O₂ Generator, Water Recycling System, Heating System, and Earth Connection Channel.
  - Added interactive Crew Operations panel in `CatalogPanel.ts` and `main.ts`.
  - Tripled Solar Array generation rating from 20 kW to 60 kW per unit (`BUILDING_DEFINITIONS.solar_array.powerGenerationKw = 60`), scaling outpost generation capacity (e.g. 8 panels = 480 kW in sunlight).
  - Adjusted lunar regolith dust accumulation rate to +0.5% per tick (`this.state.dust += 0.5 * deltaHours`), giving panels a gentler degradation curve and updating telemetry formatting to 1 decimal place.
- **Manual Device ON/OFF Power Switches & Interactive Switchboard (§1.1 A6)**:
  - Extended `PlacedBuilding` with `isEnabled?: boolean;` (defaults to true).
  - Implemented `toggleDevicePower(x, y)` and `setDeviceEnabled(id, isEnabled)` in `SimulationEngine.ts`. Switched-off machines stop consuming electrical power, producing resources, and contributing to load/generation.
  - Added visual in-game feedback on the lunar surface: machines toggled OFF display a dimmed status LED beacon (`#64748b`) and an unambiguous `[OFF]` pill badge over the module.
  - Hovering over switchable machines displays floating viewport prompts: `⚡ Click to Turn ON` / `⚪ Click to Turn OFF`. Clicking a module toggles it immediately with audio and toast notification.
  - Added interactive "DEVICE SWITCHES" switchboard in the left panel displaying live device counts (`N / Total ON`), module names, coordinates, power generation/consumption ratings, camera focus links, and toggle buttons (`[ON]` / `[OFF]`). Automatically syncs on placement, demolition, mode change, and toggling.
- **Atmospheric Oxygen Dynamics, Scrubber Independence & Incident Conditions**:
  - Configured CO₂ Scrubber so it does **not** shut down automatically when power drops or batteries exhaust; it continues scrubbing as long as enabled (`isEnabled !== false`), requiring explicit manual shutoff by the player.
  - Normalized cabin atmospheric oxygen (`state.oxygen`) to **20.0%** (nominal Earth/ISS partial pressure ratio).
  - Wired atmospheric oxygen dynamics: cabin oxygen increases while unregulated or when oxygen generators pump into the habitat until the machine (scrubber/regulator) is turned ON to regulate it back to 20%, or until oxygen stock (`stored_o2`) runs out (`stored_o2 <= 0`), in which case atmospheric oxygen begins depleting due to crew respiration.
  - Added High Oxygen Warning: triggers a warning alert when cabin oxygen exceeds **22%** (elevated flammability danger).
  - Added Flash Fire Catastrophe Incident: if cabin oxygen exceeds **25%** while habitat temperature is elevated (> **55°** / nominal 50°), a catastrophic cabin flash fire (Apollo 1 class incident) is triggered, resulting in immediate mission failure (`health = 0`).
- **Hover Component Names**: Hovering any tile with a component on the lunar map shows a floating tooltip with the component's name (from `BUILDING_DEFINITIONS`) plus a context line: ON/OFF prompt for machines, "Passive structure" for the Regolith Shield, powered/unpowered state for cables, and "Click to Demolish" in demolish mode (`ViewportRenderer.drawHoverLabel`).
- **Lunar Synodic Cycle (15d Day / 15d Night, 4h Tick), Electrolyzer Hysteresis, Thermal Control & Display Refinement**:
  - Calibrated daylight cycle to **15 Sols Daylight and 15 Sols Night** (30-day lunar synodic month, 720h) with simulation advancement step of **1 Tick = 4 Hours**.
  - Configured Oxygen Electrolyzer so it **does not shut down at night**; it operates continuously day and night as long as enabled (`isEnabled !== false`) and supplied with water.
  - Implemented automatic Oxygen Electrolyzer atmospheric emission hysteresis loop: when cabin oxygen reaches **$\ge 22\%$**, emission into the room atmosphere is paused (diverting all produced O₂ into storage tanks); when cabin oxygen drops to **$\le 19\%$**, atmospheric emission automatically resumes.
  - Fixed power display in daylight: solar generation now smoothly and visibly varies with the sun elevation angle across the 15 days of day, and the top bar capsule and telemetry monitor dynamically show live generation, net surplus/deficit, and battery charge rather than pegging to static constants.
  - Thermal maintenance strictly handled by the Heating System: removed artificial baseline auto-heating so that if the heating system is switched OFF or unpowered, temperature is immediately affected and continuously drops into freezing conditions.
  - Removed `pressure` from the telemetry HUD display and index markup.

## Next Steps / Handover State
1. Web Game Client is fully built (`npm --prefix game run build` exits 0) and synced with remote branch `OUAZENE-2026/initial-setup`.
2. All 14 story events and crises are wired into `MissionManager.ts` and verified against `story/samples/story-bible.json` (`validate_story.py` passes).
3. Day cycle renders dynamic rotating polar shadows in daylight and realistic habitat window glows during lunar night/shadow.
4. Next AI can focus on:
   - Polishing Visual Novel character art assets if custom PNG portraits are provided (currently using stylized vector fallback avatars).
   - Adding audio sound effects for the newly added crisis alerts (cryo-valve alarm, moonquake rumble, CME siren).
   - Tuning difficulty balance if the player finds the 48-hour shadow or CME response timing too fast/slow.

## Unit Ownership
| Unit | Owner | Branch | Status |
|---|---|---|---|
| 01 skeleton + mocks (v1) | Ibrahim | feat/ai-01-skeleton | in verification |
| 02 contract v2 migration | Ibrahim | feat/ai-02-contract-v2 | completed |
| 03 deterministic evaluator | Ibrahim | feat/ai-03-deterministic-evaluator | completed |
| 04b OSDR metadata pipeline | Ibrahim | feat/ai-04b-osdr-pipeline | partial corpus; review pending |
| 04 NASA data layer | Ibrahim | feat/ai-04-nasa-data-layer | completed |
| 05 expert system | Ibrahim | feat/ai-05-expert-system | completed |
| 06 story validator | Ibrahim | feat/ai-06-story-bible | completed |
| 07 statistics | Ibrahim | feat/ai-07-statistics | completed |
| Web Game Client & Story | Game Devs | OUAZENE-2026/initial-setup | active |
