/**
 * Map configuration for UNL campus view.
 * Center: Kauffman Residential Center area (630 N 14th St, Lincoln, NE 68508).
 */

export const MAP_CENTER = {
  latitude: 40.8182,
  longitude: -96.698,
} as const;

export const DEFAULT_VIEW_STATE = {
  ...MAP_CENTER,
  zoom: 16.5,
  pitch: 50,
  bearing: 0,
} as const;

/** Zoom level when flying to a single building */
export const BUILDING_ZOOM = 18;

/** Pitch when focused on a building */
export const BUILDING_PITCH = 60;

/** View state for intro fly-in (zoomed out, lower pitch) */
export const INTRO_VIEW_STATE = {
  ...MAP_CENTER,
  zoom: 14,
  pitch: 30,
  bearing: 0,
} as const;

/** Duration for intro fly-in animation (ms) */
export const INTRO_FLY_DURATION_MS = 2500;

/** Duration for building flyTo animation (ms) */
export const BUILDING_FLY_DURATION_MS = 1800;

/** Ease-out quartic for flyTo; Mapbox accepts (t) => number, t in [0,1]. */
export function easeOutQuartic(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

/** Optional bounds for UNL City Campus (southwest and northeast) */
export const CAMPUS_BOUNDS = {
  southwest: [-96.708, 40.812] as [number, number],
  northeast: [-96.69, 40.825] as [number, number],
} as const;

/** Bounds for Mapbox maxBounds: [[west, south], [east, north]] */
export const CAMPUS_MAX_BOUNDS: [[number, number], [number, number]] = [
  CAMPUS_BOUNDS.southwest,
  CAMPUS_BOUNDS.northeast,
];
