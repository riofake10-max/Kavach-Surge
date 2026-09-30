# KAVACH-Surge: Bay of Bengal Predictive Risk & Pre-Landfall Decision Engine

> **"Don't forecast the storm. Forecast the decisions."**

KAVACH-Surge is an AI-powered predictive risk and vulnerability modeling platform engineered for Indian state disaster management authorities (OSDMA, WBDMA, APSDMA, TNSDMA) and municipal emergency operations centres. It shifts disaster response from post-landfall relief to actionable, quantified **pre-landfall decision execution**: mandatory evacuation timing, critical infrastructure hardening, cascading failure mitigation, parametric insurance liquidity release, and automated early-warning dispatch.

---

## 1. System Architecture

```
                                  [ Open-Meteo & Marine API ]
                                  [ OSM Overpass & Elevation]
                                  [ GEE Satellite Adapter   ]
                                               │
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             KAVACH-Surge Engine                             │
│                                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  ┌─────────────┐  │
│  │ Holland (1980) Wind     │  │ Screening Surge Model   │  │ D8 Drainage │  │
│  │ Profile (R34, R50, R64) │  │ (IB + Wind + Tide + Hs) │  │ & Flood Fill│  │
│  └────────────┬────────────┘  └────────────┬────────────┘  └──────┬──────┘  │
│               │                            │                      │         │
│               └──────────────────────┬─────┴──────────────────────┘         │
│                                      ▼                                      │
│                ┌───────────────────────────────────────────┐                │
│                │ Cascading Failure & Vulnerability Engine  │                │
│                │ (Substations ➔ Hospitals ➔ Shelters ➔ Pop)│                │
│                └─────────────────────┬─────────────────────┘                │
│                                      │                                      │
│         ┌────────────────────────────┼────────────────────────────┐         │
│         ▼                            ▼                            ▼         │
│  [ T-Minus Planner ]       [ Parametric Triggers ]     [ Multilingual CAP ] │
│  (Evacuate/Harden)         (₹250 Cr Pre-Liquidity)     (SMS, WhatsApp, IVR) │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Gemini Multimodal Intelligence                       │
│  • Situation Analyst Chat (compact state grounding & Web Speech API)        │
│  • Multimodal Pre-Landfall Structural Imagery Assessment (Drone/Satellite)   │
│  • Post-Event Rapid Damage Triage                                           │
│  • Function Calling (What-If Interactive Simulation Tools)                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Ingested Data Sources (Keyless & CORS-Enabled)

1. **Weather Forecast API**: [Open-Meteo](https://open-meteo.com) (`hourly=wind_speed_10m,wind_gusts_10m,precipitation,surface_pressure`).
2. **Marine Wave API**: Open-Meteo Marine API (`wave_height,wave_period,wave_direction`).
3. **Topography / Elevation API**: Open-Meteo Elevation API (batched 20x20 grid coordinates covering ~40km coastal box).
4. **Critical Infrastructure**: [OpenStreetMap Overpass API](https://overpass-api.de) for hospitals, clinics, electrical substations, police/fire stations, cyclone shelters, arterial highways, and bridges.
5. **Satellite / Earth Observation**: `SatelliteProvider` adapter with precomputed Sentinel-1 SAR and Sentinel-2 NDWI layers.
6. **Dual-Tier Offline Cache**: All adapters implement in-memory + `sessionStorage` caching with exponential backoff and bundled fallback scenarios (`Fani`, `Amphan`, `Michaung`) so the command centre never fails during communication blackouts.

---

## 3. Physical Model Formulations & Assumptions

> **Official Disclaimer**: *KAVACH-Surge is a screening-grade pre-landfall operational decision tool, not a replacement for full 3D hydrodynamic numerical models (such as ADCIRC or SLOSH) or official advisories from IMD and INCOIS.*

### A. Holland (1980) Parametric Wind Field
Radial surface wind velocity $V(r)$ is computed via:
$$V(r) = 0.85 \times \left[ \sqrt{ \frac{B}{\rho} \left(\frac{R_{max}}{r}\right)^B \Delta P \exp\left(-\left(\frac{R_{max}}{r}\right)^B\right) + \left(\frac{r f}{2}\right)^2 } - \frac{r f}{2} \right]$$
Where $B$ is the Holland shape parameter (empirically bounded between $1.1$ and $2.5$), $\rho = 1.15\text{ kg/m}^3$, $\Delta P = 1010\text{ hPa} - P_c$, and $f = 2\Omega\sin(\phi)$.

### B. Coastal Surge Water Level
Peak coastal surge height at the shoreline:
$$S_{coast} = \Delta P_{ib} + S_{wind} + \Delta h_{tide} + S_{wave}$$
- **Inverse Barometer**: $\Delta P_{ib} \approx 0.01 \times (1010 - P_c)\text{ meters}$.
- **Wind Setup**: $S_{wind} = 2.2 \times \left(\frac{V_{max}}{100}\right)^2 \times \text{ShelfSlopeFactor}$.
- **Tide Phase Offset**: $-0.5\text{m}$ (Low), $\pm0.0\text{m}$ (Mean), $+1.0\text{m}$ (High spring tide).
- **Surf Zone Wave Setup**: $S_{wave} \approx 0.18 \times H_s$.

### C. Inland Propagation & Hydrological Connectivity
Surge wave decays inland from shoreline based on distance $d$ (km) and Manning surface roughness:
$$S(d) = \max\left(0, S_{coast} - d \times \left(0.22 \times (1 + (n - 0.03) \times 5)\right)\right)$$
**Ocean Flood-Fill**: A cell floods only if its elevation is lower than local surge height AND it maintains continuous hydrological connection to sea cells via Breadth-First Search (BFS), preventing spurious flooding of isolated inland dry depressions.

---

## 4. Cascading Failure Engine

1. **Substations**: Trip/fail when flood depth $\ge 0.5\text{m}$ or wind $\ge 105\text{ kt}$.
2. **Hospitals & Shelters**: Impaired when local flood depth $\ge 0.3\text{m}$ OR when the upstream electrical substation trips and the facility lacks an operational auxiliary diesel generator (`hasBackupPower = false`).
3. **Roads**: Impassable to emergency vehicles when flood depth $\ge 0.3\text{m}$.
4. **Bridges**: Structural alert triggered when wind $\ge 64\text{ kt}$ AND surge $\ge 1.0\text{m}$.
5. **Mitigation**: Users can toggle emergency generators on any facility in real-time, instantly cutting the cascading blackout failure line on the map.

---

## 5. How to Wire Real Google Earth Engine (GEE) in Production

In `/src/adapters/satellite.ts`, the application provides the `SatelliteProvider` interface and a production `GeeProvider` stub. To wire a live Earth Engine backend:

1. **Deploy Cloud Run Proxy**:
   ```python
   # main.py (FastAPI / Cloud Run)
   import ee
   from fastapi import FastAPI

   app = FastAPI()
   credentials = ee.ServiceAccountCredentials("gee-service@gcp-project.iam.gserviceaccount.com", "key.json")
   ee.Initialize(credentials)

   @app.post("/api/gee/flood-extent")
   def get_flood_extent(payload: dict):
       bbox = payload["bbox"]
       geometry = ee.Geometry.BBox(bbox["minLng"], bbox["minLat"], bbox["maxLng"], bbox["maxLat"])
       s1 = (ee.ImageCollection("COPERNICUS/S1_GRD")
             .filterBounds(geometry)
             .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
             .select('VH'))
       # Compute water threshold and return GeoJSON
       return s1.first().reduceToVectors(geometry=geometry).getInfo()
   ```
2. **Assign IAM Permissions**: Grant `roles/earthengine.writer` to the Cloud Run service account.
3. **Switch Provider**: In `useAppStore.ts`, instantiate `new GeeProvider('/api/gee')` instead of `MockSatelliteProvider`.

---

## 6. Strategic Roadmap

- [ ] **Real IMD & INCOIS Track Feeds**: Ingestion of live Cyclone Bulletins (RSMC New Delhi) via automated RSS/XML scraping.
- [ ] **ADCIRC / SLOSH Integration**: Coupling pre-computed hydrodynamic basin libraries with GPU-accelerated web workers.
- [ ] **High-Resolution Population Rasters**: Integrating 100m gridded population density from WorldPop and HRSL.
- [ ] **SACHET CAP Production Dispatch**: Directly posting validated CAP v1.2 alerts into the NDMA National Disaster Alert Portal.

---

## 7. License & Compliance
Built as a **Digital Public Good**. Open-source, compliant with Common Alerting Protocol (ITU-T X.1303 / CAP 1.2), zero telemetry, zero storage of personally identifiable information (PII).
