# ☀️ Space Weather Database Of Notifications, Knowledge, Information (DONKI)

**Official Name:** Space Weather Database Of Notifications, Knowledge, Information (DONKI)  
**Official URL:** [https://ccmc.gsfc.nasa.gov/tools/DONKI/](https://ccmc.gsfc.nasa.gov/tools/DONKI/)  
**API Endpoint:** `https://api.nasa.gov/DONKI/`  
**Category:** NASA Data & Resources (Item #2)  

---

## 1. Description & Challenge Role
> *"Real, regularly updated data on solar flares, coronal mass ejections, and other space weather events that drive radiation risk for astronauts and spacecraft. Useful for grounding any radiation-shielding, communications-disruption, or mission-risk mechanic in actual current conditions rather than invented numbers."*

---

## 2. API Endpoints & Shock Dynamics

### Key Query Endpoints:
1. **Solar Flares (`/FLR`)**: Detects high-energy bursts on the solar surface.
   * `classType`: C-Class (minor), M-Class (moderate, radio blackouts), X-Class (extreme, severe radiation).
2. **Coronal Mass Ejections (`/CME` & `/CMEAnalysis`)**: Giant plasma bubbles.
   * Shock propagation arrival speed ($400 - 1800\text{ km/s}$).
   * $$\text{Arrival Time (hours)} = \frac{\text{Distance to Outpost (km)}}{\text{CME Speed (km/s)} \times 3600}$$
3. **Solar Energetic Particles (`/SEP`)**: Relativistic protons triggering acute surface radiation spikes ($>100\text{ mSv/hr}$).

---

## 3. How to Use in the Simulator
* **Emergency Radiation Alarm**: When an M/X-class flare is detected, the HUD displays a 30-minute arrival countdown. Spacewalking crew must return to the storm shelter, and exterior solar panels must be angled edge-on to the blast.
* **Communications Disruption**: CME impacts disrupt high-frequency radio transmissions with Earth.

---

## 4. Files
* **Schema**: [`schema.json`](file:///c:/Users/acer%20i7/Programation/2026/NASA%20-%20OutPost/resources/02_Space_Weather_Database_Of_Notifications_Knowledge_Information_DONKI/schema.json)
* **Offline Fixtures**: [`fixtures_and_mock.json`](file:///c:/Users/acer%20i7/Programation/2026/NASA%20-%20OutPost/resources/02_Space_Weather_Database_Of_Notifications_Knowledge_Information_DONKI/fixtures_and_mock.json)

