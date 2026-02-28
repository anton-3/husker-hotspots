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
} from "@/lib/timeUtils";
import {
  BUILDING_ZOOM,
  BUILDING_PITCH,
} from "@/lib/mapConfig";

const PLAY_INTERVAL_MS = 500;
const PLAY_STEP_MS = 30 * 60 * 1000; // 30 minutes per tick

const BUILDINGS_LAYER_ID = "campus-buildings";

export default function Home() {
  const mapRef = useRef<import("react-map-gl").MapRef | null>(null);
  const activity = useMemo(() => getMockActivity(), []);
  const timeRange = useMemo(() => getActivityTimeRange(activity), [activity]);
  const buildingFeatures = useMemo(() => buildingsToGeoJSONFeatures(), []);

  const [currentTime, setCurrentTime] = useState(timeRange.min);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);

  const filteredActivity = useMemo(
    () =>
      filterActivityByTime(
        activity,
        currentTime,
        currentTime + HEATMAP_WINDOW_MS
      ),
    [activity, currentTime]
  );

  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setCurrentTime((t) => {
        const next = t + PLAY_STEP_MS;
        return next >= timeRange.max ? timeRange.min : next;
      });
    }, PLAY_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isPlaying, timeRange.min, timeRange.max]);

  const handlePlayPause = useCallback(() => setIsPlaying((p) => !p), []);

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
        duration: 1000,
      });
      setSelectedBuilding(building);
    },
    []
  );

  const layers = useMemo(
    () => [
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
        intensity: 1.2,
        threshold: 0.05,
      }),
      new GeoJsonLayer({
        id: BUILDINGS_LAYER_ID,
        data: buildingFeatures,
        pickable: true,
        filled: true,
        getFillColor: [160, 180, 220, 180],
        getLineColor: [80, 100, 140, 255],
        lineWidthMinPixels: 2,
      }),
    ],
    [filteredActivity, buildingFeatures]
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
            <div className="pointer-events-auto w-full max-w-xl rounded-2xl bg-zinc-950/80 p-3 shadow-2xl ring-1 ring-white/10 backdrop-blur">
              <HeatmapTimeline
                timeRange={timeRange}
                currentTime={currentTime}
                onTimeChange={setCurrentTime}
                isPlaying={isPlaying}
                onPlayPause={handlePlayPause}
              />
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
