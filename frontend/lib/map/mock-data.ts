// Mock heatmap timeline data generator
// Generates realistic 24-hour occupancy patterns for each building

import { BUILDINGS, type Building } from "./buildings";
import type { DataSourceId, DayOfWeek } from "./config";

export interface TimeSlot {
  hour: number;      // 0-23
  minute: number;    // 0 or 30
  label: string;     // "9:00 AM"
  index: number;     // 0-47
}

export interface BuildingOccupancy {
  buildingId: string;
  occupancyPercent: number;  // 0-1
  occupantCount: number;
  sources: Partial<Record<DataSourceId, number>>; // occupancy contribution per source (0-1)
}

export interface TimelineSnapshot {
  time: TimeSlot;
  buildings: BuildingOccupancy[];
  heatmapPoints: HeatmapPoint[];
}

export interface HeatmapPoint {
  coordinates: [number, number];
  weight: number; // 0-1
}

// Generate all 48 time slots (30-minute intervals)
export function generateTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let i = 0; i < 48; i++) {
    const hour = Math.floor(i / 2);
    const minute = (i % 2) * 30;
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    slots.push({
      hour,
      minute,
      label: `${displayHour}:${minute.toString().padStart(2, "0")} ${ampm}`,
      index: i,
    });
  }
  return slots;
}

// Building-specific occupancy pattern generators
type PatternFn = (hour: number, minute: number, day: DayOfWeek) => Partial<Record<DataSourceId, number>>;

const isWeekday = (day: DayOfWeek) => !["Saturday", "Sunday"].includes(day);
const isGameDay = (day: DayOfWeek) => day === "Saturday";

function gaussianPeak(x: number, center: number, width: number): number {
  return Math.exp(-((x - center) ** 2) / (2 * width ** 2));
}

