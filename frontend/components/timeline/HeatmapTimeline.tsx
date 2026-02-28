"use client";

import { formatTimeLabel } from "@/lib/timeUtils";

export interface HeatmapTimelineProps {
  timeRange: { min: number; max: number };
  currentTime: number;
  onTimeChange: (time: number) => void;
  isPlaying?: boolean;
  onPlayPause?: () => void;
}

export function HeatmapTimeline({
  timeRange,
  currentTime,
  onTimeChange,
  isPlaying = false,
  onPlayPause,
}: HeatmapTimelineProps) {
  const { min, max } = timeRange;
  const rangeMs = max - min;
  const value = rangeMs > 0 ? ((currentTime - min) / rangeMs) * 100 : 0;

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-white/95 p-3 shadow-lg backdrop-blur dark:bg-zinc-900/95">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {formatTimeLabel(currentTime)}
        </span>
        {onPlayPause && (
          <button
            type="button"
            onClick={onPlayPause}
            className="rounded bg-zinc-200 px-2 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
        )}
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={0.5}
        value={value}
        onChange={(e) => {
          const pct = Number(e.target.value) / 100;
          onTimeChange(min + pct * rangeMs);
        }}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 dark:bg-zinc-700 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
      />
    </div>
  );
}
