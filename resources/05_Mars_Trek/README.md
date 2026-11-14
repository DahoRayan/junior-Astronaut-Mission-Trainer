# 🔴 Mars Trek (Planetary GIS & Surface Elevation)

**Official Name:** Mars Trek  
**Official URL:** [https://trek.nasa.gov/mars/](https://trek.nasa.gov/mars/)  
**Category:** NASA Data & Resources (Item #5)  

---

## 1. Description & Challenge Role
> *"An interactive visualization and data-download portal for real Mars surface imagery, elevation, and terrain data compiled from NASA's Mars missions (including Curiosity and Perseverance). Useful for teams wanting real environmental or geographic data to ground a Mars outpost site or terrain visualization in actual surface conditions."*

---

## 2. Web Map Tile Service (WMTS) & Data Download Endpoints

### 1. Global Colorized Basemap (Viking Mosaic)
* **Tile URL Template**:
  ```text
  https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg
  ```

### 2. High-Resolution Landing Sites: Jezero Crater (Perseverance)
* **Coordinates**: Latitude `18.38°N`, Longitude `77.58°E`
* **Elevation DEM Endpoint (MOLA DEM 463m)**:
  ```text
  https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_DEM_mosaic_global_463m/
  ```
* **HiRISE & CTX High-Res Inset**:
  * Real rover track waypoints and delta riverbed elevation profiles.

---

## 3. How to Use in the Simulator
* **Interactive Base Map**: Use Leaflet, CesiumJS, or Three.js to render real NASA Mars Trek map tiles behind the outpost simulation.
* **Terrain Obstacle Navigation**: Send rovers across authentic Jezero Crater slopes and boulder fields.

---

## 4. Files
* **Schema**: [`schema.json`](file:///c:/Users/acer%20i7/Programation/2026/NASA%20-%20OutPost/resources/05_Mars_Trek/schema.json)
* **Constants**: [`reference_constants.json`](file:///c:/Users/acer%20i7/Programation/2026/NASA%20-%20OutPost/resources/05_Mars_Trek/reference_constants.json)

