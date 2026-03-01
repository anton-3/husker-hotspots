/**
 * API client and spatial lookup for campus buildings (from backend/scripts/buildings.json).
 * Used to resolve Mapbox 3D building clicks to campus building records.
 */

import { useQuery } from "@tanstack/react-query";
import type { CampusBuilding } from "@/lib/map/buildings";

export interface ApiBuildingRow {
  buildingCode: string;
  /** Old format (list-unique-buildings.js) */
  inferredName?: string;
  sampleLat?: number | null;
  sampleLng?: number | null;
  /** Current format (buildings.json) */
  displayName?: string;
  name?: string;
  lat?: number | null;
  lng?: number | null;
  sectionCount?: number;
  nameVariants?: number;
}

/** Normalize API row to lat/lng/name; supports both buildings.json and list-unique-buildings output. */
function toCampusBuilding(r: ApiBuildingRow): CampusBuilding | null {
  const lat = r.sampleLat ?? r.lat ?? null;
  const lng = r.sampleLng ?? r.lng ?? null;
  if (lat == null || lng == null) return null;
  const name = r.inferredName ?? r.displayName ?? r.name ?? r.buildingCode;
  return {
    id: r.buildingCode,
    name: typeof name === "string" ? name.replace(/&amp;/g, "&") : r.buildingCode,
    coordinates: [lng, lat] as [number, number],
  };
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
  const out: CampusBuilding[] = [];
  for (const r of rows) {
    const b = toCampusBuilding(r);
    if (b) out.push(b);
  }
  return out;
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
