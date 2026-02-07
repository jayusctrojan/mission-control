"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Target, Activity, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Database, MissionPriority } from "@/lib/database.types";
import type { ScheduledTaskOccurrence } from "@/hooks/use-scheduled-tasks";

type MissionRow = Database["public"]["Tables"]["missions"]["Row"];
type EventRow = Database["public"]["Tables"]["events"]["Row"];

const PRIORITY_COLORS: Record<MissionPriority, string> = {
  low: "border-zinc-600 text-zinc-400",
  medium: "border-blue-600 text-blue-400",
  high: "border-amber-600 text-amber-400",
  critical: "border-red-600 text-red-400",
};

interface CalendarDayPanelProps {
  date: Date;
  missions: MissionRow[];
  scheduledTasks: ScheduledTaskOccurrence[];
  fetchEventsForDay: (date: Date) => Promise<EventRow[]>;
  onMissionClick: (mission: MissionRow) => void;
}

export function CalendarDayPanel({
  date,
  missions,
  scheduledTasks,
  fetchEventsForDay,
  onMissionClick,
}: CalendarDayPanelProps) {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    setLoadingEvents(true);
    fetchEventsForDay(date)
      .then((data) => {
        setEvents(data);
      })
      .catch(() => {
        setEvents([]);
      })
      .finally(() => {
        setLoadingEvents(false);
      });
  }, [date, fetchEventsForDay]);

  return (
    <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
      <h4 className="text-sm font-medium text-zinc-200 mb-3">
        {format(date, "EEEE, MMMM d, yyyy")}
      </h4>

      {/* Scheduled tasks */}
      {scheduledTasks.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-3.5 w-3.5 text-violet-400" />
            <span className="text-xs font-medium text-violet-400 uppercase tracking-wider">
              Scheduled Tasks ({scheduledTasks.length})
            </span>
          </div>
          <div className="space-y-1">
            {scheduledTasks.map((occ, i) => (
              <div
                key={`${occ.task.id}-${i}`}
                className="flex items-center gap-2 rounded-md px-3 py-1.5 text-[12px]"
              >
                <span className="text-violet-400 shrink-0 w-10 font-mono">
                  {occ.runCount > 1 ? "" : occ.time}
                </span>
                <span className="text-zinc-200 truncate flex-1">
                  {occ.task.name}
                  {occ.runCount > 1 && (
                    <span className="text-violet-400/70 ml-1">
                      — {occ.runCount} runs ({occ.cronDescription})
                    </span>
                  )}
                </span>
                {occ.task.agent_id && (
                  <Badge
                    variant="outline"
                    className="text-[9px] border-violet-600/40 text-violet-400 shrink-0"
                  >
                    {occ.task.agent_id}
                  </Badge>
                )}
                {occ.runCount <= 1 && (
                  <span className="text-[10px] text-zinc-600 shrink-0">
                    {occ.cronDescription}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {scheduledTasks.length > 0 && <Separator className="bg-zinc-800 my-3" />}

      {/* Missions due this day */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-3.5 w-3.5 text-zinc-500" />
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Missions Due ({missions.length})
          </span>
        </div>
        {missions.length === 0 ? (
          <p className="text-xs text-zinc-600 pl-5">No missions due</p>
        ) : (
          <div className="space-y-1.5">
            {missions.map((m) => (
              <button
                key={m.id}
                onClick={() => onMissionClick(m)}
                className="w-full text-left flex items-center gap-2 rounded-md px-3 py-2 hover:bg-zinc-800/50 transition-colors"
              >
                <Badge
                  variant="outline"
                  className={`text-[10px] shrink-0 ${PRIORITY_COLORS[m.priority as MissionPriority]}`}
                >
                  {m.priority}
                </Badge>
                <span className="text-[13px] text-zinc-200 truncate flex-1">
                  {m.title}
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] border-zinc-700 text-zinc-500"
                >
                  {m.status}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </div>

      <Separator className="bg-zinc-800 my-3" />

      {/* Events on this day */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Activity className="h-3.5 w-3.5 text-zinc-500" />
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Events ({loadingEvents ? "..." : events.length})
          </span>
        </div>
        {loadingEvents ? (
          <p className="text-xs text-zinc-600 pl-5">Loading events...</p>
        ) : events.length === 0 ? (
          <p className="text-xs text-zinc-600 pl-5">No events</p>
        ) : (
          <ScrollArea className="max-h-[200px]">
            <div className="space-y-1">
              {events.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center gap-2 rounded-md px-3 py-1.5 text-[12px]"
                >
                  <span className="text-zinc-500 shrink-0">
                    {format(new Date(e.occurred_at), "HH:mm")}
                  </span>
                  <span className="text-zinc-300 truncate">{e.title}</span>
                  <Badge
                    variant="outline"
                    className="text-[9px] border-zinc-700 text-zinc-600 ml-auto shrink-0"
                  >
                    {e.event_type}
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
