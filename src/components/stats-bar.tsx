"use client";

import { Bot, Activity, AlertTriangle } from "lucide-react";
import { useStats } from "@/hooks/use-stats";

export function StatsBar() {
  const { agentsOnline, eventsToday, errors24h } = useStats();

  const items = [
    { label: "Agents Online", value: agentsOnline, icon: Bot, color: "text-emerald-400" },
    { label: "Events Today", value: eventsToday, icon: Activity, color: "text-blue-400" },
    { label: "Errors (24h)", value: errors24h, icon: AlertTriangle, color: errors24h > 0 ? "text-red-400" : "text-zinc-400" },
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
