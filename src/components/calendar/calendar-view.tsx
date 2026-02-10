"use client";

import { useState, useCallback, useMemo } from "react";
import {
  addMonths,
  subMonths,
  startOfMonth,
  eachDayOfInterval,
  format,
  isSameDay,
} from "date-fns";
import { useCalendarData } from "@/hooks/use-calendar-data";
import { useAgentStatuses } from "@/hooks/use-agent-statuses";
import { CalendarHeader } from "./calendar-header";
import { CalendarDayCell } from "./calendar-day-cell";
import { CalendarDayPanel } from "./calendar-day-panel";
import { CalendarStatsBar } from "./calendar-stats";
import { MissionDetail } from "@/components/kanban/mission-detail";
import type { Database } from "@/lib/database.types";

type MissionRow = Database["public"]["Tables"]["missions"]["Row"];

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarView() {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [detailMission, setDetailMission] = useState<MissionRow | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const {
    eventCountsByDay,
    loading,
    getEventsForDay,
    stats,
    getMissionsForDay,
    getTasksForDay,
    getTaskCountForDay,
    rangeStart,
    rangeEnd,
  } = useCalendarData(month);
  const agentData = useAgentStatuses();

  const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

  const handlePrev = useCallback(
    () => setMonth((m) => subMonths(m, 1)),
    []
  );
  const handleNext = useCallback(
    () => setMonth((m) => addMonths(m, 1)),
    []
  );
  const handleToday = useCallback(() => {
    setMonth(startOfMonth(new Date()));
    setSelectedDate(new Date());
  }, []);

  function handleDayClick(date: Date) {
    setSelectedDate((prev) =>
      prev && isSameDay(prev, date) ? null : date
    );
  }

  function handleMissionClick(mission: MissionRow) {
    setDetailMission(mission);
    setDetailOpen(true);
  }

  // Memoize selected day data to avoid new arrays every render
  const selectedDayMissions = useMemo(
    () => (selectedDate ? getMissionsForDay(selectedDate) : []),
    [selectedDate, getMissionsForDay]
  );
  const selectedDayTasks = useMemo(
    () => (selectedDate ? getTasksForDay(selectedDate) : []),
    [selectedDate, getTasksForDay]
  );
  const selectedDayEvents = useMemo(
    () => (selectedDate ? getEventsForDay(selectedDate) : []),
    [selectedDate, getEventsForDay]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500">
        Loading calendar...
      </div>
    );
  }

  return (
    <div>
      {/* Header + Stats */}
      <div className="flex items-center justify-between mb-3">
        <CalendarHeader
          month={month}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
        />
        <CalendarStatsBar stats={stats} />
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_LABELS.map((day) => (
          <div
            key={day}
            className="text-center text-[11px] font-medium text-zinc-500 py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date) => {
          const dayKey = format(date, "yyyy-MM-dd");
          const dayMissions = getMissionsForDay(date);
          const eventCount = eventCountsByDay[dayKey] || 0;
          const taskCount = getTaskCountForDay(date);
          const isSelected = selectedDate ? isSameDay(selectedDate, date) : false;

          return (
            <CalendarDayCell
              key={dayKey}
              date={date}
              month={month}
              missions={dayMissions}
              eventCount={eventCount}
              taskCount={taskCount}
              isSelected={isSelected}
              onClick={() => handleDayClick(date)}
            />
          );
        })}
      </div>

      {/* Day panel — always rendered to prevent layout shift */}
      <div className="mt-3">
        {selectedDate ? (
          <CalendarDayPanel
            date={selectedDate}
            missions={selectedDayMissions}
            scheduledTasks={selectedDayTasks}
            events={selectedDayEvents}
            onMissionClick={handleMissionClick}
            agentData={agentData}
          />
        ) : (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-center">
            <p className="text-sm text-zinc-600">Click a day to see its schedule</p>
          </div>
        )}
      </div>

      {/* Reuse MissionDetail dialog from kanban */}
      <MissionDetail
        mission={detailMission}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
