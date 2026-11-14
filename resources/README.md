# 📦 Official Challenge Resources Catalog (NASA Space Apps 2026)

This directory mirrors the **exact order and official naming** of every resource listed on the **2026 NASA Space Apps Challenge** portal under **"Build a Junior Astronaut Mission Trainer"** (`?tab=resources`).

> 📖 **Full 100% Specification Audit**: See [`RESOURCE_AUDIT_AND_MAPPING.md`](file:///c:/Users/acer%20i7/Programation/2026/NASA%20-%20OutPost/resources/RESOURCE_AUDIT_AND_MAPPING.md) for details on what was extracted from each, why it matters, and how to use it in code.

---

## 📁 Resource Index (Exact Online Page Match)

### Section A: NASA Data & Resources
1. [**`01_NASA_Open_APIs/`**](file:///c:/Users/acer%20i7/Programation/2026/NASA%20-%20OutPost/resources/01_NASA_Open_APIs/)
   * Central public API portal: Mars Rover Photos, APOD, and EPIC Earth imagery.
2. [**`02_Space_Weather_Database_Of_Notifications_Knowledge_Information_DONKI/`**](file:///c:/Users/acer%20i7/Programation/2026/NASA%20-%20OutPost/resources/02_Space_Weather_Database_Of_Notifications_Knowledge_Information_DONKI/)
   * Solar flares, CMEs, and proton events for dynamic in-game radiation alarms.
3. [**`03_NASA_Open_Science_Data_Repository_OSDR/`**](file:///c:/Users/acer%20i7/Programation/2026/NASA%20-%20OutPost/resources/03_NASA_Open_Science_Data_Repository_OSDR/)
   * Space biology research on bone loss, muscle atrophy, immunity, and circadian rhythm.
4. [**`04_RadLab_OSDR_Radiation_Dosimetry_Database/`**](file:///c:/Users/acer%20i7/Programation/2026/NASA%20-%20OutPost/resources/04_RadLab_OSDR_Radiation_Dosimetry_Database/)
   * Real ISS active dosimeter readings (DOSTEL, CPDS), PEL limits, and regolith shielding half-values.
5. [**`05_Mars_Trek/`**](file:///c:/Users/acer%20i7/Programation/2026/NASA%20-%20OutPost/resources/05_Mars_Trek/)
   * Interactive Mars GIS, WMTS tile streaming, and Jezero Crater elevation profiles.

### Section B: Space Agency Partner Resources (CSA - Canadian Space Agency)
6. [**`06_CSA_Space_Resources_for_STEM_and_Youth_Organizations/`**](file:///c:/Users/acer%20i7/Programation/2026/NASA%20-%20OutPost/resources/06_CSA_Space_Resources_for_STEM_and_Youth_Organizations/)
   * Youth engagement framework (ages 7–12), bilingual English/French badges, and safe failure loops.
7. [**`07_CSA_Food_Production_on_the_Moon_and_in_Remote_Areas/`**](file:///c:/Users/acer%20i7/Programation/2026/NASA%20-%20OutPost/resources/07_CSA_Food_Production_on_the_Moon_and_in_Remote_Areas/)
   * Closed-loop space farming, hydroponic crop candidates, crew psychological morale bonuses, and Earth applications.

---

## 💻 Quick Code Import Pattern

```typescript
// NASA APIs & Imagery
import nasaApisFixtures from './resources/01_NASA_Open_APIs/fixtures_and_mock.json';

// Space Weather
import donkiFixtures from './resources/02_Space_Weather_Database_Of_Notifications_Knowledge_Information_DONKI/fixtures_and_mock.json';

// Biology & Radiation
import osdrConstants from './resources/03_NASA_Open_Science_Data_Repository_OSDR/reference_constants.json';
import radLabConstants from './resources/04_RadLab_OSDR_Radiation_Dosimetry_Database/reference_constants.json';

// Planetary Geography
import marsTrekConstants from './resources/05_Mars_Trek/reference_constants.json';

// CSA Youth Framework & Food Production
import csaBadges from './resources/06_CSA_Space_Resources_for_STEM_and_Youth_Organizations/educational_framework.json';
import csaCrops from './resources/07_CSA_Food_Production_on_the_Moon_and_in_Remote_Areas/reference_constants.json';
```
