/**
 * API client for combined campus density heatmap data.
 * Backend returns normalized 0–1 weights for blue→red visualization.
 */

import { useQuery } from "@tanstack/react-query";

export interface DensityHeatmapPoint {
  coordinates: [number, number];
  weight: number;
}

/** One class/section active at the current time (from density API). */
export interface ClassAtTime {
  course_label: string;
  title: string;
  room: string;
  location?: string;
  enrolled: number;
  capacity: number;
  start_time: string;
  end_time: string;
  days: string;
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
  buildings?: {
    building_id: string;
    estimated_people: number;
    active_sections?: number;
    classes?: ClassAtTime[];
  }[];
}

/** One slot in a full-day density response (96 slots per day). */
export interface DensityDaySlot {
  time: string;
  /** Legacy: full heatmap points (omitted in compact day response). */
  heatmap_points?: DensityHeatmapPoint[];
  /** Compact: sparse weights [index, weight] row-major (day endpoint). */
  w?: [number, number][];
  /** Legacy: full buildings with classes. */
  buildings?: DensityResponse["buildings"];
  /** Compact: minimal buildings { building_id, estimated_people } (day endpoint). */
  b?: { building_id: string; estimated_people: number }[];
}

/** Full-day density: shared grid metadata + 96 slots. */
export interface DensityDayResponse {
  bounds: DensityResponse["bounds"];
  resolution: DensityResponse["resolution"];
  lng_axis: number[];
  lat_axis: number[];
  weekday: string;
  sources?: string[];
  slots: DensityDaySlot[];
}

/**
 * Reconstruct heatmap points from compact sparse weights and shared axes.
 * cols/rows from resolution; row-major index -> (r, c) -> lng_axis[c], lat_axis[r].
 */
export function slotWeightsToHeatmapPoints(
  w: [number, number][] | undefined,
  lng_axis: number[],
  lat_axis: number[],
  resolution: { cols: number; rows: number }
): DensityHeatmapPoint[] {
  if (!w?.length || !lng_axis?.length || !lat_axis?.length) return [];
  const cols = resolution?.cols ?? lng_axis.length;
  const points: DensityHeatmapPoint[] = [];
  for (const [idx, weight] of w) {
    const r = Math.floor(idx / cols);
    const c = idx % cols;
    if (r >= 0 && r < lat_axis.length && c >= 0 && c < lng_axis.length) {
      points.push({
        coordinates: [lng_axis[c], lat_axis[r]],
        weight,
      });
    }
  }
  return points;
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

export interface FetchDensityDayOptions {
  weekday: string;
  cols?: number;
  rows?: number;
  bounds?: string;
}

/**
 * Fetch density for all 96 time slots of a day. Call once when day changes; use slots[timeIndex] for heatmap.
 */
export async function fetchDensityDay(
  options: FetchDensityDayOptions
): Promise<DensityDayResponse> {
  const params = new URLSearchParams({ weekday: options.weekday });
  if (options.cols != null) params.set("cols", String(options.cols));
  if (options.rows != null) params.set("rows", String(options.rows));
  if (options.bounds != null) params.set("bounds", options.bounds);

  const url = `${API_BASE}/api/density/day?${params.toString()}`;
  const res = await fetch(url);

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<DensityDayResponse>;
}

/**
 * Fetch full-day density for the given weekday. Request runs once per day change; cache by weekday.
 * Use data?.slots[timeIndex] for heatmap and buildings at current time.
 */
export function useDensityDay(weekday: string) {
  return useQuery({
    queryKey: ["densityDay", weekday] as const,
    queryFn: () => fetchDensityDay({ weekday }),
    enabled: Boolean(weekday),
    staleTime: Infinity,
    placeholderData: (previousData) => previousData,
  });
}

export interface BuildingTimelineSlot {
  slot_index: number;
  time: string;
  label: string;
  estimated_people: number;
  /** Classes in session at this slot (included when fetching timeline for popup). */
  classes?: ClassAtTime[];
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

/** Response from GET /api/density/building/<id>/at-time (building + classes at one time). */
export interface BuildingAtTimeResponse {
  building_id: string;
  estimated_people: number;
  classes: ClassAtTime[];
}

/**
 * Fetch building occupancy and class list at a single time (for popup when day response has minimal buildings).
 */
export async function fetchBuildingAtTime(
  buildingId: string,
  time: string,
  weekday: string
): Promise<BuildingAtTimeResponse> {
  const url = `${API_BASE}/api/density/building/${encodeURIComponent(buildingId)}/at-time?time=${encodeURIComponent(time)}&weekday=${encodeURIComponent(weekday)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<BuildingAtTimeResponse>;
}

/**
 * Fetch building at-time for popup class list. Enabled when buildingId and time/weekday are set.
 */
export function useBuildingAtTime(
  buildingId: string | null,
  time: string | null,
  weekday: string
) {
  return useQuery({
    queryKey: ["buildingAtTime", buildingId, time, weekday] as const,
    queryFn: () => fetchBuildingAtTime(buildingId!, time!, weekday),
    enabled: Boolean(buildingId && time && weekday),
    staleTime: 60_000,
  });
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
