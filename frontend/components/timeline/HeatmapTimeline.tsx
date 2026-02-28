"use client";

import { formatTimeLabel } from "@/lib/timeUtils";

export interface HeatmapTimelineProps {
  timeRange: { min: number; max: number };
  currentTime: number;
  onTimeChange: (time: number) => void;
  isPlaying?: boolean;
  onPlayPause?: () => void;
  playbackSpeed?: number;
  onSpeedChange?: (speed: number) => void;
  peakTimes?: number[];
}

export function HeatmapTimeline({
  timeRange,
  currentTime,
  onTimeChange,
  isPlaying = false,
  onPlayPause,
  playbackSpeed = 1,
  onSpeedChange,
  peakTimes = [],
}: HeatmapTimelineProps) {
  const { min, max } = timeRange;
  const rangeMs = max - min;
  const value = rangeMs > 0 ? ((currentTime - min) / rangeMs) * 100 : 0;

  const speedOptions = [1, 2, 4] as const;

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-white/95 p-3 shadow-lg backdrop-blur dark:bg-zinc-900/95">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {formatTimeLabel(currentTime)}
        </span>
        <div className="flex items-center gap-2">
          {onSpeedChange && (
            <div className="flex rounded bg-zinc-200 dark:bg-zinc-700">
              {speedOptions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onSpeedChange(s)}
                  className={`px-2 py-1 text-xs font-medium ${
                    playbackSpeed === s
                      ? "rounded bg-blue-500 text-white dark:bg-blue-600"
                      : "text-zinc-700 hover:bg-zinc-300 dark:text-zinc-300 dark:hover:bg-zinc-600"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          )}
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
      </div>
      <div className="relative h-6 w-full">
        {rangeMs > 0 &&
          peakTimes.map((peakTime) => {
            if (peakTime < min || peakTime > max) return null;
            const pct = ((peakTime - min) / rangeMs) * 100;
            return (
              <div
                key={peakTime}
                className="pointer-events-none absolute top-1/2 h-2 w-0.5 -translate-y-1/2 rounded-full bg-amber-500/90"
                style={{ left: `${pct}%` }}
                title="Peak"
              />
            );
          })}
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
          className="absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-full bg-zinc-200 dark:bg-zinc-700 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
        />
      </div>
    </div>
  );
}
