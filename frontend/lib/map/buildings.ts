// UNL Campus Building Data
// Derived from parsed class locations and building capacity data for accurate map coordinates and capacity.

export interface ClassTime {
  days: string;
  startTime: string;
  endTime: string;
}

export interface BuildingCourse {
  courseLabel: string | null;
  subjectId: string | null;
  courseNumber: string | null;
  sectionNumber: string | null;
  title: string | null;
  room: string | null;
  capacity: number | null;
  enrolled: number | null;
  classTimes: ClassTime[];
}

export interface Building {
  id: string;
  buildingCode: string;
  name: string;
  shortName: string;
  type: "residential" | "academic" | "dining" | "library" | "athletic" | "recreation" | "administrative";
  coordinates: [number, number]; // [lng, lat]
  capacity: number;
  hours: string;
  description: string;
  polygon: [number, number][]; // Approximate building footprint
  courses: BuildingCourse[];
}

// Generated from backend/classes/generate_frontend_buildings.py
// This file should be regenerated when course/location data changes.
import generated from "./generated-buildings.json";

export const BUILDINGS: Building[] = (generated as any[]).map((b) => {
  const coords = Array.isArray(b.coordinates) ? b.coordinates : [0, 0];
  const lng = Number(coords[0] ?? 0);
  const lat = Number(coords[1] ?? 0);

  const rawCapacity = (b as any).capacity;
  const numericCapacity =
    typeof rawCapacity === "number"
      ? rawCapacity
      : Number(rawCapacity ?? 0) || 0;

  const polygonPoints: [number, number][] = Array.isArray(b.polygon)
    ? (b.polygon as any[]).map((p) => [Number(p[0] ?? 0), Number(p[1] ?? 0)])
    : [];

  return {
    id: b.id ?? b.buildingCode,
    buildingCode: b.buildingCode,
    name: b.name,
    shortName: b.shortName ?? b.buildingCode,
    type: (b.type ?? "academic") as Building["type"],
    coordinates: [lng, lat],
    capacity: numericCapacity,
    hours: b.hours ?? "See schedule",
    description: b.description ?? "",
    polygon: polygonPoints,
    courses: (b.courses ?? []) as BuildingCourse[],
  };
});

export const BUILDING_TYPE_COLORS: Record<Building["type"], string> = {
  residential: "#3b82f6",
  academic: "#8b5cf6",
  dining: "#f59e0b",
  library: "#06b6d4",
  athletic: "#ef4444",
  recreation: "#10b981",
  administrative: "#6b7280",
};

export function getBuildingById(id: string): Building | undefined {
  return BUILDINGS.find((b) => b.id === id);
}
