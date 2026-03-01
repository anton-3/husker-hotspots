"use client";

import { useMemo } from "react";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { GeoJsonLayer } from "@deck.gl/layers";
import { BUILDINGS, BUILDING_TYPE_COLORS, type Building } from "@/lib/map/buildings";
import type { BuildingOccupancy, HeatmapPoint } from "@/lib/map/mock-data";
import type { DataSourceId } from "@/lib/map/config";

interface UseMapLayersProps {
  heatmapPoints: HeatmapPoint[];
  buildingOccupancies: BuildingOccupancy[];
  selectedBuildingId: string | null;
  hoveredBuildingId: string | null;
  activeSources: Set<DataSourceId>;
  onBuildingClick: (building: Building) => void;
  onBuildingHover: (buildingId: string | null) => void;
}

export function useMapLayers({
  heatmapPoints,
  buildingOccupancies,
  selectedBuildingId,
  hoveredBuildingId,
  activeSources,
  onBuildingClick,
  onBuildingHover,
}: UseMapLayersProps) {
  // Filter heatmap points by active sources
  const filteredPoints = useMemo(() => {
    if (activeSources.size === 7) return heatmapPoints; // All active
    // For simplicity, apply a weight multiplier based on active source count
    const ratio = activeSources.size / 7;
    return heatmapPoints.map((p) => ({ ...p, weight: p.weight * ratio }));
  }, [heatmapPoints, activeSources]);

  const layers = useMemo(() => {
    // Build GeoJSON features for building footprints
    const buildingFeatures = BUILDINGS.map((building) => {
      const occ = buildingOccupancies.find((b) => b.buildingId === building.id);
      const occupancy = occ?.occupancyPercent ?? 0;
      const isSelected = building.id === selectedBuildingId;
      const isHovered = building.id === hoveredBuildingId;

      return {
        type: "Feature" as const,
        geometry: {
          type: "Polygon" as const,
          coordinates: [building.polygon],
        },
        properties: {
          id: building.id,
          name: building.name,
          type: building.type,
          occupancy,
          isSelected,
          isHovered,
        },
      };
    });

    const buildingGeoJson = {
      type: "FeatureCollection" as const,
      features: buildingFeatures,
    };

    return [
      // Heatmap layer for campus-wide activity density
      new HeatmapLayer({
        id: "campus-heatmap",
        data: filteredPoints,
        getPosition: (d: HeatmapPoint) => d.coordinates,
        getWeight: (d: HeatmapPoint) => d.weight,
        radiusPixels: 60,
        intensity: 1.2,
        threshold: 0.05,
        colorRange: [
          [34, 197, 94, 80],     // green (low)
          [132, 204, 22, 120],   // lime
          [234, 179, 8, 160],    // yellow
          [249, 115, 22, 180],   // orange
          [239, 68, 68, 200],    // red (high)
          [220, 38, 38, 230],    // dark red (critical)
        ],
        opacity: 0.7,
      }),

      // Building footprint polygons (interactive)
      new GeoJsonLayer({
        id: "building-footprints",
        data: buildingGeoJson,
        pickable: true,
        stroked: true,
        filled: true,
        extruded: false,
        getFillColor: (f: (typeof buildingFeatures)[0]) => {
          const baseColor = hexToRgb(
            BUILDING_TYPE_COLORS[f.properties.type as Building["type"]] || "#6b7280"
          );
          if (f.properties.isSelected) return [...baseColor, 140];
          if (f.properties.isHovered) return [...baseColor, 100];
          return [...baseColor, 40];
        },
        getLineColor: (f: (typeof buildingFeatures)[0]) => {
          const baseColor = hexToRgb(
            BUILDING_TYPE_COLORS[f.properties.type as Building["type"]] || "#6b7280"
          );
          if (f.properties.isSelected) return [...baseColor, 255];
          if (f.properties.isHovered) return [...baseColor, 200];
          return [...baseColor, 80];
        },
        getLineWidth: (f: (typeof buildingFeatures)[0]) =>
          f.properties.isSelected ? 3 : f.properties.isHovered ? 2 : 1,
        lineWidthUnits: "pixels" as const,
        onClick: (info: { object?: (typeof buildingFeatures)[0] }) => {
          if (info.object) {
            const building = BUILDINGS.find(
              (b) => b.id === info.object!.properties.id
            );
            if (building) onBuildingClick(building);
          }
        },
        onHover: (info: { object?: (typeof buildingFeatures)[0] }) => {
          onBuildingHover(info.object?.properties.id ?? null);
        },
        updateTriggers: {
          getFillColor: [selectedBuildingId, hoveredBuildingId],
          getLineColor: [selectedBuildingId, hoveredBuildingId],
          getLineWidth: [selectedBuildingId, hoveredBuildingId],
        },
      }),
    ];
  }, [
    filteredPoints,
    buildingOccupancies,
    selectedBuildingId,
    hoveredBuildingId,
    onBuildingClick,
    onBuildingHover,
  ]);

  return layers;
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [107, 114, 128];
}
