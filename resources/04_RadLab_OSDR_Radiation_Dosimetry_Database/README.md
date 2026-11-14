# ☢️ RadLab (OSDR Radiation Dosimetry Database)

**Official Name:** RadLab (OSDR Radiation Dosimetry Database)  
**Official URL:** [https://visualization.osdr.nasa.gov/radlab/gui/data-api/](https://visualization.osdr.nasa.gov/radlab/gui/data-api/)  
**Category:** NASA Data & Resources (Item #4)  

---

## 1. Description & Challenge Role
> *"Real radiation dose measurements recorded by dosimetry instruments aboard the International Space Station, contributed by multiple international space agencies. Provides authentic astronaut radiation exposure data (e.g., absorbed dose rate) useful for any tool modeling shielding, health risk, or long-duration mission trade-offs."*

---

## 2. API & Data Access
* **RadLab Data API Endpoint**: `https://visualization.osdr.nasa.gov/radlab/gui/data-api/`
* **Telemetry Data Points Provided**:
  * Absorbed Dose Rate ($\mu\text{Gy/day}$)
  * Equivalent Dose Rate ($\mu\text{Sv/day}$)
  * Linear Energy Transfer (LET) spectra from instruments including CPDS, DOSTEL, Liulin, and REM.

---

## 3. Real Space Dosimetry Benchmarks & Shielding Math

### 1. Absorbed Dose Rates
* **Low Earth Orbit (ISS inside hull)**: $\approx 300 - 500 \ \mu\text{Sv/day}$ ($0.3 - 0.5\text{ mSv/day}$).
* **Deep Space / Lunar Surface (Unshielded)**: $\approx 1,360 \ \mu\text{Sv/day}$ ($1.36\text{ mSv/day}$).
* **Martian Surface (Atmosphere attenuated)**: $\approx 670 \ \mu\text{Sv/day}$ ($0.67\text{ mSv/day}$).
* **Subterranean Regolith Vault (1.5 m soil)**: $< 80 \ \mu\text{Sv/day}$ ($0.08\text{ mSv/day}$).

### 2. Shielding Half-Value Layer (HVL)
$$\text{Transmitted Dose} = \text{Initial Dose} \times (0.5)^{\text{Thickness} / \text{HVL}}$$
* Lunar Regolith: $\text{HVL} = 18.0\text{ cm}$
* Martian Regolith: $\text{HVL} = 16.0\text{ cm}$
* Water Shield: $\text{HVL} = 14.5\text{ cm}$

---

## 4. Files
* **Schema**: [`schema.json`](file:///c:/Users/acer%20i7/Programation/2026/NASA%20-%20OutPost/resources/04_RadLab_OSDR_Radiation_Dosimetry_Database/schema.json)
* **Constants**: [`reference_constants.json`](file:///c:/Users/acer%20i7/Programation/2026/NASA%20-%20OutPost/resources/04_RadLab_OSDR_Radiation_Dosimetry_Database/reference_constants.json)

