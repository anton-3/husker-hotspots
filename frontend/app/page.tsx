"use client";

import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { HeatmapLayer, GeoJsonLayer } from "deck.gl";
import type { PickingInfo } from "deck.gl";
import { CampusMap } from "@/components/map/CampusMap";
import { HeatmapTimeline } from "@/components/timeline/HeatmapTimeline";
import { BuildingDetail } from "@/components/sidebar/BuildingDetail";
import { getMockActivity } from "@/lib/mockData/activity";
import {
  MOCK_BUILDINGS,
  buildingsToGeoJSONFeatures,
} from "@/lib/mockData/buildings";
import type { Building } from "@/lib/mockData/types";
import {
  getActivityTimeRange,
  filterActivityByTime,
  HEATMAP_WINDOW_MS,
  getPeakTimesInRange,
} from "@/lib/timeUtils";
import {
  BUILDING_ZOOM,
  BUILDING_PITCH,
  DEFAULT_VIEW_STATE,
  INTRO_VIEW_STATE,
  INTRO_FLY_DURATION_MS,
  BUILDING_FLY_DURATION_MS,
  easeOutQuartic,
} from "@/lib/mapConfig";

const PLAY_INTERVAL_MS = 500;
const PLAY_STEP_MS = 30 * 60 * 1000; // 30 minutes per tick

const BUILDINGS_LAYER_ID = "campus-buildings";

