"use client";

export function Legend() {
  return (
    <div className="absolute bottom-28 left-4 z-30 rounded-xl border border-white/10 bg-black/70 px-4 py-3 backdrop-blur-xl">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">
        Activity Level
      </h3>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-white/60">Low</span>
        <div
          className="h-3 w-36 rounded-full"
          style={{
            background:
              "linear-gradient(to right, #22c55e, #84cc16, #eab308, #f97316, #ef4444, #dc2626)",
          }}
        />
        <span className="text-[10px] text-white/60">High</span>
      </div>
      <div className="mt-2 flex gap-3">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-[10px] text-white/40">{"<"}25%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-yellow-400" />
          <span className="text-[10px] text-white/40">25-50%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-orange-400" />
          <span className="text-[10px] text-white/40">50-75%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-400" />
          <span className="text-[10px] text-white/40">{">"}75%</span>
        </div>
      </div>
    </div>
  );
}
