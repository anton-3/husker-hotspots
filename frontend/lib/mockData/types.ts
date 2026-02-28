/**
 * Shared types for campus buildings and activity data.
 * Designed to align with future data sources (class schedule, club meets, food app, etc.).
 */

export type ActivitySource =
  | "class"
  | "club"
  | "food"
  | "sports"
  | "exam"
  | "reservation"
  | "testing";

export interface ActivityPoint {
  longitude: number;
  latitude: number;
  weight: number;
  timestamp: number; // Unix ms
  source: ActivitySource;
}

export interface Building {
  id: string;
  name: string;
  address?: string;
  center: [number, number]; // [lng, lat]
  polygon: { type: "Polygon"; coordinates: number[][][] };
  height?: number; // meters, for extrusion
}
