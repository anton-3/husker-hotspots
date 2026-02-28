"use client";

import { useRef, useState, useEffect } from "react";
import Map, { NavigationControl, Layer, type MapRef } from "react-map-gl";
import type { Map as MapboxMap } from "mapbox-gl";
import { MapboxOverlay as DeckMapboxOverlay } from "@deck.gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { DEFAULT_VIEW_STATE, CAMPUS_MAX_BOUNDS } from "@/lib/mapConfig";
import { useMapboxToken } from "./useMapboxToken";
import type { LayersList, PickingInfo } from "deck.gl";

export interface CampusMapProps {
  layers?: LayersList;
  mapRef?: React.RefObject<MapRef | null>;
  onBuildingClick?: (buildingId: string) => void;
  onClick?: (info: PickingInfo) => void;
  /** Initial camera; defaults to DEFAULT_VIEW_STATE. Use INTRO_VIEW_STATE for intro fly-in. */
  initialViewState?: {
    latitude: number;
    longitude: number;
    zoom: number;
    pitch: number;
    bearing: number;
  };
  /** Called when the map style has loaded (after setFog/setTerrain). Use to run intro fly. */
  onMapLoad?: (map: MapboxMap) => void;
  /** Mapbox style URL; defaults to dark. */
  mapStyle?: string;
}

export function CampusMap({
  layers = [],
  mapRef: externalRef,
  onBuildingClick,
  onClick,
  initialViewState = DEFAULT_VIEW_STATE,
  onMapLoad,
  mapStyle = "mapbox://styles/mapbox/light-v11",
}: CampusMapProps) {
  const { token, ready } = useMapboxToken();
  const [mounted, setMounted] = useState(false);
  const [styleLoaded, setStyleLoaded] = useState(false);
  const internalRef = useRef<MapRef | null>(null);
  const mapRef = externalRef ?? internalRef;
  const deckOverlayRef = useRef<{ overlay: InstanceType<typeof DeckMapboxOverlay>; map: MapboxMap } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keep deck overlay props in sync; overlay is created in onLoad, so this runs after first load
  useEffect(() => {
    const entry = deckOverlayRef.current;
    if (!entry) return;
    entry.overlay.setProps({ interleaved: true, layers, onClick });
  }, [layers, onClick]);

  // Remove overlay on unmount
  useEffect(() => {
    return () => {
      const entry = deckOverlayRef.current;
      if (entry) {
        entry.map.removeControl(entry.overlay);
        deckOverlayRef.current = null;
      }
    };
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
      initialViewState={initialViewState}
      mapStyle={mapStyle}
      style={{ width: "100%", height: "100%" }}
      maxBounds={CAMPUS_MAX_BOUNDS}
      reuseMaps
      onLoad={() => {
        setStyleLoaded(true);
        const map = mapRef.current?.getMap();
        if (!map) return;
        map.setFog({
          range: [-1, 2],
          "horizon-blend": 0.3,
          color: "white",
          "high-color": "#add8e6",
          "space-color": "#d8f2ff",
          "star-intensity": 0,
        });
        if (!map.getSource("mapbox-dem")) {
          map.addSource("mapbox-dem", {
            type: "raster-dem",
            url: "mapbox://mapbox.terrain-rgb",
            tileSize: 512,
            maxzoom: 14,
          });
          map.setTerrain({
            source: "mapbox-dem",
            exaggeration: 1.2,
          });
        }
        onMapLoad?.(map);
        // Add deck overlay after the next tick so the 3D buildings Layer (mounted by React when styleLoaded flips) is already on the map; then our overlay is added last and draws on top.
        const overlay = new DeckMapboxOverlay({ interleaved: true, layers, onClick });
        requestAnimationFrame(() => {
          if (!deckOverlayRef.current) {
            map.addControl(overlay);
            deckOverlayRef.current = { overlay, map };
          }
        });
      }}
    >
      {styleLoaded && (
        <>
          <Layer
          id="3d-buildings"
          type="fill-extrusion"
          source="composite"
          source-layer="building"
          filter={["==", "extrude", "true"]}
          minzoom={15}
          paint={{
            "fill-extrusion-color": "#aaa",
            "fill-extrusion-height": [
              "interpolate",
              ["linear"],
              ["zoom"],
              15,
              0,
              15.05,
              ["get", "height"],
            ],
            "fill-extrusion-base": [
              "interpolate",
              ["linear"],
              ["zoom"],
              15,
              0,
              15.05,
              ["get", "min_height"],
            ],
            "fill-extrusion-opacity": 0.9,
          }}
        />
        </>
      )}
      <NavigationControl position="top-right" />
    </Map>
  );
}
