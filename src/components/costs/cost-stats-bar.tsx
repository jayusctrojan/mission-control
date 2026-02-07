"use client";

import { DollarSign, TrendingUp, Calendar } from "lucide-react";

interface CostStatsBarProps {
  todayTotal: number;
  weekTotal: number;
  monthTotal: number;
}

function fmt(n: number): string {
  return n < 0.01 && n > 0 ? "<$0.01" : `$${n.toFixed(2)}`;
}

export function CostStatsBar({ todayTotal, weekTotal, monthTotal }: CostStatsBarProps) {
  const items = [
    { label: "Today", value: fmt(todayTotal), icon: DollarSign, color: "text-emerald-400" },
    { label: "This Week", value: fmt(weekTotal), icon: TrendingUp, color: "text-blue-400" },
    { label: "This Month", value: fmt(monthTotal), icon: Calendar, color: "text-violet-400" },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3"
        >
          <item.icon className={`h-5 w-5 ${item.color}`} />
          <div>
            <div className="text-xl font-semibold text-zinc-100 tabular-nums">
              {item.value}
            </div>
            <div className="text-xs text-zinc-500">{item.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
