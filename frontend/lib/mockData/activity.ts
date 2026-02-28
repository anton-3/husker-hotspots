import type { ActivityPoint, ActivitySource } from "./types";
import { MOCK_BUILDINGS } from "./buildings";

const SOURCES: ActivitySource[] = [
  "class",
  "club",
  "food",
  "sports",
  "exam",
  "reservation",
  "testing",
];

/** Seeded simple RNG for reproducible mock data */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One week of mock activity: peaks at class change, lunch, evening */
export function generateMockActivity(): ActivityPoint[] {
  const rng = mulberry32(42);
  const points: ActivityPoint[] = [];
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const baseDate = Date.UTC(2025, 0, 6, 0, 0, 0); // Monday 00:00

  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      // Peak hours: 8–10, 11–13, 17–20
      let multiplier = 1;
      if ((hour >= 8 && hour <= 10) || (hour >= 11 && hour <= 13)) multiplier = 3;
      else if (hour >= 17 && hour <= 20) multiplier = 2.5;

      const count = Math.floor(15 * multiplier * (0.7 + 0.6 * rng()));
      for (let i = 0; i < count; i++) {
        const building = MOCK_BUILDINGS[Math.floor(rng() * MOCK_BUILDINGS.length)];
        const [lng, lat] = building.center;
        const jitter = 0.00015 * (rng() - 0.5);
        const timestamp = baseDate + day * 24 * 60 * 60 * 1000 + hour * 60 * 60 * 1000 + Math.floor(rng() * 3600000);
        const source = SOURCES[Math.floor(rng() * SOURCES.length)];
        const weight = 0.5 + rng();
        points.push({
          longitude: lng + jitter,
          latitude: lat + jitter,
          weight,
          timestamp,
          source,
        });
      }
    }
  }

  return points;
}

let cached: ActivityPoint[] | null = null;

/** Mock activity points (one week); cached after first call */
export function getMockActivity(): ActivityPoint[] {
  if (!cached) cached = generateMockActivity();
  return cached;
}
