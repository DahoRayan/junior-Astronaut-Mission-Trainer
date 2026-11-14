# Game Design Context — Beyond Earth: First Light

> **Full Narrative & Spoken Script:** See the complete, line-by-line script and character bible in [context/story-bible.md](file:///C:/Users/acer%20i7/Programation/2026/NASA%20-%20OutPost/context/story-bible.md).

## Audience, Tone and Core Philosophy
- **Target Audience**: Children aged 7–12.
- **Tone**: Balanced — scientific realism, space exploration adventure, teamwork, and light humor.
- **Fail-Safe Mindset**: No character deaths or punitive "Game Over" screens. When a subsystem runs out of power or oxygen drops, the simulation pauses/stabilizes and launches a **Mission Debrief**. The debrief explains the root cause scientifically, connects it to real NASA history, and offers a clear path to retry.
- **M.I.L.O. Persona**: *Mission Intelligence & Logistics Operator*. Friendly, slightly witty, proud of its quick calculations, and relentlessly supportive. Explains complex aerospace terms in plain language.

## Main Characters
1. **Capt. Elena Ruiz (38, Spanish, Mission Commander)**: Experienced astronaut, calm and protective. Emphasizes safety, teamwork, and planning. Signature quote: *"A good mission isn't about avoiding every problem. It's about knowing how to solve them."*
2. **Amir Haddad (29, Algerian, Systems Engineer)**: Enthusiastic tinkerer and builder. Loves wiring, rovers, and solar panels. Signature quote: *"Before we build something bigger, let's make sure what we already have actually works!"*
3. **Dr. Nia Okafor (32, Nigerian, Science Officer)**: Planetary geologist and botanist. Fascinated by lunar ice and hydroponics. Signature quote: *"Sometimes the smallest discovery can solve the biggest problem."*
4. **Dr. Daniel Park (34, South Korean, Medical Officer)**: Gentle and attentive. Monitors crew vitals, radiation exposure, and nutrition. Signature quote: *"Let's make sure the crew is safe before we worry about anything else."*
5. **M.I.L.O. (AI Companion)**: Robotic assistant and logistics manager. Speaks in punchy, encouraging sentences suitable for kids.

## Screen & Viewport Layout
```
┌────────────────────────────────────────────────────────────────────────┐
│ TOP BAR: Sol & Cycle | ⚡ Power | 🫁 O2 | 💧 Water | 🛡️ Shield | Crew HP │
├──────────────┬──────────────────────────────────────────┬──────────────┤
│ LEFT PANEL   │           CENTRAL 2D VIEWPORT            │ RIGHT PANEL  │
│              │                                          │              │
│ [Catalog]    │      Top-down 2D pixel-art lunar grid    │ [MILO Chat]  │
│ • Energy     │      (Shackleton Ridge, Regolith)        │ "Commander,  │
│ • Life Supp. │                                          │ check cables"│
│ • Defense    │      [ Solar ] ─── [ Hab ] ─── [ Vault ] │              │
│ • Farming    │                                          │ [Radar HUD]  │
│ • Water/ISRU │      Animated current pulses on cables   │ Risk: LOW    │
│              │      Building status icons (OK/Brownout) │              │
│ [Tools]      │      Camera: Free Pan (WASD/drag) + Zoom │ [Alerts]     │
│ Build/Demol. │      Recenter button                     │ Active goals │
├──────────────┴──────────────────────────────────────────┴──────────────┤
│ BOTTOM BAR: [Pause] [1x] [2x] | Log: "Solar array online" | [Next Sol] │
└────────────────────────────────────────────────────────────────────────┘
```

## Structure Catalog & Balancing Values
All balancing values are designed for clear educational cause-and-effect:

| Category | Building | Build Cost | Operating Impact | Function & Educational Value |
| :--- | :--- | :--- | :--- | :--- |
| **Energy** | **Solar Array** | 50 Materials | None | $+20\text{ kW}$ in sunlight; $0\text{ kW}$ in shadow. Teaches solar tracking. |
| **Energy** | **Battery Bank** | 40 Materials | None | Stores up to $100\text{ kWh}$. Teaches energy storage for lunar night. |
| **Energy** | **Kilopower Reactor**| 120 Materials | None | Continuous $+30\text{ kW}$ day & night. Teaches nuclear surface power. |
| **Life Support**| **Oxygen Electrolyzer**| 60 Materials| $-10\text{ kW}$, uses H₂O | Produces $+15\text{ kg/h}$ O₂. Teaches water splitting. |
| **Life Support**| **CO₂ Scrubber (CDRA)**| 40 Materials| $-8\text{ kW}$ | Removes toxic CO₂ exhaled by crew. Teaches closed atmospheres. |
| **Life Support**| **Crew Habitat** | 80 Materials | $-5\text{ kW}$ | Living space for 4 astronauts. Pressurized cabin environment. |
| **Defense** | **Regolith Shield Roof**| 30 Regolith | None | Blocks 80% of cosmic rays. Teaches in-situ resource utilization. |
| **Defense** | **Subterranean Vault** | 80 Materials | $-5\text{ kW}$ | Deep bunker for CME solar storm events. Teaches radiation shielding. |
| **Farming** | **Hydroponics Tray** | 45 Materials | $-12\text{ kW}$, $-2\text{ L}$ H₂O | Produces fresh lettuce; $+5\text{ kg/h}$ O₂ bonus; boosts crew morale. |
| **Water/ISRU** | **Water Extractor** | 70 Materials | $-15\text{ kW}$ | Mines ice from crater shadow. Teaches volatile mining. |
| **Network** | **Power Cable** | 5 Materials | None | Transmits electricity across grid tiles. Teaches closed circuits. |

## 5-Chapter Story Campaign
1. **Prologue**: Touchdown at Shackleton Rim, establish comms, meet the crew and M.I.L.O.
2. **Chapter 1 ("First Light")**: Place solar array and electrolyzer; diagnose and reconnect loose power cable with Amir.
3. **Chapter 2 ("The Long Night")**: Manage energy storage across a 48-hour lunar night; toggle load-shedding circuit breakers.
4. **Chapter 3 ("The Invisible Threat")**: Receive NASA DONKI solar flare alert; build regolith roof and subterranean shelter.
5. **Chapter 4 ("Growing Beyond Earth")**: Mine ice water, run CSA hydroponics tray, harvest fresh vegetables for crew health.
6. **Chapter 5 ("A Home Among the Stars")**: Base expansion, compound dust/shadow emergency, final graduation review.
7. **Epilogue & Sandbox**: Official graduation debrief, Mars teaser, creative sandbox mode unlock.
