// UNL Campus Building Data
// 12 key buildings with coordinates, metadata, and approximate footprint polygons
// buildingCode mapping links API buildings (backend/scripts/buildings.json) to these rich records

export interface Building {
  id: string;
  name: string;
  shortName: string;
  type: "residential" | "academic" | "dining" | "library" | "athletic" | "recreation" | "administrative";
  coordinates: [number, number]; // [lng, lat]
  capacity: number;
  hours: string;
  description: string;
  polygon: [number, number][]; // Approximate building footprint
}

/** Minimal campus building from API (all 52). Used for click/hover when no rich data. */
export interface CampusBuilding {
  id: string; // buildingCode
  name: string;
  coordinates: [number, number]; // [lng, lat]
}

/** Map API buildingCode to rich Building id for popup/occupancy lookup. */
export const BUILDING_CODE_TO_RICH_ID: Record<string, string> = {
  AVH: "avery",
  KAUF: "kauffman",
  NU: "nebraska-union",
  CREC: "campus-rec",
  HAH: "hamilton",
  LLS: "love-library",
};

export const BUILDINGS: Building[] = [
  {
    id: "kauffman",
    name: "Kauffman Residential Center",
    shortName: "Kauffman",
    type: "residential",
    coordinates: [-96.7025, 40.8202],
    capacity: 650,
    hours: "24/7",
    description: "Residence hall housing approximately 650 students with dining and study spaces.",
    polygon: [
      [-96.7030, 40.8206], [-96.7020, 40.8206],
      [-96.7020, 40.8198], [-96.7030, 40.8198],
      [-96.7030, 40.8206],
    ],
  },
  {
    id: "nebraska-union",
    name: "Nebraska Union",
    shortName: "Union",
    type: "dining",
    coordinates: [-96.7005, 40.8185],
    capacity: 1200,
    hours: "7:00 AM - 11:00 PM",
    description: "Main student union with dining options, meeting rooms, and student org offices.",
    polygon: [
      [-96.7012, 40.8190], [-96.6998, 40.8190],
      [-96.6998, 40.8180], [-96.7012, 40.8180],
      [-96.7012, 40.8190],
    ],
  },
  {
    id: "love-library",
    name: "Love Library",
    shortName: "Love Library",
    type: "library",
    coordinates: [-96.7015, 40.8170],
    capacity: 800,
    hours: "7:30 AM - 12:00 AM",
    description: "Main campus library with study rooms, archives, and computer labs.",
    polygon: [
      [-96.7022, 40.8175], [-96.7008, 40.8175],
      [-96.7008, 40.8165], [-96.7022, 40.8165],
      [-96.7022, 40.8175],
    ],
  },
  {
    id: "selleck",
    name: "Selleck Dining Hall",
    shortName: "Selleck",
    type: "dining",
    coordinates: [-96.7035, 40.8210],
    capacity: 500,
    hours: "7:00 AM - 9:00 PM",
    description: "Major dining hall serving the north campus residential area.",
    polygon: [
      [-96.7040, 40.8214], [-96.7030, 40.8214],
      [-96.7030, 40.8206], [-96.7040, 40.8206],
      [-96.7040, 40.8214],
    ],
  },
  {
    id: "campus-rec",
    name: "Campus Recreation Center",
    shortName: "Campus Rec",
    type: "recreation",
    coordinates: [-96.6960, 40.8195],
    capacity: 1000,
    hours: "6:00 AM - 11:00 PM",
    description: "Fitness center, pool, basketball courts, climbing wall, and group fitness studios.",
    polygon: [
      [-96.6968, 40.8200], [-96.6952, 40.8200],
      [-96.6952, 40.8190], [-96.6968, 40.8190],
      [-96.6968, 40.8200],
    ],
  },
  {
    id: "hamilton",
    name: "Hamilton Hall",
    shortName: "Hamilton",
    type: "academic",
    coordinates: [-96.7000, 40.8165],
    capacity: 600,
    hours: "7:00 AM - 10:00 PM",
    description: "Major classroom building for sciences and mathematics departments.",
    polygon: [
      [-96.7006, 40.8170], [-96.6994, 40.8170],
      [-96.6994, 40.8160], [-96.7006, 40.8160],
      [-96.7006, 40.8170],
    ],
  },
  {
    id: "avery",
    name: "Avery Hall",
    shortName: "Avery",
    type: "academic",
    coordinates: [-96.7030, 40.8182],
    capacity: 450,
    hours: "7:00 AM - 10:00 PM",
    description: "Home to Mathematics and Computer Science departments with lecture halls.",
    polygon: [
      [-96.7035, 40.8186], [-96.7025, 40.8186],
      [-96.7025, 40.8178], [-96.7035, 40.8178],
      [-96.7035, 40.8186],
    ],
  },
  {
    id: "memorial-stadium",
    name: "Memorial Stadium",
    shortName: "Memorial",
    type: "athletic",
    coordinates: [-96.6985, 40.8210],
    capacity: 86000,
    hours: "Event-based",
    description: "Home of Husker football. Capacity 86,000+ on game days.",
    polygon: [
      [-96.6998, 40.8220], [-96.6972, 40.8220],
      [-96.6972, 40.8200], [-96.6998, 40.8200],
      [-96.6998, 40.8220],
    ],
  },
  {
    id: "abel-sandoz",
    name: "Abel / Sandoz Residence Halls",
    shortName: "Abel/Sandoz",
    type: "residential",
    coordinates: [-96.6955, 40.8210],
    capacity: 1600,
    hours: "24/7",
    description: "Twin high-rise residence halls housing ~1,600 students on East Campus side.",
    polygon: [
      [-96.6962, 40.8216], [-96.6948, 40.8216],
      [-96.6948, 40.8204], [-96.6962, 40.8204],
      [-96.6962, 40.8216],
    ],
  },
  {
    id: "adele-hall",
    name: "Adele Hall Learning Commons",
    shortName: "Adele Hall",
    type: "library",
    coordinates: [-96.7020, 40.8178],
    capacity: 400,
    hours: "7:30 AM - 2:00 AM",
    description: "Modern learning commons with collaborative workspaces, open late for studying.",
    polygon: [
      [-96.7025, 40.8181], [-96.7015, 40.8181],
      [-96.7015, 40.8175], [-96.7025, 40.8175],
      [-96.7025, 40.8181],
    ],
  },
  {
    id: "harper-schramm-smith",
    name: "Harper-Schramm-Smith Residence Halls",
    shortName: "HSS",
    type: "residential",
    coordinates: [-96.6965, 40.8200],
    capacity: 1100,
    hours: "24/7",
    description: "Tri-hall residential complex near the recreation center.",
    polygon: [
      [-96.6972, 40.8205], [-96.6958, 40.8205],
      [-96.6958, 40.8195], [-96.6972, 40.8195],
      [-96.6972, 40.8205],
    ],
  },
  {
    id: "canfield",
    name: "Canfield Administration Building",
    shortName: "Canfield",
    type: "administrative",
    coordinates: [-96.7010, 40.8195],
    capacity: 300,
    hours: "8:00 AM - 5:00 PM",
    description: "Central administrative offices including student affairs and admissions.",
    polygon: [
      [-96.7015, 40.8198], [-96.7005, 40.8198],
      [-96.7005, 40.8192], [-96.7015, 40.8192],
      [-96.7015, 40.8198],
    ],
  },
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
