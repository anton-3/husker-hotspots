"use client";

import { useCallback, useMemo } from "react";
import { Play, Pause, SkipForward, SkipBack } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import type { DayOfWeek } from "@/lib/map/config";
import { DAYS_OF_WEEK } from "@/lib/map/config";
import { useIsMobile } from "@/hooks/use-mobile";

interface TimelineSliderProps {
  currentIndex: number; // Can be decimal for smooth play animation
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
    onIndexChange(Math.max(0, Math.floor(currentIndex) - 1));
  }, [currentIndex, onIndexChange]);

  const skipForward = useCallback(() => {
    onIndexChange(Math.min(95, Math.floor(currentIndex) + 1));
  }, [currentIndex, onIndexChange]);

  const isMobile = useIsMobile();
  const dayShort = useMemo(
    () =>
      DAYS_OF_WEEK.map((d) => ({
        full: d,
        short: isMobile ? d[0]! : d.slice(0, 3),
      })),
    [isMobile]
  );

  return (
    <div className="w-full pb-[env(safe-area-inset-bottom)] pt-2">
      <div className="mx-4 mb-2 rounded-xl border border-white/10 bg-black/70 px-3 py-3 backdrop-blur-xl sm:mx-4 sm:mb-4 sm:px-5 sm:py-4">
        {/* Day selector: single letter on mobile so 1x 2x 4x stay visible */}
        <div className="mb-3 flex flex-nowrap items-center gap-1 min-w-0">
          <div className="flex flex-nowrap items-center gap-0.5 min-w-0 flex-1 overflow-hidden">
            {dayShort.map(({ full, short }) => (
              <button
                key={full}
                onClick={() => onDayChange(full as DayOfWeek)}
                className={`min-h-[44px] min-w-[44px] rounded-md px-2 py-2 text-xs font-medium transition-all touch-manipulation sm:min-h-0 sm:min-w-0 sm:px-2.5 sm:py-1 ${
                  day === full
                    ? "bg-[#D00000] text-white"
                    : "text-white/50 hover:bg-white/10 hover:text-white/80"
                }`}
              >
                {short}
              </button>
            ))}
          </div>
          <div className="ml-auto flex flex-shrink-0 items-center gap-1">
            {[1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                className={`min-h-[44px] min-w-[44px] rounded-md px-2 py-2 text-xs font-mono transition-all touch-manipulation sm:min-h-0 sm:min-w-0 sm:px-2 sm:py-1 ${
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
        <div className="flex flex-nowrap items-center gap-2 min-w-0 sm:gap-4">
          {/* Play controls */}
          <div className="flex flex-shrink-0 items-center gap-0.5">
            <button
              onClick={skipBack}
              className="rounded-lg p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-white/60 transition-colors hover:bg-white/10 hover:text-white touch-manipulation sm:min-h-0 sm:min-w-0 sm:p-1.5"
              aria-label="Skip back"
            >
              <SkipBack className="h-4 w-4" />
            </button>
            <button
              onClick={onPlayToggle}
              className="rounded-lg bg-[#D00000] p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-white transition-all hover:bg-[#B00000] touch-manipulation sm:min-h-0 sm:min-w-0"
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
              className="rounded-lg p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-white/60 transition-colors hover:bg-white/10 hover:text-white touch-manipulation sm:min-h-0 sm:min-w-0 sm:p-1.5"
              aria-label="Skip forward"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>

          {/* Time label */}
          <span className="flex-shrink-0 min-w-[70px] text-center font-mono text-sm font-semibold text-white sm:min-w-[80px]">
            {timeLabel}
          </span>

          {/* Slider */}
          <div className="flex-1 min-w-0">
            <Slider
              value={[currentIndex]}
              onValueChange={([v]) => onIndexChange(v)}
              max={95}
              min={0}
              step={0.01}
              className="cursor-pointer touch-manipulation [&_[data-slot=slider-thumb]]:h-6 [&_[data-slot=slider-thumb]]:w-6 [&_[data-slot=slider-thumb]]:sm:h-4 [&_[data-slot=slider-thumb]]:sm:w-4"
            />
          </div>

          {/* Time markers */}
          <div className="hidden flex-shrink-0 items-center gap-3 text-[10px] text-white/40 lg:flex">
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
