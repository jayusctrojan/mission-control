"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { AgentStatus } from "@/lib/database.types";

type StatusMap = Record<string, AgentStatus>;

export function useAgentStatuses(): StatusMap {
  const [statuses, setStatuses] = useState<StatusMap>({});

  useEffect(() => {
    // Initial fetch
    supabase
      .from("agents")
      .select("id, status")
      .then(({ data }) => {
        if (data) {
          const map: StatusMap = {};
          for (const row of data as { id: string; status: string }[]) {
            map[row.id] = row.status as AgentStatus;
          }
          setStatuses(map);
        }
      });

    // Subscribe to realtime changes
    const channel = supabase
      .channel("agents-status")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "agents" },
        (payload) => {
          const { id, status } = payload.new as { id: string; status: AgentStatus };
          setStatuses((prev) => ({ ...prev, [id]: status }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return statuses;
}
