# Game Design Context (replaces ui-context.md)

## Audience and Tone
- Ages 7–12. Short sentences, friendly, encouraging, never punishing. Failure = "mission lesson".
- Explain terms inline once: "radiation dose (how much invisible space energy hits your body)".
- Assistant persona: "Mission Buddy" — curious, upbeat, factual. Never invents NASA facts.

## Core Resources (keep to 3)
| Resource | Real constraint it teaches | Spends / protects |
|---|---|---|
| Power | Solar/battery is limited, esp. at lunar night | Runs life support, comms, science, shielding systems |
| Oxygen | Life support is finite and powered | Drains with crew and activity; made with power |
| Shielding | Radiation risk spikes with solar events | Costs power/time; protects crew health |
- No free choices: every decision must lower at least one resource or raise a risk.
- Delayed consequences: some effects land 1–2 sols later (so "today's win" can hurt tomorrow).

## Events (replayability)
Randomized each run from a pool: solar flare / CME warning (DONKI-driven), dust storm,
equipment fault, science opportunity, comms delay. Severity 1–3.

## Evaluator Rubric (deterministic, in ai-service/app/evaluator/)
Score inputs: resource margins after decision, exposure to active event, delayed-effect
debt, balance across resources. Same inputs -> same output. Ratings: great / ok / risky.

## Feedback Format
1. What you gained. 2. What it cost. 3. (Optional) one real fact with source.
Max 2 sentences + fact. No jargon without an explanation.

## Data Attribution
In-game "Science Corner" lists sources (DONKI, OSDR, RadLab). Badge each real-data item
LIVE or SAVED NASA DATA. Never show saved data as live.
