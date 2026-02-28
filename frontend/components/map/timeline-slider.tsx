"use client";

import { useCallback, useMemo } from "react";
import { Play, Pause, SkipForward, SkipBack } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import type { DayOfWeek } from "@/lib/map/config";
import { DAYS_OF_WEEK } from "@/lib/map/config";

interface TimelineSliderProps {
  currentIndex: number;
  onIndexChange: (index: number) => void;
  isPlaying: boolean;
  onPlayToggle: () => void;
  playSpeed: number;
  onSpeedChange: (speed: number) => void;
  day: DayOfWeek;
  onDayChange: (day: DayOfWeek) => void;
  timeLabel: string;
}

export function TimelineSlider({
  currentIndex,
  onIndexChange,
  isPlaying,
  onPlayToggle,
  playSpeed,
  onSpeedChange,
  day,
  onDayChange,
  timeLabel,
}: TimelineSliderProps) {
  const skipBack = useCallback(() => {
    onIndexChange(Math.max(0, currentIndex - 2));
  }, [currentIndex, onIndexChange]);

  const skipForward = useCallback(() => {
    onIndexChange(Math.min(47, currentIndex + 2));
  }, [currentIndex, onIndexChange]);

  const dayShort = useMemo(
    () =>
      DAYS_OF_WEEK.map((d) => ({
        full: d,
        short: d.slice(0, 3),
      })),
    []
  );

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30">
      <div className="mx-4 mb-4 rounded-xl border border-white/10 bg-black/70 px-5 py-4 backdrop-blur-xl">
        {/* Day selector */}
        <div className="mb-3 flex items-center gap-1">
          {dayShort.map(({ full, short }) => (
            <button
              key={full}
              onClick={() => onDayChange(full as DayOfWeek)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                day === full
                  ? "bg-[#D00000] text-white"
                  : "text-white/50 hover:bg-white/10 hover:text-white/80"
              }`}
            >
              {short}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            {[1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                className={`rounded-md px-2 py-1 text-xs font-mono transition-all ${
                  playSpeed === s
                    ? "bg-white/20 text-white"
                    : "text-white/40 hover:text-white/70"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Timeline control row */}
        <div className="flex items-center gap-4">
          {/* Play controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={skipBack}
              className="rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Skip back"
            >
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              onClick={onPlayToggle}
              className="rounded-lg bg-[#D00000] p-2 text-white transition-all hover:bg-[#B00000]"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={skipForward}
              className="rounded-lg p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Skip forward"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>

          {/* Time label */}
          <span className="min-w-[80px] text-center font-mono text-sm font-semibold text-white">
            {timeLabel}
          </span>

          {/* Slider */}
          <div className="flex-1">
            <Slider
              value={[currentIndex]}
              onValueChange={([v]) => onIndexChange(v)}
              max={47}
              min={0}
              step={1}
              className="cursor-pointer"
            />
          </div>

          {/* Time markers */}
          <div className="hidden items-center gap-3 text-[10px] text-white/40 lg:flex">
            <span>12AM</span>
            <span>6AM</span>
            <span>12PM</span>
            <span>6PM</span>
            <span>12AM</span>
          </div>
        </div>
      </div>
    </div>
  );
}
