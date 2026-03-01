/**
 * API client and spatial lookup for campus buildings (from backend/scripts/buildings.json).
 * Used to resolve Mapbox 3D building clicks to campus building records.
 */

import { useQuery } from "@tanstack/react-query";
import type { CampusBuilding } from "@/lib/map/buildings";

export interface ApiBuildingRow {
  buildingCode: string;
  inferredName: string;
  sampleLat: number | null;
  sampleLng: number | null;
  sectionCount?: number;
  nameVariants?: number;
}

const CLOSEST_BUILDING_THRESHOLD_M = 80;

/** Approximate meters per degree at mid-latitudes for quick distance. */
function metersBetween(
  a: { lng: number; lat: number },
  b: { lng: number; lat: number }
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

export async function fetchBuildings(): Promise<CampusBuilding[]> {
  const res = await fetch("/api/buildings");
  if (!res.ok) throw new Error("Failed to load buildings");
  const rows = (await res.json()) as ApiBuildingRow[];
  return rows
    .filter((r) => r.sampleLat != null && r.sampleLng != null)
    .map((r) => ({
      id: r.buildingCode,
      name: r.inferredName,
      coordinates: [r.sampleLng!, r.sampleLat!] as [number, number],
    }));
}

export function useCampusBuildings() {
  return useQuery({
    queryKey: ["buildings"],
    queryFn: fetchBuildings,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Find the campus building whose coordinates are closest to (lng, lat)
 * and within CLOSEST_BUILDING_THRESHOLD_M meters.
 */
export function findClosestBuilding(
  buildings: CampusBuilding[],
  lng: number,
  lat: number,
  maxMeters: number = CLOSEST_BUILDING_THRESHOLD_M
): CampusBuilding | null {
  let best: CampusBuilding | null = null;
  let bestDist = maxMeters;
  const point = { lng, lat };
  for (const b of buildings) {
    const d = metersBetween(point, { lng: b.coordinates[0], lat: b.coordinates[1] });
    if (d < bestDist) {
      bestDist = d;
      best = b;
    }
  }
  return best;
}
