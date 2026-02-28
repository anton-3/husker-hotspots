<div align="center">

# 🎓 Husker Hustle

### AI-powered campus activity intelligence for the University of Nebraska–Lincoln 🏃‍♀️📊🌽

</div>

Husker Hustle is an opinionated, map-first analytics experience for understanding **how students actually use campus** across the day — and what you can *do* about it.

Instead of staring at disconnected dashboards for class schedules, room reservations, testing center occupancy, and game days, Husker Hustle pulls those signals into a single, interactive 3D map of UNL. The result is a **living heatmap of student life** that helps you:

- Spot emerging pressure points before they become problems.
- Design better schedules and room assignments.
- Justify student-life investments with clear visuals and evidence.

Under the hood, this repo is a **Next.js + Mapbox + deck.gl** application that currently ships with high-fidelity mock data and a full visualization pipeline. Swapping in real feeds is a matter of wiring data, not rethinking the UI.

---

## ✨ What Husker Hustle Aims To Do

Husker Hustle is designed as a decision-support surface for people who care about campus life:

- **Academic planners** exploring how course rosters and room assignments translate into physical traffic.
- **Student affairs teams** looking for under-served pockets of campus or over-stressed study spaces.
- **Facilities & operations** teams measuring the impact of interventions — new seating, changed hours, pop-up events.
- **Data teams** who want a clear, visual endpoint for models predicting student movement.

The long-term vision is to ingest and connect:

- 📚 **Class schedules** and **roster sizes** (where, when, and how many students).
- 🧪 **DLC / testing center occupancy** and queue times.
- 🏫 **Room reservation data** for study rooms, club meetings, and events.
- 🏈 **Game days and special events**, including stadium load and pre/post traffic.

Those signals are transformed into a **continuous spatio-temporal activity field**: a fancy way of saying "heatmap that moves through time in a believable way".

Right now, the repo ships with structured mock data that *acts* like those feeds so you can fully experience the product story, even before live integrations land.

---

## 🗺️ Product Walkthrough

At a glance, the Husker Hustle interface is built around three core surfaces:

1. **The Campus Map** – a 3D-tilted Mapbox view of UNL with deck.gl overlays.
2. **The Heatmap Timeline** – a scrubber + play/pause control that animates activity across the day.
3. **The Building Insight Panel** – a contextual card that appears when you click a building polygon.

**Campus Map**

- Centered on campus with a pitched camera so buildings feel spatially anchored.
- Uses Mapbox's `standard` style for crisp labels and 3D extrusion where available.
- Deck.gl layers render on top to provide:
	- A dense, smooth **activity heatmap**.
	- A **building footprint layer** with hover and click support.

**Heatmap Timeline**

- Represents a full day (or scenario window) of simulated activity.
- Supports both **scrubbing** and **auto-play** modes.
- Drives the time window that filters underlying activity events.
- Visually communicates where the "heartbeat" of campus is strongest at any moment.

**Building Insight Panel**

- Surfaces rich metadata for the selected building (from mock data today, from campus systems tomorrow).
- Designed to eventually host metrics like:
	- Average occupancy vs.
	- Peak times by day-of-week.
	- Overlap between classes, events, and reservations.
	- Game-day deltas vs. typical baselines.

Together, these pieces create a story: *"Here is how UNL breathes over the course of a day, and here is how individual buildings contribute to that pattern."*

---

## 🧠 Architecture At 10,000 Feet

Husker Hustle is structured to keep **data**, **visualization**, and **interaction** cleanly separated.

### Framework & Rendering

- **Next.js 16 (App Router)** provides routing, layout composition, and server/client boundaries.
- **React 19** powers the interactive UI, hooks-based state management, and component model.
- **Mapbox GL + react-map-gl** render the base map, camera, and controls.
- **deck.gl** handles GPU-accelerated visualization layers for the heatmap and buildings.

### Core Modules

- `app/page.tsx` – orchestrates data loading, time window state, and layer construction.
- `components/map/CampusMap.tsx` – Mapbox + deck.gl integration with token management.
- `components/timeline/HeatmapTimeline.tsx` – playback controls and timeline UI.
- `components/sidebar/BuildingDetail.tsx` – building insight panel.
- `lib/mockData/*` – mock generators and strongly typed data models.
- `lib/timeUtils.ts` – time range calculations and sliding window filters.
- `lib/mapConfig.ts` – map center, zoom, pitch, and building focus configuration.

Each layer and component is designed so that **mock data can be replaced with real sources** without rewriting the visualization logic.

---

## 🔌 Data Model & Future Integrations

Even in mock form, the data model is structured around the feeds Husker Hustle expects to ingest.

### Activity Events

Each activity point is shaped roughly like this:

- `latitude`, `longitude` – where on campus the activity happens.
- `timestamp` – when it happens (Unix ms).
- `weight` – relative intensity, derived from factors like roster size or event type.
- `source` – one of `"class" | "exam" | "reservation" | "testing" | "club" | "sports" | "gameday"`.

In a production system, this might be computed from:

- Class schedule + roster size → baseline classroom load.
- DLC / testing center occupancy → short, intense bursts of traffic.
- Room reservations → club meetings, study groups, workshops.
- Stadium + athletics calendar → large spikes aligned to kickoffs and post-game exits.

### Buildings

Buildings are modeled as:

- `id`, `name`, `category` (academic, housing, student life, etc.).
- `center` coordinate for camera targeting.
- `polygon` footprint for map rendering.
- Optional `height` for future 3D emphasis.

This structure is already enough to drive the GeoJSON footprint layer and the building insight panel.

---

## ⚙️ Getting Started (Dev Setup)

From the `frontend` directory:

```bash
npm install
cp .env.example .env.local   # if provided
# then set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN in .env.local
npm run dev
```

- Open `http://localhost:3000` in your browser.
- You should see the Husker Hustle map with a heatmap overlay and a timeline docked near the bottom.

If the map does not load, the UI will guide you to configure `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` correctly.

---

## 🎛️ Tuning The Experience

Because this is a hackathon-friendly codebase, a handful of key constants control a lot of the "feel":

- **Map camera** – `lib/mapConfig.ts` defines center, zoom, pitch, and building focus zoom.
- **Heatmap shape** – `HeatmapLayer` config in `app/page.tsx` controls radius, intensity, and threshold.
- **Timeline playback** – `PLAY_INTERVAL_MS`, `PLAY_STEP_MS`, and `HEATMAP_WINDOW_MS` set how fast the day advances and how wide the lens is.

Tweaking these values is often enough to move from "neat" to "wow" in a live demo.

---

## 🚧 Current Limitations (And How We Intend To Fix Them)

Husker Hustle is intentionally built as a **visual prototype** that is future-compatible with more serious data plumbing.

Today:

- All activity and building data is generated on the fly from structured mock sets.
- The "insights" are expressed visually rather than as textual recommendations.
- There is no persistent store or historical archive; each session is ephemeral.

Tomorrow, the same interface could be powered by:

- A data warehouse or lake (e.g., BigQuery, Snowflake) that stores historical campus activity.
- Scheduled batch jobs or streaming pipelines that populate event tables.
- A small insights service that produces narratives like:
	- "💡 Tuesday 10 AM is consistently over capacity in this cluster of lecture halls."
	- "💡 Game days are pushing evening study traffic into under-served buildings on East Campus."

The visualization here is the **final mile** for those ideas.

---

## 🤝 Who This Repo Is For

This repository is intentionally friendly to:

- **Hackathon teams** who want to tell a rich, map-based story without building everything from scratch.
- **Student devs** looking to learn Next.js, Mapbox, and deck.gl in a real-feeling project.
- **Campus partners** who might want to pilot data integrations later.

If you see ways to plug in real data, tweak the design, or extend the insights, you are exactly the audience we had in mind.

---

## 🚀 Quick Reference

- Start dev server: `npm run dev`
- Main page: `app/page.tsx`
- Map wrapper: `components/map/CampusMap.tsx`
- Heatmap & buildings: constructed in `app/page.tsx` via deck.gl layers.
- Timeline UI: `components/timeline/HeatmapTimeline.tsx`
- Building sidebar: `components/sidebar/BuildingDetail.tsx`
- Map config: `lib/mapConfig.ts`
- Time helpers: `lib/timeUtils.ts`

Husker Hustle is still evolving, but the core idea is simple: **turn the motion of campus life into something you can see, scrub, and act on.**

---

## 🧪 Example Scenarios Husker Hustle Can Tell A Story About

Even in its mock-data incarnation, Husker Hustle is designed around concrete, realistic scenarios that planners and students actually care about. A few examples:

### 1. Monday Morning Crunch ☕📚

**Question:** *"Where is campus under the most strain between 8:00 and 11:00 on a typical Monday?"*

In Husker Hustle, you would:

- Scrub the timeline to the 8:00–11:00 window or hit Play and watch the morning ramp up.
- Observe the heatmap clustering around lecture-heavy buildings and core corridors.
- Click into buildings with the brightest halos to inspect their role in the pattern.

This scenario is a dry run for a world where class rosters, room capacities, and historical attendance all feed the heatmap weight for each event.

### 2. DLC Stress Test 🧪😰

**Question:** *"Are testing centers experiencing unhealthy spikes during midterms?"*

In a future data-connected version:

- Testing center occupancy streams would show up as highly weighted, short-duration events.
- Filtering to the relevant weeks would reveal whether DLC-style facilities are just busy, or consistently over capacity.
- Building cards could summarize average wait times, peak days, and spillover effects into nearby spaces.

The current mock data already simulates this behavior visually; swapping in real metrics keeps the UX the same while raising the stakes.

### 3. Game Day Ripple Effects 🏈🌆

**Question:** *"How do home games change campus usage before and after kickoff?"*

Husker Hustle’s model naturally supports this view:

- Events tagged as `gameday` raise both activity near the stadium and along routes connecting parking, dining, and residence halls.
- The timeline lets you move from pre-game arrivals through peak stadium occupancy to post-game dispersal.
- Comparing typical weekends to game weekends shows where infrastructure or staff might be under- or over-provisioned.

