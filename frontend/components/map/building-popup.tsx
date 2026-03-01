"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, MapPin, Clock, Users } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BUILDING_TYPE_COLORS, type Building } from "@/lib/map/buildings";
import type { TimelineSnapshot } from "@/lib/map/mock-data";
import { DATA_SOURCES } from "@/lib/map/config";
import type { ClassAtTime } from "@/lib/api/density";

const CATALOG_SEARCH_BASE =
  "https://catalog.unl.edu/search/?caturl=%252Fundergraduate&scontext=courses&search=";

/** Format "HH:MM" to "10:00 AM" / "2:30 PM". */
function formatTime(hhmm: string): string {
  if (!hhmm || !/^\d{1,2}:\d{2}$/.test(hhmm)) return hhmm || "";
  const [hStr, mStr] = hhmm.split(":");
  const hour = parseInt(hStr!, 10);
  const minute = parseInt(mStr!, 10);
  const ampm = hour < 12 ? "AM" : "PM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${ampm}`;
}

interface BuildingPopupProps {
  building: Building;
  currentOccupancy: number;
  currentOccupantCount: number;
  timeline: TimelineSnapshot[];
  currentTimeIndex: number;
  onClose: () => void;
  /** When provided, chart and peak use API timeline instead of mock timeline. */
  apiTimelineSlots?: { time: string; label?: string; estimated_people: number }[] | null;
  /** When provided, Activity Sources section shows this instead of deriving from timeline. */
  sourceBreakdownOverride?: { id: string; label: string; value: number; color?: string }[] | null;
  /** Classes/sections active at the current map time (from density API). */
  classesAtTime?: ClassAtTime[];
  /** Display label for current time (e.g. "10:00 AM"). */
  currentTimeLabel?: string;
}

