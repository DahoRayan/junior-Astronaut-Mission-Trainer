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
- **Right Panel Navigation & Slim Power Cable Redesign**:
  - **Full-Height Right Panel Navigation Tabs**:
    - Reorganized `#right-panel` into 3 dedicated top navigation tabs: `🎯 GOALS` (base objectives, mode selector & DONKI radar), `📊 ALL VARS (18)` (comprehensive telemetry), and `🤖 M.I.L.O. (67)` (NASA Expert Knowledge Base).
    - Removed cramped static sections above the tabs; selecting `🤖 M.I.L.O. (67)` now grants 100% of the vertical panel height to the knowledge base, allowing kids to smoothly search, filter, and scroll all 67 questions and answers without restriction.
    - Updated `HUDController.ts` with `selectRightTab()` handling switching between `'objectives' \| 'telemetry' \| 'milo'`.
  - **Slim, Sleek Power Cable Visual Redesign**:
    - Redesigned power cables to look smaller, sleeker, and well-proportioned: reduced conduit outer jacket from 8px to 3.5px and inner core from 5px to 1.8px.
    - Scaled down the center junction terminal node in `BuildingRenderer.ts` from 14px radius (28px diameter) to a compact, sleek 4.5px radius terminal pad with a 2.5px glowing diode and subtle ambient halo.
    - Slimmed ghost preview lines down to 2px, giving clean and non-obtrusive placement feedback on the lunar surface.
- **Top Bar Overflow & Layout Fix**:
  - Fixed severe overflow and height blowup on `#top-bar`: locked header height to a strict 52px (`height: 52px; max-height: 52px; overflow: hidden; white-space: nowrap`) preventing vertical flex wrapping that pushed the viewport and sidebar out of view.
  - Eliminated redundant buttons from the top bar (`btn-toggle-telemetry` and `btn-toggle-expert`) which duplicated the prominent right sidebar tabs and consumed over 280px.
  - Compacted top-bar telemetry chips from 135px minimum width down to responsive, high-signal capsules (power: `850 kWh (+40 kW)`, oxygen: `100 kg (+0.5/h)`, water: `600 L`, shield: `90%`, crew hp: `100%`, morale: `95%`), moving full narrative text to hover tooltips (`title`).
  - Shortened cycle badge text from verbose strings (`☀️ Moon Day (Sol 1/30 · Day 1/15)`) to clean, legible phase badges (`☀️ Day 1/15`, `🌑 Night 1/15`) and standardized Sol indicator (`Sol 1/30`).
  - Total top bar width reduced from >2,000px down to ~1,220px, fitting comfortably on any resolution or display scaling with zero horizontal/vertical layout distortion.
- **Power Cable Visuals Overhaul & NASA M.I.L.O. Expert System Integration**:
  - **Cable Visual Continuity & Junction Terminals**:
    - Resolved cable disappearance bug when hovering or laying cables: added dedicated `power_cable` ghost preview in `ViewportRenderer.ts` with real-time snapping dashed conduits and glowing terminal hubs instead of falling back to generic building cubes.
    - Extended conduit line reach (`reach = neighbor.building ? TILE_SIZE * 0.85 : TILE_SIZE / 2`) so cables seamlessly connect directly into building foundations rather than stopping abruptly at tile boundaries.
    - Added high-tech ground junction terminal rendering in `BuildingRenderer.ts` (`drawPowerJunction`) with an octagonal mounting base, 4 directional couplers (N, S, E, W), heavy conduit housing, and a glowing energy core diode (cyan when powered, vibrant warm amber when unpowered).
    - Upgraded conduit aesthetics with 8px heavy dark casing, 5px conductive neon core, and animated dashed plasma particle flow pulsing when energized.
  - **M.I.L.O. NASA Expert System (100% Offline Local Knowledge Base)**:
    - Integrated `expert_questions.json` (67 verified NASA questions, 10 categories: Radiation & Shielding, Oxygen & Air, Power & Energy, Space Weather, Life Support, Moon Mission, Mars Mission, Crew Health, Thermal, Mission Strategy).
    - Implemented context-aware trigger engine (`getActiveTriggers`) evaluating live telemetry (`oxygen_low`, `power_low`, `shielding_low`, `multiple_low`, `event_solar_flare`, `event_cme`, etc.) to automatically surface and badge relevant questions with `⭐ Recommended`.
    - Added category selector pills with live count badges, instant fuzzy text search (<1ms local filter across questions, answers, tags, and citations), and collapsible card accordions.
    - Added **🔬 Science Corner** NASA citation block on each question displaying the verified NASA data source (e.g., OSDR RadLab CRaTER, DONKI, ECLSS) and direct clickable link (`source_url`).
    - Added HUD header shortcut (`🤖 Mission Expert`) and live M.I.L.O. advisor bubble linking narrative recommendations directly to the 67 scientific topics.
    - Zero TypeScript compiler errors on `npm --prefix game run build`. Verified with `game/scripts/verify_cables_and_expert.ts`.
