"use client";

import { useControl } from "react-map-gl";
import { MapboxOverlay } from "@deck.gl/mapbox";
import type { MapboxOverlayProps } from "@deck.gl/mapbox";

// Interleaved Deck.gl overlay rendered via react-map-gl useControl hook
export function DeckGLOverlay(props: MapboxOverlayProps) {
  const overlay = useControl<MapboxOverlay>(
    () => new MapboxOverlay({ ...props, interleaved: true })
  );
  overlay.setProps({ ...props, interleaved: true });
  return null;
}
