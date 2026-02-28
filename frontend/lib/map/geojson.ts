/**
 * GeoJSON helpers for Mapbox native heatmap and building footprint layers.
 */

import type { HeatmapPoint } from "@/lib/map/mock-data";
import type { BuildingOccupancy } from "@/lib/map/mock-data";
import { BUILDINGS, BUILDING_TYPE_COLORS, type Building } from "@/lib/map/buildings";

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

function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result)
    return `rgba(107,114,128,${alpha})`;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export interface BuildingFeatureProperties {
  id: string;
  name: string;
  type: Building["type"];
  fillColor: string;
  lineColor: string;
  lineWidth: number;
}

/**
 * Build GeoJSON FeatureCollection for building footprints for Mapbox fill layer.
 * Includes fillColor, lineColor, lineWidth in properties for selected/hover state.
 */
export function getBuildingFootprintsGeoJSON(
  buildingOccupancies: BuildingOccupancy[],
  selectedBuildingId: string | null,
  hoveredBuildingId: string | null
): GeoJSON.FeatureCollection<GeoJSON.Polygon, BuildingFeatureProperties> {
  const features: GeoJSON.Feature<GeoJSON.Polygon, BuildingFeatureProperties>[] = BUILDINGS.map(
    (building) => {
      const isSelected = building.id === selectedBuildingId;
      const isHovered = building.id === hoveredBuildingId;
      const baseHex = BUILDING_TYPE_COLORS[building.type] ?? "#6b7280";
      const fillAlpha = isSelected ? 140 / 255 : isHovered ? 100 / 255 : 40 / 255;
      const lineAlpha = isSelected ? 1 : isHovered ? 200 / 255 : 80 / 255;
      const lineWidth = isSelected ? 3 : isHovered ? 2 : 1;
      return {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [building.polygon],
        },
        properties: {
          id: building.id,
          name: building.name,
          type: building.type,
          fillColor: hexToRgba(baseHex, fillAlpha),
          lineColor: hexToRgba(baseHex, lineAlpha),
          lineWidth,
        },
      };
    }
  );
  return {
    type: "FeatureCollection",
    features,
  };
}
