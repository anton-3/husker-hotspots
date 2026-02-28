# 📊 Husker Hustle Data & Insights Layer

Welcome to the **brain** of Husker Hustle. This folder holds the configuration, mock data, and time utilities that turn a raw campus into a **living signal**.

If the components folder is the face of the app, `lib/` is the nervous system: it knows *when* things happen, *where* they happen, and roughly *how intense* they are. 🔍🧠

---

## 🧠 Data Philosophy

Husker Hustle treats campus life as a superposition of multiple signals:

- 📚 Class schedules and roster sizes.
- 🧪 Testing center occupancy (DLC and friends).
- 🏫 Room and space reservations.
- 🏈 Game days and special events.
- ✨ Optional extra feeds like weather, dining, or transit.

Rather than mirror each system in all its messy glory, we normalize everything into a simple **activity event**:

> "Something happened at this place, at this time, with this intensity, for this reason."

This is the contract that powers the heatmap, building insights, and future AI-driven recommendations.

---

## 🧱 Core Modules

The `lib/` directory is organized around a few core files:

- `mapConfig.ts` – where the camera and map defaults live (center, zoom, pitch, etc.).
- `timeUtils.ts` – helpers for computing global time ranges and sliding windows.
- `mockData/` – strongly typed mock datasets for buildings and activity.
- `mockData/types.ts` – shared TypeScript types for everything above.

Together, these modules provide a clean separation between **data shape** and **visualization logic**.

---

## 🔄 Normalized Activity Events

Conceptually, each campus event is reduced to a compact shape:

- `latitude` / `longitude` – where the signal lives.
- `timestamp` – when it happens (Unix ms).
- `weight` – how "loud" or impactful it is.
- `source` – one of `"class" | "exam" | "reservation" | "testing" | "club" | "sports" | "gameday"`.
- `metadata` – optional extra details like course codes or event IDs.

Real-world examples of this mapping:

- A 200-person lecture becomes a cluster of high-weight events over its time block.
- A packed exam session shows up as a spike in the testing layer.
- A stadium game generates a wave of events before and after kickoff.

The beauty of this model is that the **map does not care** which system produced the event — it just paints the pattern. 🎨

---

## 🧪 Mock Data Strategy

Until Husker Hustle is wired into real campus systems, the `mockData/` folder provides:

- `buildings.ts` – a catalog of key UNL buildings with centers and polygons.
- `activity.ts` – a generator that produces believable daily rhythms.
- `types.ts` – the shared definitions that keep everything consistent.

The mock activity generator encodes a handful of intuitive rules:

- Early mornings favor academic buildings and study spaces.
- Midday boosts the Union, dining, and outdoor commons.
- Late afternoon/early evening sees more recreation and club activity.
- Special spikes mimic exam rushes or game-day surges.

This gives the heatmap a satisfying heartbeat without any real data yet. 💓

---

## ⏱️ Time Windows & Playback

`timeUtils.ts` provides the plumbing that ties data to the timeline UI:

- `getActivityTimeRange(activity)` – finds the global min/max timestamps.
- `filterActivityByTime(activity, start, end)` – extracts events within a sliding window.
- `HEATMAP_WINDOW_MS` – defines how wide that window is (the "shutter speed" for the map).

In `app/page.tsx`, these utilities drive the logic that:

1. Computes the full range of the scenario.
2. Filters events into `[currentTime, currentTime + HEATMAP_WINDOW_MS]`.
3. Passes that slice into the deck.gl `HeatmapLayer` for GPU aggregation.

The result is a smooth, continuous sense of motion as the timeline scrubs across the day. 🕒

---

## 📈 From Visuals To Insights

Right now, Husker Hustle expresses insights visually:

- Hotspots that flare up and fade as classes start and end.
- Buildings that sit under consistently bright regions.
- Quiet pockets where campus feels under-utilized.

In a future integration, this same layer would power more explicit insight surfaces, like:

- "Lecture halls in this corridor run >80% capacity on M/W/F mornings." ⚠️
- "Testing centers see a 3× spike during midterms compared to baseline." 📉📈
- "These study rooms rarely exceed 40% utilization after 7 PM." 💡

Because all signals flow through the normalized event model, aggregations and models can be added without rewiring the map.

---

## 🧭 Integration-Friendly Design

When it’s time to plug in real systems, the intended flow is:

1. Source systems export data (SIS, reservations, occupancy, events).
2. A backend pipeline transforms raw records into normalized events.
3. APIs expose:
+   - Event slices for the map and heatmap.
+   - Aggregated metrics for building panels and reports.
4. The frontend (this repo) continues to consume the same shapes — only the origin changes.

