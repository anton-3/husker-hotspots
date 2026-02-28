"use client";

/**
 * Returns the Mapbox access token and whether the map can be rendered.
 * Use to avoid rendering the map when the token is missing.
 */
export function useMapboxToken(): { token: string | undefined; ready: boolean } {
  if (typeof window === "undefined") {
    return { token: undefined, ready: false };
  }
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  return { token, ready: Boolean(token?.trim()) };
}
