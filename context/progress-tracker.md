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

### 3D Lunar Frontend (`frontend-3d/`)
- **Red Alert Removal & Non-Alarming Incident Experience**:
  - Permanently suppressed the prominent red emergency crisis banner (`#hud-crisis-banner` / `crisisBannerEl`) from appearing during gameplay in `HUDController.ts`.
  - Replaced the jarring red gradient (`rgba(220, 38, 38, 0.96)`) and pulsing red alert animation (`kid-alert-pulse`) with clean simulation updates, leaving the 48-hour valve fracture countdown in the backend simulation engine while preventing alarming visual alerts.
  - Normalized M.I.L.O. speech bubble placement to a clean, stable `top: 96px`, eliminating jumping offsets previously used to dodge the red banner.
  - Re-styled the incident decision modal (`#hud-incident-modal`): updated header from `🚨 M.I.L.O. MISSION BUDDY ALERT!` to `🛰️ M.I.L.O. MISSION ADVISORY` and swapped red hazard callouts (`#ef4444`) with friendly, kid-approachable arcade space-gold borders and soft amber badges (`#f59e0b`).
  - Removed unused TypeScript references to achieve clean zero-warning builds with `tsc && vite build`. All 155 unit, boundary, and scenario tests pass cleanly.

### Web Game Client (`game/`)
- **Level 3 Timed Solar Storm Anomaly (3s Post-Vault)**:
  - Configured Level 3 (Chapter 3) in `MissionManager.ts` so that constructing the Subterranean Storm Vault (`subterranean_vault`) automatically starts a 3-second countdown timer.
  - When the 3-second timer expires, `MissionManager` triggers an emergency alarm, streams a NASA DONKI alert banner, and emits `trigger_anomaly` for `solar_storm`.
  - Wired `AnomalyManager.ts` to listen to `trigger_anomaly` events, immediately launching the Solar Storm incident modal, returning simulation speed to 1x, and applying coronal mass ejection (CME) crisis impacts (+45 rem radiation spike, -15% shield loss).
  - Configured `AnomalyManager.ts` to emit `anomaly_resolved` upon choice execution, automatically marking the Level 3 `shelter_cme` objective completed when the player resolves the solar storm dilemma (or activates storm shelter).
  - Created automated verification test suite `game/scripts/verify_level3_vault_solar_storm.ts` confirming that vault placement completes the vault objective, does not fire prematurely at 1.0s, triggers the solar storm at 3.0s, and completes the storm objective upon resolution.
- **Level Completion Trigger Unification & Modal Popup Fix**:
  - Resolved root cause of level completion popup failure:
    - Previously, `TutorialManager` had 6 base-building milestones that rendered into `#mission-objectives-list`, while `MissionManager` had a disconnected set of 4 objectives (including unprompted `demand_resupply` requiring `earth_channel`), leaving Level 1 in a permanent incomplete state even after all 6 visible milestones were checked off.
    - Unified Chapter 1 (Level 1) objectives in `MissionManager.ts` to directly map to the 6 essential base establishment modules: Solar Array, Battery Bank, Power Cable, Crew Living Quarters, Life Support, and Heating System.
    - Wired `tutorial_complete` event listener to immediately complete Chapter 1 and call `completeLevel()`.
    - Updated `main.ts` to synchronize `#guide-banner` dynamically across all chapters (Levels 1–6) and delegate `#mission-objectives-list` rendering to `MissionManager` when advancing beyond Level 1.
    - Updated `AIClient.ts` to send Contract v2-compliant evaluation payload to `POST /v1/evaluate/mission`, avoiding HTTP 422 errors and providing instant (<20ms) server-backed or local debrief generation.
    - Enhanced `DebriefModal.ts` and `style.css` to enforce `display: flex;` and `z-index: 250;` on `#debrief-modal`, ensuring completion debrief certificates are never blocked, occluded, or hidden behind other DOM overlays.
    - Created automated verification test suite `game/scripts/verify_level1_natural_completion.ts` validating that placing the 6 base establishment components automatically halts simulation clock, clears surface structures except central base, and triggers the Level 1 Debrief Certificate modal.
