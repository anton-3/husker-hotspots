#!/usr/bin/env node
/**
 * Temp script: list unique buildings from parsed_sections.json by building code.
 * Infers a regular building name (strips room numbers, picks canonical form).
 * Usage: node backend/scripts/list-unique-buildings.js
 */

const fs = require("fs");
const path = require("path");

const jsonPath = path.join(__dirname, "../classes/parsed_sections.json");

console.error("Reading", jsonPath, "...");
const raw = fs.readFileSync(jsonPath, "utf8");
const sections = JSON.parse(raw);
console.error("Loaded", sections.length, "sections");

// buildingCode -> { names: Set of "building" values, count, sampleLat, sampleLng }
const byCode = new Map();

for (const s of sections) {
  const code = s.buildingCode || "";
  const name = (s.building || "").trim();
  if (!byCode.has(code)) {
    byCode.set(code, {
      names: new Set(),
      count: 0,
      sampleLat: s.latitude,
      sampleLng: s.longitude,
    });
  }
  const rec = byCode.get(code);
  rec.count += 1;
  if (name) rec.names.add(name);
}

// Infer a single "regular" building name per code:
// - Prefer a name that looks like "Something Hall" or "Something Building" without a room.
// - Otherwise strip trailing numbers/room from the most common form, or use first alphabetically.
function inferName(namesSet) {
  const names = [...namesSet].filter(Boolean);
  if (names.length === 0) return "(no name)";
  if (names.length === 1) {
    const n = names[0];
    return stripRoomSuffix(n);
  }
  // Prefer names that don't end with a room number (no trailing " 123" or " ARR")
  const withoutRoom = names.map((n) => ({
    original: n,
    base: stripRoomSuffix(n),
  }));
  const baseCounts = new Map();
  for (const { base } of withoutRoom) {
    baseCounts.set(base, (baseCounts.get(base) || 0) + 1);
  }
  // Pick the most common base name; if tie, prefer shorter (likely the building name only).
  let bestBase = null;
  let bestCount = 0;
  for (const [base, count] of baseCounts) {
    if (count > bestCount || (count === bestCount && (!bestBase || base.length < bestBase.length))) {
      bestCount = count;
      bestBase = base;
    }
  }
  return bestBase || stripRoomSuffix(names[0]);
}

function stripRoomSuffix(s) {
  if (!s || typeof s !== "string") return s || "";
  // "Building 123" -> "Building", "Hall 262" -> "Hall", "Westbrook Music Arranged" -> "Westbrook Music"
  const t = s.trim();
  const lastPart = t.split(/\s+/).pop();
  if (/^\d+$/.test(lastPart) || lastPart === "ARR" || lastPart === "Arranged") {
    return t.slice(0, t.length - lastPart.length).trim();
  }
  return t;
}

const rows = [];
for (const [code, rec] of byCode.entries()) {
  const inferredName = inferName(rec.names);
  rows.push({
    buildingCode: code,
    inferredName,
    sectionCount: rec.count,
    nameVariants: [...rec.names].length,
    sampleLat: rec.sampleLat,
    sampleLng: rec.sampleLng,
  });
}

rows.sort((a, b) => (a.buildingCode < b.buildingCode ? -1 : a.buildingCode > b.buildingCode ? 1 : 0));

// Exclude codes that are not real physical buildings
const EXCLUDED_CODES = new Set(["TBD", "WEBCONF", "ARR"]);
const filtered = rows.filter((r) => !EXCLUDED_CODES.has(r.buildingCode));

const outPath = path.join(__dirname, "buildings.json");
fs.writeFileSync(outPath, JSON.stringify(filtered, null, 2), "utf8");
console.error("Wrote", filtered.length, "buildings to", outPath);
