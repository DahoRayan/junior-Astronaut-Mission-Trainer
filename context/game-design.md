# Game Design (v3)

## The fantasy
You are the Junior Mission Commander at the Shackleton rim base. Four astronauts count on you. Build, switch things ON/OFF, make 1 choice per event.

## Meters (HUD, only these)
| Meter | Icon | Meaning for kids | Real idea it teaches |
|---|---|---|---|
| Power | lightning, yellow | battery charge | solar only works in sunlight; batteries store energy for night |
| Air | lungs/bubble, cyan | breathable air | oxygen is made with power; crew uses it every day |
| Shield | shield, purple | protection from space storms | radiation shielding (regolith, water); solar storms |
Plus: Crew hearts (4 faces) = the outcome (health), and Moon Bricks = build currency. Day counter and a Storm chip (LIVE/SAVED badge) complete the HUD.

## Buildings (the only 6)
Solar Panel, Battery, Air Maker, Radiation Wall, Greenhouse, Brick Rover (numbers in sim-rules.md). Each shows: icon, cost chip, one 5-word line ("Makes air. Needs power.").
Tap a building: small popup with ON/OFF switch (Air Maker, Greenhouse, Rover) and Remove. No catalog panel: a 6-button build bar at the bottom.

## Main screen wireframe
```
[Day 5/12 | night icon] [⚡ meter][🫁 meter][🛡 meter] [crew ♥♥♥♥] [🌩 LIVE chip][⚙]
|                                                                        |
|                 2.5D isometric lunar diorama (tap/drag/pinch)           |
|                                                                        |
[MILO bubble: "Night is coming!"]            [ build bar: ☀ 🔋 🫁 🛡 🌱 🚜 ]  [ GO ▶ ]
```
Event decision = one centered card with 2 big icon buttons. Day report = a small card (3 arrows + 2 reasons + "Why?").

## One day
1. PLAN: build (costs bricks), toggle modules, answer the event card if any. Forecast chips show tomorrow (night / storm / quake).
2. GO: camera pulls back slightly, sun/shadow animation, little crew animations, meters animate. Skippable.
3. REPORT: meter arrows (up/down/same), 2 reasons ("No sun: -14 power"), Why? button, Science Card if a concept was just felt (max 1 per day, collectible).
Defeat: crew health 0 -> "Emergency return": gentle screen, shows the one mistake chain, buttons Rewind 1 day (3 per mission) or Retry.

## Story (compressed from the Story Bible)
Characters: Captain Leo (guide, orange suit), Amir (engineer, teal), Nia (scientist, green), Daniel (medic, yellow), MILO (round floating robot).
Beats = game events, shown as comic-style speech bubbles (<= 12 words, <= 2 per event, auto-dismiss):
| Day | Event | Bubble example |
|---|---|---|
| 1 | Landing + guided first build (ghost hand shows 3 taps) | Leo: "Sun is up. Build power first!" |
| 2 | Oxygen leak (decision) | Daniel: "Air is leaking!" |
| 4 | Forecast: long night | MILO: "Long night in 1 day." |
| 5-6 | Long night (no sun) | Amir: "No sun, no power!" |
| 8 | Forecast: solar storm (data badge) | Nia: "NASA sees a storm coming!" |
| 9 | Solar storm (decision: shelter or stay) | Leo: "Everyone to the vault?" |
| 10 | Calm + first harvest if Greenhouse exists | Nia: "Fresh lettuce!" |
| 12 | Moonquake finale (decision) | MILO: "Quake! Dust on panels!" |
Epilogue: certificate + "Mars is next" teaser. No hardcoded stats: all numbers in the debrief come from the sim.
The Story Bible's fictional radiation numbers are NOT used in-game (see science-education.md).

## Roles (Kaleidoscope: same story, three starting points)
All roles share the identical event timeline; they differ in loadout, one special ability (once per mission), and what MILO highlights.
| Role | Loadout | Special |
|---|---|---|
| Engineer (Amir) | 2 Solar, 1 Battery, power 60, air 60 | Quick Fix: cancels the damage of one hazard |
| Scientist (Nia) | 1 Solar, 1 Greenhouse, 1 Radiation Wall, air 70 | Ice Scan: +40 bricks |
| Medic (Daniel) | 1 Solar, 1 Air Maker, air 80 | Health Check: +25 crew health and reveals tomorrow's event |
Debrief compares the roles the player has finished (stars, best/worst day) and invites the next one.

## Stars (replayability)
1 star: crew survives day 12. 2 stars: and all three meters >= 30 on day 12. 3 stars: and 3 Science Cards or "Why?" opened ("Curious Astronaut").

## Juice (feedback)
Squash-and-pop on build, floating +/- numbers with icons, meter pulse when low, soft screen shake on storm, sparkle on star, simple SFX. Respect reduced-motion.
Reading support: "Read to me" button speaks any bubble/card (Web Speech API).

## UX cut list (from the v2 prototype)
Remove: typed MILO chat; 9 crew-operation buttons; module descriptions with kg/h, L, P1/P2 tags; separate objectives panel (use 1 big current goal chip); the side catalog; extra HUD stats (CREW HP %, MORALE %, WATER L, Mat as text).
Keep: LIVE DONKI badge, OSDR snapshot insight (move to debrief), M.I.L.O. as a friendly helper (chips, not chat).
