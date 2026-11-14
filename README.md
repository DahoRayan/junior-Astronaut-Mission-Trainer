# 🚀 Junior Astronaut Mission Trainer

> **Official Project Repository for the NASA Space Apps Challenge 2026**  
> **Challenge:** [Build a Junior Astronaut Mission Trainer](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/)  
> **Target Audience:** Junior Learners & Students (Ages 7–12)  

---

## 📖 Challenge Overview & Core Problem

Space-themed educational material often falls into one of two extremes:
1. **Oversimplified facts & posters** that omit the authentic engineering constraints of deep-space survival.
2. **Dense, technical simulators** that overwhelm young students with complex mathematics.

The goal of this project is to build an interactive, educational experience that makes **real-world space exploration trade-offs** tangible, intuitive, and fun for kids. 

Whether managing a habitat on the Moon or Mars, players will experience how critical decisions—balancing oxygen, limited power, food production, radiation shielding, and communications—directly dictate mission success or failure.

---

## 🧭 Core Design Principles (NASA & CSA Guidelines)

Every potential solution in this project is grounded in four foundational pillars:

1. **Meaningful Trade-Offs**: No choice is free. Diverting energy to heavy radiation shields reduces power available for greenhouse grow-lights or life-support scrubbers.
2. **Authentic Space Science**: Rather than invented numbers, mechanics are anchored in verified data from **NASA** (DONKI space weather, OSDR astronaut biology, RadLab dosimetry, Mars Trek GIS) and the **Canadian Space Agency (CSA)** (youth STEM toolkits and space agriculture).
3. **Low Barrier to Entry with Safe Failure**: Designed specifically for children aged 7–12. Failures (e.g. running out of battery during a dust storm) are framed positively as learning opportunities with encouraging debriefs rather than punishing game-overs.
4. **Bilingual & Inclusive Accessibility**: Structured to support English and French localization and high-contrast, accessible UI.

---

## 📁 Repository Structure

```text
├── resources/                     # Official Challenge Resources (Exact Match to Online Page)
│   ├── 01_NASA_Open_APIs/         # NASA central API: Mars Rover Photos, APOD & Earth EPIC
│   ├── 02_Space_Weather_Database_Of_Notifications_Knowledge_Information_DONKI/ # Solar flares, CMEs & alarms
│   ├── 03_NASA_Open_Science_Data_Repository_OSDR/ # Space biology: bone, muscle, immunity & sleep
│   ├── 04_RadLab_OSDR_Radiation_Dosimetry_Database/ # ISS dosimetry, PEL limits & regolith shielding
│   ├── 05_Mars_Trek/              # Mars GIS, WMTS tile streaming & Jezero Crater elevation
│   ├── 06_CSA_Space_Resources_for_STEM_and_Youth_Organizations/ # CSA youth framework & bilingual badges
│   ├── 07_CSA_Food_Production_on_the_Moon_and_in_Remote_Areas/  # Hydroponics, morale & Earth benefits
│   ├── RESOURCE_AUDIT_AND_MAPPING.md # Full 100% specification audit, extraction % & usage guide
│   └── README.md                  # Master catalog index & quick code import snippets
├── REQUIREMENTS.md                # Official challenge requirements & design framework
├── local_plan/                    # Workspace scratchpad (git-ignored)
└── ReadMe.md                      # Project documentation (this file)
```

---

## 🎯 Next Steps

1. Review [**`REQUIREMENTS.md`**](file:///c:/Users/acer%20i7/Programation/2026/NASA%20-%20OutPost/REQUIREMENTS.md) for the complete criteria and potential game mechanics.
2. Explore pre-mapped datasets, schemas, and API guides in [**`resources/`**](file:///c:/Users/acer%20i7/Programation/2026/NASA%20-%20OutPost/resources/).
3. Decide on the preferred game genre, visual style, and tech stack when ready to begin development.
