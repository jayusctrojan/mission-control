"use client";

import { format } from "date-fns";
import type { DailyCost } from "@/hooks/use-cost-data";

export function CostChart({ data }: { data: DailyCost[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-zinc-500 rounded-lg border border-zinc-800">
        No daily cost data yet
      </div>
    );
  }

  const maxCost = Math.max(...data.map((d) => d.costUsd), 0.01);

  return (
    <div className="rounded-lg border border-zinc-800 p-4">
      <div className="flex items-end gap-1 h-48">
        {data.map((day) => {
          const height = Math.max((day.costUsd / maxCost) * 100, 2);
          return (
            <div
              key={day.date}
              className="flex-1 flex flex-col items-center justify-end group relative"
            >
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                <div className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-[11px] text-zinc-200 whitespace-nowrap shadow-lg">
                  <div className="font-medium">{format(new Date(day.date), "MMM d")}</div>
                  <div className="text-zinc-400">${day.costUsd.toFixed(2)}</div>
                </div>
              </div>
              {/* Bar */}
              <div
                className="w-full rounded-t bg-violet-500/70 hover:bg-violet-500 transition-colors min-h-[2px]"
                style={{ height: `${height}%` }}
              />
            </div>
          );
        })}
      </div>
      {/* X-axis labels */}
      <div className="flex gap-1 mt-2">
        {data.map((day, i) => (
          <div key={day.date} className="flex-1 text-center">
            {/* Show label every few bars to avoid crowding */}
            {i % Math.max(1, Math.floor(data.length / 7)) === 0 ? (
              <span className="text-[9px] text-zinc-600">
                {format(new Date(day.date), "M/d")}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
