"use client";

import { useRef, useState, useEffect } from "react";
import Map, { NavigationControl, type MapRef } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { DEFAULT_VIEW_STATE } from "@/lib/mapConfig";
import { useMapboxToken } from "./useMapboxToken";
import { MapboxOverlay } from "./MapboxOverlay";
import type { LayersList, PickingInfo } from "deck.gl";

export interface CampusMapProps {
  layers?: LayersList;
  mapRef?: React.RefObject<MapRef | null>;
  onBuildingClick?: (buildingId: string) => void;
  onClick?: (info: PickingInfo) => void;
}

export function CampusMap({
  layers = [],
  mapRef: externalRef,
  onBuildingClick,
  onClick,
}: CampusMapProps) {
  const { token, ready } = useMapboxToken();
  const [mounted, setMounted] = useState(false);
  const internalRef = useRef<MapRef | null>(null);
  const mapRef = externalRef ?? internalRef;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Same output on server and first client render to avoid hydration mismatch
  if (!mounted) {
    return <div className="h-full w-full" style={{ position: "relative" }} />;
  }

  if (!ready) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-100 dark:bg-zinc-900">
        <p className="text-center text-zinc-600 dark:text-zinc-400">
          Set <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-700">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> in{" "}
          <code className="rounded bg-zinc-200 px-1 dark:bg-zinc-700">.env.local</code> to load the map.
        </p>
      </div>
    );
  }

  return (
    <Map
      ref={mapRef}
      mapboxAccessToken={token}
      initialViewState={DEFAULT_VIEW_STATE}
      mapStyle="mapbox://styles/mapbox/standard"
      style={{ width: "100%", height: "100%" }}
      reuseMaps
    >
      <MapboxOverlay interleaved layers={layers} onClick={onClick} />
      <NavigationControl position="top-right" />
    </Map>
  );
}