- **Real Metric Impacts on Anomaly Choices & Immediate HUD Synchronization**:
  - Implemented `applyAnomalyCrisisImpact(anomalyId)` in `AnomalyManager.ts`:
    - When an emergency occurs, tangible system crisis penalties hit the outpost immediately before the player even picks a response:
      - **Oxygen Leak**: Drops `stored_o2` by 15 kg, `oxygen` by 6%, `enthusiasm` by 10%, and flags `oxygen_cabin_low`.
      - **Solar Storm**: Spikes ionizing `radiation` by +45 rem, damages `shield` by -15%, drops crew `enthusiasm` by 15%, and flags `radiation_high`.
      - **Lunar Dust Blanket**: Surges `dust` accumulation on arrays by +45% and flags `dust_high`.
      - **Water Electrolyzer Failure**: Vents `water` by -15 L, drops `stored_o2` by -12 kg, spikes `temperature` by +12°C (reaching 62°C), and flags `stored_o2_low`.
  - Re-engineered all 12 decision choices across the 4 canonical anomalies to enforce real resource economics and execute concrete metric shifts:
    - **Resource Validation**: Choices requiring Materials, Battery kWh, or Stored O₂ check current reserves before proceeding; if insufficient, the action fails cleanly (`success: false`) and streams an alert (`"Cannot execute choice: Insufficient materials!"`).
    - **Physical Effects**: Deducts materials/power/O2 and directly impacts pressure, temperature, dust coverage, radiation, shielding integrity, crew health, and morale.
    - **Instant HUD Recalculation**: Immediately triggers `this.sim.recalculate()`, updates legacy state aliases (`crew_health`, `crew_morale`, `power_stored`), and emits `eventBus.emit('resources_updated', this.sim.state)` so all 18 HUD telemetry gauges, top chips, and objective trackers reflect the resolution on the very next render frame.
  - Created automated test suite `game/scripts/verify_anomaly_metrics.ts` validating crisis metric drops, resource cost deductions, metric adjustments, and reactive event bus notifications.
- **Level Completion Game Pause & Surface Clear Protocol**:
  - Implemented `completeLevel()` in `MissionManager.ts` when all chapter objectives are fulfilled:
    - **Immediately stops the game clock** (`simulation.setSpeed(0)`), updating HUD speed toggles to paused.
    - Plays a celebratory fanfare audio cue (`soundManager.playFanfare()`).
    - Emits a clear level completion banner across the status log ticker (`🎉 LEVEL X COMPLETED!`).
    - Automatically clears all placed structures (solar arrays, battery banks, machines) and surface cables from the lunar surface via `simulation.clearStructuresExceptBase()`, keeping only the 4-tile Central Outpost Base firmly anchored in the center.
    - Displays the debrief modal titled `LEVEL X COMPLETED • MISSION DEBRIEF` with action button `Start Level X+1 ➜`.
  - Created automated test suite `game/scripts/verify_level_completion.ts` verifying speed halt, notification emission, structure clearance, and central base persistence.
- **Daily Materials Logistics Stipend (+100 Mats/Day)**:
  - Configured `SimulationEngine.ts` to grant **+100 Materials** on every Sol transition (`this.state.materials += 100`).
  - Added real-time notification stream (`Sol X: Daily logistics stipend received (+100 Materials granted)`) and 8-bit NASA radio chirp sound effect on day change.
  - Created automated test suite `game/scripts/verify_daily_materials.ts` confirming material progression across consecutive Sols.
- **4-Tile Central Outpost Base (0 Functions Hub)**:
  - Added the canonical permanent Central Outpost Base (`outpost_base`) occupying a $2 \times 2$ (4-tile) footprint at the exact center of the map (`(11, 7)`, `(12, 7)`, `(11, 8)`, `(12, 8)`).
  - Configured with strictly **0 functions**: 0 kW power generation, 0 kW power consumption, 0 battery capacity, 0 O₂ production, 0 water consumption/production, and 0 shielding bonus (purely structural foundational base camp).
  - Automatically pre-placed at the start of every level, scratch mode initialization, and mission restart.
  - Protected against accidental construction and demolition (cannot be overwritten or deleted).
  - Rendered with rich $96 \times 96$ px graphics in `BuildingRenderer.ts`: titanium shock-absorbing landing struts with gold foil footpads, multi-port pressurized docking vestibules, white MLI thermal insulation dome, glowing cyan cupola windows, steerable comms dish, and "ARTEMIS BASE" insignia.
  - Created automated test suite `game/scripts/verify_central_base.ts` confirming 4-tile footprint, 0 functions, demolition protection, entity deduplication, and persistence across resets.