In other words: **mock today, production-ready tomorrow**. The code in `lib/` keeps that promise by treating shapes and contracts as first-class citizens.

If you are touching this folder, you are shaping how Husker Hustle thinks about campus reality. Handle with care — and maybe a little excitement. 🌽🚀

---

## 🧪 Example Analytics Questions This Layer Can Support

To make the data model more concrete, here are sample questions a future analytics pipeline could answer using the shapes defined in `lib/`:

1. **Capacity vs. Usage**  
	*"Which academic buildings consistently run above 90% of their modeled capacity between 10:00 and 14:00 on weekdays?"*

2. **Cross-System Interactions**  
	*"How do large evening reservations in student centers correlate with dining traffic and transit load?"*

3. **Temporal Shifts**  
	*"How does the pattern of activity change between midterm weeks and baseline weeks for freshman-heavy courses?"*

4. **Game-Day Footprints**  
	*"Which study spaces stay resilient on home game days, and which ones experience disruptive spikes?"*

5. **Equity & Access**  
	*"Are certain parts of campus consistently under-served by late-night study or collaboration space usage?"*

The normalized event approach makes these questions variations on **filter + aggregate**, rather than bespoke one-off reports.

---

## 🧰 Implementation Notes For Future Integrations

If you are the person wiring Husker Hustle into real systems, a few hints from your past self:

- Use **stable, opaque IDs** for buildings and rooms so records remain joinable across systems.
- Keep timestamps in a single, clearly documented timezone before converting to the client’s local time.
- Consider pre-aggregating heavy queries (e.g., utilization by building and hour) into summary tables for fast retrieval.
- Start with read-only, anonymized aggregates; you do not need per-student traces to get meaningful patterns.

On the frontend side, resist the temptation to smuggle backend-specific assumptions into this folder. Keep it about shapes and semantics, not transport specifics.

---

## 🧬 Extending The Data Model

As Husker Hustle grows, you might want to extend the core shapes without breaking everything:

- Add optional fields like `confidenceScore`, `scenarioTag`, or `sourceSystem` to events.
- Introduce building-level attributes like `primaryUse`, `openHours`, `accessRestrictions`.
- Create lightweight enums or literal unions for new source types instead of untyped strings.

Because TypeScript types live alongside mock data here, you can evolve the model incrementally and let the compiler guide downstream refactors. 🧑‍💻✨

---

## 📚 Documentation As A Contract

Finally, treat this README and related comments as part of the actual contract between data producers and consumers. When you change:

- The meaning of `weight`.
- The set of valid `source` values.
- The interpretation of building categories.

update this file. Future you — and anyone integrating Husker Hustle with new backends — will thank you.

Until then, enjoy the fact that with just a small set of well-defined shapes, you can make an entire campus light up on a map. 💡🗺️

---

## 🧮 Testing & Validation Ideas

Even though this is a frontend-focused repo, you can still bring discipline to the data layer with a few light-touch practices:

- **Type-driven testing** – lean on TypeScript to catch shape mismatches early. If you evolve `ActivityEvent`, propagate changes here first.
- **Snapshot fixtures** – capture small, representative slices of mock data and assert that time filters and aggregations behave as expected.
- **Boundary tests** – explicitly test behavior at time-range edges, such as when `currentTime + HEATMAP_WINDOW_MS` equals `timeRange.max`.

These do not need a heavy test framework to be useful; even a handful of sanity checks can prevent subtle regressions.

---

## 🔐 Security & Privacy Posture (High Level)

Although Husker Hustle currently runs entirely on mock data, any future real deployment must treat student data with care.

Design assumptions baked into this layer include:

- Events should be **aggregated and anonymized** before they ever reach the frontend.
- Per-student identifiers are unnecessary for the kinds of insights this app wants to surface.
- Time and location granularity can be coarsened if needed without breaking the visualization model.

When adapting this code to a production setting, work closely with institutional data governance teams to ensure that any real feeds align with policy and respect student privacy.

---

## 🌐 Beyond UNL: Generalizing The Model

Finally, note that nothing in this folder is fundamentally UNL-specific. The same data model could apply to:

- Other universities looking at campus movement.
- Corporate or research campuses analyzing space utilization.
- Large event venues mapping attendee flows and pinch points.

All of these environments can be seen as variations on the same theme:

> A set of spaces, a schedule of activities, and people moving through them.

By keeping `lib/` focused on generic, well-documented shapes, Husker Hustle stays portable to new contexts — while still proudly wearing Husker red in the UI. 🌽❤️
