# 🛰️ Beyond Earth: First Light — Systems & Requirements Specification

**Project:** Beyond Earth: First Light (Junior Astronaut Mission Trainer)  
**Source Challenge:** NASA International Space Apps Challenge 2026 — *"Build a Junior Astronaut Mission Trainer"*  
**Document Status:** Complete Implementation-Ready Architectural & Systems Specification  
**Document Version:** 2.0.0  
**Target Audience:** Students & Children (Ages 7–12)  
**Primary Authors:** Senior Game Systems Designer, Space Science Researcher, Educational Product Architect  

---

## 1. Project Overview

**Beyond Earth: First Light** is an educational, interactive 2D top-down outpost simulation and colony builder designed to teach children aged 7–12 the authentic engineering, scientific, and human survival trade-offs required to establish and sustain a permanent human presence on the Moon (Artemis Base Camp at Shackleton Crater Rim).

Traditional educational resources often either oversimplify space survival into fictional cartoons where oxygen and energy are infinite, or present dense aerospace engineering textbooks that overwhelm young learners with differential equations. This project resolves this dilemma by translating real NASA mission telemetry, human physiology standards, and space weather physics into intuitive, visual, and interactive gameplay systems.

### 1.1 Core Vision
The player assumes the role of **Junior Mission Commander** at the **Lunar South Pole** (Shackleton Crater Ridge). Guided by **M.I.L.O.** (*Mission Intelligence & Logistics Operator*), an upbeat, witty, and scientifically factual robotic AI flight controller, and directing a four-astronaut crew (**Capt. Elena Ruiz**, **Amir Haddad**, **Dr. Nia Okafor**, and **Dr. Daniel Park**), the child constructs, powers, pressurizes, and maintains a functional lunar settlement across a linear 5-chapter story campaign and unlockable sandbox mode.

### 1.2 Fundamental Design Tenets
1. **Meaningful Interconnected Trade-Offs**: No decision is purely positive. Every action carries an immediate resource cost, an opportunity cost, and often a delayed consequence.
2. **Authentic Space Science as Ground Truth**: Systems are anchored in verified standards (NASA-STD-3001, NASA Life Support Baseline Values and Assumptions Document, NASA DONKI, NASA RadLab, and Canadian Space Agency food production research).
3. **Low Barrier to Entry with High Conceptual Depth**: Visual, color-coded meters and spatial top-down grid building allow a 7-year-old to play immediately, while authentic cause-and-effect dependencies teach 12-year-olds systems thinking.
4. **Safe Failure & Educational Growth Mindset**: Running out of battery or losing pressure never results in a punishing "Game Over". Instead, it triggers an informative, encouraging **Mission Debrief** that breaks down the causal failure chain, connects it to real NASA history, and empowers the child to retry with a better strategy.

---

## 2. Challenge Alignment

This specification directly fulfills the requirements of the **2026 NASA International Space Apps Challenge**:

| Challenge Requirement | Project Implementation |
| :--- | :--- |
| **Simulate Lunar/Martian Outpost** | Focuses on Artemis Base Camp at the Lunar South Pole (Shackleton Crater), modeling real lighting, vacuum, low gravity ($1.62\text{ m/s}^2$), and thermal extremes. |
| **Balance Competing Survival Demands** | Core gameplay centers on the triangular tension between **Electrical Power**, **Life Support (ECLSS)**, **Radiation Shielding**, and **Food Production**. |
| **Target Audience: Ages 7–12** | 2D top-down grid view, intuitive iconography, inline terminology explanations, progressive complexity disclosure, and bilingual support (EN/FR). |
| **Grounding in Real NASA Open Data** | Integrates NASA DONKI (space weather/flares), OSDR (space biology), RadLab (ISS dosimetry), and CSA space agriculture toolkits. |
| **Replayability & Anomaly Response** | Dynamic space weather events, equipment degradation, micrometeoroid punctures, and lunar shadow periods create distinct playthrough scenarios. |

---

## 3. Target Audience and Educational Philosophy

