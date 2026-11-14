# 🚀 NASA Open APIs

**Official Name:** NASA Open APIs  
**Official URL:** [https://api.nasa.gov/](https://api.nasa.gov/)  
**Category:** NASA Data & Resources (Item #1)  

---

## 1. Description & Challenge Role
> *"NASA's central public API portal, providing free programmatic access to datasets including the Astronomy Picture of the Day (APOD), Mars Rover Photos, and the Space Weather Database (DONKI). A free API key (higher rate limits than the shared demo key) can be requested instantly and is a good starting point for any challenge team building a data-connected prototype."*

---

## 2. API Endpoints for the Mission Trainer

### Authentication
* Query Param: `api_key=DEMO_KEY` (30 requests/hour, 50/day limit).
* Free Personal Key: Instant sign-up at [api.nasa.gov](https://api.nasa.gov/) (1,000 requests/hour).

### Primary Endpoints Used in Game:
1. **Mars Rover Photos API**:
   * **Endpoint**: `GET /mars-photos/api/v1/rovers/perseverance/photos`
   * **Parameters**: `sol` (Martian sol number), `camera` (NAVCAM, MCZ_RIGHT, MCZ_LEFT), `api_key`.
   * **Game Use**: Display real, authenticated Mars surface imagery in the rover exploration viewport when players send scouting missions.
2. **Astronomy Picture of the Day (APOD)**:
   * **Endpoint**: `GET /planetary/apod`
   * **Parameters**: `date` (YYYY-MM-DD), `api_key`.
   * **Game Use**: Dynamic background imagery and daily educational space discoveries in the mission briefing screen.
3. **EPIC (Earth Polychromatic Imaging Camera)**:
   * **Endpoint**: `GET /EPIC/api/natural`
   * **Game Use**: Real-time Earth views from 1 million miles away for the outpost's Earth-observation window.

---

## 3. Data Schema & Offline Fixtures
* **Schema**: [`schema.json`](file:///c:/Users/acer%20i7/Programation/2026/NASA%20-%20OutPost/resources/01_NASA_Open_APIs/schema.json)
* **Sample Fixtures**: [`fixtures_and_mock.json`](file:///c:/Users/acer%20i7/Programation/2026/NASA%20-%20OutPost/resources/01_NASA_Open_APIs/fixtures_and_mock.json)

