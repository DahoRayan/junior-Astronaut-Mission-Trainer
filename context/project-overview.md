# Junior Astronaut Mission Trainer

## Overview
A 3D Unity game for kids aged 7–12 (NASA Space Apps 2026 challenge "Build a Junior
Astronaut Mission Trainer"). The player runs a lunar/Martian outpost, balancing power,
oxygen, and radiation shielding over a simulated mission. Every choice has a real cost.
A Python FastAPI service adds (a) an in-game AI assistant that explains and hints in
kid-friendly language and (b) a feedback evaluator that judges each decision's
trade-off and the player's overall survivability. Real NASA data (DONKI space weather,
RadLab dosimetry, OSDR findings) grounds events and feedback.

## Goals
1. Player experiences >= 3 distinct trade-offs where saving one resource costs another.
2. At least one gameplay event is driven by real NASA data (DONKI) and labeled live or curated.
3. AI assistant answers any in-game question in <= 3 short sentences at a 7–12 reading level.
4. Every decision gets evaluator feedback within 3 s, or an instant deterministic fallback.
5. Game is fully playable if the AI service or NASA APIs are down.

## Core User Flow
1. Player starts a mission (site: Moon or Mars) and sees tutorial + resource dashboard.
2. Each sol (day), an event appears (e.g. solar flare warning, dust storm, equipment fault).
3. Player picks an action; resources change; some costs show up later.
4. Evaluator returns short feedback: what was gained, what it cost, one real-science fact.
5. Player can ask the assistant for help at any time.
6. Mission ends (survived N sols or failed); debrief shows survivability score and lessons.
7. Replay with different random events/strategy.

## Features
### Game (Unity — friends)
- 3D outpost scene, resource HUD, event/decision UI, sol progression, win/lose
### AI service (FastAPI — Ibrahim)
- Assistant chat, decision evaluator, mission debrief, NASA data layer w/ cache + fallback

## Scope
### In Scope
- 2–3 core resources (power, oxygen, shielding); food only as stretch
- One site (Moon first), 10–15 sol mission
- DONKI integration + curated OSDR/RadLab facts
- Browser-or-desktop Unity build that calls the service over HTTPS/localhost

### Out of Scope
- Accounts, login, persistence between sessions, multiplayer
- Voice, image generation, fine-tuned models
- Live-streaming every NASA dataset; Mars Trek terrain rendering
- Any AI control over game state

## Success Criteria
1. A judge can play a full mission start to debrief without errors.
2. Killing the AI service mid-game does not crash or block the game.
3. Evaluator scores are reproducible: same inputs, same score.
4. Data sources are credited in-game and in the submission write-up.
5. Demo shows a real DONKI event changing a shielding decision.
