"use client";

import { format, isToday, isSameMonth } from "date-fns";
import { cn } from "@/lib/utils";
import type { Database, MissionPriority } from "@/lib/database.types";

type MissionRow = Database["public"]["Tables"]["missions"]["Row"];

const PRIORITY_DOT_COLORS: Record<MissionPriority, string> = {
  low: "bg-zinc-500",
  medium: "bg-blue-500",
  high: "bg-amber-500",
  critical: "bg-red-500",
};

interface CalendarDayCellProps {
  date: Date;
  month: Date;
  missions: MissionRow[];
  eventCount: number;
  taskCount: number;
  isSelected: boolean;
  onClick: () => void;
}

export function CalendarDayCell({
  date,
  month,
  missions,
  eventCount,
  taskCount,
  isSelected,
  onClick,
}: CalendarDayCellProps) {
  const inCurrentMonth = isSameMonth(date, month);
  const today = isToday(date);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      className={cn(
        "h-16 p-1.5 text-left border border-zinc-800/50 rounded-md transition-colors relative cursor-pointer select-none active:scale-95 active:bg-zinc-700/50",
        inCurrentMonth ? "bg-zinc-900/30" : "bg-zinc-950/50 opacity-40",
        today && "ring-1 ring-violet-500",
        isSelected && "border-violet-500 bg-violet-500/10",
        !isSelected && inCurrentMonth && "hover:bg-zinc-800/30"
      )}
    >
      <span
        className={cn(
          "text-xs font-medium",
          today ? "text-violet-400" : inCurrentMonth ? "text-zinc-300" : "text-zinc-600"
        )}
      >
        {format(date, "d")}
      </span>

      {/* Scheduled tasks badge */}
      {taskCount > 0 && (
        <div className="mt-1">
          <span className="text-[9px] font-medium text-violet-300 bg-violet-500/15 rounded px-1 py-0.5">
            {taskCount} {taskCount === 1 ? "task" : "tasks"}
          </span>
        </div>
      )}

      {/* Mission dots */}
      {missions.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {missions.slice(0, 4).map((m) => (
            <div
              key={m.id}
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                PRIORITY_DOT_COLORS[m.priority as MissionPriority]
              )}
              title={m.title}
            />
          ))}
          {missions.length > 4 && (
            <span className="text-[9px] text-zinc-500">
              +{missions.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Event count badge */}
      {eventCount > 0 && (
        <div className="absolute bottom-1 right-1.5">
          <span className="text-[9px] text-zinc-500 bg-zinc-800 rounded px-1 py-0.5">
            {eventCount > 99 ? "99+" : eventCount}
          </span>
        </div>
      )}
    </div>
  );
}
