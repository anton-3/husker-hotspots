"use client";

import { useEffect, useRef } from "react";
import { useControl } from "react-map-gl";
import { MapboxOverlay as DeckMapboxOverlay } from "@deck.gl/mapbox";
import type { MapboxOverlayProps } from "@deck.gl/mapbox";

/**
 * Renders deck.gl layers inside the Mapbox map and keeps the camera in sync.
 * Must be used as a child of react-map-gl's Map.
 */
export function MapboxOverlay(props: MapboxOverlayProps) {
  const overlay = useControl(() => new DeckMapboxOverlay(props));

  useEffect(() => {
    overlay.setProps(props);
  }, [overlay, props]);

  return null;
}
