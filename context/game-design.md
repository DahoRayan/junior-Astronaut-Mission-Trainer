# Game Design Context (v2) — Beyond Earth: First Light

## Audience, Tone and Core Philosophy
- **Target Audience**: Children aged 7–12.
- **Tone**: Balanced — scientific realism, space exploration adventure, teamwork, and encouraging ("failure = mission lesson").
- **Fail-Safe Mindset**: No character deaths or punitive "Game Over" screens. When a subsystem runs out of power or oxygen drops, the simulation pauses/stabilizes and launches a **Mission Debrief**. The debrief explains the root cause scientifically, connects it to real NASA history, and offers a clear path to retry.
- **M.I.L.O. Persona**: *Mission Intelligence & Logistics Operator* ("Mission Buddy"). Robotic assistant and logistics manager. Speaks in punchy, encouraging sentences suitable for kids. Answers deterministically from the knowledge base.

## Main Characters & Perspectives
1. **Capt. Elena Ruiz (38, Spanish, Mission Commander)**: Experienced astronaut, calm and protective. Emphasizes safety, teamwork, and planning.
2. **Amir Haddad (29, Algerian, Systems Engineer)**: Enthusiastic tinkerer and builder. Loves wiring, rovers, and solar panels.
3. **Dr. Nia Okafor (32, Nigerian, Science Officer)**: Planetary geologist and botanist. Fascinated by lunar ice and hydroponics.
4. **Dr. Daniel Park (34, South Korean, Medical Officer)**: Gentle and attentive. Monitors crew vitals, radiation exposure, and nutrition.
5. **M.I.L.O.**: Robotic assistant and AI expert companion.

## Core Resources
| Resource | Constraint taught | Sinks and Sources |
|---|---|---|
| Power | Solar/battery limited, lunar night | Produced by Solar Panels/Kilopower, consumed by base & machines |
| Oxygen | Life support is finite and powered | Consumed by crew (-3/h), produced by Electrolyzers & Farm |
| Water | Essential for drinks, farming and electrolysis | Recycled from humidity/wastewater (+3/h), mined from ice |
| Shielding / Radiation | Radiation risk spikes with solar events | Regolith shields (+30-40%), Storm Vault (+95% sheltering) |

## Kaleidoscope Story Structure
- ONE canonical timeline (`story/samples/story-bible.json` validated by `scripts/validate_story.py`).
- 3 perspectives (Engineer, Doctor/Scientist, Commander) providing replayable points of view converging on critical space weather events.
- Replay value: see the same events from another side; debrief compares perspectives.

## Expert System (Mission Buddy)
- Knowledge base: `ai-service/data/knowledge/` (`questions.json`, `rules.json`, `facts.json`).
- Each scene provides questions matched by conditions on the snapshot.
- Fully deterministic forward chaining with explainable evidence.
