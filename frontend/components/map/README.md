# 🗺️ Husker Hustle Map Stack

Welcome to the **map engine** for 🏃‍♀️ Husker Hustle — the part of the app that makes UNL’s campus feel like a living, breathing organism instead of a flat screenshot.

This folder contains the components that glue together **Mapbox**, **react-map-gl**, and **deck.gl** into a single, smooth experience:

- `CampusMap.tsx` – the React wrapper around Mapbox + deck.gl overlays.
- `MapboxOverlay.tsx` – the tiny but mighty bridge that lets deck.gl draw GPU layers directly into the map.

If you want to change how the campus *looks*, *moves*, or *feels* on screen, you are in exactly the right place. ✨

---

## 🌎 Experience Goals

The map stack is built to deliver a few very specific vibes:

1. **Instant orientation** – within a second, it should be obvious that you are looking at UNL, not a random city block. 🏫
2. **Cinematic motion** – camera moves (tilt, zoom, flyTo) should feel like piloting a tiny drone over campus, not jumping between static frames. 🚁
3. **Layered storytelling** – base map → heatmap → buildings → UI overlays should build up a story as you explore. 📚
4. **Predictive framing** – even with mock data, the map should *look ready* for serious forecasting and AI-powered insights. 🤖

These goals drive decisions about camera settings, styles, and how we layer information on top of the map.

---

## 🧩 Layering Strategy

Visually, the map experience is a stack of layers, back to front:

1. **Base map (Mapbox GL)** – crisp labels, 3D buildings where available, Husker-friendly context.
2. **Activity heatmap (deck.gl)** – glowing blobs of activity that reflect the current time window. 🔥
3. **Building footprints (deck.gl GeoJsonLayer)** – polygons you can hover and click to anchor the story. 🏢
4. **UI overlays (React)** – timeline, legends, and side panels that wrap the experience. 🎛️

`CampusMap` wires all of this together by:

- Managing a `MapRef` so `page.tsx` can fly the camera to buildings.
- Loading the Mapbox token via `useMapboxToken` and handling the “no token yet” state with a friendly message.
- Applying `DEFAULT_VIEW_STATE` from `lib/mapConfig.ts` so the initial view is perfectly framed.
- Hosting the `MapboxOverlay` component, which hands control to deck.gl for actual WebGL rendering.

---

## 🧭 Camera & View State

The camera configuration lives primarily in `lib/mapConfig.ts`, but this folder is where it comes to life.

Key ingredients:

- **MAP_CENTER** – latitude/longitude for the default campus focus.
- **DEFAULT_VIEW_STATE** – zoom, pitch, and bearing for the starting pose.
- **BUILDING_ZOOM / BUILDING_PITCH** – values used when zooming into a single building.

Inside `page.tsx`, when you click a building:

1. The `mapRef` from `CampusMap` is used to call `flyTo` on the underlying map.
2. `BUILDING_ZOOM` and `BUILDING_PITCH` are applied for a dramatic but readable view.
3. The `BuildingDetail` panel slides in to complete the story. 🌟

All of that depends on the `MapRef` that originates in this folder.

---

## 🔥 Heatmap + Buildings (In Context)

While the heatmap and GeoJSON layers are constructed in `app/page.tsx`, they **render through** the `MapboxOverlay` component here.

- `MapboxOverlay` uses `useControl` from `react-map-gl` to mount a `MapboxOverlay` (from `@deck.gl/mapbox`).
- On every prop change, it calls `overlay.setProps(props)`, which keeps layers, interactivity, and view state in sync.
- Because the overlay is marked as `interleaved`, deck.gl layers are composited in a way that plays nicely with Mapbox’s own rendering pipeline.

The net effect is that your heatmap + buildings feel like a native part of the map, not an iframe floating on top. 💫

---

## 🎨 UI Integration

The map canvas itself is intentionally kept visually minimal so UI can float on top:

- The page wraps `CampusMap` in a full-screen container.
- Headers, legends, and the timeline are absolutely positioned over the map with glassy backgrounds.
- All pointer events are carefully scoped so you can drag the map *and* interact with controls without conflict.

If you add new overlays (e.g., filters, scenario toggles), this folder is where you ensure the map still feels responsive and smooth.

---

## 🛠️ Common Tweaks

Things you might reasonably want to adjust here:

- **Map style** – switch `mapStyle` in `CampusMap` to a different Mapbox style (e.g., dark mode, high-contrast). 🎨
- **Initial zoom/pitch** – tune `DEFAULT_VIEW_STATE` for more/less drama.
- **Performance tradeoffs** – if you add many deck.gl layers, you may want to tweak `reuseMaps` or overlay options.

When in doubt, remember the core principle: **the map should always feel like the stage, not the entire show**. Everything else — heatmaps, buildings, timelines, insights — is lighting and choreography on top of that stage.

---

## 🔬 Map Debugging & Tuning Checklist

If something looks or feels off with the Husker Hustle map, this quick checklist can help you track it down.

### Camera Feels Weird

- Is the initial view too close or too far?
	- Adjust `zoom` in `DEFAULT_VIEW_STATE`.
- Is the pitch so high that labels are hard to read?
	- Dial back `pitch` a few degrees at a time.
- Does the campus feel rotated in an unintuitive way?
	- Try a `bearing` of `0` or a cardinal direction aligned with key corridors.

### Map Is Janky When Dragging

