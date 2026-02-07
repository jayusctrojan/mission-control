"use client";

import { useState } from "react";
import { useCostData, type TimeRange } from "@/hooks/use-cost-data";
import { CostStatsBar } from "@/components/costs/cost-stats-bar";
import { CostByAgentTable } from "@/components/costs/cost-by-agent";
import { CostByModelTable } from "@/components/costs/cost-by-model";
import { CostChart } from "@/components/costs/cost-chart";
import { cn } from "@/lib/utils";

const RANGES: { value: TimeRange; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
];

export default function CostsPage() {
  const [range, setRange] = useState<TimeRange>("30d");
  const { loading, todayTotal, weekTotal, monthTotal, byAgent, byModel, dailyCosts } =
    useCostData(range);

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Costs</h2>
          <p className="text-sm text-zinc-500 mt-0.5">
            Token usage and spend across agents and models
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/50 p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                range === r.value
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-zinc-500">
          Loading cost data...
        </div>
      ) : (
        <>
          <CostStatsBar
            todayTotal={todayTotal}
            weekTotal={weekTotal}
            monthTotal={monthTotal}
          />

          <div>
            <h3 className="text-sm font-medium text-zinc-400 mb-3">
              Daily Spend
            </h3>
            <CostChart data={dailyCosts} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-3">
                By Agent
              </h3>
              <CostByAgentTable data={byAgent} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-3">
                By Model
              </h3>
              <CostByModelTable data={byModel} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
