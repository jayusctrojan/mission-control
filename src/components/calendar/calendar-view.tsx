"use client";

import { useState, useCallback } from "react";
import {
  addMonths,
  subMonths,
  startOfMonth,
  eachDayOfInterval,
  format,
  isSameDay,
} from "date-fns";
import { useCalendarData } from "@/hooks/use-calendar-data";
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
    fetchEventsForDay,
    stats,
    getMissionsForDay,
    rangeStart,
    rangeEnd,
  } = useCalendarData(month);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500">
        Loading calendar...
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
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
          const isSelected = selectedDate ? isSameDay(selectedDate, date) : false;

          return (
            <CalendarDayCell
              key={dayKey}
              date={date}
              month={month}
              missions={dayMissions}
              eventCount={eventCount}
              isSelected={isSelected}
              onClick={() => handleDayClick(date)}
            />
          );
        })}
      </div>

      {/* Day panel */}
      {selectedDate && (
        <CalendarDayPanel
          date={selectedDate}
          missions={getMissionsForDay(selectedDate)}
          fetchEventsForDay={fetchEventsForDay}
          onMissionClick={handleMissionClick}
        />
      )}

      {/* Reuse MissionDetail dialog from kanban */}
      <MissionDetail
        mission={detailMission}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
