/**
 * GeoJSON helpers for Mapbox native heatmap layer.
 * Building footprint layer removed — use 3D building layer for click/hover.
 */

import type { HeatmapPoint } from "@/lib/map/mock-data";

const EMPTY_HEATMAP: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [],
};

/**
 * Convert heatmap points to GeoJSON FeatureCollection for Mapbox heatmap layer.
 * Each feature is a Point with properties.weight.
 */
export function heatmapPointsToGeoJSON(
  points: HeatmapPoint[]
): GeoJSON.FeatureCollection<GeoJSON.Point> {
  if (!points?.length) return EMPTY_HEATMAP;
  return {
    type: "FeatureCollection",
    features: points.map((p) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: p.coordinates,
      },
      properties: { weight: p.weight },
    })),
  };
}