- **1 Hour / Second Simulation Cadence & Evaluation Score Removal**:
  - Calibrated the simulation engine clock in `SimulationEngine.ts` to advance exactly 1 game hour per real-world second at 1x speed (`deltaHours = 1 * multiplier`), with 2h/s at 2x and 0h/s when paused.
  - Normalized life-support, thermal, radiation, and metabolic rates to scale smoothly per hour.
  - Removed the numerical evaluation score (`SURVIVABILITY SCORE` / `FINAL EVALUATION SCORE` / `debrief-score`) from `index.html`, `DebriefModal.ts`, and `style.css`, refocusing debriefs and incident reviews on narrative outcomes, engineering lessons, and mission strengths without arbitrary point penalties.
- **Mission Failure Debrief & Evacuation Protocol**:
  - Implemented automatic mission failure detection in `SimulationEngine.ts` when crew health drops to $\le 0$.
  - Immediately pauses the simulation (`this.setSpeed(0)`) and triggers the emergency alarm sound (`soundManager.playAlarm()`).
  - Differentiates NASA root-cause failure incidents (Apollo 1 atmospheric flash fire, complete hypoxia/O2 depletion, Apollo 13 lethal CO2 hypercapnia, lunar freezing, acute radiation sickness, severe dehydration, or calorie depletion) and provides realistic engineering lessons learned.
  - Enhanced `DebriefModal.ts` with `showFailure(data, onRestart)` displaying a dedicated emergency theme (`MISSION FAILED • OUTPOST EVACUATED`, red caution glow, evacuation protocol badge, surviving sol count, and scientific root cause analysis).
  - Wired a clean `🔄 Re-plan & Restart Mission` button that invokes `setMode('scratch')`, resetting the outpost to Sol 1 with 1,400 materials, resetting the tutorial guidance system, and resuming simulation at 1x speed without deadlocks.
  - Created automated test suite `game/scripts/verify_mission_failure.ts` validating pause on failure, tick blockage, payload emission, and clean scratch restarts.
- **NASA Canonical Anomaly Decision Events (`anomalies.json`)**:
  - Implemented `AnomalyManager.ts` featuring 4 canonical lunar events from `anomalies.json`:
    1. **Oxygen Leak**: Habitat distribution leak venting breathable gas; choice between EVA Spacewalk Repair (costs 25 Materials), Sector Isolation (reduces O2 quality), or Emergency Reserve Injection.
    2. **Solar Storm**: High-energy particle event; choice between Regolith Subterranean Shelter, Overcharging Magnetic Shielding, or Minimizing Surface Activities.
    3. **Lunar Dust on Solar Panels**: Regolith blanket reducing panel efficiency by 35%; choice between Deploying Dust Sweeper Rover (costs 20 Materials), Electrostatic Wave Pulse (costs 30 kWh Power), or Mechanical Array Tilting.
    4. **Water Electrolyzer Failure**: Catalytic membrane fouled; choice between Installing Spare Membrane (costs 30 Materials), Suspending Hydroponics Water Feed, or Thermal Descaling Flush.
    *(Note: Long Lunar Night removed from random popups per design preference, letting the ambient synodic cycle handle night transitions naturally).*
  - **Tri-Daily Anomaly Cadence & Automatic 1x Speed Reset**:
    - Strictly enforces an event trigger every 3 simple days (`sol >= 3 && sol % 3 === 0`, firing on Day 3, Day 6, Day 9, Day 12...).
    - Automatically forces simulation speed back to `1x` (`simulation.setSpeed(1)`) whenever an emergency strikes, updating the bottom HUD speed buttons so the player is not rushed by fast-forwarding during critical decisions.
    - Wired bottom bar time acceleration buttons (`0x`, `1x`, `2x`) and keyboard shortcuts (`Space`, `1`, `2`) to the reactive `speed_changed` event bus.
  - Added clean dilemma modal `#anomaly-modal` with NASA danger warnings and 3 interactive trade-off choice cards.
  - Added top bar `🚨 Event` trigger button for instant testing and manual decision drills.
  - Created automated test suite `game/scripts/verify_anomalies.ts` confirming tri-daily event cadence, speed drop to 1x on incident trigger, and decision executions.
