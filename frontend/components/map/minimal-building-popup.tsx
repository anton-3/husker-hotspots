"use client";

import { X } from "lucide-react";

interface MinimalBuildingPopupProps {
  building: { id: string; name: string; address?: string };
  onClose: () => void;
}

export function MinimalBuildingPopup({ building, onClose }: MinimalBuildingPopupProps) {
  return (
    <div className="absolute bottom-28 right-4 z-40 w-80 animate-in slide-in-from-right-4 fade-in duration-300 lg:bottom-[11rem] lg:right-[340px]">
      <div className="rounded-xl border border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="flex items-start justify-between border-b border-white/10 p-4">
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white text-balance">
              {building.name}
            </h2>
            <p className="mt-1 text-xs text-white/50 font-mono">{building.id}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4">
          {building.address ? (
            <p className="text-sm text-white/60">{building.address}</p>
          ) : (
            <p className="text-sm text-white/60">
              No data for this building yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
