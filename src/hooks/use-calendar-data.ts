"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isAfter,
  isBefore,
  isWithinInterval,
  addDays,
  eachDayOfInterval,
  isSameDay,
} from "date-fns";
import { supabase } from "@/lib/supabase";
import { useScheduledTasks } from "./use-scheduled-tasks";
import type { Database } from "@/lib/database.types";

type MissionRow = Database["public"]["Tables"]["missions"]["Row"];
type EventRow = Database["public"]["Tables"]["events"]["Row"];

export interface CalendarStats {
  overdue: number;
  dueThisWeek: number;
  completedThisMonth: number;
  tasksToday: number;
  tasksThisWeek: number;
}

export function useCalendarData(month: Date) {
  const [missions, setMissions] = useState<MissionRow[]>([]);
  const [eventCountsByDay, setEventCountsByDay] = useState<
    Record<string, number>
  >({});
  const [loading, setLoading] = useState(true);
  const { getTasksForDay, getTaskCountForDay, loading: tasksLoading } = useScheduledTasks();

  // Compute visible date range (grid might show days from adjacent months)
  // Memoize to avoid creating new Date objects every render
  const { rangeStart, rangeEnd, rangeStartISO, rangeEndISO } = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
    return {
      rangeStart: start,
      rangeEnd: end,
      rangeStartISO: start.toISOString(),
      rangeEndISO: end.toISOString(),
    };
  }, [month.getTime()]);

  // Fetch missions with due_at in range
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function fetchData() {
      try {
        const [missionsRes, eventsRes] = await Promise.all([
          supabase
            .from("missions")
            .select("*")
            .not("due_at", "is", null)
            .gte("due_at", rangeStartISO)
            .lte("due_at", rangeEndISO)
            .order("due_at", { ascending: true }),
          supabase
            .from("events")
            .select("occurred_at")
            .gte("occurred_at", rangeStartISO)
            .lte("occurred_at", rangeEndISO)
            .limit(5000),
        ]);

        if (cancelled) return;

        if (missionsRes.error) {
          console.error("Failed to fetch missions:", missionsRes.error.message);
        }
        if (eventsRes.error) {
          console.error("Failed to fetch events:", eventsRes.error.message);
        }

        if (missionsRes.data) {
          setMissions(missionsRes.data as MissionRow[]);
        }

        // Count events per day (convert to local date to avoid UTC off-by-one near midnight)
        if (eventsRes.data) {
          const counts: Record<string, number> = {};
          for (const e of eventsRes.data) {
            const localDate = new Date(e.occurred_at as string);
            const dayKey = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, "0")}-${String(localDate.getDate()).padStart(2, "0")}`;
            counts[dayKey] = (counts[dayKey] || 0) + 1;
          }
          setEventCountsByDay(counts);
        }
      } catch (err) {
        console.error("Calendar data fetch failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();

    // Subscribe to realtime for mission changes
    const channel = supabase
      .channel("calendar-missions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "missions" },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [rangeStartISO, rangeEndISO]);

  // On-demand fetch events for a specific day
  const fetchEventsForDay = useCallback(
    async (date: Date): Promise<EventRow[]> => {
      try {
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        const { data, error } = await supabase
          .from("events")
          .select("*")
          .gte("occurred_at", dayStart.toISOString())
          .lte("occurred_at", dayEnd.toISOString())
          .order("occurred_at", { ascending: false })
          .limit(50);

        if (error) {
          console.error("Failed to fetch events for day:", error.message);
        }

        return (data as EventRow[]) ?? [];
      } catch (err) {
        console.error("Failed to fetch events for day:", err);
        return [];
      }
    },
    []
  );

  // Compute stats
  const stats = useMemo((): CalendarStats => {
    const now = new Date();
    const weekEnd = addDays(now, 7);
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);

    let overdue = 0;
    let dueThisWeek = 0;
    let completedThisMonth = 0;

    for (const m of missions) {
      if (m.due_at && m.status !== "done" && isBefore(new Date(m.due_at), now)) {
        overdue++;
      }
      if (
        m.due_at &&
        m.status !== "done" &&
        isAfter(new Date(m.due_at), now) &&
        isBefore(new Date(m.due_at), weekEnd)
      ) {
        dueThisWeek++;
      }
      if (
        m.completed_at &&
        isWithinInterval(new Date(m.completed_at), {
          start: monthStart,
          end: monthEnd,
        })
      ) {
        completedThisMonth++;
      }
    }

    // Compute scheduled task stats
    const tasksToday = getTaskCountForDay(now);
    let tasksThisWeek = 0;
    const weekDays = eachDayOfInterval({ start: now, end: addDays(now, 6) });
    for (const d of weekDays) {
      tasksThisWeek += getTaskCountForDay(d);
    }

    return { overdue, dueThisWeek, completedThisMonth, tasksToday, tasksThisWeek };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missions, month.getTime(), getTaskCountForDay]);

  // Get missions for a specific day
  const getMissionsForDay = useCallback(
    (date: Date): MissionRow[] => {
      return missions.filter(
        (m) => m.due_at && isSameDay(new Date(m.due_at), date)
      );
    },
    [missions]
  );

  return {
    missions,
    eventCountsByDay,
    loading: loading || tasksLoading,
    fetchEventsForDay,
    stats,
    getMissionsForDay,
    getTasksForDay,
    getTaskCountForDay,
    rangeStart,
    rangeEnd,
  };
}