- **Reactor Module Removal**:
  - Removed `kilopower_reactor` ("Kilopower Fission Reactor") from the game:
    - Removed from `CatalogPanel.ts` under the Energy category so it no longer appears as a buildable option.
    - Removed definitions from `Constants.ts` and `types.ts`.
    - Removed power grid simulation logic from `PowerNetwork.ts` and sprite rendering routines from `BuildingRenderer.ts`.
    - Removed device switchboard mapping from `main.ts`.
- **Notification Ticker Streaming & M.I.L.O. Knowledge Base Overhaul**:
  - **M.I.L.O. Typography & Smooth Scrolling Overhaul**:
    - Fixed card layout squishing: restructured question card headers into a distinct 2-tier layout — a top metadata row displaying category icon, category name, `⭐ RECOMMENDED` pill, and accordion chevron, above a dedicated 100% full-width multi-line question text element with `word-break: break-word` and `overflow-wrap: break-word`, preventing horizontal compression of text into narrow vertical columns.
    - Set `.expert-card` to `display: block; width: 100%; box-sizing: border-box; flex-shrink: 0;` so items never get compressed by flexbox shrink algorithms across all 67 topics.
    - Enforced `min-height: 0; flex: 1 1 0%; overflow-y: auto; overflow-x: hidden;` across `.milo-questions-list`, `.objectives-pane`, `.telemetry-grid-scroll`, and `#catalog-content`, with `flex-shrink: 0` on all fixed headers, search wrappers, and footers.
    - Added styled amber/gold custom scrollbars (`scrollbar-width: thin; scrollbar-color: ...;` and `::-webkit-scrollbar` with tracks and hoverable thumbs) ensuring scrollability is visibly intuitive and draggable in Chromium, Firefox, and WebKit.
    - Expanded right panel width from 340px to 360px for improved readability and text breathing room.
  - **Bottom Mission Log Notification Streaming**:
    - Completely removed the disruptive floating `#notification-toast` popup from the canvas viewport overlay.
    - Routed all notification events (`info`, `success`, `warning`) directly into `#ticker-message` inside the bottom bar (`#bottom-bar .status-ticker`).
    - Added ambient animated flash pulses (`flash-info`, `flash-success`, `flash-warning`) with glowing border tints that automatically revert after 5 seconds without blocking user interaction.
  - **M.I.L.O. Expert Question List & Accordion Fix**:
    - Fixed critical scroll jumping bug: eliminated full-list re-renders on accordion toggle; clicking a card now uses in-place DOM mutation (`toggleCardDOM`), preserving exact scroll position and preventing visual glitching.
    - Cleaned up cluttered question headers: removed the crammed row of 4 colored badges from the collapsed card header and introduced a streamlined top row containing the category icon, crisp question text, golden star badge (`⭐` for active situational recommendations), and rotating chevron.
    - Moved technical tags (category, difficulty, related resources) into an internal `.expert-meta-row` inside the expanded card body.
    - Removed intrusive speech bubble injection above the questions; advisor notifications now stream smoothly through the bottom mission log.
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

