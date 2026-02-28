"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import Map, { Source, Layer, NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { MAP_CONFIG, DATA_SOURCES, type DataSourceId, type DayOfWeek } from "@/lib/map/config";
import { BUILDINGS, getBuildingById, type Building } from "@/lib/map/buildings";
import {
  generateDayTimeline,
  generateInsights,
  type TimelineSnapshot,
  type HeatmapPoint,
} from "@/lib/map/mock-data";
import { useDensity } from "@/lib/api/density";
import {
  heatmapPointsToGeoJSON,
  getBuildingFootprintsGeoJSON,
} from "@/lib/map/geojson";

import { TimelineSlider } from "./timeline-slider";
import { InsightsPanel } from "./insights-panel";
import { DataSourceToggle } from "./data-source-toggle";
import { Legend } from "./legend";
import { BuildingPopup } from "./building-popup";
import { MapPin, Layers } from "lucide-react";
import type { MapLayerMouseEvent } from "mapbox-gl";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const EMPTY_HEATMAP_GEOJSON: GeoJSON.FeatureCollection<GeoJSON.Point> = {
  type: "FeatureCollection",
  features: [],
};

export function CampusMap() {
  console.log("[v0] CampusMap rendering, token exists:", !!MAPBOX_TOKEN);
  // State
  const [viewState, setViewState] = useState({
    longitude: MAP_CONFIG.center[0],
    latitude: MAP_CONFIG.center[1],
    zoom: MAP_CONFIG.defaultZoom,
    pitch: MAP_CONFIG.pitch,
    bearing: MAP_CONFIG.bearing,
  });

  const [day, setDay] = useState<DayOfWeek>("Wednesday");
  const [timeIndex, setTimeIndex] = useState(40); // 10:00 AM default (40 = 10*4)
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [hoveredBuildingId, setHoveredBuildingId] = useState<string | null>(null);
  const [insightsOpen, setInsightsOpen] = useState(true);
  const [showSources, setShowSources] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [activeSources, setActiveSources] = useState<Set<DataSourceId>>(
    new Set(DATA_SOURCES.map((s) => s.id))
  );
  const [mapLoaded, setMapLoaded] = useState(false);

  const mapRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const lastTickTimeRef = useRef<number>(0);

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

  // Density from API (cached by TanStack Query per day + time)
  const { data: densityData, isPending: densityLoading } = useDensity(day, timeIndex, timeline);
  const densityHeatmapPoints = densityData?.heatmap_points ?? null;

  // Heatmap: use only API density data; keep previous frame's data while loading (no mock fallback)
  const heatmapPoints = densityHeatmapPoints ?? [];
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

  // Building footprints as GeoJSON for Mapbox fill layer
  const buildingGeoJSON = useMemo(
    () =>
      getBuildingFootprintsGeoJSON(
        currentSnapshot?.buildings ?? [],
        selectedBuilding?.id ?? null,
        hoveredBuildingId
      ),
    [currentSnapshot?.buildings, selectedBuilding?.id, hoveredBuildingId]
  );

  // Building click handler - fly to building
  const handleBuildingClick = useCallback(
    (building: Building) => {
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
  }, []);

  // Map click: building select or deselect
  const handleMapClick = useCallback(
    (e: MapLayerMouseEvent) => {
      const features = e.features;
      if (features?.length) {
        const props = features[0].properties as { id?: string } | null;
        const buildingId = props?.id;
        const building = buildingId ? BUILDINGS.find((b) => b.id === buildingId) : undefined;
        if (building) {
          handleBuildingClick(building);
          return;
        }
      }
      if (selectedBuilding) {
        handleCloseBuilding();
      }
    },
    [handleBuildingClick, handleCloseBuilding, selectedBuilding]
  );

  // Map mouse move: hover building
  const handleMapMouseMove = useCallback((e: MapLayerMouseEvent) => {
    const props = e.features?.[0]?.properties as { id?: string } | null;
    setHoveredBuildingId(props?.id ?? null);
  }, []);

  const handleMapMouseLeave = useCallback(() => {
    setHoveredBuildingId(null);
  }, []);

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

  // Current building occupancy data
  const selectedBuildingOccupancy = selectedBuilding
    ? currentSnapshot?.buildings.find(
        (b) => b.buildingId === selectedBuilding.id
      )
    : null;

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
    <div className="relative h-screen w-screen overflow-hidden bg-[#0a0a0f]">
      {/* Header bar */}
      <header className="absolute left-0 right-0 top-0 z-30 flex items-center justify-between border-b border-white/5 bg-black/60 px-5 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D00000]">
            <MapPin className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">UNL Campus Pulse</h1>
            <p className="text-[10px] text-white/40">
              Real-time Activity Heatmap
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 md:flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-xs text-white/60">
              {currentSnapshot?.time.label} - {day}
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

      {/* Map */}
      <Map
        ref={mapRef}
        {...viewState}
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
        interactiveLayerIds={["building-footprints-fill"]}
        style={{ width: "100%", height: "100%" }}
        cursor={hoveredBuildingId ? "pointer" : "grab"}
      >
        <NavigationControl position="top-right" style={{ marginTop: 80 }} />

        {/* Building footprints (under heatmap) */}
        <Source id="building-footprints" type="geojson" data={buildingGeoJSON}>
          <Layer
            id="building-footprints-fill"
            type="fill"
            paint={{
              "fill-color": ["get", "fillColor"],
              "fill-opacity": 1,
              "fill-outline-color": ["get", "lineColor"],
            }}
          />
        </Source>

        {/* Heatmap (on top) */}
        {showHeatmap && (
          <Source id="heatmap-data" type="geojson" data={heatmapGeoJSON}>
            <Layer
              id="heatmap-layer"
              type="heatmap"
              paint={{
                "heatmap-weight": ["get", "weight"],
                "heatmap-intensity": 1.8,
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
                "heatmap-radius": 45,
                "heatmap-opacity": 0.85,
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
      <InsightsPanel
        insights={insights}
        isOpen={insightsOpen}
        onToggle={() => setInsightsOpen((p) => !p)}
        onInsightClick={handleInsightClick}
      />

      {/* Building detail popup */}
      {selectedBuilding && selectedBuildingOccupancy && (
        <BuildingPopup
          building={selectedBuilding}
          currentOccupancy={selectedBuildingOccupancy.occupancyPercent}
          currentOccupantCount={selectedBuildingOccupancy.occupantCount}
          timeline={timeline}
          currentTimeIndex={timeIndex}
          onClose={handleCloseBuilding}
        />
      )}

      {/* Legend */}
      <Legend />

      {/* Timeline slider */}
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
  );
}
