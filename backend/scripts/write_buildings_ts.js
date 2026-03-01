const fs = require("fs");
const path = require("path");

const lines = JSON.parse(
  fs.readFileSync(path.join(__dirname, "buildings-lines.json"), "utf8")
);

const header = `// UNL Campus Building Data
// Generated from backend/scripts/buildings.json (all buildings). Type, capacity, hours, description inferred where missing.
// id = buildingCode so map clicks resolve via getBuildingById(selectedBuilding.id).

export interface Building {
  id: string;
  name: string;
  shortName: string;
  type: "residential" | "academic" | "dining" | "library" | "athletic" | "recreation" | "administrative";
  coordinates: [number, number]; // [lng, lat]
  capacity: number;
  hours: string;
  description: string;
  address: string;
}

/** Minimal campus building from API. Used for click/hover; lookup in BUILDINGS by id. */
export interface CampusBuilding {
  id: string; // buildingCode
  name: string;
  coordinates: [number, number]; // [lng, lat]
}

// Campus center fallback for buildings with null coords in JSON (e.g. M&N)
const CAMPUS_CENTER: [number, number] = [-96.7012, 40.8185];

function coords(lng: number | null, lat: number | null): [number, number] {
  if (lat != null && lng != null) return [lng, lat];
  return CAMPUS_CENTER;
}

function estCapacity(sectionCount: number): number {
  return Math.min(2000, Math.max(100, sectionCount * 25));
}

export const BUILDINGS: Building[] = [
`;

const footer = `
];

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
`;

const outPath = path.join(__dirname, "..", "..", "frontend", "lib", "map", "buildings.ts");
fs.writeFileSync(outPath, header + lines.join("\n") + footer);
console.log("Wrote", lines.length, "buildings to", outPath);
