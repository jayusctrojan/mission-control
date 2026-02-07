"use client";

import type { CalendarStats } from "@/hooks/use-calendar-data";

interface CalendarStatsBarProps {
  stats: CalendarStats;
}

export function CalendarStatsBar({ stats }: CalendarStatsBarProps) {
  return (
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-red-500" />
        <span className="text-xs text-zinc-400">
          <span className="font-medium text-zinc-200">{stats.overdue}</span>{" "}
          overdue
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-amber-500" />
        <span className="text-xs text-zinc-400">
          <span className="font-medium text-zinc-200">{stats.dueThisWeek}</span>{" "}
          due this week
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-emerald-500" />
        <span className="text-xs text-zinc-400">
          <span className="font-medium text-zinc-200">
            {stats.completedThisMonth}
          </span>{" "}
          completed
        </span>
      </div>
    </div>
  );
}