- **Crew Operations Removal & Highlight Guide Glitch Fix**:
  - Removed obsolete Crew Operations UI panel (`btn-crew-eat`, `btn-crew-drink`, `btn-crew-clean`, etc.) from `index.html` and unhooked listeners in `main.ts` for a cleaner, decluttered interface.
  - Eliminated rapid strobing/glitching on lunar surface beacon: reduced frequency from 800 Hz (`sin(time * 5)`) to a smooth 0.5 Hz pulse (`sin(time * 0.003)`).
  - Fixed catalog highlight flickering: removed `transform: scale(1.04)` from `pulse-tutorial-btn` animation to prevent flex container reflows and scrollbar popping.
  - Added duplicate highlight suppression in `CatalogPanel.ts` (`currentHighlightedType`), preventing continuous DOM class mutations and repeated auto-scrolling.
  - Prevented camera snapping loops in `main.ts` by tracking `lastPannedStep` so the viewport only pans on actual step progression or deliberate user clicks.
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
- **Startup "Build My Own Base" Construction Mode & Step-by-Step Guided Highlights**:
  - Configured app to start cleanly in **"Build My Own Base"** mode with 1400 materials on pristine lunar regolith, eliminating unwanted pre-built clutter while allowing instant switching to pre-built reference base.
  - Designed interactive **6-Milestone Base Establishment Guide** (Solar Power ➔ Night Battery Storage ➔ Power Cable Conduit ➔ Crew Habitat ➔ Life Support Electrolyzer ➔ Thermal Heating System) ensuring outpost survives the 30 Earth days lunar cycle.
  - Architected an orthogonally connected micro-grid layout: Solar Array (9,4) connects via Power Cable (9,5) to Battery Bank (9,6) and Crew Habitat (9,7), flanked by Oxygen Electrolyzer (8,7) and Heating System (10,7), ensuring all 5 machines are 100% powered with 0 kW deficits and 150 kWh storage for the 15-day lunar night.
  - Added programmatic module auto-selection (`catalog.selectTool()`) and canvas beacon activation: clicking a target beacon on lunar regolith automatically selects the required tool, and completing milestones smoothly advances selection to the next tool.
  - Removed restrictive `pointer-events: none` on dimmed catalog buttons, granting players complete building autonomy while keeping gold pulse highlights visible.
  - Fixed cable hover reticle preview in `ViewportRenderer.ts`, fixed negative Sol night calculation in HUD telemetry, and added automated test script `verify_tutorial_and_cycle.ts`.
  - Added dedicated **Guided Mission Banner** (`#guide-banner`) atop the viewport with live step tags, clear actionable instructions, click-to-focus interactivity, and a toggle button (`💡 Guide: ON / OFF`).
  - Added real-time **Objectives Checklist** (`#mission-objectives-list`) in the right panel with interactive item click-to-focus and status indicators (`✓` completed, `▶` active, `○` pending).
  - Standardized HUD Moon Day badge (`☀️ Moon Day (Sol 1/30 · Day 1/15)` / `🌑 Moon Night (Sol 16/30 · Night 1/15)`) with detailed tooltips explaining the 30 Earth-day cycle.

### 3D Frontend (`frontend-3d/`)
- **4K Moon Texture & Terrain Displacement**:
  - Ingested 4K diffuse (`moon_01_diff_4k.jpg`) and displacement (`moon_01_disp_4k.png`) maps extracted from `moon_01_4k.blend.zip` into `frontend-3d/public/textures/`.
  - Configured `TerrainManager.ts` with 16x repeat texture mapping, PBR roughness/bump relief, and pure white reflectance (`0xffffff`) for authentic high-contrast lunar regolith.
- **Lighting Overhaul ("Too Dark" Resolution)**:
  - Boosted direct solar directional light intensity to 7.0 with PCF soft shadows.
  - Boosted high-elevation sunward fill light to 5.2 at 45° angle to brightly illuminate horizontal regolith and habitat roofs.
  - Boosted opposing bounce fill light to 3.2 and day ambient hemisphere light to 2.20 (`0xdbeafe` / `0x94a3b8`).
  - Enhanced nocturnal illumination: Earthshine fill boosted to 3.8 max intensity, night ambient doubled to 1.40, and wide floodlights calibrated to 10.0 intensity over 320m radius.
  - Calibrated WebGLRenderer tone mapping exposure to 2.20 for vivid, eye-friendly visibility across both day and night phases.
