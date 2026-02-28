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
    <main className="relative h-screen w-full">
      <CampusMap
        mapRef={mapRef}
        layers={layers}
        onClick={handleMapClick}
      />
      <div className="absolute bottom-4 left-4 right-4 z-10 flex justify-center md:left-1/2 md:right-auto md:w-80 md:-translate-x-1/2">
        <HeatmapTimeline
          timeRange={timeRange}
          currentTime={currentTime}
          onTimeChange={setCurrentTime}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
        />
      </div>
      {selectedBuilding && (
        <div className="absolute top-4 left-4 z-10 w-72 max-w-[calc(100%-2rem)]">
          <BuildingDetail
            building={selectedBuilding}
            onClose={() => setSelectedBuilding(null)}
          />
        </div>
      )}
    </main>
  );
}
