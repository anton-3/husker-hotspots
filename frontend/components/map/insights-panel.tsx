"use client";

import {
  AlertTriangle,
  TrendingUp,
  Lightbulb,
  Activity,
  X,
  ChevronRight,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Insight } from "@/lib/map/mock-data";

interface InsightsPanelProps {
  insights: Insight[];
  isOpen: boolean;
  onToggle: () => void;
  onInsightClick: (buildingId: string) => void;
}

const SEVERITY_STYLES = {
  low: "border-emerald-500/30 bg-emerald-500/10",
  medium: "border-amber-500/30 bg-amber-500/10",
  high: "border-orange-500/30 bg-orange-500/10",
  critical: "border-red-500/30 bg-red-500/10",
};

const SEVERITY_DOT = {
  low: "bg-emerald-400",
  medium: "bg-amber-400",
  high: "bg-orange-400",
  critical: "bg-red-400",
};

const TYPE_ICONS = {
  alert: AlertTriangle,
  prediction: TrendingUp,
  recommendation: Lightbulb,
  status: Activity,
};

const TYPE_LABELS = {
  alert: "Alert",
  prediction: "Prediction",
  recommendation: "Suggestion",
  status: "Status",
};

export function InsightsPanel({
  insights,
  isOpen,
  onToggle,
  onInsightClick,
}: InsightsPanelProps) {
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="absolute right-4 top-20 z-30 flex items-center gap-2 rounded-xl border border-white/10 bg-black/70 px-3 py-2.5 backdrop-blur-xl transition-all hover:bg-black/80"
      >
        <Activity className="h-4 w-4 text-[#D00000]" />
        <span className="text-sm font-medium text-white">Insights</span>
        {insights.filter((i) => i.severity === "critical").length > 0 && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {insights.filter((i) => i.severity === "critical").length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="absolute right-4 top-20 z-30 w-80 rounded-xl border border-white/10 bg-black/70 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#D00000]" />
          <h3 className="text-sm font-semibold text-white">Live Insights</h3>
        </div>
        <button
          onClick={onToggle}
          className="rounded-lg p-1 text-white/50 hover:bg-white/10 hover:text-white"
          aria-label="Close insights"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Insights list */}
      <ScrollArea className="max-h-[calc(100vh-240px)]">
        <div className="space-y-2 p-3">
          {insights.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/40">
              No notable activity at this time.
            </p>
          ) : (
            insights.map((insight) => {
              const Icon = TYPE_ICONS[insight.type];
              return (
                <button
                  key={insight.id}
                  onClick={() => insight.buildingId && onInsightClick(insight.buildingId)}
                  className={`w-full rounded-lg border p-3 text-left transition-all hover:brightness-125 ${SEVERITY_STYLES[insight.severity]}`}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${SEVERITY_DOT[insight.severity]}`} />
                    <Icon className="h-3.5 w-3.5 text-white/70" />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-white/50">
                      {TYPE_LABELS[insight.type]}
                    </span>
                    {insight.buildingId && (
                      <ChevronRight className="ml-auto h-3 w-3 text-white/30" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-white/90">
                    {insight.title}
                  </p>
                  <p className="mt-0.5 text-xs text-white/50">
                    {insight.description}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