- **Kid-Friendly 3D Moon City Builder & Comprehensive Review Overhaul**:
  - Implemented `BuildingCatalog.ts` defining 25 kid-friendly moon colony structures across 5 categories (Habitats, Power, Farms/O2, Spaceport, Rovers) mapped to local GLB models with clear tangible benefits and emoji badges.
  - Added authentic connecting corridors and facilities: Straight Corridor Tunnel, 90° Curved Corner Tunnel, 3-Way T-Junction Hub, Dust-Lock Airlock Vestibule, Cryogenic Fuel Depot, Falcon Cargo Lander, and Pressurised Expedition Rover.
  - Built `CityBuilder.ts` with raycasted terrain tracking, 4-metre grid snapping, glowing reticle (emerald valid / coral blocked), semi-transparent 3D ghost preview with 'R' key rotation, instant placement, and placement sparkle effects.
  - Resolved pointer drag-vs-click conflict: separated camera orbit navigation from placement clicks using a 6px drag threshold, and wired right-click for instant kid-friendly tool cancellation.
  - Protected starter base core zone (`r < 8m`) against overlapping mesh clipping with in-character M.I.L.O. guidance.
  - Connected `SimulationEngine.ts` to building production: dynamic solar kW generation, 24/7 continuous Kilopower nuclear reactor power, battery storage container capacity scaling, greenhouse food growth, water extraction, oxygen skids, and mining revenue.
  - Implemented Bulldoze / Recycle tool ('B' key) with 70% materials refund and audio feedback.
  - Integrated `SoundSystem.ts`: zero-dependency Web Audio API procedural synthesizer for placement chimes, demolish sweeps, clicks, and milestone fanfares.
  - Upgraded `HUDController.ts`: Top glowing resource capsules (Materials 🧱, Power ⚡, Crew 🧑‍🚀, Food 🥕, Water 💧, O2 🫧, Morale 😊), bottom building dock, M.I.L.O. speech bubble guide, and milestone achievement toasts (+bonus materials).
  - Eliminated UI overlapping: repositioned M.I.L.O. bubble safely above the dock, added collapsible panel toggles (`[📊 Vitals]`, `[🕹️ Rovers]`, `[─ Minimise Dock]`, and dismissible M.I.L.O. bubble) for full-screen 3D exploration.
  - Aligned fail-safe messaging with `context/game-design.md`: replaced morbid casualty alerts with encouraging mission debriefs.
  - Calibrated balanced lighting: direct sunlight (3.8), sunward fill (2.4 at 40° elevation), opposing bounce (1.2), ambient (0.95 day / 0.55 night), earthshine (1.2), and tone mapping exposure (1.35) eliminating overexposure clipping while ensuring brilliant visibility.
  - All 126/126 automated tests passing across 32 suites; production Vite build completes in ~1.4s with 0 errors.
- **Astronauts Movement, Navigation Freedom, Canonical Anomalies & UI Redesign**:
  - Implemented `AstronautManager.ts` managing Artemis astronauts (Cmdr. Sarah Glenn, Dr. Leo Ruiz, Eng. Maya Lin) with authentic lunar 1/6th-g bunny hop kinematics ($y = |\sin(\text{phase})| \cdot 0.38\text{m}$), waypoint patrols between base modules, and vault evacuation.
  - Implemented `MissionDecisionManager.ts` loading all 5 canonical anomalies from `anomalies.json` (Oxygen Leak, Solar Storm, Long Lunar Night, Lunar Dust on Solar Panels, Water Electrolyzer Failure), each featuring 3 kid-friendly decision choices that directly affect simulation resources, crew morale, and mission success score (0-100%). Paced cleanly with minimum 2.5-sol interval to avoid spam.
  - Restructured `NarrativeManager.ts` to minimize disruptive dialog popups: only the initial arrival dialog displays automatically; subsequent timeline milestones trigger as non-intrusive radio transmission toasts without pausing the simulation.
  - Expanded `CameraController.ts` with free-flight keyboard navigation (WASD/Arrows to pan across crater, Shift to sprint, Q/E to orbit), extended zoom range [3.0m, 280.0m], and entity focus transitions (`focusOn`).
  - Redesigned HUD layout to eliminate overlapping: centered bottom dock with max-width 860px (leaving sides clear), repositioned M.I.L.O. speech bubble without panel collisions, integrated time scrubber slider and speed multipliers directly into dock header.
  - Solved deselection across the entire game: clicking an active building card again toggles it off, Escape key and right-click deselect immediately, clicking empty ground deselects, and added explicit close buttons to Inspector cards.
  - Added interactive 3D Inspector card giving meaning, kid-friendly descriptions, real-time stats, camera focus, and recycle actions for placed buildings and astronauts.
  - All 137/137 tests passing across 36 test suites; clean production build with Vite.

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
