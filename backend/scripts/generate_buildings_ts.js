#!/usr/bin/env node
/**
 * Generate BUILDINGS array for frontend/lib/map/buildings.ts from backend/scripts/buildings.json.
 * Infers type, capacity, hours, description where missing.
 */
const fs = require("fs");
const path = require("path");

const CAMPUS_CENTER = [-96.7012, 40.8185];
const BUILDING_TYPES = ["residential", "academic", "dining", "library", "athletic", "recreation", "administrative"];

function inferType(displayName, name) {
  const n = ((displayName || name) || "").toLowerCase();
  if (/parking|garage|lot\b|pg\b/.test(n) || /^\d+pg$/.test(n)) return "administrative";
  if (/apartment|dorm|residential|suite|courtyard|village|terrace|quad|hall\s*[a-z](\s|$)/.test(n) && !/dining|food|union|rec|library|college|school|center|museum/.test(n)) return "residential";
  if (/dining|food service|cather dining|harper dining|welcome center.*food|building l - food/.test(n)) return "dining";
  if (/library|learning commons|depository/.test(n)) return "library";
  if (/recreation|rec\s|wellness|fitness|adventure|stadium|coliseum|arena|athletic|sport|devaney|hawks|championship|osborne|mabel lee|pavilion/.test(n)) return n.includes("rec ") || n.includes("recreation") || n.includes("wellness") || n.includes("adventure") ? "recreation" : "athletic";
  if (/tennis|ice center/.test(n)) return "athletic";
  if (/union\b/.test(n) && !/east union/.test(n)) return "dining";
  if (/east union/.test(n)) return "dining";
  if (/administration|admin|facility|management|utility|maintenance|service building|storage|warehouse|bus garage|transport|recycling|refuse|document|implement building|plant\b|thermal|sewage|concessions|credit union|hotel\b|alumni/.test(n)) return "administrative";
  if (/greenhouse|shop\s|laboratory|lab\s|hall\b|center\b|building\b|institute|museum|college|school|research|complex|annex|link|west\b|east\b/.test(n)) return "academic";
  return "academic";
}

function inferCapacity(type, displayName) {
  const n = (displayName || "").toLowerCase();
  if (type === "administrative" && /parking|garage/.test(n)) return 50;
  if (type === "residential") return 250;
  if (type === "athletic") return 500;
  if (type === "recreation") return 300;
  if (type === "dining") return 400;
  if (type === "library") return 300;
  return 200;
}

function inferHours(type, displayName) {
  const n = (displayName || "").toLowerCase();
  if (/parking|garage/.test(n)) return "24/7";
  if (type === "administrative") return "8:00 AM - 5:00 PM";
  if (type === "athletic" || type === "recreation") return "Varies";
  return "7:00 AM - 10:00 PM";
}

function escape(s) {
  if (s == null) return '""';
  return '"' + String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
}

const jsonPath = path.join(__dirname, "buildings.json");
const raw = fs.readFileSync(jsonPath, "utf8");
const data = JSON.parse(raw);

const buildings = [];
for (const b of data) {
  const name = (b.displayName || b.name || b.buildingCode || "").replace(/&amp;/g, "&");
  const shortName = b.shortName || b.buildingCode || "";
  const hasCoords = b.lat != null && b.lng != null && !b.error;
  const coords = hasCoords ? [b.lng, b.lat] : CAMPUS_CENTER;
  const type = inferType(b.displayName, b.name);
  const capacity = inferCapacity(type, b.displayName);
  const hours = inferHours(type, b.displayName);
  const address = b.address || "";
  const description = "";

  buildings.push({
    id: b.buildingCode,
    name,
    shortName,
    type,
    coordinates: coords,
    capacity,
    hours,
    description,
    address,
  });
}

// Output as TypeScript array entries (one per line)
const lines = buildings.map((b) => {
  const coordStr = b.coordinates[0] === CAMPUS_CENTER[0] && b.coordinates[1] === CAMPUS_CENTER[1] ? "CAMPUS_CENTER" : `[${b.coordinates[0]}, ${b.coordinates[1]}]`;
  return `  { id: ${escape(b.id)}, name: ${escape(b.name)}, shortName: ${escape(b.shortName)}, type: "${b.type}", coordinates: ${coordStr}, capacity: ${b.capacity}, hours: ${escape(b.hours)}, description: ${escape(b.description)}, address: ${escape(b.address)} },`;
});

fs.writeFileSync(path.join(__dirname, "buildings-lines.json"), JSON.stringify(lines));
