# Expert System — Knowledge Base

## Overview
A pre-built, self-contained question-and-answer database that the game loads
directly (no AI service, no LLM, no network required). When a player clicks the
**"Mission Expert"** button, they see a categorized list of questions relevant to
their current situation. Each answer is kid-friendly (ages 7–12), grounded in
real NASA data, and cites its source.

## File
```
data/expert_system/expert_questions.json
```

## Schema

### Top Level
| Field        | Type     | Description                              |
|-------------|----------|------------------------------------------|
| `version`    | string   | Semver of the knowledge base             |
| `categories` | array    | Category definitions (id, label, icon)   |
| `questions`  | array    | All Q&A entries                          |

### Category Object
| Field         | Type   | Description                           |
|--------------|--------|---------------------------------------|
| `id`          | string | Unique category key                   |
| `label`       | string | Display name with emoji               |
| `icon`        | string | Icon identifier for Unity UI          |
| `description` | string | Short description shown to the player |

### Question Object
| Field              | Type          | Description                                                       |
|-------------------|---------------|-------------------------------------------------------------------|
| `id`               | string        | Unique question ID (e.g. `rad_001`)                               |
| `category`         | string        | References a category `id`                                        |
| `question`         | string        | The question the player sees                                      |
| `answer`           | string        | Kid-friendly answer (≤ 3 short paragraphs)                        |
| `source`           | string        | Human-readable NASA data source name                              |
| `source_url`       | string\|null  | Link to original NASA resource (for credits / Science Corner)     |
| `difficulty`       | string        | `"beginner"` / `"intermediate"` / `"advanced"`                    |
| `tags`             | string[]      | Topical tags for search / filtering                               |
| `related_resource` | string\|null  | Which game resource this relates to: `"power"`, `"oxygen"`, `"shielding"`, or `null` |
| `triggers`         | string[]      | Game states that should surface this question (see below)         |

### Trigger Values
Unity uses `triggers` to show context-relevant questions at the right time:

| Trigger               | When to surface                                     |
|-----------------------|-----------------------------------------------------|
| `any`                  | Always available in the expert panel                |
| `site_moon`            | Player is on a Moon mission                         |
| `site_mars`            | Player is on a Mars mission                         |
| `oxygen_low`           | Oxygen < 30%                                        |
| `oxygen_critical`      | Oxygen < 15%                                        |
| `oxygen_medium`        | Oxygen 30–60%                                       |
| `power_low`            | Power < 30%                                         |
| `power_critical`       | Power < 15%                                         |
| `shielding_low`        | Shielding < 30%                                     |
| `shielding_critical`   | Shielding < 15%                                     |
| `multiple_low`         | Two or more resources < 30%                         |
| `event_solar_flare`    | Active event is a solar flare                       |
| `event_cme`            | Active event is a CME                               |
| `event_dust_storm`     | Active event is a dust storm                        |
| `event_equipment_fault`| Active event is an equipment fault                  |
| `event_comms_delay`    | Active event is a comms delay                       |
| `mission_end`          | Mission is over (debrief screen)                    |

## How Unity Should Use It

### Loading
```csharp
// Load once at game start
TextAsset json = Resources.Load<TextAsset>("expert_questions");
ExpertDatabase db = JsonUtility.FromJson<ExpertDatabase>(json.text);
```

### Filtering by Context
```csharp
// Get relevant questions for current game state
List<string> activeTriggers = GetActiveTriggers(snapshot);
var relevant = db.questions
    .Where(q => q.triggers.Any(t => t == "any" || activeTriggers.Contains(t)))
    .ToList();
```

### Display
1. Player clicks **"Mission Expert"** button (always visible in HUD)
2. Show category tabs (only categories that have matching questions)
3. Show question list — questions with matching triggers appear first (highlighted as "Recommended")
4. Player taps a question → answer expands with source citation
5. "Science Corner" badge shows the NASA source name

## Content Summary

| Category | Questions | Key Topics |
|----------------------|:---:|--------------------------------------------------|
| ☢️ Radiation & Shielding | 12 | GCRs, SPEs, RadLab dose rates, Van Allen belts, water & regolith shielding |
| 💨 Oxygen & Air | 7 | O₂ generation, MOXIE (Mars air ISRU), leaks, pressure loss, CO₂ scrubbing |
| ⚡ Power & Energy | 8 | Solar arrays, Kilopower nuclear, battery cold limits, crisis rationing |
| 🌞 Space Weather | 8 | Flares, CMEs, DONKI, storm duration, radio blackouts, 11-year solar cycle |
| 🛠️ Life Support | 6 | ECLSS, water recovery (90%), Sabatier reactor, Veggie plants, humidity control |
| 🌙 Moon Mission | 5 | Hazards, regolith, 14-day night, South Pole water ice, lava tubes |
| 🔴 Mars Mission | 5 | Thin atmosphere, dust storms, comms delay, sub-surface ice, extreme cold |
| 🧑‍🚀 Crew Health & Fitness | 4 | Microgravity bone loss, ARED exercise, sleep disruption, immune suppression |
| 🌡️ Thermal & Temperature | 2 | Active radiators, cooling loops, multi-layer insulation (MLI) |
| 🧠 Mission Strategy | 10 | Triage priority, delayed effect debt, post-storm recovery, trade-off balance |
| **Total** | **67** | |

## Data Sources Referenced
- NASA OSDR RadLab (CRaTER lunar data, MSL-RAD Mars data)
- NASA DONKI (space weather events)
- NASA ECLSS Reference (life support systems)
- NASA HRP Space Radiation Element
- NASA Space Radiation Challenge Guide (educator PDF)
- NASA Mars Exploration Program
