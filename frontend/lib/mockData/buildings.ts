import type { Building } from "./types";

/**
 * Mock campus buildings for UNL City Campus.
 * Kauffman Residential Center is the anchor; others are approximate.
 * Polygons are simple rectangles (center ± offset) for click-to-zoom.
 */
function rect(lng: number, lat: number, w: number, h: number): number[][][] {
  const halfW = w / 2;
  const halfH = h / 2;
  return [
    [
      [lng - halfW, lat - halfH],
      [lng + halfW, lat - halfH],
      [lng + halfW, lat + halfH],
      [lng - halfW, lat + halfH],
      [lng - halfW, lat - halfH],
    ],
  ];
}

export const MOCK_BUILDINGS: Building[] = [
  {
    id: "kauffman",
    name: "Kauffman Residential Center",
    address: "630 N 14th St, Lincoln, NE 68508",
    center: [-96.698, 40.8182],
    polygon: { type: "Polygon", coordinates: rect(-96.698, 40.8182, 0.00025, 0.00018) },
    height: 25,
  },
  {
    id: "union",
    name: "Nebraska Union",
    address: "1400 R St, Lincoln, NE 68588",
    center: [-96.6995, 40.8172],
    polygon: { type: "Polygon", coordinates: rect(-96.6995, 40.8172, 0.00035, 0.00022) },
    height: 30,
  },
  {
    id: "love-library",
    name: "Love Library",
    address: "13th & R St, Lincoln, NE 68588",
    center: [-96.6972, 40.8178],
    polygon: { type: "Polygon", coordinates: rect(-96.6972, 40.8178, 0.0003, 0.0002) },
    height: 28,
  },
  {
    id: "abel",
    name: "Abel Hall",
    address: "400 N 17th St, Lincoln, NE 68588",
    center: [-96.702, 40.819],
    polygon: { type: "Polygon", coordinates: rect(-96.702, 40.819, 0.0002, 0.00015) },
    height: 22,
  },
  {
    id: "selleck",
    name: "Selleck Hall",
    address: "1440 N 16th St, Lincoln, NE 68588",
    center: [-96.7008, 40.8185],
    polygon: { type: "Polygon", coordinates: rect(-96.7008, 40.8185, 0.00022, 0.00016) },
    height: 24,
  },
  {
    id: "dining",
    name: "Campus Dining (Selleck/Abel area)",
    address: "16th & R St, Lincoln, NE 68588",
    center: [-96.701, 40.8178],
    polygon: { type: "Polygon", coordinates: rect(-96.701, 40.8178, 0.0002, 0.00018) },
    height: 15,
  },
];

/** GeoJSON Feature type for building footprints (for Deck.gl GeoJsonLayer) */
export interface BuildingFeature {
  type: "Feature";
  geometry: Building["polygon"];
  properties: { id: string; name: string; address?: string };
}

export function buildingsToGeoJSONFeatures(): BuildingFeature[] {
  return MOCK_BUILDINGS.map((b) => ({
    type: "Feature" as const,
    geometry: b.polygon,
    properties: { id: b.id, name: b.name, address: b.address },
  }));
}
