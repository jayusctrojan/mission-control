"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Stats {
  agentsOnline: number;
  eventsToday: number;
  errors24h: number;
}

export function useStats(): Stats {
  const [stats, setStats] = useState<Stats>({
    agentsOnline: 0,
    eventsToday: 0,
    errors24h: 0,
  });

  useEffect(() => {
    async function fetch() {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      const [agentsRes, eventsTodayRes, errorsRes] = await Promise.all([
        supabase
          .from("agents")
          .select("id", { count: "exact", head: true })
          .eq("status", "online"),
        supabase
          .from("events")
          .select("id", { count: "exact", head: true })
          .gte("occurred_at", todayStart),
        supabase
          .from("events")
          .select("id", { count: "exact", head: true })
          .in("severity", ["error", "critical"])
          .gte("occurred_at", yesterday),
      ]);

      setStats({
        agentsOnline: agentsRes.count ?? 0,
        eventsToday: eventsTodayRes.count ?? 0,
        errors24h: errorsRes.count ?? 0,
      });
    }

    fetch();
    const interval = setInterval(fetch, 30_000);
    return () => clearInterval(interval);
  }, []);

  return stats;
}
