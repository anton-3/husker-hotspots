import type { ActivityPoint } from "./mockData/types";

/**
 * Filter activity points to those within a time window [startTime, endTime] (inclusive of start, exclusive of end).
 * All times in Unix ms.
 */
export function filterActivityByTime(
  activity: ActivityPoint[],
  startTime: number,
  endTime: number
): ActivityPoint[] {
  return activity.filter((p) => p.timestamp >= startTime && p.timestamp < endTime);
}

/**
 * Get the min and max timestamps from activity data (for timeline range).
 */
export function getActivityTimeRange(activity: ActivityPoint[]): { min: number; max: number } {
  if (activity.length === 0) return { min: 0, max: 0 };
  let min = activity[0].timestamp;
  let max = activity[0].timestamp;
  for (const p of activity) {
    if (p.timestamp < min) min = p.timestamp;
    if (p.timestamp > max) max = p.timestamp;
  }
  return { min, max };
}

/**
 * Time window for heatmap: one hour by default.
 */
export const HEATMAP_WINDOW_MS = 60 * 60 * 1000;

/**
 * Format timestamp for display (e.g. "Mon 12:00 PM").
 */
export function formatTimeLabel(ts: number): string {
  const d = new Date(ts);
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const h = d.getHours();
  const am = h < 12;
  const h12 = h % 12 || 12;
  const m = d.getMinutes();
  return `${days[d.getDay()]} ${h12}:${m.toString().padStart(2, "0")} ${am ? "AM" : "PM"}`;
}

/** Peak hours (0-23) used for timeline markers; aligned with mock activity peaks. */
const PEAK_HOURS = [8, 10, 12, 14, 18];

/**
 * Return timestamps within timeRange that represent "peak" times (one per day in range).
 * Used to render peak indicators on the timeline.
 */
export function getPeakTimesInRange(timeRange: { min: number; max: number }): number[] {
  const { min, max } = timeRange;
  if (max <= min) return [];
  const out: number[] = [];
  const minDate = new Date(min);
  const maxDate = new Date(max);
  const startDay = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate()).getTime();
  const endDay = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate()).getTime();
  for (let day = startDay; day <= endDay; day += 24 * 60 * 60 * 1000) {
    for (const hour of PEAK_HOURS) {
      const ts = day + hour * 60 * 60 * 1000;
      if (ts >= min && ts <= max) out.push(ts);
    }
  }
  return out;
}