- Check how many deck.gl layers are being rendered.
- Temporarily remove lower-priority layers to confirm which one is expensive.
- Make sure you are not re-creating `layers` arrays on every render without `useMemo`.

### Map Looks Blurry Or Washed Out

- Confirm that any CSS scaling or transforms are not being applied to the map container.
- If you changed the base style, pick one with a clean contrast profile under a heatmap overlay.
- Verify that you are not drawing overly opaque overlays on top of labels.

This README is your reminder that maps are both art and engineering — small tweaks can dramatically change the feel of the experience. 🎨🧮

---

## 🧱 Ideas For Future Map Enhancements

Some directions the Husker Hustle map stack could grow in, if you want to impress future judges, teammates, or your future self:

- **Scenario toggles** – allow users to switch between "Typical Week", "Finals Week", and "Game Day" presets.
- **Layer toggles** – give viewers the ability to turn individual sources on and off (classes only, events only, etc.).
- **Path visualizations** – infer common walking routes between buildings and draw them as animated flows.
- **Accessibility views** – highlight step-free paths, elevators, and accessible building entrances.
- **Time-of-day styles** – gradually shift the base map style toward evening or night palettes as the timeline advances.

All of these ideas can be implemented as **variations on layers and styling**, without needing to rewrite the core `CampusMap` scaffolding.

---

## 🌽 Why This Folder Matters

When people play with Husker Hustle for the first time, they remember the feeling of flying around campus, not the type definitions or build scripts. That feeling starts here.

- A single thoughtful camera setting can make the campus feel inviting instead of confusing.
- A carefully tuned overlay can make activity patterns instantly legible.
- A smooth drag or scroll interaction can be the difference between "neat" and "I want to keep exploring this." 🧭

If you are working in this folder, you are effectively the **director of photography** for Husker Hustle. Have fun with it.

---

## 🧪 Advanced Topics: Performance & Reliability

For small hackathon datasets, the map stack will almost always feel instant. But if you ever scale Husker Hustle to larger or more complex scenarios, these topics become important.

### 1. Layer Complexity & Draw Calls

Every deck.gl layer adds work for the GPU. While modern machines can handle quite a bit, it is good practice to:

- Prefer **fewer, richer layers** over many thin ones.
- Use `updateTriggers` thoughtfully so only the props that change actually trigger re-renders.
- Consider aggregating infrequent or background layers into static tiles or precomputed images.

When in doubt, open your browser’s performance tools and profile a few timeline scrubs while watching GPU time.

### 2. Device Diversity

Remember that your laptop is not the only device that may run this app.

- On high-DPI displays, subtle aliasing issues may show up along building edges.
- On integrated GPUs or older hardware, large heatmap radii can become expensive.
- On touch devices, gesture handling needs to feel natural and avoid conflict with scroll.

If Husker Hustle is ever used beyond a demo, consider testing on:

- A mid-range laptop.
- A tablet or 2-in-1 device.
- A projector-driven display (for how the colors and contrasts hold up).

### 3. Handling Mapbox Rate Limits

In a real deployment with many viewers, Mapbox rate limits and token scoping matter.

- Use separate tokens for development, staging, and production.
- Consider using usage-restricted tokens for public demos.
- Monitor tile and style request counts if you embed Husker Hustle into a high-traffic environment.

The map stack here does not impose an opinion on token management, but it is ready to plug into a more sophisticated configuration system if needed.

### 4. Error States & Fallbacks

The current implementation already shows a clear message when the Mapbox token is missing. You can extend this pattern to handle:

- Network errors when loading tiles.
- Unsupported browsers (e.g., very old versions without WebGL2).
- Feature-detection failures for things like `MapboxOverlay`.

Thoughtful fallbacks make the map feel robust even when the environment is not.

---

## 🌍 Multi-Campus & Multi-Scenario Considerations

While Husker Hustle is currently tailored to UNL, the map stack can scale to multiple campuses or scenarios with a bit of planning.

### Multi-Campus

You could imagine a future where:

- Different campuses are selectable from a dropdown or URL parameter.
- Each campus has its own `MAP_CENTER`, `DEFAULT_VIEW_STATE`, and building catalog.
- Shared components in this folder remain unchanged; only configuration and data swap out.

Structuring your code so that map configuration is driven by props or context can make this transition painless.

### Multi-Scenario

Similarly, the same physical campus can host different **scenarios**:

- Baseline week vs. midterms vs. finals.
- Typical day vs. game day.
- Normal operations vs. construction detours.

The map stack can represent these by:

- Switching which layers are active.
- Adjusting color ramps or opacities per scenario.
- Animating camera paths to tell specific scenario stories.

The key is to treat the map as an expressive canvas that can host many narratives, not a single static dashboard.

---

## ✅ Map Stack Checklist For New Contributors

If you are new to this repo and want to make safe, high-impact changes in this folder, run through this checklist:

1. **Read through this README** to get a feel for goals and constraints. ✅
2. **Skim `CampusMap.tsx` and `MapboxOverlay.tsx`** to understand how props flow. ✅
3. **Open `lib/mapConfig.ts`** and note the current center, zoom, and pitch defaults. ✅
4. **Run the app** and interact with the map while watching the browser console for warnings. ✅
5. **Make one small, reversible change** (e.g., tweak pitch or change a color) and verify behavior in multiple viewports. ✅

If all of that feels good, you are ready to tackle larger changes like new layers, new interactions, or redesigned overlays.