- **Kid-Friendly Aerospace UI Redesign (frontend-3d)**:
  - Overhauled Top Vitals Bar with playful rounded capsules (`rounded-2xl`), glowing cyan/amber borders, and large colorful icons (⚡ Power, 🌬️ Oxygen, 💧 Water, 🥦 Food, 🧱 Materials, ❤️ Crew Health, 🧑‍🚀 Crew, 😊 Morale, 🏆 Mission Rating) featuring bold numerical badges and dynamic friendly status smileys/pills (e.g. `Rich`, `Charged`, `Fresh`, `Pure`, `Yum`, `Safe`, `Happy`).
  - Redesigned City Builder Dock with bright, colorful category tabs (🏠 Homes, ⚡ Energy, 🌿 Food & Air, 🚀 Spaceport, 🚜 Rovers), rounded-2xl building cards with satisfying hover/active bounce (`.kid-arcade-btn`), price badges (`🧱 120`), and clear positive benefits.
  - Implemented unmistakable `[✕ Cancel / Deselect [Esc]]` arcade button with high-contrast red gradient styling and right-click escape hatch, alongside vivid emerald green selection highlight rings in 3D (`0x22c55e`).
  - Created dedicated Mission Sol Evaluation Screen (`#hud-sol-eval-modal`) accessible anytime via `⭐ Sol Report` button or `🏆` trophy badge, complete with dynamic 5-star rating (⭐⭐⭐⭐⭐), Outpost achievements breakdown (Power, Atmosphere, Crew Welfare, Base Expansion), and encouraging mascot feedback from M.I.L.O.
  - Revamped Telemetry Panel with friendly status smileys and pills (`[⚡ Charged]`, `[❤️ Healthy]`, `[🟢 Fresh Air]`, `[🌿 Clean]`, `[🛋️ Cozy]`, `[🛡️ Safe]`, `[🧱 Berms]`, `[✨ Clean]`, `[🚀 Outpost]`) replacing dense technical jargon while preserving underlying simulation data.
  - Enhanced M.I.L.O. Robot Assistant with floating bounce animation (`@keyframes kid-milo-bounce`), cheerful speech bubble, and collapsible toggle safely positioned to prevent screen clutter.
  - Restyled Narrative Dialogue Modal in `NarrativeManager.ts` with aerospace communication console aesthetics, character avatars (🤖, 🧑‍🚀, 🚀, 🔧, 🌿, 🩺), and tactile arcade action buttons (`Continue ▶`, `Acknowledge ✔`).
  - All 137/137 tests passing cleanly across 36 suites; production Vite build compiles in ~1.4s with 0 errors.