This is exactly the kind of question the interface is meant to make visceral instead of abstract.

### 4. Study Space Discovery 📖✨

**Question:** *"Where are the hidden, consistently under-utilized study spaces on campus?"*

By looking at low-intensity regions during common study times (evenings, weekends), Husker Hustle can help identify:

- Buildings that rarely see meaningful heat in the evening.
- Clusters of spaces with persistent low signals despite being near busy corridors.
- Opportunities to redirect marketing, staffing, or amenities.

In an AI-enhanced setup, this would become a gentle recommendation engine for students: "Try this building at 7 PM — it’s usually calm and has available space."

---

## 🧩 Component-Level Tour

This section is for developers who want to understand how the conceptual pieces map onto actual files and props.

### `CampusMap` (components/map/CampusMap.tsx)

**Responsibility:** Own the actual Mapbox GL instance and host deck.gl overlays.

Key behaviors:

- Reads `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` via a small hook and renders a friendly message if it’s missing.
- Mounts a `Map` component from `react-map-gl` with `DEFAULT_VIEW_STATE` from `lib/mapConfig.ts`.
- Exposes a `mapRef` so parent components can call `flyTo` when a building is selected.
- Renders `MapboxOverlay` with the active deck.gl `layers` and click handler.

If you want to:

- Change the base map style → update the `mapStyle` prop.
- Adjust starting camera → tweak `DEFAULT_VIEW_STATE`.
- Add more layers → extend the `layers` array built in `app/page.tsx`.

### `HeatmapTimeline` (components/timeline/HeatmapTimeline.tsx)

**Responsibility:** Provide the time scrubber and playback controls.

Key props:

- `timeRange` – global min/max timestamps.
- `currentTime` – where the window is currently anchored.
- `onTimeChange` – called when the slider moves.
- `isPlaying` / `onPlayPause` – control and reflect the playback loop.

The caller (in `app/page.tsx`) remains the single source of truth for time-related state; the timeline is a pure view/controller layer.

### `BuildingDetail` (components/sidebar/BuildingDetail.tsx)

**Responsibility:** Turn a raw building record into a compact, human-readable summary.

Today, it leans on mock metadata. In the future, it is the natural home for:

- Utilization charts.
- Source breakdowns (classes vs. clubs vs. testing vs. events).
- Game-day deltas.
- Textual insights fed by a backend service.

Because it is driven entirely by a `Building` object, it is very easy to enrich as new fields become available.

---

## 🧱 Design Principles

A few non-technical principles quietly guide Husker Hustle’s implementation:

1. **Make the default path delightful.** The first-run experience (fresh clone + token) should already feel like a cohesive product tour.
2. **Prefer clarity over cleverness.** Variable names, types, and components aim to be boringly descriptive, not mysterious.
3. **Keep visual hierarchy simple.** The map is always the star; UI elements are supporting actors.
4. **Design for replacement.** Mock generators, map styles, and even data feeds should be easy to swap without rewriting core logic.

These ideas show up everywhere from file naming to color choices.

---

## 🔍 Debugging & Troubleshooting Tips

A few issues you might run into while developing or demoing Husker Hustle — and how to recover gracefully.

### Map Doesn’t Load At All

- Check that `.env.local` exists in the `frontend` directory.
- Verify `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` is present and spelled correctly.
- Restart the dev server after changing env vars.
- Open the browser console for Mapbox-related errors.

### Heatmap Looks Flat Or Underwhelming

- Confirm the mock activity generator is returning events in the expected time range.
- Adjust `radiusPixels`, `intensity`, and `threshold` in the `HeatmapLayer` config.
- Narrow or widen `HEATMAP_WINDOW_MS` to change how much data contributes at once.

### Building Clicks Don’t Do Anything

- Ensure the `GeoJsonLayer` is marked `pickable: true` and has a stable `id`.
- Confirm the `onClick` handler is passed through `MapboxOverlay`.
- Check that building IDs in GeoJSON match the ones in `MOCK_BUILDINGS`.

These checks are usually enough to unblock most development hiccups.

---

## 🧭 Roadmap Sketch (Aspirational)

Finally, a quick, non-binding roadmap sketch to anchor future ideas:

- **Short term**
	- Clean up visual polish and responsive behavior.
	- Add simple filters (e.g., "classes only", "events only", "game days only").
	- Introduce scenario switches (typical week vs. finals week).

- **Medium term**
	- Connect one or two real data feeds behind a feature flag.
	- Add descriptive insight callouts for buildings with notable patterns.
	- Support exporting specific map states as sharable links or screenshots.

- **Long term**
	- Integrate a proper data pipeline and warehouse.
	- Build a recommendation engine for schedule planning and space allocation.
	- Turn Husker Hustle into a platform for experimenting with student-life interventions.

Whether or not all of these items ship, they help keep the architecture pointed in a consistent direction.

---

## 🌽 Closing Thought

Husker Hustle is, at its heart, a simple promise: **if you can see how campus moves, you can make campus better.**

This repository gives you a concrete starting point for that journey — with a map that feels alive, a timeline that makes time tangible, and a data model that is ready to grow from mock to real.

