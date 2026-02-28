"use client";

import {
  GraduationCap,
  Users,
  UtensilsCrossed,
  Trophy,
  FileText,
  CalendarDays,
  ClipboardCheck,
} from "lucide-react";
import { DATA_SOURCES, type DataSourceId } from "@/lib/map/config";

interface DataSourceToggleProps {
  activeSources: Set<DataSourceId>;
  onToggle: (sourceId: DataSourceId) => void;
}

const ICONS: Record<string, React.ElementType> = {
  GraduationCap,
  Users,
  UtensilsCrossed,
  Trophy,
  FileText,
  CalendarDays,
  ClipboardCheck,
};

export function DataSourceToggle({ activeSources, onToggle }: DataSourceToggleProps) {
  return (
    <div className="absolute left-4 top-20 z-30 rounded-xl border border-white/10 bg-black/70 p-3 backdrop-blur-xl">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">
        Data Sources
      </h3>
      <div className="space-y-1.5">
        {DATA_SOURCES.map((source) => {
          const Icon = ICONS[source.icon];
          const isActive = activeSources.has(source.id);
          return (
            <button
              key={source.id}
              onClick={() => onToggle(source.id)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left transition-all ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-white/30 hover:bg-white/5 hover:text-white/50"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded transition-all ${
                  isActive ? "opacity-100" : "opacity-40"
                }`}
                style={{ color: isActive ? source.color : undefined }}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
              </span>
              <span className="text-xs font-medium">{source.label}</span>
              <span
                className={`ml-auto h-2 w-2 rounded-full transition-all ${
                  isActive ? "bg-white/80" : "bg-white/10"
                }`}
                style={{
                  backgroundColor: isActive ? source.color : undefined,
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
