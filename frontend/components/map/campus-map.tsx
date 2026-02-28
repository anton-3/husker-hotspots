"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import Map, { NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { MAP_CONFIG, DATA_SOURCES, type DataSourceId, type DayOfWeek } from "@/lib/map/config";
import { BUILDINGS, getBuildingById, type Building } from "@/lib/map/buildings";
import {
  generateDayTimeline,
  generateInsights,
  type TimelineSnapshot,
} from "@/lib/map/mock-data";

import { DeckGLOverlay } from "./deck-overlay";
import { useMapLayers } from "./heatmap-layer";
import { TimelineSlider } from "./timeline-slider";
import { InsightsPanel } from "./insights-panel";
import { DataSourceToggle } from "./data-source-toggle";
import { Legend } from "./legend";
import { BuildingPopup } from "./building-popup";
import { MapPin, Layers } from "lucide-react";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

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
  const [timeIndex, setTimeIndex] = useState(20); // 10:00 AM default
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [hoveredBuildingId, setHoveredBuildingId] = useState<string | null>(null);
  const [insightsOpen, setInsightsOpen] = useState(true);
  const [showSources, setShowSources] = useState(true);
  const [activeSources, setActiveSources] = useState<Set<DataSourceId>>(
    new Set(DATA_SOURCES.map((s) => s.id))
  );
  const [mapLoaded, setMapLoaded] = useState(false);

  const mapRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate timeline data (memoized per day)
  const timeline = useMemo(() => generateDayTimeline(day), [day]);
  const currentSnapshot = timeline[timeIndex];
  const insights = useMemo(
    () => (currentSnapshot ? generateInsights(currentSnapshot, timeline) : []),
    [currentSnapshot, timeline]
  );

  // Play/pause timeline
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        setTimeIndex((prev) => (prev >= 47 ? 0 : prev + 1));
      }, 1000 / playSpeed);
    }
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, playSpeed]);

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

  // Deck.gl layers
  const deckLayers = useMapLayers({
    heatmapPoints: currentSnapshot?.heatmapPoints ?? [],
    buildingOccupancies: currentSnapshot?.buildings ?? [],
    selectedBuildingId: selectedBuilding?.id ?? null,
    hoveredBuildingId,
    activeSources,
    onBuildingClick: handleBuildingClick,
    onBuildingHover: setHoveredBuildingId,
  });

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
        style={{ width: "100%", height: "100%" }}
        cursor={hoveredBuildingId ? "pointer" : "grab"}
      >
        <NavigationControl position="top-right" style={{ marginTop: 80 }} />
        {mapLoaded && <DeckGLOverlay layers={deckLayers} />}
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
        currentIndex={timeIndex}
        onIndexChange={setTimeIndex}
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
