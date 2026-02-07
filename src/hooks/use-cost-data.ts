"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { startOfDay, subDays, format } from "date-fns";
import type { Database, CostProvider } from "@/lib/database.types";

type CostEventRow = Database["public"]["Tables"]["cost_events"]["Row"];

export type TimeRange = "7d" | "30d" | "90d";

export interface CostByAgent {
  agentId: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export interface CostByModel {
  provider: CostProvider;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export interface DailyCost {
  date: string; // YYYY-MM-DD
  costUsd: number;
}

const RANGE_DAYS: Record<TimeRange, number> = { "7d": 7, "30d": 30, "90d": 90 };

export function useCostData(range: TimeRange) {
  const [events, setEvents] = useState<CostEventRow[]>([]);
  const [loading, setLoading] = useState(true);

  const since = useMemo(
    () => startOfDay(subDays(new Date(), RANGE_DAYS[range])).toISOString(),
    [range]
  );

  const fetchCosts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("cost_events")
      .select("*")
      .gte("occurred_at", since)
      .order("occurred_at", { ascending: false });

    if (data) setEvents(data as CostEventRow[]);
    setLoading(false);
  }, [since]);

  useEffect(() => {
    fetchCosts();

    const channel = supabase
      .channel("cost-events-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "cost_events" },
        (payload) => {
          const row = payload.new as CostEventRow;
          if (row.occurred_at >= since) {
            setEvents((prev) => [row, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCosts, since]);

  // Aggregations
  const today = startOfDay(new Date()).toISOString();
  const weekAgo = startOfDay(subDays(new Date(), 7)).toISOString();
  const monthAgo = startOfDay(subDays(new Date(), 30)).toISOString();

  const todayTotal = events
    .filter((e) => e.occurred_at >= today)
    .reduce((sum, e) => sum + Number(e.cost_usd), 0);

  const weekTotal = events
    .filter((e) => e.occurred_at >= weekAgo)
    .reduce((sum, e) => sum + Number(e.cost_usd), 0);

  const monthTotal = events
    .filter((e) => e.occurred_at >= monthAgo)
    .reduce((sum, e) => sum + Number(e.cost_usd), 0);

  const byAgent: CostByAgent[] = useMemo(() => {
    const map = new Map<string, CostByAgent>();
    for (const e of events) {
      if (!e.agent_id) continue;
      const existing = map.get(e.agent_id) ?? {
        agentId: e.agent_id,
        inputTokens: 0,
        outputTokens: 0,
        costUsd: 0,
      };
      existing.inputTokens += e.input_tokens;
      existing.outputTokens += e.output_tokens;
      existing.costUsd += Number(e.cost_usd);
      map.set(e.agent_id, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.costUsd - a.costUsd);
  }, [events]);

  const byModel: CostByModel[] = useMemo(() => {
    const map = new Map<string, CostByModel>();
    for (const e of events) {
      const key = `${e.provider}:${e.model}`;
      const existing = map.get(key) ?? {
        provider: e.provider as CostProvider,
        model: e.model,
        inputTokens: 0,
        outputTokens: 0,
        costUsd: 0,
      };
      existing.inputTokens += e.input_tokens;
      existing.outputTokens += e.output_tokens;
      existing.costUsd += Number(e.cost_usd);
      map.set(key, existing);
    }
    return Array.from(map.values()).sort((a, b) => b.costUsd - a.costUsd);
  }, [events]);

  const dailyCosts: DailyCost[] = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of events) {
      const date = format(new Date(e.occurred_at), "yyyy-MM-dd");
      map.set(date, (map.get(date) ?? 0) + Number(e.cost_usd));
    }
    return Array.from(map.entries())
      .map(([date, costUsd]) => ({ date, costUsd }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [events]);

  return {
    events,
    loading,
    todayTotal,
    weekTotal,
    monthTotal,
    byAgent,
    byModel,
    dailyCosts,
  };
}
