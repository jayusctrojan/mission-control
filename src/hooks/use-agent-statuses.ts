"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { AgentStatus } from "@/lib/database.types";

export interface AgentData {
  status: AgentStatus;
  avatarUrl: string | null;
}

type AgentDataMap = Record<string, AgentData>;

export function useAgentStatuses(): AgentDataMap {
  const [data, setData] = useState<AgentDataMap>({});

  useEffect(() => {
    // Initial fetch
    supabase
      .from("agents")
      .select("id, status, avatar_url")
      .then(({ data: rows }) => {
        if (rows) {
          const map: AgentDataMap = {};
          for (const row of rows as { id: string; status: string; avatar_url: string | null }[]) {
            map[row.id] = { status: row.status as AgentStatus, avatarUrl: row.avatar_url };
          }
          setData(map);
        }
      });

    // Subscribe to realtime changes
    const channel = supabase
      .channel("agents-status")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "agents" },
        (payload) => {
          const { id, status, avatar_url } = payload.new as {
            id: string;
            status: AgentStatus;
            avatar_url: string | null;
          };
          setData((prev) => ({
            ...prev,
            [id]: { status, avatarUrl: avatar_url },
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return data;
}
