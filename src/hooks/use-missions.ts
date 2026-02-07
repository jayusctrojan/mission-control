"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";

type MissionRow = Database["public"]["Tables"]["missions"]["Row"];

export function useMissions() {
  const [missions, setMissions] = useState<MissionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMissions = useCallback(async () => {
    const { data } = await supabase
      .from("missions")
      .select("*")
      .order("sort_order", { ascending: true });

    if (data) {
      setMissions(data as MissionRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMissions();

    const channel = supabase
      .channel("missions-board")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "missions" },
        (payload) => {
          const newMission = payload.new as MissionRow;
          setMissions((prev) => [...prev, newMission]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "missions" },
        (payload) => {
          const updated = payload.new as MissionRow;
          setMissions((prev) =>
            prev.map((m) => (m.id === updated.id ? updated : m))
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "missions" },
        (payload) => {
          const deleted = payload.old as { id: string };
          setMissions((prev) => prev.filter((m) => m.id !== deleted.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMissions]);

  return { missions, setMissions, loading };
}
