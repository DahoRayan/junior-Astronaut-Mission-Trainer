# Beyond Earth: First Light (v3)

## One-liner
A bright, tap-and-build lunar outpost game for kids 7-12, in the browser. Keep 4 astronauts alive for 12 Moon days by balancing
Power, Air and Shield. Every choice costs something. Real NASA data shows up as storm alerts and "Science Cards".

## Why v3
The v2 prototype had 9+ HUD numbers, long dialogue, a typed chat box, jargon-heavy module cards and a flat top-down map.
v3 keeps the educational goal (real engineering trade-offs, real NASA data, explainability) and removes everything a 7-year-old cannot parse.

## Pillars
1. Few, chunky decisions with visible trade-offs (3 meters, 6 buildings, 1 big choice per event).
2. Looks like a toy: 2.5D low-poly diorama, saturated colors, juicy feedback (Clash of Clans / Boomerang Fu feel).
3. Show, don't tell: story and science arrive through gameplay moments and 1-line bubbles, not cutscenes.
4. Always explainable: after every day, one tap on "Why?" shows the cause chain.
5. Real data, honestly labeled: LIVE or SAVED NASA data badges; sources one tap away.
6. Learn from failure: rewind and retry, never punitive.

## Core flow (one game day, 30-60 s)
PLAN (tap to build or switch modules ON/OFF, choose event option) -> GO (animated day, 6-10 s, skippable) -> REPORT (3 meter arrows + 2 reasons).
A mission = 12 days (about 8-10 minutes). Three starting roles (Engineer, Scientist, Medic) play the SAME timeline from different loadouts (Kaleidoscope idea).

## Scope
In: 3 meters + crew health, 6 buildings, 12-day timeline, 3 roles, ~5 events, MILO tappable help, Science Cards, DONKI badge (+ optional live mode),
OSDR "what scientists study" cards in the debrief, debrief charts, rewind, read-aloud, sound, offline play.
Out: accounts, backend dependency for play, free-text chat, multiplayer, Mars (stretch), voice acting, 3D asset pipeline beyond CC0 packs.

## Success criteria
1. A judge plays a full mission in <= 10 minutes with no instructions and no typing.
2. At least 3 distinct trade-offs are felt (night power, storm shelter vs income, air vs bricks).
3. Every day report can be explained with "Why?" using rules fired + inputs.
4. Real-data items carry LIVE/SAVED badges and sources; no invented NASA facts.
5. >= 30 fps on a low-end laptop; first load < 3 MB; works offline after first load.
6. Same inputs + same seed => same outcome (deterministic).
