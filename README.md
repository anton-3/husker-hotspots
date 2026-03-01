# HuskerHotspots

**HuskerHotspots** is an interactive 3D map of the University of Nebraska–Lincoln (UNL) campus that provides animated insights into student activity—day by day and minute by minute. We integrated public data such as UNL course registrations, campus events, and restaurant order wait times to build a heatmap of student activity as each day progresses on campus.

---

## Running the project

### Backend (Flask API)

From the **repository root**:

```bash
cd backend
pip install -r requirements.txt
cd ..
FLASK_APP=backend.app flask run
```

The API runs at `http://localhost:5000` by default. It serves combined density heatmap data and building timelines.

### Frontend (Next.js)

```bash
cd frontend
pnpm install
cp .env.local.example .env.local
# Edit .env.local: set NEXT_PUBLIC_MAPBOX_TOKEN and optionally NEXT_PUBLIC_API_URL (default http://localhost:5000)
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The map requires a [Mapbox access token](https://account.mapbox.com/).

---

## Code overview

### Frontend (`frontend/`)

- **App**: Next.js 16; the main page loads the campus map. The map is loaded with `dynamic()` and no SSR because it uses Mapbox/Deck.gl and WebGL.
- **Map**: `components/map/campus-map.tsx` — Mapbox base map, Deck.gl heatmap layer, 3D building footprints, timeline slider, data-source toggle, legend, and building popups (with class lists and timelines).
- **API client**: `lib/api/density.ts` — Fetches density heatmaps (`/api/density`, `/api/density/day`), building timelines, and building-at-time details. Uses TanStack Query for caching (e.g. by weekday and time slot).
- **Config & data**: `lib/map/config.ts` (map center, zoom, data sources), `lib/map/buildings.ts` (campus building IDs and geometries). Building GeoJSON and metadata can be produced by scripts in `backend/scripts/`.

### Backend (`backend/`)

- **API**: `app.py` — Flask app with CORS for localhost. Key routes:
  - `GET /api/density` — Combined heatmap at a single time and weekday (query: `time`, `weekday`, optional `cols`, `rows`, `bounds`).
  - `GET /api/density/day` — Full day (96 × 15-minute slots) for a weekday; used for the timeline animation.
  - `GET /api/density/building/<id>/timeline` — Per-building estimated people per 15-min slot.
  - `GET /api/density/building/<id>/at-time` — Building occupancy and class list at one time (for popups).
- **Density pipeline**: `density_aggregator.py` — Registers multiple “density providers” (e.g. classes, dining), calls them with the same bounds/resolution, sums their grids, normalizes to [0, 1], and returns heatmap points (and optional per-building data). Adding a new data source means implementing a provider and registering it here.
- **Classes**: `classes/density_field.py` — Builds a people-density grid from course sections (`parsed_sections.json`): location, enrollment, and meeting times. Used for full-day slot grids and single-time queries.
- **Dining**: `wait_times/density_field.py` — Contributes density from restaurant wait-time data (e.g. CSVs in `wait_times/`), interpreted as proxy for foot traffic.

For detailed documentation of the course-section dataset and fields, see `README_courses.md`.
