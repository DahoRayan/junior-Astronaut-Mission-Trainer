# Junior Astronaut Mission Trainer (v2 plan)

## Overview
A story-driven 3D Unity game for kids aged 7-12 (NASA Space Apps 2026, "Build a Junior
Astronaut Mission Trainer"). The player lives one lunar mission, told Kaleidoscope-style:
ONE canonical story, several starting points (crew roles). Each perspective sees a different
slice and makes different decisions, and all of them stay consistent with the same timeline and
converge on a shared critical event. Every decision is a trade-off between power, oxygen and
radiation shielding.
A Python FastAPI service provides the "science brain", with NO LLM at runtime:
- an **expert system** built from curated NASA data that answers the player's questions,
- a **deterministic evaluator** that judges decisions and explains why,
- a **statistics layer**: event probabilities from real data + a post-mission analysis,
- a **story consistency validator** for the shared story bible.
Everything the service says is explainable: the rules fired, the inputs, and the data source.

## Goals
1. Player sees >= 3 distinct trade-offs where saving one resource costs another.
2. >= 3 starting points (perspectives) of the same mission; each playable, all consistent.
3. Every evaluation and every assistant answer comes with a visible "why" (rules + inputs + source).
4. At least one event frequency or fact comes from real NASA data (DONKI / RadLab / OSDR), labeled live or saved.
5. Post-mission debrief shows simple statistics on the player's choices and compares perspectives.
6. The game is fully playable with the service offline (Unity ships local fallback text).

## Core User Flow
1. Player picks a starting point (e.g. engineer, doctor, commander) with a short intro.
2. Story scenes advance sol by sol; each scene may carry an event and a decision.
3. Player chooses; resources change; some costs land later.
4. Evaluator returns rating + trade-off + explanation ("Why?" button shows the rules).
5. Player can open "Mission Buddy": tappable questions relevant to the current scene.
6. All perspectives converge on the shared critical event.
7. Debrief: survivability score, lessons, simple statistics, comparison with other perspectives played.
8. Replay from another starting point to see the same story from a different side.

## Features
### Game (Unity - friends)
Scenes, story flow, HUD, decisions UI, "Why?" and Mission Buddy UI, perspective select, debrief UI.
### AI service (FastAPI - Ibrahim + teammate)
Evaluator, expert system, NASA data layer, statistics, story validator.

## Scope
### In scope
- 3 core resources (power, oxygen, shielding); one site (Moon); ~10-15 sol mission
- 3 perspectives, one canonical timeline, one convergence event
- Tappable-question assistant (no free text); deterministic rules; curated NASA facts
- DONKI integration with curated fallback; simple statistics (stdlib / light numpy)
### Out of scope
- LLM chatbot or any generative text at runtime; free-text chat
- Accounts, persistence, multiplayer, voice; Mars (stretch); food resource (stretch)
- AI control of game state

## Success Criteria
1. A judge can play 2 perspectives and see the same story from two sides.
2. Any answer/score can be explained with its rules and sources.
3. Killing the service mid-game does not block the game.
4. Same inputs always give the same outputs.
5. Story validator passes: no contradictions across perspectives.
6. Data sources are credited in-game and in the submission write-up.
