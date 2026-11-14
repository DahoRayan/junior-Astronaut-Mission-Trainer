# 📋 Requirements & Design Framework

**Challenge:** NASA Space Apps Challenge 2026 — *Build a Junior Astronaut Mission Trainer*  
**Document Status:** Foundation Specification (Genre & Tech Stack Open)  
**Target Audience:** Students & Children (Ages 7–12)  

---

## 1. Official Challenge Mandates (NASA & CSA)

1. **Core Problem**: Traditional space education is either oversimplified (static posters, basic facts) or over-engineered (dense engineering textbooks). The solution must bridge this gap by making real space survival trade-offs intuitive and interactive.
2. **Target Audience**: Designed primarily for youth aged **7 to 12**. Interfaces must be visual, accessible, and intuitive.
3. **Open Format**: NASA does not mandate a specific game engine or format. Submissions can be:
   - Resource-management survival games
   - Narrative choice & decision-tree adventures
   - Interactive mission-control dashboards
   - Puzzle or mini-game suites
   - Web apps, desktop games, or mobile/tablet experiences.

---

## 2. Universal Functional Requirements (UFR)

Regardless of the chosen game format, the application must satisfy the following core requirements:

### UFR-1: Meaningful Engineering Trade-offs
* The player must balance competing survival priorities:
  - **Power Allocation**: Distributing limited energy among life support, heating, research equipment, and communications.
  - **Radiation Shielding vs. Mobility**: Balancing heavy shielding (e.g., regolith layers) against energy/time costs and spacewalk mobility.
  - **Closed-Loop Life Support & Food**: Balancing water recycling, oxygen levels, and hydroponic food production.
* Actions must have clear consequences (e.g., cutting greenhouse power saves electricity for life support, but slows crop growth).

### UFR-2: Grounded in Real Space Science & NASA Open Data
* Simulations and game mechanics must derive from verified NASA and partner data rather than fabricated numbers:
  - **Space Weather (DONKI)**: Solar flares and coronal mass ejections drive real radiation alerts and communication blackouts.
  - **Astronaut Health (OSDR)**: Physiological realities of spaceflight (exercise needs to combat bone/muscle loss, immune health).
  - **Radiation Dosimetry (RadLab)**: Realistic absorbed dose rates and shielding thickness calculations (Half-Value Layers).
  - **Planetary Geography (Mars Trek)**: Authentic surface terrain, elevation profiles, and rover exploration sites (e.g., Jezero Crater).
  - **Youth & Food Toolkits (CSA)**: Pedagogical structures, bilingual considerations, and space agriculture concepts.

### UFR-3: Pedagogical Design & Safe Failure Loops
* **Simplicity over Overload**: Keep core in-game metrics focused (typically 2 to 4 primary variables at a time) so young learners remain engaged.
* **Informative Failure (Growth Mindset)**: When a player fails a mission (e.g., running out of oxygen or power during a solar storm), the game must provide an encouraging "Mission Debrief" explaining the science of what happened and how to improve.
* **Positive Reinforcement**: Reward milestones with achievement badges (e.g., *"First Harvest"*, *"Solar Storm Survivor"*).

---

## 3. Potential Game Archetypes (To Be Selected)

The project structure is designed to support any of the following archetypes once decided:

| Archetype | Description | Key Appeal for Kids |
| :--- | :--- | :--- |
| **A. Outpost Survival / Base Builder** | Real-time or turn-based management of a lunar/Martian base modules, power grids, and farms. | High player agency; seeing an outpost visually grow and thrive. |
| **B. Narrative Decision Adventure** | Card-swipe or branching decision tree (similar to *Reigns* or text adventures) responding to daily crisis cards. | Highly accessible; focus on storytelling and immediate cause-and-effect. |
| **C. Mission Control Dashboard** | Kid-friendly flight director terminal monitoring live telemetry, responding to DONKI solar alerts, and directing crew. | Immersive "real NASA scientist" roleplay experience. |
| **D. Modular Mini-Game Suite** | A collection of quick interactive challenges (e.g., Rover Navigation, Solar Array Alignment, Hydroponic Balancing). | Fast-paced, modular, easy to develop incrementally. |

---

## 4. Evaluation & Judging Criteria (NASA Space Apps Rubric)

Submissions to the NASA Space Apps Challenge are evaluated across five official criteria:

1. **Impact**: How effectively does the trainer educate young learners about real-world space trade-offs?
2. **Creativity / Originality**: How unique, fun, and engaging is the game mechanic or storytelling approach?
3. **Validity**: Are the scientific concepts, numbers, and models accurately anchored in NASA and CSA data?
4. **Relevance**: Does the solution directly address the challenge statement and target the 7–12 age group?
5. **Presentation**: Is the user interface clean, appealing, accessible, and easy to understand?
