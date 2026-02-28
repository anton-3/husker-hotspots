/**
 * API client for combined campus density heatmap data.
 * Backend returns normalized 0–1 weights for blue→red visualization.
 */

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
