"use client";

import { useEffect, useState, useCallback } from "react";
import { Cron } from "croner";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type ScheduledTaskRow = Database["public"]["Tables"]["scheduled_tasks"]["Row"];

export interface ScheduledTaskOccurrence {
  task: ScheduledTaskRow;
  time: string; // HH:mm display time
  runCount: number; // 1 for normal tasks, N for high-frequency
  cronDescription: string; // human-readable schedule
}

function describeCron(expr: string): string {
  const parts = expr.split(" ");
  if (parts.length !== 5) return expr;
  const [min, hour, dom, , dow] = parts;

  // Every N minutes
  if (min.startsWith("*/")) {
    const interval = parseInt(min.slice(2), 10);
    return `every ${interval} min`;
  }
  // Specific day of week
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  if (dow !== "*") {
    const dayIdx = parseInt(dow, 10);
    const dayName = dayNames[dayIdx] || dow;
    return `${dayName}s at ${hour.padStart(2, "0")}:${min.padStart(2, "0")}`;
  }
  // Specific day of month
  if (dom !== "*") {
    const suffix = dom === "1" || dom === "21" || dom === "31" ? "st" :
                   dom === "2" || dom === "22" ? "nd" :
                   dom === "3" || dom === "23" ? "rd" : "th";
    return `${dom}${suffix} of month at ${hour.padStart(2, "0")}:${min.padStart(2, "0")}`;
  }
  // Daily — guard against wildcards/steps in hour or min
  if (!/^\d+$/.test(hour) || !/^\d+$/.test(min)) return expr;
  return `daily at ${hour.padStart(2, "0")}:${min.padStart(2, "0")}`;
}

function getOccurrencesForDay(task: ScheduledTaskRow, date: Date): Date[] {
  try {
    const cron = new Cron(task.schedule_expr, { timezone: task.schedule_tz });
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const occurrences: Date[] = [];
    // Get enough future runs to cover this day (max 200 for high-frequency)
    const runs = cron.nextRuns(200, dayStart);
    for (const run of runs) {
      if (run > dayEnd) break;
      occurrences.push(run);
    }
    return occurrences;
  } catch {
    return [];
  }
}

export function useScheduledTasks() {
  const [tasks, setTasks] = useState<ScheduledTaskRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchTasks() {
      try {
        const { data, error } = await supabase
          .from("scheduled_tasks")
          .select("*")
          .eq("enabled", true)
          .order("name");

        if (cancelled) return;
        if (error) {
          console.error("Failed to fetch scheduled tasks:", error.message);
        }
        setTasks((data as ScheduledTaskRow[]) ?? []);
      } catch (err) {
        console.error("Failed to fetch scheduled tasks:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTasks();

    const channel = supabase
      .channel("scheduled-tasks")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scheduled_tasks" },
        () => { fetchTasks(); }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  const getTasksForDay = useCallback(
    (date: Date): ScheduledTaskOccurrence[] => {
      const result: ScheduledTaskOccurrence[] = [];

      for (const task of tasks) {
        const occurrences = getOccurrencesForDay(task, date);
        if (occurrences.length === 0) continue;

        const description = describeCron(task.schedule_expr);

        // High-frequency tasks (more than 4 runs/day) get grouped
        if (occurrences.length > 4) {
          result.push({
            task,
            time: "", // no single time for grouped
            runCount: occurrences.length,
            cronDescription: description,
          });
        } else {
          for (const occ of occurrences) {
            result.push({
              task,
              time: `${String(occ.getHours()).padStart(2, "0")}:${String(occ.getMinutes()).padStart(2, "0")}`,
              runCount: 1,
              cronDescription: description,
            });
          }
        }
      }

      // Sort: single occurrences by time first, grouped at end
      result.sort((a, b) => {
        if (a.runCount > 1 && b.runCount <= 1) return 1;
        if (a.runCount <= 1 && b.runCount > 1) return -1;
        return a.time.localeCompare(b.time);
      });

      return result;
    },
    [tasks]
  );

  const getTaskCountForDay = useCallback(
    (date: Date): number => {
      let count = 0;
      for (const task of tasks) {
        const occurrences = getOccurrencesForDay(task, date);
        if (occurrences.length > 0) count++;
      }
      return count;
    },
    [tasks]
  );

  return { tasks, loading, getTasksForDay, getTaskCountForDay };
}
