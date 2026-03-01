"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import Map, { Source, Layer, NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { MAP_CONFIG, DATA_SOURCES, type DataSourceId, type DayOfWeek } from "@/lib/map/config";
import { BUILDINGS, getBuildingById, type Building, type CampusBuilding } from "@/lib/map/buildings";
import {
  generateDayTimeline,
  generateInsights,
  type TimelineSnapshot,
  type HeatmapPoint,
} from "@/lib/map/mock-data";
import {
  useDensityDay,
  useBuildingTimeline,
  slotWeightsToHeatmapPoints,
  type ClassAtTime,
} from "@/lib/api/density";
import { useCampusBuildings, findClosestBuilding } from "@/lib/api/buildings";
import {
  heatmapPointsToGeoJSON,
} from "@/lib/map/geojson";

import { TimelineSlider } from "./timeline-slider";
import { InsightsPanel } from "./insights-panel";
import { DataSourceToggle } from "./data-source-toggle";
import { Legend } from "./legend";
import { BuildingPopup } from "./building-popup";
import { MinimalBuildingPopup } from "./minimal-building-popup";
import { MapPin, Layers } from "lucide-react";
import type { MapLayerMouseEvent } from "mapbox-gl";
import type { Map as MapboxMap } from "mapbox-gl";

/** Selected building can be rich (12) or minimal (from API). */
type SelectedBuilding = Building | CampusBuilding;

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const EMPTY_HEATMAP_GEOJSON: GeoJSON.FeatureCollection<GeoJSON.Point> = {
  type: "FeatureCollection",
  features: [],
};

const EMPTY_BUILDINGS_GEOJSON: GeoJSON.FeatureCollection<GeoJSON.Polygon> = {
  type: "FeatureCollection",
  features: [],
};

/** Blue tint for clickable (52) campus buildings — distinct from default building gradient */
const CLICKABLE_BUILDING_COLOR = "#1e3a5f";
/** Red highlight when a building is selected */
const SELECTED_BUILDING_COLOR = "#b91c1c";
/** Scale clickable extrusion slightly above base layer to avoid z-fighting */
const CLICKABLE_BUILDING_HEIGHT_SCALE = 1.02;
/** Scale clickable footprint horizontally so blue layer extends slightly past base */
const CLICKABLE_BUILDING_HORIZONTAL_SCALE = 1.02;

const SELLECK_IDS = new Set([
  "SELD",
  "SELE",
  "SELF",
  "SELG",
  "SELH",
  "SELJ",
  "SELK",
  "SELL",
]);
const SELLECK_SHAPE_ID = "SELL";

const TOOLTIPS = [
  "Try clicking on a building!",
  "Use arrow keys to change the camera angle!",
  "Press space to play/pause the heatmap!",
];

/** Breakpoint (px) below which we treat as mobile and show static tip only */
const TOOLTIP_MOBILE_BREAKPOINT = 768;

type Ring = [number, number][];

function pointInRing(point: [number, number], ring: Ring): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function randomPointInGeometry(
  geom: GeoJSON.Polygon | GeoJSON.MultiPolygon
): [number, number] | null {
  const polygons = geom.type === "Polygon" ? [geom.coordinates] : geom.coordinates;
  if (!polygons.length || !polygons[0].length || !polygons[0][0].length) return null;
  const ring = polygons[0][0] as Ring;
  if (!ring.length) return null;

  let minX = ring[0][0];
  let maxX = ring[0][0];
  let minY = ring[0][1];
  let maxY = ring[0][1];
  for (const [lng, lat] of ring) {
    if (lng < minX) minX = lng;
    if (lng > maxX) maxX = lng;
    if (lat < minY) minY = lat;
    if (lat > maxY) maxY = lat;
  }

  for (let attempt = 0; attempt < 10; attempt++) {
    const lng = minX + Math.random() * (maxX - minX);
    const lat = minY + Math.random() * (maxY - minY);
    if (pointInRing([lng, lat], ring)) return [lng, lat];
  }

  let cx = 0;
  let cy = 0;
  for (const [lng, lat] of ring) {
    cx += lng;
    cy += lat;
  }
  cx /= ring.length;
  cy /= ring.length;
  return [cx, cy];
}

