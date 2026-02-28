"use client";

import type { Building } from "@/lib/mockData/types";

export interface BuildingDetailProps {
  building: Building | null;
  onClose?: () => void;
}

export function BuildingDetail({ building, onClose }: BuildingDetailProps) {
  if (!building) return null;

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-white/95 p-4 shadow-lg backdrop-blur dark:bg-zinc-900/95">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
            {building.name}
          </h3>
          {building.address && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {building.address}
            </p>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
            aria-label="Close"
          >
            <span className="text-lg leading-none">×</span>
          </button>
        )}
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Real-time insights (e.g. occupancy, wait times) will appear here when
        data sources are connected.
      </p>
    </div>
  );
}
