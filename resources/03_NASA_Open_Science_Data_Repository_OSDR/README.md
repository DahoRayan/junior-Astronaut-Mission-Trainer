# 🧬 NASA Open Science Data Repository (OSDR)

**Official Name:** NASA Open Science Data Repository (OSDR)  
**Official URL:** [https://osdr.nasa.gov/bio/repo/](https://osdr.nasa.gov/bio/repo/)  
**Search API:** [https://osdr.nasa.gov/osdr/data/search?term=KEYWORD](https://osdr.nasa.gov/osdr/data/search?term=KEYWORD)  
**Category:** NASA Data & Resources (Item #3)  

---

## 1. Description & Challenge Role
> *"NASA's public archive of space biology and astronaut health research, including studies on how spaceflight affects bone density, muscle mass, immune response, sleep, and more across many organisms. Searchable by keyword, making it well suited for tools that want to surface real published NASA science relevant to human health trade-offs in space."*

---

## 2. API Endpoints & Search Queries
* **Search API Endpoint**: `GET https://osdr.nasa.gov/osdr/data/search?term={keyword}&size={n}`
* **Recommended Keywords for Trainer**:
  * `bone loss microgravity` (Study of calcium loss; 1–1.5% bone density drop per month without exercise).
  * `muscle atrophy spaceflight` (Crew must perform 2 hours/day of resistive exercise).
  * `immune dysregulation space` (Stress and microgravity weaken astronaut infection defense).
  * `sleep circadian disruption` (Disrupted day/night cycles on Mars or Moon reduce cognitive agility).

---

## 3. Human Health Trade-Offs & Formulas
1. **Daily Exercise Requirement**:
   * If astronauts exercise 2 hours/day: muscle/bone loss is mitigated ($+100\%$ nominal retention).
   * If exercise equipment is powered off to save electricity: astronaut stamina drops by $-2\%$ per day.
2. **Nutrition & Immune Support**:
   * Pre-packaged rations lack active phytonutrients over time. Fresh salad from hydroponics boosts the immune score by $+15\%$.

---

## 4. Files
* **Schema**: [`schema.json`](file:///c:/Users/acer%20i7/Programation/2026/NASA%20-%20OutPost/resources/03_NASA_Open_Science_Data_Repository_OSDR/schema.json)
* **Constants**: [`reference_constants.json`](file:///c:/Users/acer%20i7/Programation/2026/NASA%20-%20OutPost/resources/03_NASA_Open_Science_Data_Repository_OSDR/reference_constants.json)

