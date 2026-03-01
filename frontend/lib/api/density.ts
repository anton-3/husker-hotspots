/**
 * API client for combined campus density heatmap data.
 * Backend returns normalized 0–1 weights for blue→red visualization.
 */

import { useQuery } from "@tanstack/react-query";

export interface DensityHeatmapPoint {
  coordinates: [number, number];
  weight: number;
}

export interface DensityResponse {
  bounds: {
    southwest: [number, number];
    northeast: [number, number];
  };
  resolution: { cols: number; rows: number };
  lng_axis: number[];
  lat_axis: number[];
  heatmap_points: DensityHeatmapPoint[];
  sources: string[];
  requested_time: string;
  weekday: string;
  time_slot: string;
  /** Per-building occupancy at current time (from classes provider). */
  buildings?: { building_id: string; estimated_people: number; active_sections?: number }[];
}

const API_BASE =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) ||
  "http://localhost:5000";

export interface FetchDensityOptions {
  time: string;
  weekday: string;
  cols?: number;
  rows?: number;
  bounds?: string;
}

/**
 * Fetch combined density heatmap for the given time and weekday.
 * Use heatmap_points with getPosition: (d) => d.coordinates, getWeight: (d) => d.weight.
 */
export async function fetchDensity(
  options: FetchDensityOptions
): Promise<DensityResponse> {
  const params = new URLSearchParams({
    time: options.time,
    weekday: options.weekday,
  });
  if (options.cols != null) params.set("cols", String(options.cols));
  if (options.rows != null) params.set("rows", String(options.rows));
  if (options.bounds != null) params.set("bounds", options.bounds);

  const url = `${API_BASE}/api/density?${params.toString()}`;
  const res = await fetch(url);

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<DensityResponse>;
}

export interface BuildingTimelineSlot {
  slot_index: number;
  time: string;
  label: string;
  estimated_people: number;
}

export interface BuildingTimelineResponse {
  building_id: string;
  weekday: string;
  slots: BuildingTimelineSlot[];
}

/**
 * Fetch 96-slot timeline (estimated_people per 15-min slot) for a building and weekday.
 */
export async function fetchBuildingTimeline(
  buildingId: string,
  weekday: string
): Promise<BuildingTimelineResponse> {
  const url = `${API_BASE}/api/density/building/${encodeURIComponent(buildingId)}/timeline?weekday=${encodeURIComponent(weekday)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<BuildingTimelineResponse>;
}

/**
 * Fetch building timeline for the selected building and day.
 * Enabled only when buildingId is non-null.
 */
export function useBuildingTimeline(buildingId: string | null, weekday: string) {
  return useQuery({
    queryKey: ["buildingTimeline", buildingId, weekday] as const,
    queryFn: () => fetchBuildingTimeline(buildingId!, weekday),
    enabled: buildingId != null && Boolean(weekday),
    staleTime: Infinity,
    placeholderData: (previousData) => previousData,
  });
}

// Query key factory for TanStack Query cache
export function densityQueryKey(time: string, weekday: string) {
  return ["density", weekday, time] as const;
}

export type DensityQueryKey = ReturnType<typeof densityQueryKey>;

/** Timeline snapshot type for useDensity (needs time.hour, time.minute). */
interface TimeSnapshot {
  time: { hour: number; minute: number };
}

/**
 * Fetch density for the current day/time with TanStack Query.
 * Results are cached by (weekday, time) so moving the slider reuses cached data.
 */
export function useDensity(
  weekday: string,
  timeIndex: number,
  timeline: TimeSnapshot[] | undefined
) {
  const snapshot = timeline?.[timeIndex];
  const time =
    snapshot != null
      ? `${String(snapshot.time.hour).padStart(2, "0")}:${String(snapshot.time.minute).padStart(2, "0")}`
      : null;

  return useQuery({
    queryKey: time != null ? densityQueryKey(time, weekday) : ["density", weekday, "skip"],
    queryFn: () => fetchDensity({ time: time!, weekday }),
    enabled: time != null,
    staleTime: Infinity,
    placeholderData: (previousData) => previousData,
  });
}