export function BuildingPopup({
  building,
  currentOccupancy,
  currentOccupantCount,
  timeline,
  currentTimeIndex,
  onClose,
  apiTimelineSlots = null,
  sourceBreakdownOverride = null,
  classesAtTime = [],
  currentTimeLabel = "",
}: BuildingPopupProps) {
  // Build hourly chart data: from API timeline when provided, else mock timeline
  const chartData = useMemo(() => {
    if (apiTimelineSlots && apiTimelineSlots.length > 0) {
      return apiTimelineSlots
        .filter((_, i) => i % 2 === 0)
        .map((slot) => ({
          time: (slot.label ?? slot.time).replace(":00 ", " "),
          occupancy: Math.round(
            (100 * slot.estimated_people) / Math.max(1, building.capacity)
          ),
        }));
    }
    return timeline
      .filter((_, i) => i % 2 === 0)
      .map((snap) => {
        const bOcc = snap.buildings.find((b) => b.buildingId === building.id);
        return {
          time: snap.time.label.replace(":00 ", " "),
          occupancy: Math.round((bOcc?.occupancyPercent ?? 0) * 100),
        };
      });
  }, [apiTimelineSlots, timeline, building.id, building.capacity]);

  // Find peak hour: from API timeline when provided, else mock timeline
  const peakData = useMemo(() => {
    if (apiTimelineSlots && apiTimelineSlots.length > 0) {
      let maxPeople = 0;
      let peakLabel = "";
      for (const slot of apiTimelineSlots) {
        if (slot.estimated_people > maxPeople) {
          maxPeople = slot.estimated_people;
          peakLabel = (slot.label ?? slot.time).replace(":00 ", " ");
        }
      }
      const maxOccPercent =
        building.capacity > 0
          ? Math.round(100 * (maxPeople / building.capacity))
          : 0;
      return { maxOcc: Math.min(100, maxOccPercent), peakTime: peakLabel };
    }
    let maxOcc = 0;
    let peakTime = "";
    for (const snap of timeline) {
      const bOcc = snap.buildings.find((b) => b.buildingId === building.id);
      if (bOcc && bOcc.occupancyPercent > maxOcc) {
        maxOcc = bOcc.occupancyPercent;
        peakTime = snap.time.label;
      }
    }
    return { maxOcc: Math.round(maxOcc * 100), peakTime };
  }, [apiTimelineSlots, timeline, building.id, building.capacity]);

  // Source breakdown: override when provided (API), else derive from mock timeline
  const sourceBreakdownFromTimeline = useMemo(() => {
    const snap = timeline[currentTimeIndex];
    if (!snap) return [];
    const bOcc = snap.buildings.find((b) => b.buildingId === building.id);
    if (!bOcc) return [];

    return DATA_SOURCES.filter(
      (src) => bOcc.sources[src.id] && bOcc.sources[src.id]! > 0.01
    ).map((src) => ({
      ...src,
      value: Math.round((bOcc.sources[src.id] ?? 0) * 100),
    }));
  }, [timeline, currentTimeIndex, building.id]);

  const displaySourceBreakdown =
    sourceBreakdownOverride && sourceBreakdownOverride.length > 0
      ? sourceBreakdownOverride
      : sourceBreakdownFromTimeline;

  // Only show classes that are in session at the current map time (start <= current < end)
  const classesInSession = useMemo(() => {
    const slot = timeline[currentTimeIndex]?.time;
    if (!slot || classesAtTime.length === 0) return classesAtTime;
    const currentHHMM = `${String(slot.hour).padStart(2, "0")}:${String(slot.minute).padStart(2, "0")}`;
    return classesAtTime.filter(
      (cls) =>
        cls.start_time <= currentHHMM &&
        currentHHMM < cls.end_time
    );
  }, [timeline, currentTimeIndex, classesAtTime]);

  const typeColor = BUILDING_TYPE_COLORS[building.type];
  const occupancyPercent = Math.round(currentOccupancy * 100);

  const statusColor =
    occupancyPercent > 75
      ? "#ef4444"
      : occupancyPercent > 50
      ? "#f97316"
      : occupancyPercent > 25
      ? "#eab308"
      : "#22c55e";

  return (
    <>
      {/* Mobile: dimmed backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        aria-hidden
        onClick={onClose}
      />
      <div className="fixed sm:mb-24 lg:mb-0 inset-0 z-40 flex items-center justify-center p-3 animate-in fade-in duration-300 sm:p-4 lg:pointer-events-none lg:absolute lg:inset-auto lg:bottom-[11rem] lg:right-[340px] lg:block lg:p-0 lg:animate-none">
        <div className="flex h-[80vh] w-full max-w-[min(95vw,420px)] flex-col overflow-hidden rounded-xl border border-white/10 bg-black/80 backdrop-blur-xl lg:pointer-events-auto lg:h-[calc(85vh-14rem)] lg:max-w-none lg:w-96 animate-in slide-in-from-right-4 duration-300">
          {/* Header */}
          <div className="flex shrink-0 items-start justify-between border-b border-white/10 p-4">
            <div className="flex-1 min-w-0">
              <div className="mb-1 flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: typeColor }}
                />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                  {building.type}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white text-balance">
                {building.name}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="ml-2 shrink-0 rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close building details"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col">
            <TabsList className="mx-4 mt-2 shrink-0 w-fit bg-white/5 p-[3px] [&>button]:text-white/90 [&>button]:data-[state=active]:bg-white/10 [&>button]:data-[state=active]:text-white">
              <TabsTrigger value="overview" className="text-white/90 data-[state=active]:text-white">Overview</TabsTrigger>
              <TabsTrigger value="classes" className="text-white/90 data-[state=active]:text-white">Classes now</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 min-h-0">
              <TabsContent value="overview" className="mt-0 focus-visible:outline-none">
                <div className="space-y-4 p-4">
                  {/* Occupancy gauge */}
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-white/50">Current Occupancy</p>
                        <p className="text-2xl font-bold" style={{ color: statusColor }}>
                          {occupancyPercent}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-white/50">Estimated</p>
                        <p className="text-lg font-semibold text-white">
                          {currentOccupantCount.toLocaleString()}
                          <span className="text-xs text-white/40">
                            {" "}/ {building.capacity.toLocaleString()}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${occupancyPercent}%`,
                          backgroundColor: statusColor,
                        }}
                      />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2">
                      <Clock className="h-3.5 w-3.5 shrink-0 text-white/40" />
                      <span className="text-xs text-white/70 truncate">{building.hours}</span>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 min-w-0">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-white/40" />
                      <span className="text-xs text-white/70 truncate">{building.address || building.shortName}</span>
                    </div>
                  </div>

                  {/* Chart */}
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">
                      24-Hour Activity
                    </h4>
                    <div className="h-32 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id={`grad-${building.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={typeColor} stopOpacity={0.4} />
                              <stop offset="100%" stopColor={typeColor} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis
                            dataKey="time"
                            tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }}
                            axisLine={false}
                            tickLine={false}
                            interval={5}
                          />
                          <YAxis
                            tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }}
                            axisLine={false}
                            tickLine={false}
                            domain={[0, 100]}
                            width={25}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "rgba(0,0,0,0.8)",
                              border: "1px solid rgba(255,255,255,0.1)",
                              borderRadius: "8px",
                              fontSize: "12px",
                              color: "white",
                            }}
                            formatter={(value: number) => [`${value}%`, "Occupancy"]}
                          />
                          <Area
                            type="monotone"
                            dataKey="occupancy"
                            stroke={typeColor}
                            strokeWidth={2}
                            fill={`url(#grad-${building.id})`}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Source breakdown */}
                  {displaySourceBreakdown.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">
                        Activity Sources
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {displaySourceBreakdown.map((src) => (
                          <span
                            key={src.id}
                            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium"
                            style={{
                              borderColor: (src.color ?? "#94a3b8") + "40",
                              backgroundColor: (src.color ?? "#94a3b8") + "15",
                              color: src.color ?? "#94a3b8",
                            }}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: src.color ?? "#94a3b8" }}
                            />
                            {src.label} {src.value}%
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <p className="text-xs text-white/40 text-pretty">{building.description}</p>
                </div>
              </TabsContent>

              <TabsContent value="classes" className="mt-0 focus-visible:outline-none">
                <div className="space-y-4 p-4">
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">
                      Classes right now
                      {currentTimeLabel ? ` (${currentTimeLabel})` : ""}
                    </h4>
                    {classesInSession.length === 0 ? (
                      <p className="text-xs text-white/40">No scheduled classes at this time.</p>
                    ) : (
                      <ul className="space-y-2">
                        <AnimatePresence initial={false}>
                          {classesInSession.map((cls, i) => {
                            const catalogUrl = `${CATALOG_SEARCH_BASE}${encodeURIComponent(cls.course_label)}`;
                            const itemKey = `${cls.course_label}-${cls.room ?? ""}-${cls.start_time}-${i}`;
                            return (
                              <motion.li
                                key={itemKey}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <a
                                  href={catalogUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block rounded-lg border border-white/10 bg-white/5 p-2.5 transition-[transform,background-color,box-shadow] duration-150 hover:scale-[1.02] hover:bg-white/10 hover:shadow-md hover:shadow-black/20 cursor-pointer"
                                >
                                  <div className="font-medium text-white text-xs">
                                    {cls.course_label}
                                    {cls.title ? ` — ${cls.title}` : ""}
                                  </div>
                                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-white/60">
                                    {cls.room && (
                                      <span className="inline-flex items-center gap-1">
                                        <MapPin className="h-3 w-3 shrink-0" />
                                        Room {cls.room}
                                      </span>
                                    )}
                                    <span className="inline-flex items-center gap-1">
                                      <Users className="h-3 w-3 shrink-0" />
                                      {cls.enrolled}/{cls.capacity}
                                    </span>
                                    {(cls.start_time || cls.end_time) && (
                                      <span className="inline-flex items-center gap-1">
                                        <Clock className="h-3 w-3 shrink-0" />
                                        {formatTime(cls.start_time)}–{formatTime(cls.end_time)}
                                        {cls.days ? ` (${cls.days})` : ""}
                                      </span>
                                    )}
                                  </div>
                                </a>
                              </motion.li>
                            );
                          })}
                        </AnimatePresence>
                      </ul>
                    )}
                  </div>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </div>
    </>
  );
}