### 3.1 Cognitive & Developmental Profile (Ages 7–12)
Children in this age bracket (spanning Piaget's concrete operational stage to early formal operations) learn best through:
* **Direct Cause and Effect**: Immediate visual feedback when a valve is opened or a power switch is flipped.
* **Spatial & Tactile Organization**: Placing structures on a physical grid and seeing cables/pipes link them.
* **Scaffolded Complexity**: Introducing one system at a time (Power $\to$ Oxygen $\to$ Shielding $\to$ Food).
* **Positive Emotional Reinforcement**: Feeling like a real NASA scientist collaborating with a friendly robotic companion (M.I.L.O.).

### 3.2 Terminology Translation Table
To preserve scientific rigor without overwhelming young learners, technical terms are explained inline using accessible analogies:

| Scientific Concept | Scientific Term | Kid-Friendly In-Game Label | In-Game Inline Definition |
| :--- | :--- | :--- | :--- |
| **Gas Pressure** | Partial Pressure ($pO_2$, $pCO_2$) | Air Mixture | *"How much of each gas is pushing against your lungs."* |
| **CO₂ Scrubbing** | Amine Thermal Swing / CDRA | CO₂ Cleaner | *"A machine that catches dirty exhaled breath so you don't get headaches."* |
| **Water Recovery** | Catalytic Oxidation & Electrolysis | Water Recycler | *"Cleans every drop of sink water and sweat so it's purer than tap water."* |
| **Power vs. Energy** | Power ($\text{kW}$) vs. Energy ($\text{kWh}$) | Power Flow vs. Battery Bank | *"Power flow is how fast energy is being used; Battery is how much is saved in the tank."* |
| **Radiation Shielding**| Half-Value Layer ($\text{HVL}$) | Shield Thickness | *"How many layers of moon soil you need to cut radiation in half."* |
| **Solar Particle Event**| Coronal Mass Ejection ($\text{CME}$) | Solar Proton Storm | *"A giant cloud of energetic particles shot out by the Sun."* |
| **Space Agriculture** | Photoperiod & Biomass Yield | Plant Sun Hours & Harvest | *"How many hours of LED light plants need to make crunchy salads and oxygen."* |

---

## 4. Complete Game Concept

### 4.1 Player Identity & Role
The player is the **Lunar Outpost Commander**. They do not control an individual astronaut with a joystick; rather, they command the outpost's central operations terminal. They decide which structures to deploy on the lunar surface, how to route power and life support lines, how to schedule astronaut activities, and how to respond when alarms sound.

### 4.2 The Environment: Lunar South Pole (Shackleton Crater Rim)
* **Location**: 89.9°S, 0.0°E, elevated ridge (+4,250 m above local datum).
* **Sunlight**: "Peak of Eternal Light" featuring low-angle grazing sunlight for ~86% of the lunar year, punctuated by prolonged shadow periods lasting 50 to 100 continuous hours.
* **Temperature**: Sunlit surface reaches $+55^\circ\text{C}$; shadowed surface drops to $-180^\circ\text{C}$; interior crater floor cold traps drop to $40\text{ K}$ ($-233^\circ\text{C}$).
* **Atmosphere**: Hard vacuum ($0.0\text{ kPa}$).
* **Gravity**: $1.62\text{ m/s}^2$ (approximately $1/6\text{th}$ of Earth's gravity).

### 4.3 Five Distinct Educational Modalities
The game deliberately integrates five different pedagogical modes so it never degenerates into a quiz:
1. **Interactive Tutorials**: Hands-on guided construction (e.g., placing your first solar array and seeing the power cable glow green).
2. **Interactive Science Experiments**: Sandbox sliders inside building detail panels (e.g., adjusting the CDRA fan speed and observing how power consumption drops while CO₂ climbs).
3. **Outpost Resource Management**: Macro-level balancing of daily energy production, battery storage, air quality, and greenhouse yields.
4. **Emergency Anomaly Response**: Real-time crisis interventions when space weather sirens sound or airlocks leak.
5. **Mission Evaluation & Debriefing**: Post-action reflection linking player decisions to real NASA flight history and biological research.

---

## 5. Mission Narrative and Gameplay Flow

The mission spans **10 to 15 Sols** (lunar operational cycles), structured across four progressive phases:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MISSION PROGRESSION MAP                         │
│                                                                        │
│   Phase 1: Arrival & Life Support Setup (Sols 1–3)                     │
│   • Land Orion/Lander ──► Deploy Solar Grid ──► Pressurize Habitat    │
│                 │                                                      │
│                 ▼                                                      │
│   Phase 2: Radiation Defense & Expansion (Sols 4–6)                    │
│   • Excavate Regolith ──► Bury Habitats ──► Survive First Solar Storm │
│                 │                                                      │
│                 ▼                                                      │
│   Phase 3: Deep Freeze & Sustainable Food (Sols 7–10)                  │
│   • Endure 72h Shadow ──► Ration Battery Bank ──► Harvest CSA Crops    │
│                 │                                                      │
│                 ▼                                                      │
│   Phase 4: Mission Debrief & Certification (Post-Mission)              │
│   • Review Survivability Score ──► Earn NASA Badges ──► Unlock Mars   │
└────────────────────────────────────────────────────────────────────────┘
```

### Stage-by-Stage Breakdown

#### Stage 1: Introduction & Touchdown (Sol 1)
* **What the Child Sees**: A top-down 2D lunar ridge landscape. The Artemis Human Landing System (HLS) touches down, kicking up regolith dust. M.I.L.O. boots up with friendly dialogue: *"Welcome to Shackleton Rim, Commander! Our lander batteries only have 6 hours of charge. Let's get our solar arrays deployed before the sun dips!"*
* **What the Child Interacts With**: The Left Panel (Construction Menu). Drag-and-drop 2 Solar Panels onto designated anchor tiles. Connect power cables to the HLS Habitat Module.
* **What is Learned**: Power generation is the prerequisite for all life support. Solar panels must face the sun.

#### Stage 2: Life Support Activation (Sol 2)
* **What the Child Sees**: Inside the habitat module, the air tank indicator is yellow. Crew members arrive inside the airlock.
* **What the Child Interacts With**: Open the Life Support Sub-Panel. Power on the Oxygen Electrolyzer and CDRA CO₂ Scrubber. Observe the Oxygen meter rise from 60 to 100 kPa and CO₂ drop to safe levels (<0.4 kPa).
* **What is Learned**: Astronauts consume oxygen constantly and exhale toxic carbon dioxide. Both gases must be actively managed with electrical equipment.

#### Stage 3: Establishing Communications (Sol 3)
* **What the Child Sees**: A flashing Earth icon on the Right Panel. The signal is weak.
* **What the Child Interacts With**: Build a High-Gain S-Band Dish Antenna. Orient it toward Earth. The communication latency indicator displays `1.28s` one-way delay.
* **What is Learned**: Radio waves travel at the speed of light. Even close to Earth, signals have a measurable delay.

#### Stage 4: Radiation Protection & Regolith Excavation (Sols 4–5)
* **What the Child Sees**: M.I.L.O. displays an alert from NASA DONKI: an active sunspot has formed on the Sun. Background cosmic rays are ticking the dosimeter upward.
* **What the Child Interacts With**: Deploy the Excavator Rover. Scoop up lunar regolith (soil) and dump it over the Habitat Module roof. Watch the radiation shielding efficiency meter jump from 20% to 85%.
* **What is Learned**: In space, there is no thick Earth atmosphere or magnetic field to block radiation. Soil mass (regolith) acts as an armor blanket.

#### Stage 5: First Space Weather Anomaly (Sol 6)
* **What the Child Sees**: Siren sounds. NASA DONKI warning banner: `M-Class Solar Flare Detected. Protons inbound in 45 minutes!`
* **What the Child Interacts With**: Decision emergency prompt: (A) Order astronauts into the Subterranean Storm Shelter, or (B) Keep EVA astronauts outside finishing solar panel wiring. If (A), astronauts are protected but construction halts; if (B), power grid finishes but astronaut radiation dose spikes into yellow warning territory.
* **What is Learned**: Solar storms travel fast. Crew safety must always take priority over work schedules.

#### Stage 6: The Long Shadow / Thermal Challenge (Sols 7–8)
* **What the Child Sees**: The grazing solar angle drops behind a mountain ridge. Sunlight disappears. Solar generation drops to 0 kW. Exterior temperature plummets to $-180^\circ\text{C}$.
* **What the Child Interacts With**: Manage the Power Distribution Panel. Battery reserves are draining rapidly. The player must load-shed: turn off non-essential research lights and heaters while keeping oxygen scrubbers and crew quarters warm.
* **What is Learned**: Batteries store energy (kWh). When the sun vanishes, every watt consumed drains your survival clock.

#### Stage 7: Food Production & Hydroponics (Sols 9–10)
* **What the Child Sees**: Pre-packaged food rations are dropping. Astronaut morale is showing mild fatigue.
* **What the Child Interacts With**: Construct the CSA Hydroponic Greenhouse Module. Plant Outredgeous Red Romaine Lettuce. Balance water recycling tubes and LED grow lights. On Sol 10, harvest fresh greens for a +20% crew health and morale boost.
* **What is Learned**: Plants recycle carbon dioxide back into oxygen and provide vital fresh vitamins that packaged space food loses over time.

#### Stage 8: Mission Debrief & Certification (Post-Sol 10)
* **What the Child Sees**: Artemis capsule return burn. A comprehensive, beautifully formatted Mission Certificate signed by M.I.L.O. and NASA.
* **What is Learned**: Detailed breakdown of their choices: total kWh generated, total kg of water recycled, total radiation dose avoided, and a personalized learning lesson.

---

## 6. Game Systems and Subsystems

### 6.1 Subsystem Overview Matrix

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           INTER-SUBSYSTEM COUPLING                              │
├─────────────────────┬───────────────────────┬───────────────────────────────────┤
│ Subsystem           │ Primary Inputs        │ Primary Outputs / Beneficiaries   │
├─────────────────────┼───────────────────────┼───────────────────────────────────┤
│ 1. Electrical Power │ Solar / Fission / Batt│ Drives ECLSS, Heating, Pumps, Comms│
│ 2. Life Support     │ Power, Water, Consum. │ Breathable O₂, Low CO₂, Pressure │
│ 3. Thermal Control  │ Electric Heat / MLI   │ Prevents Equipment Freeze/Boil    │
│ 4. Food Production  │ Power, Water, CO₂     │ Caloric Food, O₂, Morale Boost   │
│ 5. Radiation Shield │ Regolith Mass, Vault  │ Prevents Cell DNA Damage / Sickness│
│ 6. Communications   │ Power, Line-of-Sight  │ Earth Telemetry, Science Data, AI │
└─────────────────────┴───────────────────────┴───────────────────────────────────┘
```

---

### 6.2 Life Support System (ECLSS)

#### A. Purpose
To maintain a safe, pressurized, breathable atmospheric envelope and clean closed-loop water supply inside the habitat modules.

#### B. Scientific Foundation & Core Distinctions
* **Cabin Pressure vs. Oxygen Partial Pressure**:
  * *Cabin Pressure ($P_{total}$)*: Total mechanical force of air against habitat walls and human body. Nominal Earth standard is $101.3\text{ kPa}$ (14.7 psi). Exploration standard (NASA-STD-3001) is $70.3\text{ kPa}$ (10.2 psi) or $56.5\text{ kPa}$ (8.2 psi) to enable faster EVA airlock pre-breathing without decompression sickness (the bends).
  * *Oxygen Partial Pressure ($pO_2$)*: The actual amount of oxygen available for blood hemoglobin saturation. Nominal is $21.3\text{ kPa}$. If $pO_2 < 16\text{ kPa}$, crew experiences hypoxia (night vision loss, lethargy); if $pO_2 < 12\text{ kPa}$, confusion and fainting occur. If oxygen percentage exceeds $24.1\%$ at sea level or $pO_2 > 30\text{ kPa}$, materials become highly flammable (Apollo 1 fire hazard).
  * *Carbon Dioxide Partial Pressure ($pCO_2$)*: Clean air is $<0.04\text{ kPa}$. In closed spaces, crew exhales $1.00\text{ kg } CO_2/\text{day}$. If $pCO_2 > 0.70\text{ kPa}$ (5.3 mmHg), headaches, dizziness, and cognitive decline begin. If $pCO_2 > 1.33\text{ kPa}$, severe acidosis and incapacitation occur.
* **Metabolic Constants (NASA Life Support BVAD)**:
  * Crew Member $O_2$ consumption: $0.84\text{ kg/day}$ ($0.035\text{ kg/hour}$).
  * Crew Member $CO_2$ expiration: $1.00\text{ kg/day}$ ($0.0417\text{ kg/hour}$).
  * Crew Member Drinking Water: $2.50\text{ kg/day}$; Hygiene Water: $2.00\text{ kg/day}$.
  * Urine produced: $1.50\text{ kg/day}$; Sweat & breath condensation: $1.80\text{ kg/day}$.

#### C. Subsystem Components & Dependencies
1. **Oxygen Generation Assembly (OGA / Electrolyzer)**:
   * *Formula*: $2\text{H}_2\text{O} \to 2\text{H}_2 + \text{O}_2$.
   * *Input*: $1.0\text{ L } H_2O$ liquid + $4.5\text{ kWh}$ electrical energy.
   * *Output*: $0.888\text{ kg } O_2$ gas + $0.112\text{ kg } H_2$ gas (vented or fed to Sabatier).
2. **Carbon Dioxide Removal Assembly (CDRA)**:
   * *Mechanism*: Dual-bed thermal swing amine or zeolite molecular sieves.
   * *Input*: $1.2\text{ kW}$ continuous electric power.
   * *Output*: Absorbs up to $4.2\text{ kg } CO_2/\text{day}$ from cabin air.
3. **Water Recovery System (WRS)**:
   * *Urine Processor Assembly (UPA)*: Vacuum rotary distillation recovering $93\%$ of water from urine. Consumes $0.35\text{ kW}$.
   * *Water Processor Assembly (WPA)*: Particulate filtration, catalytic oxidation, and ultraviolet disinfection recovering $98\%$ of gray water (sweat, hygiene). Consumes $0.40\text{ kW}$.

#### D. Controls, Degraded States & Indicators
* **Player Controls**: Set cabin target pressure ($70.3\text{ kPa}$ vs. $101.3\text{ kPa}$); toggle OGA on/off; toggle CDRA fan speed (Eco $0.6\text{ kW}$ / Normal $1.2\text{ kW}$ / Boost $2.0\text{ kW}$); emergency oxygen tank dump.
* **Normal Operation**: $O_2$ partial pressure stable at $21\text{ kPa}$; $CO_2$ held at $0.35\text{ kPa}$; potable water tank full.
* **Degraded Operation**: Power shortage forces CDRA off $\to$ $CO_2$ steadily increases by $+0.17\text{ kPa/hour}$ for a 4-person crew. Crew stamina drops by $-10\%/\text{hour}$.
* **Failure State**: $pO_2 < 12\text{ kPa}$ or $pCO_2 > 1.3\text{ kPa} \implies$ Medical emergency alert, mission debrief triggered.
* **HUD Indicators**: Circular gas composition dial (Green = Nominal, Yellow = Warning, Red = Danger); Water storage bar graph (Potable blue, Gray yellow).

---

### 6.3 Electrical Power System (EPS)

#### A. Purpose
To harvest environmental energy, store it in electrochemical reserves, and distribute electrical power continuously to life-critical and operational loads.

#### B. Scientific Foundation & Core Distinctions
* **Power ($\text{kW}$) vs. Energy ($\text{kWh}$)**:
  * *Power ($\text{kW}$)*: Instantaneous rate of energy production or consumption. (e.g., A solar array generating $20\text{ kW}$ right now).
  * *Energy ($\text{kWh}$)*: Accumulated power over time. (e.g., A battery storing $100\text{ kWh}$ can supply a $10\text{ kW}$ life-support load for exactly $10\text{ hours}$).
* **Solar Irradiance at Lunar Surface**:
  * Solar Constant: $I_0 \approx 1,361\text{ W/m}^2$ (AM0).
  * Triple-junction GaAs space solar cells achieve $\approx 30\%$ conversion efficiency under ideal perpendicular alignment.
  * *Mathematical Generation Formula*:
    $$P_{\text{solar}} = A \cdot I_0 \cdot \eta \cdot \cos(\theta) \cdot (1 - \delta_{\text{dust}})$$
    Where $A$ is array surface area ($m^2$), $\eta = 0.30$, $\theta$ is incidence angle relative to normal, and $\delta_{\text{dust}}$ is regolith dust obscuration factor ($0.0$ to $0.80$).
* **Storage Degradation & Depth of Discharge (DoD)**:
  * Lithium-ion space cells operate with high round-trip efficiency ($92\%$), but cycle life degrades if DoD exceeds $80\%$. Batteries must be thermally maintained between $+0^\circ\text{C}$ and $+30^\circ\text{C}$; if batteries freeze below $-20^\circ\text{C}$, internal electrolyte resistance spikes and capacity drops by $60\%$.
* **Kilopower Nuclear Fission Option**:
  * KRUSTY reactor provides $10\text{ kWe}$ continuous baseload power regardless of sun or dust, but requires heat pipe radiators and a $100\text{ m}$ exclusion safety perimeter.

#### C. Power Priority Architecture (Load Shedding Hierarchy)

| Priority Level | Subsystem Category | Systems Included | Shedding Rule |
| :---: | :--- | :--- | :--- |
| **Tier 1 (Critical)** | Core Life Support | Cabin Circulation Fans, CDRA Scrubbers, Emergency Oxygen | **Never shed automatically**. If power runs out, batteries drain to zero. |
| **Tier 2 (Essential)** | Thermal Base & Health | Module Base Heaters, Water Recycler, Medical Monitors | Shed only when battery drops below **$20\%$**. |
| **Tier 3 (Operational)**| Food & Science | Hydroponic LED Lights, Rover Recharging Stations | Shed automatically when battery drops below **$40\%$**. |
| **Tier 4 (Discretionary)**| Non-Critical Research | High-Gain Ka-band Antenna, Rock Core Analyzers, Exterior Floodlights | Shed automatically when battery drops below **$60\%$**. |

#### D. Controls, Degraded States & Indicators
* **Player Controls**: Place solar arrays; connect cables; toggle Tier 3/4 circuit breakers; deploy rover to dust solar panels; toggle battery reserve lock.
* **HUD Indicators**: Real-time balance bar: Generation (Green) vs. Consumption (Orange); Battery State of Charge (SoC %) with estimated hours of remaining buffer.

---

### 6.4 Thermal Control System (TCS)

#### A. Purpose
To maintain the habitat modules, battery banks, and greenhouse within habitable temperature limits ($+18^\circ\text{C}$ to $+24^\circ\text{C}$) despite exterior lunar swings between $+55^\circ\text{C}$ and $-180^\circ\text{C}$.

#### B. Scientific Foundation
* **Vacuum Heat Transfer Reality**: On the Moon, there is no ambient air. Therefore, **zero convective cooling or warming** occurs. Heat moves purely via **conduction** (through ground contact with regolith) and **radiation** (emitting infrared photons into space or absorbing solar radiation).
* **Multi-Layer Insulation (MLI)**: Reflective aluminized Mylar blankets reject solar heat in daylight and trap thermal radiation at night.
* **Heat Rejection vs. Heating Needs**:
  * During Lunar Day: Electronics and humans produce excess heat that must be pumped via fluid loops to shaded titanium radiators facing cold deep space ($3\text{ K}$).
  * During Lunar Shadow: The habitat loses heat rapidly through radiator surfaces; electric heaters ($2.5\text{ kW}$) must engage to prevent water pipe freezing.

#### C. Controls, Degraded States & Indicators
* **Player Controls**: Deploy/retract deployable radiator shades; adjust habitat thermostat; activate secondary electric heat coils.
* **Degraded State**: Power brownout forces heaters off during a 72-hour shadow $\to$ module temperature drops at $3.5^\circ\text{C}/\text{hour}$. At $+5^\circ\text{C}$, hydroponic plants enter dormancy; at $0^\circ\text{C}$, water recycling lines freeze and rupture.
* **HUD Indicators**: Module interior thermometer gauge; radiator thermal dissipation bar.

---

### 6.5 Space Agriculture & Food Production System

#### A. Purpose
To grow fresh, vitamin-rich crops in closed-loop hydroponics, providing sustainable calories, psychological morale benefits, and biological carbon-dioxide-to-oxygen conversion.

#### B. Scientific Foundation (NASA Veggie & CSA Food Toolkit)
* **Photosynthetic Gas Exchange**:
  $$6\text{CO}_2 + 6\text{H}_2\text{O} \xrightarrow{\text{LED Light}} \text{C}_6\text{H}_{12}\text{O}_6 + 6\text{O}_2$$
* **Transpiration Water Loop**: Plants absorb liquid water and release $95\%$ of it as clean water vapor into cabin air. ECLSS condensing heat exchangers capture this vapor, yielding naturally distilled potable water.
* **Validated Crop Candidates**:

| Crop Candidate | Growth Duration | Photoperiod (Light) | Power Draw | Calories / Harvest | Morale Boost | Dual-Benefit Earth Connection |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Outredgeous Lettuce** | 28 days | 16 hours/day | 45 W/tray | 150 kcal | $+15\%$ | High-efficiency indoor vertical farming in dense urban centers. |
| **Cherry Belle Radish** | 21 days | 14 hours/day | 35 W/tray | 110 kcal | $+10\%$ | Fast emergency crop; edible taproot and vitamin-rich greens. |
| **Apogee Dwarf Wheat** | 60 days | 20 hours/day | 85 W/tray | 2,400 kcal | $+20\%$ | Dense carbohydrate foundation for multi-month survival. |
| **Micro-Tom Tomato** | 70 days | 18 hours/day | 80 W/tray | 450 kcal | $+25\%$ | Fresh lycopene and antioxidants combating space radiation stress. |

#### C. Controls, Degraded States & Indicators
* **Player Controls**: Select crop seeds per tray; toggle LED lighting schedule; allocate nutrient fluid doses; harvest mature crops.
* **Degraded State**: If lights are cut during a power crisis for $>36\text{ hours}$, crop health declines by $-25\%/\text{day}$. If water is depleted, crops wilt within 24 hours.
* **HUD Indicators**: Tray growth progress bar (0–100%); Plant health heart icon; Days to harvest counter.

---

### 6.6 Radiation Protection System

#### A. Purpose
To shield astronauts from acute and chronic deep-space ionizing radiation, keeping cumulative exposure within NASA Permissible Exposure Limits (PEL).

#### B. Scientific Foundation & Space Weather Distinctions
* **Galactic Cosmic Rays (GCR)**:
  * Origin: Supernovae and deep space outside our solar system.
  * Nature: Relativistic, omnidirectional heavy ions (protons, alpha particles, high-Z and high-energy iron nuclei).
  * Surface Dose: Constant background rate of $\approx 1.36\text{ mSv/day}$ on the lunar surface (reduced from deep space's $1.8\text{ mSv/day}$ because the Moon's bulk shields half the sky).
* **Solar Energetic Particle (SEP) Events**:
  * Origin: Accelerated by Solar Flares and Coronal Mass Ejection (CME) shock waves.
  * Nature: Intense streams of energetic protons arriving in directional waves within 20 minutes to several hours of a solar eruption.
  * Surface Dose: Unshielded flux can spike to $>100 - 500\text{ mSv/hour}$, capable of causing Acute Radiation Syndrome (ARS) within hours if unprotected.
* **Solar Flare vs. CME Distinctions**:
  * *Solar Flare*: A burst of electromagnetic radiation (light, X-rays, UV) traveling at light speed ($c$). Arrives in **8.3 minutes**. Primarily causes radio communication blackouts.
  * *Coronal Mass Ejection (CME)*: A multi-billion-ton magnetized cloud of plasma and accelerated particles traveling at $400 - 2,000\text{ km/s}$. Arrives in **18 to 48 hours**. Causes dangerous proton storms and geomagnetic disturbances.
* **Shielding Physics & Half-Value Layer (HVL)**:
  $$\text{Dose}_{\text{transmitted}} = \text{Dose}_{\text{incident}} \times (0.5)^{\text{Thickness} / \text{HVL}}$$
  * Lunar Regolith: $\text{HVL} = 18.0\text{ cm}$ ($\rho \approx 1.5\text{ g/cm}^3$).
  * Water Shield: $\text{HVL} = 14.5\text{ cm}$.
  * Polyethylene: $\text{HVL} = 12.0\text{ cm}$.
  * A **$1.5\text{ m}$ lunar regolith berm** provides $>8$ half-value layers, blocking $>99.6\%$ of solar proton flux!

#### C. Controls, Degraded States & Indicators
* **Player Controls**: Direct rover to pile regolith onto habitat roofs; sound the Storm Shelter Alarm (ordering astronauts into the underground vault); deploy water-bladder storm curtains.
* **HUD Indicators**: Real-time dosimeter ($\mu\text{Sv/hour}$ gauge); Cumulative astronaut dose meter (mSv); Active solar weather warning banner (from NASA DONKI feed).

---

### 6.7 Communications & Deep Space Telemetry

#### A. Purpose
To maintain radio data links with Earth Mission Control and relay satellites, enabling live telemetry downlink, science data transmission, and communication with M.I.L.O.'s ground database.

#### B. Scientific Foundation & Core Distinctions
* **Speed-of-Light Delay vs. Complete Communication Loss**:
  * *Transmission Delay*: The Moon is on average $384,400\text{ km}$ from Earth. Radio waves traveling at $c = 299,792\text{ km/s}$ take **$1.28\text{ seconds}$** each way (round-trip lag: $\mathbf{2.56\text{ seconds}}$). This is a predictable, constant latency.
  * *Communication Blackout*: Complete loss of signal caused by solar flare radio ionization, terrain obstruction (roving into a deep crater out of line-of-sight), or antenna motor failure.
* **Antenna Power Draw**: High-gain steerable parabolic dish consumes $0.35\text{ kW}$ tracking Earth. Omni-directional patch antennas draw $0.05\text{ kW}$ but only support low-bandwidth emergency text.

#### C. Controls, Degraded States & Indicators
* **Player Controls**: Toggle antenna between High-Gain (Science/Video, high power) and Low-Gain (Emergency telemetry, low power); trigger Earth consultation requests.
* **HUD Indicators**: Signal strength meter (dBm); Latency clock (`1.28s`); Link status icon (Live / Degraded / Blackout).

---

## 7. Resource Model

### 7.1 Primary & Secondary Resource Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                 RESOURCE ARCHITECTURE                                   │
├─────────────────────────┬─────────────────────────┬─────────────────────────────────────┤
│ Level                   │ Resource Name           │ Unit / Representation               │
├─────────────────────────┼─────────────────────────┼─────────────────────────────────────┤
│ **Primary Resources**   │ Electrical Energy       │ Kilowatt-hours (kWh) & % SoC        │
│                         │ Cabin Oxygen            │ kg O₂ & Partial Pressure (kPa)      │
│                         │ Potable Water           │ Liters (L)                          │
│                         │ Radiation Shielding     │ Regolith Thickness (cm) & % Blocked │
├─────────────────────────┼─────────────────────────┼─────────────────────────────────────┤
│ **Secondary Resources** │ Food Rations & Produce  │ Kilocalories (kcal) & Salad Units   │
│                         │ Gray / Waste Water      │ Liters (L)                          │
│                         │ Habitat Regolith Mass   │ Metric Tons (t)                     │
│                         │ Spare Parts / Filters   │ Mechanical Units                    │
├─────────────────────────┼─────────────────────────┼─────────────────────────────────────┤
│ **Human Indicators**    │ Crew Health / Stamina   │ 0–100% per Astronaut                │
│                         │ Radiation Dose          │ Cumulative Millisieverts (mSv)      │
│                         │ Crew Morale             │ 0–100% (Affected by fresh food)     │
└─────────────────────────┴─────────────────────────┴─────────────────────────────────────┘
```

### 7.2 Core Governing Mathematical Relationships

1. **Net Power Flow Equation**:
   $$P_{\text{net}}(t) = P_{\text{solar}}(t) + P_{\text{fission}} - \sum P_{\text{consumers}}(t)$$
   $$\text{Battery}(t + \Delta t) = \text{clamp}\left(\text{Battery}(t) + P_{\text{net}}(t) \cdot \Delta t \cdot \eta_{\text{chg}}, \ 0, \ \text{Capacity}_{\text{max}}\right)$$

2. **Oxygen Balance Equation**:
   $$O_{2}(t + \Delta t) = O_{2}(t) + \left(\dot{M}_{O_2,\text{OGA}} + \dot{M}_{O_2,\text{plants}} - N_{\text{crew}} \cdot 0.035\text{ kg/hr}\right) \cdot \Delta t$$

3. **Carbon Dioxide Accumulation Equation**:
   $$CO_{2}(t + \Delta t) = CO_{2}(t) + \left(N_{\text{crew}} \cdot 0.0417\text{ kg/hr} - \dot{M}_{CO_2,\text{CDRA}} - \dot{M}_{CO_2,\text{plants}}\right) \cdot \Delta t$$

4. **Radiation Dose Transmission Equation**:
   $$\text{DoseRate}(t) = \left(\text{Rate}_{\text{GCR}} + \text{Rate}_{\text{SEP}}(t)\right) \cdot (0.5)^{\text{Thickness}_{\text{regolith}} / 18.0}$$

---

## 8. Detailed Engineering Trade-off System

Every major decision in the game is an authentic engineering trade-off. There are **no universally correct answers**; each choice prioritizes one survival pillar while accepting a calculated risk in another.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        THE CORE TRADE-OFF TRIANGLE                     │
│                                                                        │
│                              [ POWER ]                                 │
│                               ▲     ▲                                  │
│                              ╱       ╲                                 │
│                   Drives   ╱           ╲   Powers                      │
│                  Scrubbers╱             ╲  Radiation                   │
│                          ▼               ▼ Deflector                   │
│                   [ OXYGEN ] ◄─────────► [ SHIELDING ]                 │
│                              Compete For                               │
│                           Payload Mass/Energy                          │
└────────────────────────────────────────────────────────────────────────┘
```

---

### Trade-off 1: Life Support Scrubbing vs. Greenhouse Lighting
* **The Situation**: A dust coating has reduced solar array output by $35\%$. Available power is $3.2\text{ kW}$, but running both the CDRA CO₂ scrubber ($1.2\text{ kW}$) and the hydroponic LED grow arrays ($2.5\text{ kW}$) requires $3.7\text{ kW}$.
* **The Dilemma**: Essential human breathing vs. biological food production.
* **Options Table**:

| Choice | Immediate Consequence | Delayed Consequence | Risk | Scientific Lesson |
| :--- | :--- | :--- | :--- | :--- |
| **Option A: Priority to Life Support** | CDRA runs at 100%. $CO_2$ stays clean ($0.35\text{ kPa}$). Greenhouse lights turned off. | Crops enter dark dormancy. Harvest delayed by 2 Sols. Morale bonus postponed. | If lights remain off $>48\text{ h}$, crops wilt and die, wasting invested water. | Human survival always comes first; crops can endure temporary darkness, but humans cannot endure toxic $CO_2$. |
| **Option B: Priority to Greenhouse** | Greenhouse lights stay on. CDRA throttled to $50\%$ Eco Mode ($0.6\text{ kW}$). | $CO_2$ climbs from $0.35$ to $0.65\text{ kPa}$. Crew reports mild headaches. | If an unexpected second draw occurs, $CO_2$ may cross into toxic red alert ($>1.0\text{ kPa}$). | Plants take weeks to produce food; risking immediate human air quality for crop growth creates an acute crisis. |

* **Why Neither is Universally Correct**: If the crop is only 1 Sol away from harvest and will produce vital calories, a brief 4-hour throttle of the scrubber within safe medical margins ($<0.7\text{ kPa}$) might save the crop harvest without endangering crew lives.

---

### Trade-off 2: Module Heating vs. Scientific Research Telemetry
* **The Situation**: The outpost enters a 60-hour crater shadow. Battery reserves are at $45\%$.
* **The Dilemma**: Electric heaters consume $2.5\text{ kW}$; running the scientific mass spectrometer and high-gain Earth transmitter draws $1.8\text{ kW}$.
* **Options Table**:

| Choice | Immediate Consequence | Delayed Consequence | Risk | Scientific Lesson |
| :--- | :--- | :--- | :--- | :--- |
| **Option A: Full Thermal Comfort** | Radiator loop heaters powered. Module stays $+21^\circ\text{C}$. Research shut down. | Earth science milestone missed. Telemetry delayed. Battery drains at sustainable $-2.5\text{ kW}$. | Slower mission score progression, but zero physical danger to crew or equipment. | Cold is an absolute threat in space. If fluid pipes freeze at $-5^\circ\text{C}$, they burst and ruin the base permanently. |
| **Option B: Maintain Science Operations** | Heaters dialed to minimum ($1.0\text{ kW}$). Science instruments broadcast data to Earth. | Module temperature drops to $+8^\circ\text{C}$. Astronauts put on heavy flight suits. | If shadow lasts longer than expected, module hits freezing point ($0^\circ\text{C}$); pipe rupture disaster. | Scientific curiosity must be weighed against thermal survival margins. |

---

### Trade-off 3: Radiation Shielding Excavation vs. Surface Exploration
* **The Situation**: NASA DONKI reports sunspot AR3664 is expanding. Probability of an M-Class flare within 48 hours is $75\%$.
* **The Dilemma**: The single multi-purpose rover can either be used to bulldoze regolith onto the habitat roof or travel 3 km to explore an ice-rich shadowed crater.
* **Options Table**:

| Choice | Immediate Consequence | Delayed Consequence | Risk | Scientific Lesson |
| :--- | :--- | :--- | :--- | :--- |
| **Option A: Regolith Roof Shielding** | Rover spends 2 Sols excavating and piling $50\text{ cm}$ of regolith over modules. | Shielding reaches $88\%$. Habitat is completely safe from the upcoming flare. | Ice exploration canceled; outpost must rely on stored water reserves. | Prevention is survival. Constructing passive shielding before a storm hits eliminates acute radiation risk. |
| **Option B: Ice Prospecting Sortie** | Rover sorties into crater floor; discovers $250\text{ kg}$ of water ice in permanent shadow. | Outpost water and oxygen reserves secured for the entire 15-Sol mission. | Solar flare arrives while astronauts/rover are on the surface; severe radiation dose incurred. | Greed for resources during an active space weather watch can expose astronauts to lethal proton blasts. |

---

### Trade-off 4: Battery Reserve Conservation vs. Rapid Daytime Expansion
* **The Situation**: Midday solar generation is peak ($+25\text{ kW}$).
* **The Dilemma**: Charge the secondary emergency battery bank to $100\%$ vs. run the high-power Regolith Sintering 3D Printer to construct a second airlock.
* **Options Table**:

| Choice | Immediate Consequence | Delayed Consequence | Risk | Scientific Lesson |
| :--- | :--- | :--- | :--- | :--- |
| **Option A: Maximize Battery Reserves** | Energy diverted to storage; 3D printer sits idle. | Nightfall arrives with $100\text{ kWh}$ stored buffer. Full peace of mind. | Base expansion delayed; crew remains in cramped single module. | Energy storage is life insurance on the Moon. Without batteries, lunar night is fatal. |
| **Option B: Run Heavy Manufacturing** | 3D printer draws $18\text{ kW}$; new airlock built. Batteries only charge to $55\%$. | Base capacity doubles; crew gets separate research room (+morale). | If an unexpected shadow or dust event occurs, the battery runs out before sunrise. | Infrastructure expansion is useless if you don't have the baseline energy reserves to keep it powered. |

---

### Trade-off 5: Closed-Loop Water Recycling vs. Consumable Filter Wear
* **The Situation**: The Water Recovery System filter membrane has reached $85\%$ contamination.
* **The Dilemma**: Replace the filter with the outpost's last spare cartridge now, or run the degraded filter at high power while consuming backup emergency water tanks.
* **Options Table**:

| Choice | Immediate Consequence | Delayed Consequence | Risk | Scientific Lesson |
| :--- | :--- | :--- | :--- | :--- |
| **Option A: Install Last Spare Filter** | Water recovery efficiency restored to $98\%$. Pure potable water flows. | Spare parts inventory hits zero. No backup if another mechanical fault strikes. | A future filter clog cannot be repaired; will require water rationing. | Preventive maintenance maintains high efficiency, but depletes mission spare reserves. |
| **Option B: Run Degraded Filter + Backup Water** | Water processor throttled to $75\%$ efficiency to prevent blowout. Backup tank opened. | Emergency water tank drains by $-15\text{ L/day}$. Spare filter preserved. | Emergency water reserve is depleted; if a pipe leaks later, no reserves remain. | Running damaged machinery risks total subsystem failure and burns non-renewable safety margins. |

---

### Trade-off 6: High-Gain Earth Comms vs. Electrical Conservation
* **The Situation**: Low power state ($15\%$ battery remaining).
* **The Dilemma**: Keep the High-Gain Ka-band Tracking Dish powered to transmit real-time video/health telemetry to Houston/Earth, or power down the transmitter and switch to passive Low-Gain beacon mode.
* **Options Table**:

| Choice | Immediate Consequence | Delayed Consequence | Risk | Scientific Lesson |
| :--- | :--- | :--- | :--- | :--- |
| **Option A: High-Gain Comms Active** | Draws $0.35\text{ kW}$. Earth Mission Control provides AI evaluation and assistance. | Battery drains 2 hours faster. | If battery hits zero, core life support shuts down. | Staying in touch with Earth provides valuable advice, but is useless if the base loses power. |
| **Option B: Switch to Low-Gain Beacon** | Saves $0.30\text{ kW}$. Earth receives only basic pulse telemetry. AI assistant enters offline mode. | Earth cannot diagnose complex anomalies; player must make decisions alone. | An unexpected system fault must be solved without Earth flight controller guidance. | Autonomous outpost survival requires local decision-making when communications are curtailed. |

---

## 9. Comprehensive Anomaly and Space Phenomenon Catalogue

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                ANOMALY TAXONOMY                                        │
├─────────────────────┬──────────────────────────────────────────────────────────────────┤
│ Category            │ Phenomena & Malfunctions Included                                │
├─────────────────────┼──────────────────────────────────────────────────────────────────┤
│ **Space Weather**   │ Solar Flares, Coronal Mass Ejections, Solar Proton Storms        │
│ **Lunar Surface**   │ Micrometeoroids, Regolith Dust Contamination, 72h Crater Shadow │
│ **ECLSS & Internal**│ Pressure Hull Leak, CDRA Scrubber Failure, Electrolyzer Fault    │
│ **Electrical/Power**│ Solar Array Junction Burnout, Battery Cold Trap, Inverter Trip   │
│ **Operational**     │ Rover Wheel Regolith Jam, Earth Radio Conjunction Blackout       │
└─────────────────────┴──────────────────────────────────────────────────────────────────┘
```

---

### Anomaly 1: M-Class / X-Class Solar Energetic Particle Event (Space Weather)
1. **Scientific Explanation**: Magnetic reconnection in the solar corona violently accelerates protons and ions into interplanetary space at velocities exceeding $1,000\text{ km/s}$.
2. **Physical Cause**: Solar Active Region (Sunspot) magnetic field collapse.
3. **Environmental Conditions**: Occurs during solar maximum or active space weather windows.
4. **Classification**: Natural External Phenomenon.
5. **Subsystems Affected**: Radiation Dosimetry, Human Health, Exterior Electronics, High-Gain Radio.
6. **Detection**: NASA DONKI orbital coronagraph telemetry; outpost exterior dosimeter rate jump ($>150\text{ mSv/hr}$).
7. **Player Notification**: Klaxon alarm sounds. HUD displays: `DONKI ALERT: X1.2 Solar Proton Storm Inbound! Lead time: 35 minutes.`
8. **Indicators Changing**: Dosimeter needle pins into red; Solar Flare icon flashes on Right Panel.
9. **Severity Levels**: Level 1 (C-Class, monitor); Level 2 (M-Class, cancel EVAs); Level 3 (X-Class, immediate shelter).
10. **Situation Evolution**: If ignored, unshielded astronauts accumulate $>500\text{ mSv}$ within 3 hours, developing acute radiation sickness (nausea, stamina $-50\%$).
11. **Available Responses**:
    * *Response A*: Sound base-wide alarm; move crew into the Subterranean Regolith Storm Vault; angle solar panels edge-on.
    * *Response B*: Stay in standard module; activate electromagnetic shield coils (draws massive $15\text{ kW}$ power).
12. **Consequences**: Response A protects 100% of crew health with zero power draw, but halts all surface activities; Response B keeps surface work alive but severely drains battery reserves.
13. **Recovery Action**: Wait for DONKI all-clear (typically 12–24 hours); run diagnostic on exterior sensors.
14. **Scientific Lesson**: Solar flares give off light (arriving in 8 minutes), but the heavy proton shock wave arrives later (30 minutes to hours), giving astronauts a vital window to take shelter.
15. **Data Source**: NASA DONKI (`/FLR`, `/CME`, `/SEP` APIs).

---

### Anomaly 2: Micrometeoroid Pinhole Puncture (Surface Hazard)
1. **Scientific Explanation**: High-velocity orbital dust particles ($20 - 70\text{ km/s}$) penetrate the outer Whipple shield, puncturing the module pressure bladder.
2. **Physical Cause**: Cometary debris stream crossing lunar orbit.
3. **Environmental Conditions**: Unpredictable; higher risk during annual meteor showers.
4. **Classification**: External Physical Hazard.
5. **Subsystems Affected**: Cabin Pressure, Oxygen Reserves, Thermal Atmosphere.
6. **Detection**: Cabin pressure sensor detects steady drop ($dP/dt = -0.5\text{ kPa/min}$); audible hissing sound in module.
7. **Player Notification**: Red flashing warning: `DEPRESSURIZATION DETECTED: Cabin Pressure dropping! Current: 64 kPa.`
8. **Indicators Changing**: Cabin Pressure dial needles down; Oxygen reserve depletes at $3\times$ nominal rate.
9. **Severity Levels**: Minor Pinhole ($0.2\text{ kPa/min}$), Moderate Puncture ($1.0\text{ kPa/min}$), Catastrophic Breach ($>5.0\text{ kPa/min}$).
10. **Situation Evolution**: If ignored, cabin drops below $55\text{ kPa}$ within 15 minutes; crew must don emergency spacesuits; at $<45\text{ kPa}$, structural collapse and hypoxia occur.
11. **Available Responses**:
    * *Response A*: Deploy ultrasonic leak detector; seal breach with adhesive epoxy regolith patch kit (takes 10 minutes, costs 1 repair kit).
    * *Response B*: Isolate the punctured module by sealing internal pressure bulkhead doors (module is abandoned, crew retreats to main dome).
12. **Consequences**: Response A preserves the room and stops the leak, but uses a non-renewable patch kit; Response B saves the kit, but permanently shuts down whatever was in that room (e.g. greenhouse or lab).
13. **Recovery Action**: Repressurize cabin using backup nitrogen/oxygen reserves; inspect exterior hull.
14. **Scientific Lesson**: In vacuum, even a tiny millimeter-sized rock packs the kinetic energy of a rifle bullet because space debris travels tens of thousands of kilometers per hour.
15. **Data Source**: NASA Apollo Lunar Surface Experiments Package (ALSEP) meteorite impact records.

---

### Anomaly 3: Lunar Dust Contamination on Solar Panels (Surface Hazard)
1. **Scientific Explanation**: Extremely abrasive, electrostatically charged, jagged lunar regolith dust adheres to photovoltaic cover glass, scattering and blocking sunlight.
2. **Physical Cause**: Rocket landing plume, rover surface driving, or electrostatic levitation at terminator crossing.
3. **Environmental Conditions**: Arises after nearby rover operations or during low-angle sunrise.
4. **Classification**: Environmental Equipment Degradation.
5. **Subsystems Affected**: Electrical Power System (Solar Generation).
6. **Detection**: Solar array generation reads $40\%$ below theoretical expected clear-sky wattage for current sun angle.
7. **Player Notification**: Yellow telemetry flag: `EPS ADVISORY: Array Efficiency Reduced. Regolith dust coating detected on Solar Bank B.`
8. **Indicators Changing**: Power generation bar graph drops; Battery recharge rate slows.
9. **Severity Levels**: Light Dust ($-15\%$ power), Moderate Coating ($-40\%$ power), Severe Blinding ($-75\%$ power).
10. **Situation Evolution**: Power generation remains suppressed indefinitely until actively cleaned; battery cannot reach full charge before nightfall.
11. **Available Responses**:
    * *Response A*: Dispatch Cleaning Rover with electrostatic dust brush (draws $2\text{ kW}$ for 2 hours).
    * *Response B*: Pulse ultrasonic vibration transducers on array glass (consumes $1\text{ kWh}$ instant power).
    * *Response C*: Ignore and rely on secondary battery reserves.
12. **Consequences**: Response A restores $98\%$ power; Response B clears $70\%$ instantly; Response C risks a major blackout during the upcoming crater shadow.
13. **Recovery Action**: Calibrate array surface sensors; establish a rover traffic exclusion corridor upwind of solar fields.
14. **Scientific Lesson**: Lunar dust has no wind or water erosion to smooth it, so every grain is as sharp as crushed glass and carries an electric charge from solar ultraviolet rays.
15. **Data Source**: NASA Surveyor & Apollo Lunar Surface Journal dust reports.

---

### Anomaly 4: CDRA CO₂ Scrubber Desiccant Bed Saturation (Equipment Anomaly)
1. **Scientific Explanation**: The desiccant bed in the carbon dioxide removal system becomes waterlogged, preventing the amine material from adsorbing $CO_2$ molecules.
2. **Physical Cause**: Cabin humidity spike caused by an unsealed hydroponic greenhouse door or condensation pump fault.
3. **Environmental Conditions**: High indoor humidity ($>70\%$ RH).
4. **Classification**: Internal Mechanical Malfunction.
5. **Subsystems Affected**: ECLSS Atmosphere, Crew Cognitive Stamina.
6. **Detection**: $pCO_2$ sensor climbs from $0.35\text{ kPa}$ past $0.65\text{ kPa}$; humidity sensor flags condensation.
7. **Player Notification**: Audio chime: `ECLSS WARNING: Carbon Dioxide Scrubber Efficiency Low. pCO2 climbing: 0.72 kPa.`
8. **Indicators Changing**: Air Quality bar turns yellow; Crew stamina recovery rate drops by $-30\%$.
9. **Severity Levels**: Bed Moisture Saturation (mild, $+0.1\text{ kPa/hr}$), Valve Jam (moderate), Thermal Core Burnout (severe).
10. **Situation Evolution**: Within 6 hours, $pCO_2$ crosses $1.0\text{ kPa}$; astronauts complain of pounding headaches and visual fuzziness.
11. **Available Responses**:
    * *Response A*: Execute thermal regeneration bake-out cycle (diverts $2.0\text{ kW}$ heat for 3 hours to bake off moisture into space vacuum).
    * *Response B*: Swap in disposable lithium hydroxide (LiOH) emergency backup chemical canisters.
12. **Consequences**: Response A is renewable but consumes precious electrical power; Response B preserves electricity but burns through finite, non-renewable emergency LiOH cans.
13. **Recovery Action**: Re-seal greenhouse humidity airlock; verify condensing heat exchanger drainage.
14. **Scientific Lesson**: In a closed spaceship, human beings produce water vapor and carbon dioxide simultaneously; managing moisture is critical because damp air can ruin the chemical filters that keep air breathable.
15. **Data Source**: NASA International Space Station ECLSS Operational Anomalies Log.

---

### Anomaly 5: Water Recovery Distillation Centrifuge Jam (Equipment Anomaly)
1. **Scientific Explanation**: Calcium and sulfate precipitates in the urine distillation assembly form hard scale, seizing the rotating vacuum centrifuge.
2. **Physical Cause**: High concentration of calcium excreted in astronaut urine due to microgravity bone mineral loss.
3. **Environmental Conditions**: Occurs on missions running $>7$ Sols without chemical pre-treat flush.
4. **Classification**: Internal Chemical/Mechanical Failure.
5. **Subsystems Affected**: Water Recovery System, Potable Water Reserves.
6. **Detection**: UPA centrifuge motor draws high amperage ($12\text{ A}$ vs. nominal $3\text{ A}$) and automatically trips circuit breaker.
7. **Player Notification**: Alarm: `WRS FAULT: Urine Processor Assembly Motor Seized. Gray water recycling halted.`
8. **Indicators Changing**: Water recycling efficiency drops from $93\%$ to $0\%$; Potable water tank drains with zero inflow.
9. **Severity Levels**: Scale Buildup (cleanable), Mechanical Motor Jam (requires spare part), Ruptured Seal (water leak).
10. **Situation Evolution**: If unaddressed, the base burns through stored drinking water in 48 hours, forcing severe hydration rationing.
11. **Available Responses**:
    * *Response A*: Flush assembly with sulfuric/phosphoric acid pre-treatment wash (takes 2 hours, clears scale).
    * *Response B*: Disassemble and replace distillation drum with a mechanical spare (takes 4 hours, uses 1 spare part).
12. **Consequences**: Response A fixes the clog cleanly without consuming physical spares; Response B is faster if acid wash fails, but consumes a precious spare.
13. **Recovery Action**: Add acid flush to automated daily maintenance schedule; ensure astronauts use resistance exercise gear to slow down bone calcium loss.
14. **Scientific Lesson**: In space, astronauts lose bone density if they don't exercise. That lost calcium ends up in their urine, which can clog the very machines designed to recycle their water!
15. **Data Source**: NASA Open Science Data Repository (OSDR) bone loss telemetry & ISS UPA flight logs.

---

### Anomaly 6: Rover Regolith Wheel Seizure (Operational Anomaly)
1. **Scientific Explanation**: A sharp regolith rock wedges between the rover wheel titanium mesh and motor drive gear, causing the drive motor to stall on a steep crater slope.
2. **Physical Cause**: Navigating rough crater rim terrain with slopes $>20^\circ$.
3. **Environmental Conditions**: Occurs during surface prospecting sorties in rocky debris fields.
4. **Classification**: Operational Robotic Failure.
5. **Subsystems Affected**: Surface Mobility, In-Situ Resource Utilization (Ice/Regolith Mining).
6. **Detection**: Rover telemetry flags drive motor over-torque; GPS position remains fixed.
7. **Player Notification**: Rover HUD alert: `ROVER 1 STALLED: Left-front wheel motor locked. Slope: 22 degrees.`
8. **Indicators Changing**: Rover status switches to `IMPACT/STALLED`; Resource mining intake stops.
9. **Severity Levels**: Wedged Pebble (shakeable), Motor Stall (reverse burst), Axle Damage (requires EVA spacewalk to fix).
10. **Situation Evolution**: If left stranded, rover solar battery drains; prospecting mission fails.
11. **Available Responses**:
    * *Response A*: Command automated rock-jiggle sequence (oscillates forward/reverse torque to dislodge stone).
    * *Response B*: Dispatch an astronaut on a 1-hour EVA to physically inspect and free the wheel with a geological hammer.
12. **Consequences**: Response A has a $70\%$ chance of working with zero risk to crew; Response B is guaranteed ($100\%$), but costs 1 hour of EVA oxygen and exposes the astronaut to surface radiation.
13. **Recovery Action**: Plot route waypoints around boulder clusters using Mars Trek / Moon Trek topographic elevation maps.
14. **Scientific Lesson**: Without water or air to erode them, rocks on the Moon are razor-sharp and jagged, making terrain navigation a major mechanical hazard for wheeled rovers.
15. **Data Source**: NASA Apollo 15/16 Lunar Roving Vehicle operational logs.

---

## 10. Anomaly Simulation and Response Architecture

### 10.1 Generation, Probability & Lifecycle Model
Anomalies in the Junior Astronaut Mission Trainer are not purely random; they follow a **three-tier generation engine**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      ANOMALY SELECTION ENGINE                          │
│                                                                        │
│   [ Environmental Drivers ]  ──►  Space weather (DONKI live/cached)    │
│                                   Terrain & Day/Night lighting         │
│                                                                        │
│   [ Player Action Debt ]     ──►  Deferred maintenance backlog         │
│                                   Running machinery over capacity      │
│                                                                        │
│   [ Scripted Story Milestones]──► First Solar Storm on Sol 5           │
│                                   Crater Shadow on Sol 8               │
└────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Anomaly Lifecycle State Machine

```
[ Dormant / Seeded ]
       │
       ▼ (Trigger Condition Met)
[ Warning Phase ] ───────────► Player Alert Displayed (Lead-time timer starts)
       │
       ▼ (Timer Expires or Shock Hits)
[ Active Crisis Phase ] ─────► Direct System Degradation (Resource deltas applied)
       │
       ├─────────────────────────────────┐
       ▼ (Correct Player Action Taken)   ▼ (Ignored / Poor Choice)
[ Mitigation & Recovery ]         [ Compounding Cascade Failure ]
       │                                 │
       ▼                                 ▼
[ Safe Restored State ]           [ Critical Emergency / Mission Debrief ]
```

### 10.3 Reusable Anomaly Specification Template
Every event in the game engine conforms to this standardized TypeScript/JSON schema:

```json
{
  "anomalyId": "ANOM-LUNAR-001",
  "name": "Solar Energetic Particle Warning",
  "category": "SPACE_WEATHER",
  "nature": "NATURAL_EXTERNAL",
  "severityLevel": 2,
  "leadTimeSeconds": 45,
  "triggerCondition": {
    "donkiEventClass": "M",
    "minSol": 4
  },
  "affectsSubsystems": ["RADIATION", "POWER", "COMMS"],
  "hudNotification": {
    "bannerColor": "RED",
    "soundFx": "KLAXON_ALARM",
    "title": "M-Class Solar Flare Warning",
    "message": "High-energy protons detected by orbital satellites. ETA: 45 seconds!"
  },
  "consequenceIfIgnored": {
    "radiationRate_mSv_hr": 120.0,
    "crewStaminaDelta": -35,
    "commsBlackout": true
  },
  "choices": [
    {
      "id": "CHOICE_SHELTER",
      "label": "Sound Base Alarm & Move Crew to Regolith Shelter",
      "cost": { "power_kW": 0, "spareParts": 0 },
      "result": { "crewProtected": true, "surfaceWorkHalted": true },
      "feedbackFact": "Lunar regolith (moon soil) is rich in oxygen, silicon, and iron, making it an excellent natural radiation shield!"
    },
    {
      "id": "CHOICE_DEFLECTOR",
      "label": "Power Up Magnetic Deflector Field",
      "cost": { "power_kW": 12.0, "batteryDrain_kWh": 25.0 },
      "result": { "crewProtected": true, "surfaceWorkHalted": false },
      "feedbackFact": "Electromagnetic shields use high power to deflect charged protons, just like Earth's natural magnetic field."
    }
  ]
}
```

---

## 11. Educational Design & Pedagogical Framework

### 11.1 Progressive Complexity Scaffolding
To ensure children aged 7–12 are never overwhelmed, complexity is disclosed across 4 distinct gameplay tiers:

```
[ Sol 1–3: The Survival Basics ]
• Only 2 meters visible: Power & Oxygen.
• Direct 1-to-1 interactions: Connect solar panel ──► Power lights up.

[ Sol 4–6: Environmental Hazards ]
• 3rd meter unlocked: Radiation & Shielding.
• First space weather alerts; introducing regolith roof burial.

[ Sol 7–9: The Closed Ecosystem ]
• 4th meter unlocked: Potable Water & Food Production.
• Balancing crop light cycles and water recycling filters.

[ Sol 10+: Full Autonomous Commander ]
• Delayed consequences, equipment maintenance cycles, and trade-off optimization.
```

### 11.2 M.I.L.O.: The Pedagogical Mission Buddy
* **Persona**: M.I.L.O. is an upbeat, robotic lunar rover companion who speaks in short, enthusiastic, encouraging sentences.
* **Tone Principles**:
  * Never condescending; treats the child as a respected Commander.
  * Always highlights the **why** behind science rules.
  * Uses physical analogies: *"Think of our battery like a lunchbox: once you eat the sandwich, you have to wait until tomorrow's sunrise to refill it!"*
  * **Failure Reframing**: When a system fails, M.I.L.O. says: *"Whoa, that was a tough challenge, Commander! NASA flight controllers learned the exact same lesson during Apollo 13. Let's look at what the numbers showed and try a different lever!"*

---

## 12. NASA and CSA Data Integration

The following table documents the authentic datasets and APIs integrated into the trainer, establishing clear boundaries between **real scientific data** and **simplified educational gameplay parameters**:

| Data Source | Official Source & API | What It Actually Provides | Game Subsystem Powered | Real Data vs. Educational Simplification |
| :--- | :--- | :--- | :--- | :--- |
| **NASA DONKI** | `https://api.nasa.gov/DONKI/` (`/FLR`, `/CME`, `/SEP`) | Real-time and historical solar flare classes (C, M, X), coronal mass ejection speeds, and shock arrival times. | Space Weather Anomaly Engine; Emergency Siren System. | **Real**: Flare classifications and shock propagation physics. <br>**Simplified**: Arrival lead-times are scaled down to 30–60 seconds game-time so kids don't wait 18 hours. |
| **NASA OSDR** | `https://osdr.nasa.gov/` (Search API) | Published peer-reviewed research on spaceflight biological stress (bone loss, muscle atrophy, immune changes). | Astronaut Health & Exercise Systems. | **Real**: Bone demineralization rates (~1.2%/month) and required 2h daily exercise mitigation. <br>**Simplified**: Represented as a clean 0–100% Stamina bar. |
| **NASA RadLab** | `https://visualization.osdr.nasa.gov/radlab/` | Calibrated radiation dose measurements from ISS active dosimetry instruments (DOSTEL, CPDS, Liulin). | Radiation Exposure & Shielding calculations. | **Real**: Background dose rates (1.36 mSv/day Moon unshielded) and Half-Value Layers (18 cm regolith). <br>**Simplified**: Shielding depth rounded to clean 10 cm increments. |
| **Mars Trek** | `https://trek.nasa.gov/mars/` (WMTS Tile Service) | High-resolution orbital imagery, terrain elevation rasters (MOLA DEM), and rover coordinates. | Surface Navigation & Rover Waypoints (Mars expansion). | **Real**: Authentic Jezero Crater topography and slope gradients. <br>**Simplified**: Navigational hazards grouped into 3 discrete slope categories. |
| **CSA Food Production**| `https://www.asc-csa.gc.ca/` (Youth STEM Toolkits) | Educational guides on controlled-environment vertical farming, nutritional benefits of fresh crops, Arctic food resilience. | Hydroponic Greenhouse Module & Morale Bonuses. | **Real**: Validated crop growth cycles (lettuce, radishes) and microgreen nutrition. <br>**Simplified**: Fertilizer and pH balancing abstracted into simple "Nutrient Packs". |

---

## 13. Mission Success, Failure, and Recovery

### 13.1 Tiered Performance Rubric

| Performance Tier | Title Earned | Criteria Required | Educational Debrief Feedback |
| :---: | :--- | :--- | :--- |
| **Tier 1 (Mastery)** | **Artemis Pioneer Commander** | Survived 10+ Sols; all resources maintained $>50\%$; zero ARS radiation symptoms; 1 successful crop harvest. | *"Outstanding mission, Commander! You balanced power, air, and crew safety with the skill of a veteran NASA flight director. Your crew thrived!"* |
| **Tier 2 (Proficient)**| **Lunar Outpost Survivor** | Survived 10 Sols; resources dipped into yellow warning zone ($20 - 50\%$); crew suffered mild fatigue. | *"Mission accomplished! You encountered tough space weather and cold shadows, but kept your cool and protected the base. Review your power log to see how to keep batteries fuller next time!"* |
| **Tier 3 (Sub-optimal)**| **Emergency Evacuation** | Base survived, but 1 module depressurized or crew accumulated high radiation dose ($>300\text{ mSv}$). | *"You brought the crew home, but the outpost took heavy damage. NASA always designs redundant backup systems. Let's see how building an extra regolith shield makes all the difference!"* |
| **Educational Reset** | **Valuable Flight Lesson** | Oxygen, Power, or Hull dropped to 0. Emergency Orion capsule abort burn triggered. | *"Mission aborted safely! Apollo 13 proved that spaceflight is all about learning from anomalies. Notice how our battery ran out right when the heater turned on? Let's try again with an extra battery bank!"* |

---

## 14. Technical Architecture

### 14.1 System Topology & Data Flow
The system operates as a **modular monorepo** with a clean, decoupled boundary between the **Game Client** and the **AI/NASA Microservice**:

```
┌──────────────────────────────────────────────────────────────┐
│                    UNITY GAME CLIENT (C#)                    │
│                                                              │
│  [ Top Bar: HUD Meters ]   [ Bottom Bar: Timeline/Controls ] │
│  [ Left: 2D Building Menu] [ Right: M.I.L.O. Chat / Radar ]      │
│                                                              │
│                  CENTRAL 2D TILE VIEWPORT                    │
│             (Lunar Grid, Structures, Cables)                 │
│                                                              │
│  • Authoritative Simulation Engine (Local Tick Loop)         │
│  • Local Deterministic Fallback JSON (Zero-lag fail-safe)    │
└──────────────────────────────┬───────────────────────────────┘
                               │ HTTP REST (<= 3.0s Timeout)
                               ▼
┌──────────────────────────────────────────────────────────────┐
│             PYTHON FASTAPI MICROSERVICE (`ai-service/`)      │
│                                                              │
│  • `/v1/space-weather` (DONKI Cache & Shock Math)            │
│  • `/v1/assistant/chat` (M.I.L.O. Kid-Tone Prompting Engine)     │
│  • `/v1/evaluate/decision` (Deterministic Pure Math Scorer)  │
│  • `/v1/evaluate/mission` (Final Debrief & Badges)           │
└──────────────────────────────────────────────────────────────┘
```

### 14.2 UI Frame Layout Specification
To support the user's explicit design mandate (Top, Bottom, and Side panels surrounding a central 2D viewport):

```
┌────────────────────────────────────────────────────────────────────────┐
│ TOP BAR: Sol 04/10 | ⚡ Power: 72/100 | 🫁 O2: 85/100 | 🛡️ Shield: 88%  │
├──────────────┬──────────────────────────────────────────┬──────────────┤
│ LEFT PANEL   │           CENTRAL 2D VIEWPORT            │ RIGHT PANEL  │
│ [Structures] │                                          │ [M.I.L.O. Buddy] │
│ • Solar Array│    Top-down 2D tile grid                 │ "Commander,  │
│ • Battery Bk │    (Regolith terrain, modular base)      │ solar flare  │
│ • OGA Air Gen│                                          │ detected by  │
│ • CDRA Scrub │    [ Solar ] ─── [ Hab Dome ] ─── [ Vault ]│ DONKI!"      │
│ • Regolith Rf│                                          │              │
│ • Greenhouse │    Animated power pulses on cables       │ [Radar HUD]  │
│              │    Status icons (powered/unpowered)      │ Risk: MEDIUM │
├──────────────┴──────────────────────────────────────────┴──────────────┤
│ BOTTOM BAR: [Pause] [1x] [2x] | Log: "Solar array deployed." | [End Sol]│
└────────────────────────────────────────────────────────────────────────┘
```

---

## 15. Functional Requirements (FR)

### FR-01: Grid-Based 2D Outpost Construction
* **FR-01.1**: The system shall render a 2D top-down grid (minimum $20 \times 20$ tiles) representing lunar regolith terrain.
* **FR-01.2**: Players shall be able to place modular structures from the Left Panel catalog by clicking on valid grid tiles.
* **FR-01.3**: Structures shall require valid electrical cable connectivity to a power source (Solar Array, Battery, or Reactor) to function.
* **FR-01.4**: Structures shall display immediate visual feedback: Active (green indicator), Unpowered (flashing yellow lightning bolt), or Damaged (red hazard icon).

### FR-02: Deterministic Simulation Tick Loop
* **FR-02.1**: The game simulation shall execute an authoritative update tick every 1.0 second (scaled by simulation speed 1x / 2x).
* **FR-02.2**: In every tick, total power generation shall be summed and compared against total active structure consumption. If consumption exceeds generation plus battery discharge capacity, non-critical Tier 3/4 structures shall be browned out automatically.
* **FR-02.3**: In every tick, cabin oxygen shall deplete by $0.035\text{ kg/hr}$ per astronaut, and $CO_2$ shall accumulate by $0.0417\text{ kg/hr}$ per astronaut unless scrubbed by active ECLSS modules.

### FR-03: Space Weather & Anomaly Integration
* **FR-03.1**: The system shall fetch space weather data via `GET /v1/space-weather` (backed by NASA DONKI) or load bundled fallback events if offline.
* **FR-03.2**: When an M-Class or X-Class event triggers, the system shall initiate an audible alarm and display an on-screen warning banner with a countdown timer.
* **FR-03.3**: The system shall calculate radiation dose absorption based on the player's installed regolith roof thickness using the Half-Value Layer formula ($18.0\text{ cm}$ regolith).

### FR-04: M.I.L.O. AI Mission Buddy Chat
* **FR-04.1**: Players shall be able to enter free-text questions into the Right Panel chat box up to 300 characters.
* **FR-04.2**: The backend service shall respond via `POST /v1/assistant/chat` in $\le 3$ short sentences at an age 7–12 reading level within $2.5\text{ seconds}$.
* **FR-04.3**: If the AI backend is unreachable within $3.0\text{ seconds}$, Unity shall immediately display a context-relevant pre-written local fallback hint without freezing.

### FR-05: Decision Evaluation & Mission Debrief
* **FR-05.1**: Upon selecting a major decision, the system shall calculate a deterministic rating (`great`, `ok`, `risky`) and `survival_delta` (-20 to +20) using pure mathematical rules in `ai-service/app/evaluator/`.
* **FR-05.2**: At the conclusion of Sol 10 (or upon premature mission abort), the system shall render a Mission Debrief screen detailing the final survivability score (0–100), top strengths, and key science lessons.

---

## 16. Non-Functional Requirements (NFR)

* **NFR-01 (Performance)**: The 2D web build shall maintain a constant **60 FPS** on standard educational Chromebooks and school laptops with integrated Intel HD graphics. Initial asset load time shall not exceed **5.0 seconds**.
* **NFR-02 (Offline Resilience & Zero-Dependency)**: The game client shall be 100% playable from start to debrief even if the Python backend, NASA APIs, and LLM servers are completely offline. All core events and scientific feedback strings shall have hardcoded local JSON fallbacks.
* **NFR-03 (Accessibility & Visual Clarity)**: All vital resource meters shall utilize distinct dual-encoding (color + alphanumeric value + unique shape icon) to support color-blind learners. Contrast ratios shall exceed WCAG 2.1 AA standards ($>4.5:1$).
* **NFR-04 (Child Safety & Security)**: No student personal data, accounts, logins, or cookies shall ever be requested or stored. Player free-text chat input shall be sanitized server-side, length-capped at 300 characters, and protected against prompt injection.
* **NFR-05 (Bilingual Readiness)**: All UI strings, M.I.L.O. dialogue prompts, and achievement badges shall be architected for English and French localization (supporting CSA bilingual guidelines).

---

## 17. MVP Scope and Development Priorities

To ensure the student development team delivers a polished, winning hackathon submission on schedule, features are categorized by strict priority:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DEVELOPMENT ROADMAP                             │
│                                                                        │
│  [ P0: Hackathon MVP ] ──► 2D Top-Down Grid + 3 Core Resources         │
│                            6 Core Structures + DONKI Flare Alert       │
│                            Local Deterministic Fallback Strings        │
│                                                                        │
│  [ P1: Complete Release] ──► Full 10-Sol Progression + Crop Farming    │
│                            Live FastAPI / DONKI Integration + Chat     │
│                            Sound FX & Achievement Badges               │
│                                                                        │
│  [ P2: Future Expansion] ──► 3D Isometric View / WebGL Rendering      │
│                            Mars Jezero Crater Site Selection           │
│                            Rover Pathfinding & Real-Time Physics       │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 18. Testing and Validation

1. **Unit Testing (AI Service)**:
   * 100% of Pydantic models validated against `contracts/*.json`.
   * Deterministic evaluator tested across 25 edge cases (zero resources, max resources, contradictory inputs).
   * Fallback handlers tested by simulating network timeouts and HTTP 500 errors.
2. **Simulation Balance Validation**:
   * Mathematical verification that a 10-Sol playthrough is impossible to win if solar panels are never built, and guaranteed to win if balanced play is maintained.
   * Verification that $CO_2$ toxicity triggers within 6 hours if CDRA scrubbers are unpowered.
3. **Playtesting with Youth (Ages 7–12)**:
   * Verification that children understand the icons without reading manuals.
   * Verification that failure messages prompt curiosity and retries rather than frustration.

---

## 19. Scientific References and Data Provenance

1. **NASA Space Flight Human-System Standard**: NASA-STD-3001, Vol 2: *Human Factors, Habitability, and Environmental Health*.
2. **NASA Baseline Values and Assumptions Document (BVAD)**: NASA/TP-2015-218570, *Life Support Baseline Values and Assumptions Document*, Johnson Space Center.
3. **NASA Space Weather CCMC / DONKI**: Community Coordinated Modeling Center, *Space Weather Database of Notifications, Knowledge, Information*, Goddard Space Flight Center.
4. **NASA Open Science Data Repository (OSDR) & RadLab**: NASA Ames Research Center, *Active Spaceflight Radiation Dosimetry Archive*.
5. **NASA Lunar Reconnaissance Orbiter (LRO)**: Diviner Lunar Radiometer Experiment & LOLA Science Team, *Shackleton Crater Illumination and Volatile Deposition Reports*.
6. **Canadian Space Agency (CSA)**: *Food Production on the Moon and in Remote Areas Toolkit*, ASC-CSA Youth & Educator Resources.

---

## 20. Design Gaps and Decisions Requiring Team Approval

The following architectural and design questions cannot be unilaterally decided and require explicit confirmation from the development team:

1. **Client Engine Choice (Unity vs. Web Framework)**:
   * *Context*: The architecture specifies Unity C#. However, for a 2D top-down grid game with panels, lightweight web frameworks (React/PixiJS, Phaser, or Godot) compile to WebGL much faster and with zero deployment/CORS friction. Does the game team want to stick with Unity C# or consider a lightweight 2D engine?
2. **Final Status of Food Production (Core vs. Event)**:
   * *Context*: The game design notes suggest keeping resources strictly to 3 (Power, Oxygen, Shielding) and making Food a stretch goal, while the CSA challenge resources emphasize food production. Should Food remain a lightweight event card bonus (P1) or a permanent 4th meter?
3. **LLM Provider Selection for Live Demo**:
   * *Context*: The FastAPI backend is model-agnostic. Which provider key (Gemini 1.5 Flash, OpenAI gpt-4o-mini, or Groq Llama-3) will be funded and placed in the production `.env` for the live judges' demonstration?
4. **Backend Cloud Hosting Location**:
   * *Context*: Where will the FastAPI backend be hosted during judging (e.g., Render free tier, Railway, or Fly.io) so the web build can make live HTTPS calls without requiring judges to run Python locally?