function buildPatternForType(type: Building["type"]): PatternFn {
  return (hour, minute, day) => {
    const t = hour + minute / 60;
    const wd = isWeekday(day);
    const gd = isGameDay(day);

    switch (type) {
      case "academic": {
        const morningClass = gaussianPeak(t, 10, 1.5) * (wd ? 0.8 : 0.05);
        const afternoonClass = gaussianPeak(t, 14, 1.5) * (wd ? 0.7 : 0.05);
        const eveningStudy = gaussianPeak(t, 19, 1.5) * (wd ? 0.3 : 0.1);
        const exams = gaussianPeak(t, 11, 2) * (wd ? 0.15 : 0);
        return {
          classes: morningClass + afternoonClass,
          clubs: gaussianPeak(t, 18, 1) * (wd ? 0.2 : 0.05),
          exams,
          reservations: eveningStudy * 0.5,
          testing: gaussianPeak(t, 13, 2) * (wd ? 0.1 : 0),
        };
      }
      case "dining": {
        const breakfast = gaussianPeak(t, 8, 0.8) * 0.4;
        const lunch = gaussianPeak(t, 12, 0.8) * 0.9;
        const dinner = gaussianPeak(t, 18, 1) * 0.85;
        const lateSnack = gaussianPeak(t, 21, 1) * 0.3;
        return {
          dining: breakfast + lunch + dinner + lateSnack,
          clubs: gaussianPeak(t, 17, 1.5) * 0.1,
        };
      }
      case "library": {
        const morning = gaussianPeak(t, 10, 2) * (wd ? 0.5 : 0.3);
        const afternoon = gaussianPeak(t, 15, 2) * (wd ? 0.6 : 0.4);
        const evening = gaussianPeak(t, 20, 2) * 0.85;
        const lateNight = gaussianPeak(t, 23, 1.5) * 0.5;
        return {
          classes: morning * 0.3,
          exams: (afternoon + evening) * 0.3,
          reservations: (morning + afternoon) * 0.4,
          clubs: gaussianPeak(t, 16, 1) * 0.15,
        };
      }
      case "residential": {
        const morning = gaussianPeak(t, 8, 1.5) * 0.5;
        const midday = 0.15; // base occupancy
        const evening = gaussianPeak(t, 20, 2.5) * 0.7;
        const night = gaussianPeak(t, 0, 3) * 0.8 + gaussianPeak(t, 24, 3) * 0.8;
        return {
          classes: 0,
          clubs: gaussianPeak(t, 19, 1.5) * 0.15,
          reservations: (morning + evening) * 0.2,
          dining: 0,
        };
      }
      case "athletic": {
        const practice = gaussianPeak(t, 15, 2) * (wd ? 0.15 : 0.05);
        const gameDay = gd ? gaussianPeak(t, 14, 2) * 0.95 : 0;
        const preGame = gd ? gaussianPeak(t, 11, 1.5) * 0.4 : 0;
        return {
          sports: practice + gameDay + preGame,
          clubs: gaussianPeak(t, 10, 1.5) * 0.05,
        };
      }
      case "recreation": {
        const earlyMorning = gaussianPeak(t, 6.5, 1) * 0.35;
        const lunch = gaussianPeak(t, 12, 1) * (wd ? 0.45 : 0.3);
        const afternoon = gaussianPeak(t, 16.5, 1.5) * 0.8;
        const evening = gaussianPeak(t, 19, 1.5) * 0.7;
        return {
          clubs: gaussianPeak(t, 18, 1.5) * 0.25,
          reservations: (lunch + afternoon) * 0.3,
          sports: earlyMorning + afternoon + evening,
        };
      }
      case "administrative": {
        const business = (t >= 8 && t <= 17) ? 0.6 : 0.02;
        const peak = gaussianPeak(t, 10, 1.5) * (wd ? 0.3 : 0) + gaussianPeak(t, 14, 1.5) * (wd ? 0.25 : 0);
        return {
          classes: 0,
          reservations: (business + peak) * 0.5 * (wd ? 1 : 0.05),
        };
      }
    }
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

// Generate occupancy for a single building at a given time
function generateBuildingOccupancy(
  building: Building,
  hour: number,
  minute: number,
  day: DayOfWeek
): BuildingOccupancy {
  const pattern = buildPatternForType(building.type);
  const sources = pattern(hour, minute, day);

  // Sum all source contributions, clamped to [0, 1]
  const total = clamp(
    Object.values(sources).reduce((sum, v) => sum + (v || 0), 0),
    0,
    1
  );

  // Add a small random jitter for realism (+/- 5%)
  const jitter = (Math.random() - 0.5) * 0.1;
  const occupancyPercent = clamp(total + jitter, 0, 1);

  return {
    buildingId: building.id,
    occupancyPercent,
    occupantCount: Math.round(occupancyPercent * building.capacity),
    sources,
  };
}

// Generate scattered heatmap points around each building
function generateHeatmapPoints(
  buildings: BuildingOccupancy[],
  buildingMap: Map<string, Building>
): HeatmapPoint[] {
  const points: HeatmapPoint[] = [];

  for (const bo of buildings) {
    const building = buildingMap.get(bo.buildingId);
    if (!building) continue;

    // Generate scattered points around the building center proportional to occupancy
    const numPoints = Math.max(1, Math.round(bo.occupancyPercent * 20));
    const spread = 0.0008; // ~80m spread

    for (let i = 0; i < numPoints; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const r = Math.random() * spread * Math.sqrt(bo.occupancyPercent);
      points.push({
        coordinates: [
          building.coordinates[0] + r * Math.cos(angle),
          building.coordinates[1] + r * Math.sin(angle),
        ],
        weight: bo.occupancyPercent * (0.7 + Math.random() * 0.3),
      });
    }
  }

  return points;
}

// Generate a full timeline dataset for a given day
export function generateDayTimeline(day: DayOfWeek): TimelineSnapshot[] {
  const timeSlots = generateTimeSlots();
  const buildingMap = new Map(BUILDINGS.map((b) => [b.id, b]));
  const snapshots: TimelineSnapshot[] = [];

  for (const slot of timeSlots) {
    const buildings = BUILDINGS.map((b) =>
      generateBuildingOccupancy(b, slot.hour, slot.minute, day)
    );
    const heatmapPoints = generateHeatmapPoints(buildings, buildingMap);

    snapshots.push({
      time: slot,
      buildings,
      heatmapPoints,
    });
  }

  return snapshots;
}

// Generate insights based on current occupancy snapshot
export interface Insight {
  id: string;
  type: "alert" | "prediction" | "recommendation" | "status";
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  buildingId?: string;
}

export function generateInsights(
  snapshot: TimelineSnapshot,
  timeline: TimelineSnapshot[]
): Insight[] {
  const insights: Insight[] = [];
  const currentIdx = snapshot.time.index;

  // Find busiest buildings
  const sorted = [...snapshot.buildings].sort(
    (a, b) => b.occupancyPercent - a.occupancyPercent
  );

  // Hot spot alerts
  for (const bo of sorted.slice(0, 3)) {
    const building = BUILDINGS.find((b) => b.id === bo.buildingId);
    if (!building) continue;

    if (bo.occupancyPercent > 0.8) {
      insights.push({
        id: `alert-${bo.buildingId}`,
        type: "alert",
        title: `${building.shortName} is at ${Math.round(bo.occupancyPercent * 100)}% capacity`,
        description: `${bo.occupantCount} of ${building.capacity} estimated occupants. Consider alternative spaces.`,
        severity: "critical",
        buildingId: bo.buildingId,
      });
    } else if (bo.occupancyPercent > 0.6) {
      insights.push({
        id: `status-${bo.buildingId}`,
        type: "status",
        title: `${building.shortName}: ${Math.round(bo.occupancyPercent * 100)}% occupied`,
        description: `Moderately busy with ${bo.occupantCount} occupants.`,
        severity: "medium",
        buildingId: bo.buildingId,
      });
    }
  }

  // Future predictions - look ahead 2 hours
  const futureIdx = Math.min(currentIdx + 4, 47);
  if (futureIdx > currentIdx && timeline[futureIdx]) {
    const futureSnapshot = timeline[futureIdx];
    for (const futureBo of futureSnapshot.buildings) {
      const currentBo = snapshot.buildings.find(
        (b) => b.buildingId === futureBo.buildingId
      );
      if (!currentBo) continue;

      const building = BUILDINGS.find((b) => b.id === futureBo.buildingId);
      if (!building) continue;

      const diff = futureBo.occupancyPercent - currentBo.occupancyPercent;
      if (diff > 0.25) {
        insights.push({
          id: `pred-${futureBo.buildingId}`,
          type: "prediction",
          title: `${building.shortName} will get busier`,
          description: `Expected to reach ${Math.round(futureBo.occupancyPercent * 100)}% capacity by ${futureSnapshot.time.label}.`,
          severity: futureBo.occupancyPercent > 0.7 ? "high" : "medium",
          buildingId: futureBo.buildingId,
        });
      }
    }
  }

  // Recommendations - find quiet buildings
  const quietBuildings = sorted
    .filter((b) => b.occupancyPercent < 0.3)
    .slice(0, 2);

  for (const bo of quietBuildings) {
    const building = BUILDINGS.find((b) => b.id === bo.buildingId);
    if (!building) continue;

    if (["library", "academic", "recreation"].includes(building.type)) {
      insights.push({
        id: `rec-${bo.buildingId}`,
        type: "recommendation",
        title: `${building.shortName} is quiet right now`,
        description: `Only ${Math.round(bo.occupancyPercent * 100)}% occupied - great time to visit.`,
        severity: "low",
        buildingId: bo.buildingId,
      });
    }
  }

  return insights.slice(0, 6); // Max 6 insights
}