/** Scale a polygon ring around its centroid (for horizontal scale of clickable layer). */
function scaleRing(ring: number[][], scale: number): number[][] {
  if (ring.length === 0) return ring;
  let cx = 0;
  let cy = 0;
  for (const [lng, lat] of ring) {
    cx += lng;
    cy += lat;
  }
  cx /= ring.length;
  cy /= ring.length;
  return ring.map(([lng, lat]) => [
    cx + (lng - cx) * scale,
    cy + (lat - cy) * scale,
  ]);
}

function scalePolygonGeometry(
  geom: GeoJSON.Polygon | GeoJSON.MultiPolygon,
  scale: number
): GeoJSON.Polygon | GeoJSON.MultiPolygon {
  if (geom.type === "Polygon") {
    return {
      type: "Polygon",
      coordinates: geom.coordinates.map((ring) => scaleRing(ring, scale)),
    };
  }
  return {
    type: "MultiPolygon",
    coordinates: geom.coordinates.map((poly) =>
      poly.map((ring) => scaleRing(ring, scale))
    ),
  };
}

export function CampusMap() {
  // console.log("[v0] CampusMap rendering, token exists:", !!MAPBOX_TOKEN);
  // State
  const [viewState, setViewState] = useState<{
    longitude: number;
    latitude: number;
    zoom: number;
    pitch: number;
    bearing: number;
  }>({
    longitude: MAP_CONFIG.center[0],
    latitude: MAP_CONFIG.center[1],
    zoom: MAP_CONFIG.defaultZoom,
    pitch: MAP_CONFIG.pitch,
    bearing: MAP_CONFIG.bearing,
  });

  const [day, setDay] = useState<DayOfWeek>("Wednesday");
  const [timeIndex, setTimeIndex] = useState(24); // 6:00 AM default (24 = 6*4)
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);
  const [selectedBuilding, setSelectedBuilding] = useState<SelectedBuilding | null>(null);
  const [hoveredBuildingId, setHoveredBuildingId] = useState<string | null>(null);
  const [insightsOpen, setInsightsOpen] = useState(true);
  const [showSources, setShowSources] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [activeSources, setActiveSources] = useState<Set<DataSourceId>>(
    new Set(DATA_SOURCES.map((s) => s.id))
  );
  const [mapLoaded, setMapLoaded] = useState(false);
  const [buildingFootprintsVersion, setBuildingFootprintsVersion] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [tooltipText, setTooltipText] = useState(TOOLTIPS[0]);
  const [tooltipIndex, setTooltipIndex] = useState(0);

  const mapRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const lastTickTimeRef = useRef<number>(0);
  /** Arrow keys currently held for smooth pitch/bearing */
  const arrowKeysPressedRef = useRef(new Set<string>());
  const arrowKeyLastTickRef = useRef<number>(0);
  const arrowKeyRafRef = useRef<number>(0);
  /** Accumulated clickable building features (deduped by id or geometry key) for merge on moveend */
  const resolvedClickableFeaturesRef = useRef(
    new globalThis.Map<string, GeoJSON.Feature<GeoJSON.Polygon>>()
  );
  /** Map of campus building id -> resolved Mapbox building footprint geometry */
  const buildingFootprintsRef = useRef(
    new globalThis.Map<string, GeoJSON.Polygon | GeoJSON.MultiPolygon>()
  );

  // Smooth play progress 0–1 within current 15min tick (for slider animation only)
  const [smoothProgress, setSmoothProgress] = useState(0);
  const displayValue = Math.min(95, timeIndex + smoothProgress);

  // Generate timeline data (memoized per day)
  const timeline = useMemo(() => generateDayTimeline(day), [day]);
  const currentSnapshot = timeline[timeIndex];
  const insights = useMemo(
    () => (currentSnapshot ? generateInsights(currentSnapshot, timeline) : []),
    [currentSnapshot, timeline]
  );

  // Play/pause timeline: rAF drives smooth slider; time still advances every 15min
  useEffect(() => {
    if (!isPlaying) {
      setSmoothProgress(0);
      return;
    }
    lastTickTimeRef.current = Date.now();
    let rafId: number;
    const tickDuration = 500 / playSpeed;
    const tick = () => {
      const now = Date.now();
      let elapsed = now - lastTickTimeRef.current;
      if (elapsed >= tickDuration) {
        setTimeIndex((prev) => (prev >= 95 ? 0 : prev + 1));
        lastTickTimeRef.current = now;
        elapsed = 0;
      }
      setSmoothProgress(Math.min(elapsed / tickDuration, 1));
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, playSpeed]);

  const handleIndexChange = useCallback((value: number) => {
    const idx = Math.round(Math.min(95, Math.max(0, value)));
    setTimeIndex(idx);
    setSmoothProgress(0);
    lastTickTimeRef.current = Date.now();
  }, []);

  // Full-day density: fetch once per day, then index by timeIndex (no request on slider/play)
  const { data: dayData, isPending: densityLoading } = useDensityDay(day);
  const slot = dayData?.slots?.[timeIndex];
  // Reconstruct heatmap points: compact response has slot.w + shared axes; legacy has slot.heatmap_points
  const densityHeatmapPoints =
    slot?.w != null && dayData?.lng_axis && dayData?.lat_axis && dayData?.resolution
      ? slotWeightsToHeatmapPoints(
          slot.w as [number, number][],
          dayData.lng_axis,
          dayData.lat_axis,
          dayData.resolution
        )
      : slot?.heatmap_points ?? null;
  // Buildings: compact has slot.b (minimal); legacy has slot.buildings (full). Normalize to { building_id, estimated_people }[] for occupancy.
  const slotBuildings = slot?.b ?? slot?.buildings ?? null;
  // Single-slot-shaped object for building popup and any code that expects densityData
  const densityData = dayData && slot
    ? {
        bounds: dayData.bounds,
        resolution: dayData.resolution,
        lng_axis: dayData.lng_axis,
        lat_axis: dayData.lat_axis,
        heatmap_points: densityHeatmapPoints ?? [],
        buildings: slotBuildings ?? [],
        sources: dayData.sources ?? [],
        requested_time: slot.time,
        weekday: dayData.weekday,
        time_slot: slot.time,
      }
    : undefined;

  // Building timeline from API when a rich building is selected (one request for full day: chart + classes per slot)
  const richBuildingForTimeline = selectedBuilding ? getBuildingById(selectedBuilding.id) ?? null : null;
  const { data: buildingTimelineData } = useBuildingTimeline(richBuildingForTimeline?.id ?? null, day);
  // Classes at current time: from timeline slots (same request as chart — no per-slot at-time requests)
  const classesAtTimeFromTimeline = buildingTimelineData?.slots?.[timeIndex]?.classes ?? null;
  const buildingIndex = useMemo(
    () => new globalThis.Map(BUILDINGS.map((b) => [b.id, b])),
    []
  );

  // Heatmap: prefer API density data, but when unavailable, generate points inside
  // each building's resolved footprint geometry from the 3D building layer.
  const computeFallbackHeatmapPoints = (): HeatmapPoint[] => {
    if (!currentSnapshot) return [];
    const footprints = buildingFootprintsRef.current;
    const points: HeatmapPoint[] = [];

    for (const bo of currentSnapshot.buildings) {
      const building = buildingIndex.get(bo.buildingId);
      if (!building) continue;

      const effectiveId = SELLECK_IDS.has(bo.buildingId)
        ? SELLECK_SHAPE_ID
        : bo.buildingId;
      const geom = footprints.get(effectiveId);

      let numPoints = Math.max(1, Math.round(bo.occupancyPercent * 20));

      if (building.type === "library") {
        numPoints = Math.max(1, Math.round(numPoints * 3));
      }

      let neighborBuilding: Building | null = null;
      let neighborGeom: GeoJSON.Polygon | GeoJSON.MultiPolygon | undefined;
      if (building.type === "library" && bo.occupancyPercent > 0.5) {
        let minDist = Infinity;
        for (const other of BUILDINGS) {
          if (other.id === building.id) continue;
          const dx = other.coordinates[0] - building.coordinates[0];
          const dy = other.coordinates[1] - building.coordinates[1];
          const d2 = dx * dx + dy * dy;
          if (d2 < minDist) {
            minDist = d2;
            neighborBuilding = other;
          }
        }
        if (neighborBuilding) {
          neighborGeom = footprints.get(neighborBuilding.id);
        }
      }

      for (let i = 0; i < numPoints; i++) {
        let coordinates: [number, number] | null = null;
        let targetGeom = geom;
        let targetCenter = building.coordinates;

        if (neighborBuilding && Math.random() < 0.3) {
          targetGeom = neighborGeom ?? targetGeom;
          targetCenter = neighborBuilding.coordinates;
        }

        if (targetGeom) {
          const p = randomPointInGeometry(targetGeom);
          if (p) coordinates = p;
        }
        if (!coordinates) {
          const spread = 0.0004;
          const angle = Math.random() * 2 * Math.PI;
          const r = Math.random() * spread * Math.sqrt(bo.occupancyPercent || 0.2);
          coordinates = [
            targetCenter[0] + r * Math.cos(angle),
            targetCenter[1] + r * Math.sin(angle),
          ];
        }
        points.push({
          coordinates,
          weight: bo.occupancyPercent * (0.7 + Math.random() * 0.3),
        });
      }
    }

    return points;
  };

  const fallbackHeatmapPoints = useMemo(
    () => computeFallbackHeatmapPoints(),
    [currentSnapshot, buildingFootprintsVersion, buildingIndex]
  );

  const heatmapPoints = fallbackHeatmapPoints;
    // densityHeatmapPoints && densityHeatmapPoints.length > 0
    //   ? densityHeatmapPoints
    //   : fallbackHeatmapPoints;
  const heatmapPointsFiltered = useMemo(() => {
    if (activeSources.size === 7) return heatmapPoints;
    const ratio = activeSources.size / 7;
    return heatmapPoints.map((p) => ({ ...p, weight: p.weight * ratio }));
  }, [heatmapPoints, activeSources]);
  const heatmapGeoJSON = useMemo(
    () =>
      heatmapPointsFiltered.length > 0
        ? heatmapPointsToGeoJSON(heatmapPointsFiltered)
        : EMPTY_HEATMAP_GEOJSON,
    [heatmapPointsFiltered]
  );

  const { data: campusBuildingsList = [] } = useCampusBuildings();

  // Building footprints as GeoJSON for Mapbox fill layer — REMOVED (use 3D buildings for click/hover)
  // buildingGeoJSON removed

  // Building click handler - fly to building (accepts rich or minimal)
  const handleBuildingClick = useCallback(
    (building: SelectedBuilding) => {
      setSelectedBuilding(building);
      mapRef.current?.flyTo({
        center: building.coordinates,
        zoom: MAP_CONFIG.buildingZoom,
        pitch: 65,
        bearing: MAP_CONFIG.bearing + 10,
        duration: MAP_CONFIG.transitionDuration,
        essential: true,
      });
    },
    []
  );

  // Close building detail - fly back to campus
  const handleCloseBuilding = useCallback(() => {
    setSelectedBuilding(null);
    mapRef.current?.flyTo({
      center: MAP_CONFIG.center,
      zoom: MAP_CONFIG.defaultZoom,
      pitch: MAP_CONFIG.pitch,
      bearing: MAP_CONFIG.bearing,
      duration: MAP_CONFIG.transitionDuration,
      essential: true,
    });
  }, []);

  // Insight click - navigate to that building
  const handleInsightClick = useCallback(
    (buildingId: string) => {
      const building = getBuildingById(buildingId);
      if (building) handleBuildingClick(building);
    },
    [handleBuildingClick]
  );

  // Toggle data source
  const handleSourceToggle = useCallback((sourceId: DataSourceId) => {
    setActiveSources((prev) => {
      const next = new Set(prev);
      if (next.has(sourceId)) {
        next.delete(sourceId);
      } else {
        next.add(sourceId);
      }
      return next;
    });
  }, []);

  // Enable 3D buildings after map loads
  const handleMapLoad = useCallback(() => {
    console.log("[v0] Map loaded successfully");
    setMapLoaded(true);
    const map = mapRef.current?.getMap();
    if (!map) return;

    // Add 3D building extrusion layer
    const layers = map.getStyle()?.layers;
    if (!layers) return;

    // Find the first symbol layer to insert the 3D buildings beneath it
    let labelLayerId: string | undefined;
    for (const layer of layers) {
      if (layer.type === "symbol" && layer.layout?.["text-field"]) {
        labelLayerId = layer.id;
        break;
      }
    }

    if (!map.getLayer("3d-buildings")) {
      map.addLayer(
        {
          id: "3d-buildings",
          source: "composite",
          "source-layer": "building",
          filter: ["==", "extrude", "true"],
          type: "fill-extrusion",
          minzoom: 14,
          paint: {
            "fill-extrusion-color": [
              "interpolate",
              ["linear"],
              ["get", "height"],
              0, "#1a1a2e",
              50, "#16213e",
              100, "#0f3460",
            ],
            "fill-extrusion-height": ["get", "height"],
            "fill-extrusion-base": ["get", "min_height"],
            "fill-extrusion-opacity": 0.7,
          },
        },
        labelLayerId
      );
    }

    // GeoJSON source + layer for clickable (51) buildings — drawn on top with blue tint
    if (!map.getSource("clickable-buildings")) {
      map.addSource("clickable-buildings", {
        type: "geojson",
        data: EMPTY_BUILDINGS_GEOJSON,
      });
    }
    if (!map.getLayer("3d-buildings-clickable")) {
      map.addLayer(
        {
          id: "3d-buildings-clickable",
          source: "clickable-buildings",
          type: "fill-extrusion",
          paint: {
            "fill-extrusion-color": CLICKABLE_BUILDING_COLOR,
            "fill-extrusion-height": [
              "*",
              ["get", "height"],
              CLICKABLE_BUILDING_HEIGHT_SCALE,
            ],
            "fill-extrusion-base": ["get", "min_height"],
            "fill-extrusion-opacity": 0.7,
          },
        },
        labelLayerId
      );
    }
  }, []);

  // Map click: query 3D building layer, resolve to campus building, select and fly
  const handleMapClick = useCallback(
    (e: MapLayerMouseEvent) => {
      const map = mapRef.current?.getMap();
      if (!map) return;
      if (!map.getLayer("3d-buildings")) return; // Layer added in handleMapLoad; not ready yet
      const features = map.queryRenderedFeatures(e.point, {
        layers: ["3d-buildings", "3d-buildings-clickable"],
      });
      if (features?.length) {
        const { lng, lat } = e.lngLat;
        const campus = findClosestBuilding(campusBuildingsList, lng, lat);
        if (campus) {
          handleBuildingClick(campus);
          return;
        }
      }
      if (selectedBuilding) {
        handleCloseBuilding();
      } else {
        setSelectedBuilding(null);
      }
    },
    [campusBuildingsList, handleBuildingClick, handleCloseBuilding, selectedBuilding]
  );

  // Map mouse move: hover 3D building, resolve to campus building for cursor
  const handleMapMouseMove = useCallback(
    (e: MapLayerMouseEvent) => {
      const map = mapRef.current?.getMap();
      if (!map) return;
      if (!map.getLayer("3d-buildings")) {
        setHoveredBuildingId(null);
        return;
      }
      const features = map.queryRenderedFeatures(e.point, {
        layers: ["3d-buildings", "3d-buildings-clickable"],
      });
      if (features?.length) {
        const { lng, lat } = e.lngLat;
        const campus = findClosestBuilding(campusBuildingsList, lng, lat);
        setHoveredBuildingId(campus?.id ?? null);
      } else {
        setHoveredBuildingId(null);
      }
    },
    [campusBuildingsList]
  );

  const handleMapMouseLeave = useCallback(() => {
    setHoveredBuildingId(null);
  }, []);

  // Resolve 52 clickable buildings to Mapbox building geometries and update the clickable-buildings source
  const resolveClickableBuildings = useCallback(
    (map: MapboxMap, buildings: CampusBuilding[]) => {
      if (!map.getLayer("3d-buildings") || !map.getSource("clickable-buildings")) return;
      const seen = resolvedClickableFeaturesRef.current;
       const footprints = buildingFootprintsRef.current;
      for (const building of buildings) {
        const [lng, lat] = building.coordinates;
        const point = map.project([lng, lat]);
        const features = map.queryRenderedFeatures(point, { layers: ["3d-buildings"] });
        for (const f of features) {
          const geom = f.geometry;
          if (geom.type !== "Polygon" && geom.type !== "MultiPolygon") continue;
          const props = f.properties as { height?: number; min_height?: number };
          const height = props?.height ?? 0;
          const minHeight = props?.min_height ?? 0;
          const key =
            f.id != null ? `id:${f.id}` : `geom:${JSON.stringify(geom.coordinates)}`;
          if (seen.has(key)) continue;
          const scaledGeometry = scalePolygonGeometry(
            geom as GeoJSON.Polygon | GeoJSON.MultiPolygon,
            CLICKABLE_BUILDING_HORIZONTAL_SCALE
          );
          const feature: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> = {
            type: "Feature",
            geometry: scaledGeometry,
            properties: { height, min_height: minHeight, building_id: building.id },
          };
          seen.set(key, feature as GeoJSON.Feature<GeoJSON.Polygon>);
          footprints.set(building.id, scaledGeometry);
        }
      }
      const collection: GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon> = {
        type: "FeatureCollection",
        features: Array.from(seen.values()),
      };
      (
        map.getSource("clickable-buildings") as { setData(data: GeoJSON.FeatureCollection): void }
      ).setData(collection);
      setBuildingFootprintsVersion((v) => v + 1);
    },
    [setBuildingFootprintsVersion]
  );

  useEffect(() => {
    if (!mapLoaded || campusBuildingsList.length === 0) return;
    const map = mapRef.current?.getMap();
    if (!map || !map.getLayer("3d-buildings") || !map.getSource("clickable-buildings")) return;
    resolveClickableBuildings(map, campusBuildingsList);
    const onMoveEnd = () => resolveClickableBuildings(map, campusBuildingsList);
    map.on("moveend", onMoveEnd);
    return () => {
      map.off("moveend", onMoveEnd);
    };
  }, [mapLoaded, campusBuildingsList, resolveClickableBuildings]);

  // Highlight selected building in red; restore blue when deselected
  useEffect(() => {
    if (!mapLoaded) return;
    const map = mapRef.current?.getMap();
    if (!map || !map.getLayer("3d-buildings-clickable")) return;
    const selectedId = selectedBuilding?.id ?? "";
    map.setPaintProperty("3d-buildings-clickable", "fill-extrusion-color", [
      "case",
      ["==", ["get", "building_id"], selectedId],
      SELECTED_BUILDING_COLOR,
      CLICKABLE_BUILDING_COLOR,
    ]);
  }, [mapLoaded, selectedBuilding]);

  // Toggle heatmap visibility with 'h' key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "h" || e.key === "H") {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
        e.preventDefault();
        setShowHeatmap((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Spacebar: pause/play timeline
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === " ") {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Arrow keys: up/down = pitch, left/right = bearing (smooth while held, 1° at a time)
  useEffect(() => {
    const ARROW_KEYS = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]);
    const { minPitch, maxPitch, keyboardPitchRate, keyboardBearingRate } = MAP_CONFIG;

    const tick = () => {
      const now = performance.now();
      const dtSec = arrowKeyLastTickRef.current
        ? (now - arrowKeyLastTickRef.current) / 1000
        : 0;
      arrowKeyLastTickRef.current = now;

      const pressed = arrowKeysPressedRef.current;
      if (pressed.size === 0) return;

      const pitchDelta = keyboardPitchRate * dtSec;
      const bearingDelta = keyboardBearingRate * dtSec;

      setViewState((prev) => {
        const next = { ...prev };
        if (pressed.has("ArrowUp")) {
          next.pitch = Math.min(maxPitch, prev.pitch - pitchDelta);
        }
        if (pressed.has("ArrowDown")) {
          next.pitch = Math.max(minPitch, prev.pitch + pitchDelta);
        }
        if (pressed.has("ArrowLeft")) {
          next.bearing = prev.bearing + bearingDelta;
        }
        if (pressed.has("ArrowRight")) {
          next.bearing = prev.bearing - bearingDelta;
        }
        return next;
      });

      arrowKeyRafRef.current = requestAnimationFrame(tick);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      if (!ARROW_KEYS.has(e.key)) return;
      e.preventDefault();
      const wasEmpty = arrowKeysPressedRef.current.size === 0;
      arrowKeysPressedRef.current.add(e.key);
      if (wasEmpty) {
        arrowKeyLastTickRef.current = performance.now();
        arrowKeyRafRef.current = requestAnimationFrame(tick);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (!ARROW_KEYS.has(e.key)) return;
      arrowKeysPressedRef.current.delete(e.key);
    };

    const onBlur = () => {
      arrowKeysPressedRef.current.clear();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      cancelAnimationFrame(arrowKeyRafRef.current);
    };
  }, []);

  // Mobile detection for tooltip (static on mobile, animated on desktop)
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${TOOLTIP_MOBILE_BREAKPOINT - 1}px)`);
    const handle = () => setIsMobile(mql.matches);
    handle();
    mql.addEventListener("change", handle);
    return () => mql.removeEventListener("change", handle);
  }, []);

  // Animated tooltip: type out → hold → backspace → next (desktop only)
  useEffect(() => {
    if (isMobile) return;
    const full = TOOLTIPS[tooltipIndex];
    let cancelled = false;
    const typeMs = 50;
    const holdMs = 2800;
    const backspaceMs = 35;

    const typeNext = (i: number) => {
      if (cancelled) return;
      if (i <= full.length) {
        setTooltipText(full.slice(0, i));
        if (i < full.length) setTimeout(() => typeNext(i + 1), typeMs);
        else setTimeout(hold, holdMs);
      }
    };
    const hold = () => {
      if (cancelled) return;
      let j = full.length;
      const backNext = () => {
        if (cancelled) return;
        if (j >= 0) {
          setTooltipText(full.slice(0, j));
          j--;
          if (j >= 0) setTimeout(() => backNext(), backspaceMs);
          else
            setTimeout(
              () => setTooltipIndex((prev) => (prev + 1) % TOOLTIPS.length),
              400
            );
        }
      };
      backNext();
    };
    typeNext(0);
    return () => {
      cancelled = true;
    };
  }, [isMobile, tooltipIndex]);

  // Current building: all 52 are rich (id = buildingCode); lookup by selected building id
  const richBuilding = selectedBuilding ? getBuildingById(selectedBuilding.id) ?? null : null;
  const { selectedBuildingOccupancy, usedApiOccupancy } = useMemo(() => {
    if (!richBuilding) return { selectedBuildingOccupancy: null, usedApiOccupancy: false };
    const apiBuilding = densityData?.buildings?.find((b) => b.building_id === richBuilding.id);
    if (apiBuilding != null) {
      const occupancyPercent = Math.min(1, apiBuilding.estimated_people / richBuilding.capacity);
      const occupantCount = Math.round(apiBuilding.estimated_people);
      return {
        selectedBuildingOccupancy: {
          buildingId: richBuilding.id,
          occupancyPercent,
          occupantCount,
          sources: { classes: occupancyPercent },
        },
        usedApiOccupancy: true,
      };
    }
    const mockOcc = currentSnapshot?.buildings.find((b) => b.buildingId === richBuilding.id) ?? null;
    return { selectedBuildingOccupancy: mockOcc, usedApiOccupancy: false };
  }, [richBuilding, densityData?.buildings, currentSnapshot]);

  const showFullPopup = Boolean(
    richBuilding && selectedBuildingOccupancy
  );
  const showMinimalPopup = Boolean(selectedBuilding && !showFullPopup);

  const classesSource = DATA_SOURCES.find((s) => s.id === "classes");
  const sourceBreakdownOverride =
    usedApiOccupancy && selectedBuildingOccupancy && classesSource
      ? [
          {
            id: classesSource.id,
            label: classesSource.label,
            value: Math.round(selectedBuildingOccupancy.occupancyPercent * 100),
            color: classesSource.color,
          },
        ]
      : undefined;

  if (!MAPBOX_TOKEN) {
    console.log("[v0] No Mapbox token found");
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0a0a0f]">
        <div className="max-w-md rounded-xl border border-white/10 bg-black/50 p-8 text-center backdrop-blur-xl">
          <MapPin className="mx-auto mb-4 h-12 w-12 text-[#D00000]" />
          <h2 className="mb-2 text-xl font-bold text-white">Mapbox Token Required</h2>
          <p className="text-sm text-white/60">
            Please set your <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-[#D00000]">NEXT_PUBLIC_MAPBOX_TOKEN</code> environment
            variable. Get a free token at{" "}
            <a
              href="https://account.mapbox.com/auth/signup/"
              target="_blank"
              rel="noreferrer"
              className="text-[#D00000] underline"
            >
              mapbox.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0a0a0f]">
      {/* Header bar */}
      <header className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between border-b border-white/5 bg-black/60 px-5 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D00000]">
            <MapPin className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Husker Hotspots</h1>
          </div>
        </div>

        {/* Centered tooltip: desktop only (animated); hidden on mobile */}
        {!isMobile && (
          <div
            className="absolute left-1/2 top-0 flex h-full -translate-x-1/2 items-center justify-center pointer-events-none"
            aria-live="polite"
          >
            <span className="text-sm text-white/70">
              {tooltipText}
              {/* <span className="animate-pulse" style={{ opacity: 0.8 }} aria-hidden>
                |
              </span> */}
            </span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 md:flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-xs text-white/60">
              {densityLoading ? "Loading…" : `${currentSnapshot?.time.label} - ${day}`}
            </span>
          </div>
          <button
            onClick={() => setShowSources((p) => !p)}
            className={`rounded-lg p-2 transition-all ${
              showSources
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/70"
            }`}
            aria-label="Toggle data sources panel"
          >
            <Layers className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Map area: flex-1 so timeline stays visible at bottom */}
      <div className="relative flex-1 min-h-0">
        <Map
        ref={mapRef}
        {...viewState}
        keyboard={false}
        onMove={(evt) => setViewState(evt.viewState)}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={MAP_CONFIG.style}
        minZoom={MAP_CONFIG.minZoom}
        maxZoom={MAP_CONFIG.maxZoom}
        antialias
        onLoad={handleMapLoad}
        onClick={handleMapClick}
        onMouseMove={handleMapMouseMove}
        onMouseLeave={handleMapMouseLeave}
        style={{ width: "100%", height: "100%" }}
        cursor={hoveredBuildingId ? "pointer" : "grab"}
      >
        <NavigationControl position="top-right" style={{ marginTop: 80 }} />

        {/* Heatmap (on top) */}
        {showHeatmap && (
          <Source id="heatmap-data" type="geojson" data={heatmapGeoJSON}>
            <Layer
              id="heatmap-layer"
              type="heatmap"
              paint={{
                "heatmap-weight": ["get", "weight"],
                "heatmap-intensity": 1.5,
                "heatmap-color": [
                  "interpolate",
                  ["linear"],
                  ["heatmap-density"],
                  0,
                  "rgba(0,0,0,0)",
                  0.1,
                  "rgba(59,130,246,0.35)",
                  0.25,
                  "rgba(34,197,94,0.45)",
                  0.45,
                  "rgba(234,179,8,0.55)",
                  0.6,
                  "rgba(249,115,22,0.7)",
                  0.8,
                  "rgba(239,68,68,0.85)",
                  1,
                  "rgba(220,38,38,0.95)",
                ],
                "heatmap-radius": 30,
                "heatmap-opacity": 0.5,
              }}
            />
          </Source>
        )}
      </Map>

      {/* Data source toggles */}
      {showSources && (
        <DataSourceToggle
          activeSources={activeSources}
          onToggle={handleSourceToggle}
        />
      )}

      {/* Insights panel */}
      {/* <InsightsPanel
        insights={insights}
        isOpen={insightsOpen}
        onToggle={() => setInsightsOpen((p) => !p)}
        onInsightClick={handleInsightClick}
      /> */}

      {/* Building detail popup: full when rich + occupancy, else minimal */}
      {showFullPopup && richBuilding && selectedBuildingOccupancy && (
        <BuildingPopup
          building={richBuilding}
          currentOccupancy={selectedBuildingOccupancy.occupancyPercent}
          currentOccupantCount={selectedBuildingOccupancy.occupantCount}
          timeline={timeline}
          currentTimeIndex={timeIndex}
          onClose={handleCloseBuilding}
          apiTimelineSlots={buildingTimelineData?.slots ?? null}
          sourceBreakdownOverride={sourceBreakdownOverride}
          classesAtTime={
            classesAtTimeFromTimeline ??
            (densityData?.buildings?.find((b) => b.building_id === richBuilding.id) as
              | { classes?: ClassAtTime[] }
              | undefined
            )?.classes ??
            []
          }
          currentTimeLabel={currentSnapshot?.time.label ?? ""}
        />
      )}
      {showMinimalPopup && selectedBuilding && (
        <MinimalBuildingPopup
          building={{
            id: selectedBuilding.id,
            name: selectedBuilding.name,
            address: richBuilding?.address,
          }}
          onClose={handleCloseBuilding}
        />
      )}

      {/* Legend */}
      <Legend />

      </div>

      {/* Timeline slider: above all elements, always visible and interactable */}
      <div className="flex-shrink-0 z-50">
        <TimelineSlider
          currentIndex={displayValue}
          onIndexChange={handleIndexChange}
          isPlaying={isPlaying}
          onPlayToggle={() => setIsPlaying((p) => !p)}
          playSpeed={playSpeed}
          onSpeedChange={setPlaySpeed}
          day={day}
          onDayChange={setDay}
          timeLabel={currentSnapshot?.time.label ?? ""}
        />
      </div>
    </div>
  );
}