- **J-Astro Master Home Page & Dual Game Launcher (`index.html`)**:
  - Implemented unified landing page `index.html` titled **J-Astro** (Junior Astronaut Deep-Space Mission Trainer) with NASA Artemis mission styling.
  - Linked both games:
    1. **J-Astro 2D: Mission Control** (`game/`) — Tactical 2D grid base builder, ECLSS 18-variable telemetry, manual device switches, and M.I.L.O. 67-question NASA expert system. Direct link to `http://localhost:3000` + relative fallback `game/index.html`.
    2. **J-Astro 3D: Lunar Outpost** (`frontend-3d/`) — Three.js full 3D lunar crater colony builder, authentic 4K Moon terrain displacement, 1/6th-gravity astronaut physics, and rovers. Direct link to `http://localhost:3001` + relative fallback `frontend-3d/index.html`.
  - Added live port ping status indicators (`:3000` and `:3001`) with green pulsing badges when dev servers are active.
  - Added workspace scripts: `npm run dev:all` (`scripts/start-both.mjs`) to launch both simulators concurrently, `npm run home` (`scripts/serve-home.mjs`), `npm run dev:2d`, and `npm run dev:3d`.
  - **Vercel Cloud Deployment Setup**: Added [vercel.json](file:///c:/Users/acer%20i7/Programation/2026/NASA%20-%20OutPost/vercel.json) and [scripts/build-vercel.mjs](file:///c:/Users/acer%20i7/Programation/2026/NASA%20-%20OutPost/scripts/build-vercel.mjs) which compiles both 2D and 3D games and packages everything into a unified `dist/` ready for zero-config Vercel deployment. Updated [index.html](file:///c:/Users/acer%20i7/Programation/2026/NASA%20-%20OutPost/index.html) to dynamically detect production cloud environments and link directly to `/game/` and `/frontend-3d/`.

- **HUD Non-Overlapping Layout Boundaries & Spacious City Builder Dock (`HUDController.ts`)**:
  - Restructured Top Bar into a rigid 2-row layout with `height: 84px; max-height: 84px; overflow: hidden;`:
    - Row 1 (Height 32px): Logo (`🚀 MOON BASE`), Sol badge (`📅 SOL 1 | 06.0h`), and Polar Day/Night badge on the left; simulation speed (`SPD: 1x`) and 5 action buttons (`📊 Vitals`, `🧑‍🚀 Base Ops`, `⚠️ Decisions`, `⭐ Sol Report`, `🤖 M.I.L.O.`) on the right.
    - Row 2 (Height 32px): Kid-friendly resource ribbon with 9 capsules (`Materials`, `Power`, `Oxygen`, `Water`, `Food`, `Health`, `Crew`, `Morale`, `Trophy Report`) smoothly scrolling horizontally (`overflow-x: auto; white-space: nowrap; scrollbar-width: none;`), never wrapping into additional vertical lines.
  - Re-anchored and clamped all side panels below the 84px Top Bar (`top: 96px;`) and well above the Bottom Dock (`max-height: calc(100vh - 320px); overflow-y: auto;`), ensuring zero overlap:
    - Left Telemetry Panel (`#hud-telemetry-panel`): `left: 14px; width: 270px;` (starts closed).
    - Right Base Ops Panel (`#hud-controls-panel`): `right: 14px; width: 280px;` (starts closed).
    - Inspector Panel (`#hud-inspector-card`): `left: 14px; width: 270px;`, mutually exclusive with Left Telemetry.
    - M.I.L.O. Assistant Bubble (`#hud-milo-bubble`): Centered in upper viewport (`left: 50%; transform: translateX(-50%); top: 96px;` or `top: 160px;` during crisis), completely clear of both left and right side panels.
  - Spacious, Uncramped City Builder Dock (`#hud-city-builder-dock`):
    - Expanded width to `min(1180px, calc(100vw - 28px))` with dedicated height of `198px` (`min-height: 198px; max-height: 205px; overflow: hidden;`).
    - Fixed Dock Header to a single non-wrapping row (`height: 34px; flex-shrink: 0; overflow-x: auto; scrollbar-width: none; white-space: nowrap;`) keeping category tabs, integrated time scrubber, and tool buttons on one line.
    - Set dedicated cards tray `#city-cards-tray` to `height: 130px; min-height: 130px; flex-shrink: 0; display: flex; gap: 12px; overflow-x: auto; scrollbar-width: thin;`.
    - Resized building cards to `flex: 0 0 148px; width: 148px; height: 118px; box-sizing: border-box; overflow: hidden;` with proportional emoji, name, materials cost, and kid benefit, guaranteeing 100% visibility of all card details with zero clipping or elements appearing out of frame.
    - Updated dock minimise toggle: collapses smoothly to `height: 56px;` for panoramic views and expands back to `198px;`.
  - All 147/147 tests pass across 36 test suites; TypeScript build compiles cleanly with zero errors in 1.30s. Dev server running on `http://localhost:3001/`.

- **Bottom-Right M.I.L.O. NASA Expert Knowledge Panel (`MILOExpertPanel.ts`)**:
  - Implemented dedicated M.I.L.O. Expert Assistant Panel anchored in the bottom-right corner (`position: absolute; right: 14px; bottom: 12px; width: 380px; height: 520px; z-index: 45;`):
    - **Header & Advice Balloon**: Bouncing robot avatar (`🤖`), title `M.I.L.O. NASA BUDDY`, live advice speech balloon, minimise button (`─`), and close button (`✕`).
    - **Minimised Floating Pill**: Collapses to an unobtrusive pill in the bottom-right corner (`#hud-milo-pill`: `[ 🤖 M.I.L.O. Expert (67) ▲ ]`, height: 42px) with glowing border, always accessible with one click or via the Top Bar button (`🤖 M.I.L.O.`).
    - **Tab 1 — Expert Q&A (67 Questions)**: Loaded from `C:\Users\acer i7\Downloads\expert_questions.json` across all 10 canonical categories:
      - Interactive search input with clear button `✕`.
      - Category filter strip (`All (67)`, `⭐ Recommended`, `☢️ Radiation (12)`, `💨 Oxygen (7)`, `⚡ Power (8)`, `🌞 Space Weather (8)`, `🛠️ Life Support (6)`, `🌙 Moon (5)`, `🔴 Mars (5)`, `🧠 Strategy (10)`, `🧑‍🚀 Crew (4)`, `🌡️ Thermal (2)`).
      - Dynamic contextual triggers surfacing "⭐ Recommended" questions during critical ECLSS states (`site_moon`, `oxygen_critical`, `power_critical`, `shielding_critical`).
      - Scrollable accordion cards displaying question, kid-friendly answer, difficulty pill (`Beginner`, `Intermediate`, `Advanced`), NASA source citation badge (`🔬 NASA Source`), tags, and verified external reference links (`🌐 Open NASA Reference Data ↗`).
    - **Tab 2 — Field Guide (README.md)**: Loaded from `C:\Users\acer i7\Downloads\README.md` with rich formatting:
      - Overview of the expert system and zero-network design.
      - 10 Science Domains breakdown cards and question counts.
      - Cited official NASA repositories (OSDR RadLab, DONKI, ECLSS Reference, HRP, Mars Exploration Program).
      - Expandable full verbatim markdown viewer.
  - Added dedicated test suite `frontend-3d/tests/milo_expert_panel.test.ts` with 8 automated invariant tests.
  - All 155/155 tests pass across 37 test suites; production build compiles cleanly in 1.35s with zero errors. Dev server running on `http://localhost:3001/`.

- **Strict Anomaly Notification Cooldown, Sol 1 Peaceful Grace Period & Dismissal Quiet Period (frontend-3d)**:
  - Enforced a mandatory minimum cooldown period (`cooldownHours = 48.0` simulation hours / 2.0 full Sols, customizable down to 36.0h / 1.5 Sols) between any anomaly notifications in `MissionDecisionManager.ts`.
  - Implemented Sol 1 Peaceful Grace Period in `checkAnomalies`: completely suppresses all random canonical anomaly notifications throughout Sol 1 (`sol <= 1 || currentTotalHours < 24.0`), giving new commanders uninterrupted quiet time to explore the crater and construct their starter base.
  - Implemented Mandatory Quiet Period on Dismissal & Resolution: whenever an active anomaly modal or story incident notification is closed or dismissed (`dismissActiveAnomaly`, `#btn-close-incident`, `Escape` key, backdrop click, or `NarrativeManager.closeModal`), `resetCooldown(currentTotalHours)` resets `lastAnomalyHour = currentTotalHours`, guaranteeing a full 48h quiet period with zero popup interruptions.
  - Enforced strict hour verification: `lastAnomalyHour + cooldownHours <= currentTotalHours` strictly checked before any anomaly can trigger.
  - Fixed Sol calculation and data integrity in `resolveActiveAnomaly` and `resetCooldown`: timestamps, `DecisionRecord.sol`, `DecisionRecord.hour`, and `lastAnomalySol` now derive dynamically from `currentTotalHours` instead of defaulting to stale `simEngine.state.sol`.
  - Upgraded Sol pacing comparisons to use continuous Sols (`effectiveSol = Math.max(sol, 1.0 + currentTotalHours / 24.0)`): eliminates artificial 24h lockout bugs when using fractional cooldowns (e.g. 36.0h / 1.5 Sols) and unlocks midday anomalies (e.g. Oxygen Leak at Sol 2.5 / 36.0h) precisely on schedule.
  - Added backward time scrub defense: automatically anchors forward cooldown timestamps when scrubbing backward in time, eliminating multi-sol silence deadlocks.
  - Added scrubber drag isolation: suppresses incident modals while actively dragging the mission time scrubber (`!isUserScrubbing`), triggering cleanly only after the slider is released.
  - Linked `NarrativeManager` and `MissionDecisionManager` so visual novel narrative story scenes take priority and suppress anomaly popups (`narrativeManager.isModalOpen`), and closing or auto-fading narrative comms toasts resets the cooldown timer.
  - Added 10 automated test cases (ANOM-06 through ANOM-15) in `tests/anomalies_and_astronauts.test.ts`. All 147 tests passing across 36 suites; production Vite build passes cleanly in ~1.1s.

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
