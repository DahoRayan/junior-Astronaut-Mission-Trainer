# Game Design Context (v2: story + perspectives)

## Audience and Tone
Ages 7-12. Short sentences, friendly, encouraging, never punishing: failure = "mission lesson".
Explain terms inline once ("radiation dose: how much invisible space energy reaches your body").
"Mission Buddy" = friendly face of the expert system. It only answers from the knowledge base.

## Core Resources (3)
| Resource | Real constraint it teaches | Spent by / protects |
|---|---|---|
| Power | Solar/battery limited, lunar night | Runs life support, comms, science, shielding |
| Oxygen | Life support is finite and powered | Drains with crew/activity; made with power |
| Shielding | Radiation risk spikes with solar events | Costs power/time; protects crew |
Every decision must lower a resource or raise a risk. Some effects land 1-2 sols later.

## Kaleidoscope Structure
- ONE canonical timeline (the "story bible"): a list of events per sol, with a single critical
  convergence event (e.g. a major solar storm).
- 3 perspectives (starting points), e.g. Engineer (power), Doctor (radiation/health), Commander (comms/decisions).
  Each perspective starts at a different place/sol, knows different facts, sees different scenes,
  faces different decisions, but is consistent with the same timeline and ends at the convergence event.
- Replay value: see the same events from another side; debrief compares perspectives.
- Scope guard: 3 perspectives x ~5 scenes. More is stretch.

### `story/story-bible.json` (schema, owned jointly; content by game devs)
{ "mission": {"site", "length_sols", "convergence_event_id"},
  "timeline": [{"event_id", "sol", "type", "severity", "summary"}],
  "facts": [{"fact_id", "revealed_at_sol", "text"}],
  "perspectives": [{"id", "role", "start_sol",
     "scenes": [{"scene_id", "sol", "event_id", "reveals":[fact_id], "decision_ids":[...]}]}] }

### Consistency rules (checked by `scripts/validate_story.py`)
1. Every scene's `event_id` exists in the timeline and the scene `sol` matches the event's sol.
2. Every `reveals` fact exists; a fact is never used before its `revealed_at_sol`.
3. Every perspective reaches the convergence event.
4. No two perspectives disagree on a timeline fact (same event, same sol, same severity).
5. Every scene id and decision id is unique; every decision has at least one cost (a negative delta or delayed effect).
6. Scenes within a perspective are in non-decreasing sol order.

## Expert System (Mission Buddy)
- Knowledge base: `ai-service/data/knowledge/`: `questions.json` (id, text, applies_when),
  `rules.json` (rule_id, conditions on the snapshot, answer template, fact ids), `facts.json`
  (fact_id, text, source, retrieved date, kind).
- Each scene shows 3-5 tappable questions picked by `applies_when` (event, low resource, perspective).
- Inference: simple forward chaining over the snapshot; the answer is the matched rule's template + fact.
- Always returns `explanation`: rules fired, inputs, sources. "Why am I seeing this?" is always answerable.

## Evaluator Rubric
See `specs/03-deterministic-evaluator.md`. Deterministic. Ratings great/ok/risky. Every rating lists the rules behind it.

## Statistics (simple)
- Event weights: relative frequency of event types in real DONKI data (flares, CMEs, geomagnetic storms) -> randomized (non-story) events.
- Debrief: per-resource mean/min/trend, rating counts, costliest decision, exposure to events, perspective comparison.

## Data Attribution
In-game "Science Corner" lists sources (DONKI, OSDR, RadLab). Badge each item LIVE or SAVED NASA DATA.
Never show saved data as live.
