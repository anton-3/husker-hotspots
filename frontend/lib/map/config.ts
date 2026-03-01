// UNL Campus Map Configuration
// Centered on Kauffman Residential Center, 630 N 14th St, Lincoln, NE 68508

export const MAP_CONFIG = {
  center: [-96.7025, 40.8202] as [number, number],
  defaultZoom: 15.5,
  buildingZoom: 17.5,
  minZoom: 13,
  maxZoom: 20,
  pitch: 60,
  bearing: -15,
  style: "mapbox://styles/mapbox/dark-v11",
  transitionDuration: 1500,
  /** Keyboard: up/down arrow step (degrees) */
  pitchStep: 1,
  /** Keyboard: left/right arrow step (degrees) */
  bearingStep: 1,
  /** Keyboard hold: pitch change per second (degrees) */
  keyboardPitchRate: 45,
  /** Keyboard hold: bearing change per second (degrees) */
  keyboardBearingRate: 45,
  minPitch: 0,
  maxPitch: 85,
} as const;

export const HEATMAP_COLORS = {
  low: [34, 197, 94],       // green-500
  medium: [234, 179, 8],    // yellow-500
  high: [249, 115, 22],     // orange-500
  critical: [239, 68, 68],  // red-500
} as const;

export const OCCUPANCY_THRESHOLDS = {
  low: 0.25,
  medium: 0.5,
  high: 0.75,
  critical: 1.0,
} as const;

export const DATA_SOURCES = [
  { id: "classes", label: "Class Schedules", icon: "GraduationCap", color: "#3b82f6" },
  { id: "clubs", label: "Club Meetings", icon: "Users", color: "#8b5cf6" },
  { id: "dining", label: "Dining Wait Times", icon: "UtensilsCrossed", color: "#f59e0b" },
  { id: "sports", label: "Sports Events", icon: "Trophy", color: "#ef4444" },
  { id: "exams", label: "Exam Schedules", icon: "FileText", color: "#ec4899" },
  { id: "reservations", label: "Room Reservations", icon: "CalendarDays", color: "#06b6d4" },
  { id: "testing", label: "Testing Centers", icon: "ClipboardCheck", color: "#10b981" },
] as const;

export type DataSourceId = (typeof DATA_SOURCES)[number]["id"];

export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];