export default function Home() {
  const mapRef = useRef<import("react-map-gl").MapRef | null>(null);
  const hasIntroFlownRef = useRef(false);
  const orbitFrameRef = useRef<number | null>(null);
  const activity = useMemo(() => getMockActivity(), []);
  const timeRange = useMemo(() => getActivityTimeRange(activity), [activity]);
  const buildingFeatures = useMemo(() => buildingsToGeoJSONFeatures(), []);

  const [currentTime, setCurrentTime] = useState(timeRange.min);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [isOrbiting, setIsOrbiting] = useState(false);
  const [hoveredBuildingId, setHoveredBuildingId] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const filteredActivity = useMemo(
    () =>
      filterActivityByTime(
        activity,
        currentTime,
        currentTime + HEATMAP_WINDOW_MS
      ),
    [activity, currentTime]
  );

  const peakTimes = useMemo(() => getPeakTimesInRange(timeRange), [timeRange]);

  useEffect(() => {
    if (!isPlaying) return;
    const stepMs = PLAY_STEP_MS / playbackSpeed;
    const id = setInterval(() => {
      setCurrentTime((t) => {
        const next = t + stepMs;
        return next >= timeRange.max ? timeRange.min : next;
      });
    }, PLAY_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isPlaying, timeRange.min, timeRange.max, playbackSpeed]);

  useEffect(() => {
    if (!isOrbiting) {
      if (orbitFrameRef.current != null) {
        cancelAnimationFrame(orbitFrameRef.current);
        orbitFrameRef.current = null;
      }
      return;
    }
    function rotateCamera(timestamp: number) {
      const map = mapRef.current?.getMap();
      if (map) map.rotateTo((timestamp / 100) % 360, { duration: 0 });
      orbitFrameRef.current = requestAnimationFrame(rotateCamera);
    }
    orbitFrameRef.current = requestAnimationFrame(rotateCamera);
    return () => {
      if (orbitFrameRef.current != null) {
        cancelAnimationFrame(orbitFrameRef.current);
        orbitFrameRef.current = null;
      }
    };
  }, [isOrbiting]);

  const handlePlayPause = useCallback(() => setIsPlaying((p) => !p), []);

  const handleMapHover = useCallback((info: PickingInfo) => {
    if (info.layer?.id !== BUILDINGS_LAYER_ID) {
      setHoveredBuildingId(null);
      return;
    }
    const id = (info.object as { properties?: { id?: string } } | undefined)?.properties?.id ?? null;
    setHoveredBuildingId(id);
  }, []);

  const handleMapLoad = useCallback((map: import("mapbox-gl").Map) => {
    if (hasIntroFlownRef.current) return;
    hasIntroFlownRef.current = true;
    const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = prefersReducedMotion ? 800 : INTRO_FLY_DURATION_MS;
    // Short delay so setTerrain has committed before flyTo (avoids react-map-gl quirk)
    setTimeout(() => {
      map.flyTo({
        center: [DEFAULT_VIEW_STATE.longitude, DEFAULT_VIEW_STATE.latitude],
        zoom: DEFAULT_VIEW_STATE.zoom,
        pitch: DEFAULT_VIEW_STATE.pitch,
        bearing: DEFAULT_VIEW_STATE.bearing,
        duration,
        essential: true,
      });
    }, 100);
  }, []);

  const handleMapClick = useCallback(
    (info: PickingInfo) => {
      if (!info.object || info.layer?.id !== BUILDINGS_LAYER_ID) return;
      const props = (info.object as { properties?: { id?: string } })
        .properties;
      const id = props?.id;
      if (!id) return;
      const building = MOCK_BUILDINGS.find((b) => b.id === id);
      if (!building) return;
      mapRef.current?.getMap()?.flyTo({
        center: building.center,
        zoom: BUILDING_ZOOM,
        pitch: BUILDING_PITCH,
        duration: BUILDING_FLY_DURATION_MS,
        curve: 1.35,
        easing: easeOutQuartic,
        essential: true,
      });
      setSelectedBuilding(building);
    },
    []
  );

  const layers = useMemo(
    () => {
      const hour = new Date(currentTime).getHours();
      const isPeakHour = (hour >= 8 && hour <= 10) || (hour >= 11 && hour <= 13) || (hour >= 17 && hour <= 20);
      const intensityMultiplier = isPeakHour ? 1.35 : 1;
      const baseIntensity = 1.2;
      const layerList = [
        new HeatmapLayer<{
          longitude: number;
          latitude: number;
          weight: number;
        }>({
          id: "campus-activity-heatmap",
          data: filteredActivity,
          getPosition: (d) => [d.longitude, d.latitude],
          getWeight: (d) => d.weight,
          radiusPixels: 60,
          intensity: baseIntensity * intensityMultiplier,
          threshold: 0.05,
          colorRange: [
            [26, 26, 26, 255],
            [65, 65, 65, 255],
            [120, 80, 60, 255],
            [200, 100, 50, 255],
            [240, 140, 60, 255],
            [255, 200, 150, 255],
          ],
        }),
        new GeoJsonLayer({
          id: BUILDINGS_LAYER_ID,
          data: buildingFeatures,
          pickable: true,
          filled: true,
          onHover: handleMapHover,
          getFillColor: (d) => {
            const id = (d as { properties?: { id?: string } }).properties?.id;
            return id === hoveredBuildingId ? [255, 200, 200, 220] : [160, 180, 220, 180];
          },
          getLineColor: (d) => {
            const id = (d as { properties?: { id?: string } }).properties?.id;
            return id === hoveredBuildingId ? [200, 120, 120, 255] : [80, 100, 140, 255];
          },
          lineWidthMinPixels: 2,
        }),
      ];
      return layerList;
    },
    [filteredActivity, buildingFeatures, currentTime, hoveredBuildingId, handleMapHover]
  );

  return (
    <main className="relative flex h-screen w-full flex-col overflow-hidden">
      <header className="pointer-events-none relative z-20 flex items-start justify-between px-4 pt-4 md:px-8">
        <div className="pointer-events-auto rounded-2xl bg-zinc-950/70 px-4 py-3 shadow-lg ring-1 ring-white/10 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-300">
            Husker Hustle
          </p>
          <h1 className="mt-1 text-lg font-semibold text-zinc-50 md:text-2xl">
            Campus activity intelligence for UNL
          </h1>
          <p className="mt-1 max-w-xl text-xs text-zinc-300 md:text-sm">
            Explore how students move across campus throughout the day with a
            live heatmap, building overlays, and a scrubbable timeline.
          </p>
        </div>
        <div className="pointer-events-auto hidden shrink-0 gap-3 rounded-2xl bg-zinc-950/70 px-4 py-3 text-xs text-zinc-300 shadow-lg ring-1 ring-white/10 backdrop-blur md:flex">
          <div>
            <p className="font-semibold text-zinc-100">Signals fused</p>
            <p>Class schedules · room reservations · testing · game days</p>
          </div>
        </div>
      </header>

      <section className="relative mt-2 flex-1">
        <div className="absolute inset-0">
          <CampusMap
            mapRef={mapRef}
            layers={layers}
            onClick={handleMapClick}
            initialViewState={INTRO_VIEW_STATE}
            onMapLoad={handleMapLoad}
          />
        </div>

        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col">
          <div className="flex flex-1 items-start justify-end px-4 pt-24 md:px-8">
            <div className="pointer-events-auto hidden w-64 rounded-2xl bg-zinc-950/70 p-3 text-xs text-zinc-300 shadow-lg ring-1 ring-white/10 backdrop-blur md:block">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-red-300">
                Heatmap legend
              </p>
              <p className="mb-2">
                Bright areas indicate higher modeled activity intensity over the
                current time window. Darker areas are calmer.
              </p>
              <ul className="space-y-1">
                <li>
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                  <span className="ml-2 align-middle">Lecture & exam traffic</span>
                </li>
                <li>
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="ml-2 align-middle">Clubs, events, reservations</span>
                </li>
                <li>
                  <span className="inline-block h-2 w-2 rounded-full bg-sky-400" />
                  <span className="ml-2 align-middle">Game-day and spike scenarios</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex items-end justify-center px-4 pb-4 md:justify-center md:px-0">
            <div className="pointer-events-auto flex w-full max-w-xl flex-col gap-2">
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOrbiting((o) => !o)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    isOrbiting
                      ? "bg-amber-500 text-zinc-900 hover:bg-amber-400"
                      : "bg-zinc-700 text-zinc-200 hover:bg-zinc-600 dark:bg-zinc-700 dark:hover:bg-zinc-600"
                  }`}
                >
                  {isOrbiting ? "Stop orbit" : "Orbit"}
                </button>
              </div>
              <div className="rounded-2xl bg-zinc-950/80 p-3 shadow-2xl ring-1 ring-white/10 backdrop-blur">
                <HeatmapTimeline
                  timeRange={timeRange}
                  currentTime={currentTime}
                  onTimeChange={setCurrentTime}
                  isPlaying={isPlaying}
                  onPlayPause={handlePlayPause}
                  playbackSpeed={playbackSpeed}
                  onSpeedChange={setPlaybackSpeed}
                  peakTimes={peakTimes}
                />
              </div>
            </div>
          </div>
        </div>

        {selectedBuilding && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-start px-4 pt-28 md:px-8">
            <div className="pointer-events-auto w-80 max-w-[calc(100%-2rem)] rounded-2xl bg-zinc-950/80 p-3 shadow-xl ring-1 ring-white/10 backdrop-blur">
              <BuildingDetail
                building={selectedBuilding}
                onClose={() => setSelectedBuilding(null)}
              />
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
