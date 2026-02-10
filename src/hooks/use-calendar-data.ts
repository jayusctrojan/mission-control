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

type CalendarEvent = Pick<EventRow, "id" | "title" | "occurred_at" | "event_type">;

const EVENTS_PAGE_SIZE = 1000;

export function useCalendarData(month: Date) {
  const [missions, setMissions] = useState<MissionRow[]>([]);
  const [eventCountsByDay, setEventCountsByDay] = useState<
    Record<string, number>
  >({});
  const [eventsByDay, setEventsByDay] = useState<
    Map<string, CalendarEvent[]>
  >(new Map());
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

    async function fetchAllEvents(): Promise<CalendarEvent[]> {
      const allEvents: CalendarEvent[] = [];
      let offset = 0;

      while (true) {
        const { data, error } = await supabase
          .from("events")
          .select("id, title, occurred_at, event_type")
          .gte("occurred_at", rangeStartISO)
          .lte("occurred_at", rangeEndISO)
          .order("occurred_at", { ascending: false })
          .range(offset, offset + EVENTS_PAGE_SIZE - 1);

        if (error) {
          console.error("Failed to fetch events:", error.message);
          break;
        }

        if (!data || data.length === 0) break;
        allEvents.push(...(data as CalendarEvent[]));

        if (data.length < EVENTS_PAGE_SIZE) break;
        offset += EVENTS_PAGE_SIZE;
        console.warn(`Calendar events paginating — fetched ${allEvents.length} so far`);
      }

      return allEvents;
    }

    async function fetchData() {
      try {
        const [missionsRes, allEvents] = await Promise.all([
          supabase
            .from("missions")
            .select("*")
            .not("due_at", "is", null)
            .gte("due_at", rangeStartISO)
            .lte("due_at", rangeEndISO)
            .order("due_at", { ascending: true }),
          fetchAllEvents(),
        ]);

        if (cancelled) return;

        if (missionsRes.error) {
          console.error("Failed to fetch missions:", missionsRes.error.message);
        }

        if (missionsRes.data) {
          setMissions(missionsRes.data as MissionRow[]);
        }

        // Pre-index events by day for O(1) lookups
        const counts: Record<string, number> = {};
        const indexed = new Map<string, CalendarEvent[]>();
        for (const e of allEvents) {
          const localDate = new Date(e.occurred_at as string);
          const dayKey = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, "0")}-${String(localDate.getDate()).padStart(2, "0")}`;
          counts[dayKey] = (counts[dayKey] || 0) + 1;
          const existing = indexed.get(dayKey);
          if (existing) {
            existing.push(e);
          } else {
            indexed.set(dayKey, [e]);
          }
        }
        setEventCountsByDay(counts);
        setEventsByDay(indexed);
      } catch (err) {
        console.error("Calendar data fetch failed:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();

    // Subscribe to realtime for mission and event changes
    const channel = supabase
      .channel("calendar-data")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "missions" },
        () => { fetchData(); }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        () => { fetchData(); }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [rangeStartISO, rangeEndISO]);

  // Get events for a specific day — O(1) lookup from pre-indexed map
  const getEventsForDay = useCallback(
    (date: Date): CalendarEvent[] => {
      const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      return eventsByDay.get(dayKey) || [];
    },
    [eventsByDay]
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
    getEventsForDay,
    stats,
    getMissionsForDay,
    getTasksForDay,
    getTaskCountForDay,
    rangeStart,
    rangeEnd,
  };
}
