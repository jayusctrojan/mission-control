"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useNotifications, shouldNotify } from "@/hooks/use-notifications";
import { getAgent } from "@/lib/agents";
import type { Database, EventType, EventSeverity } from "@/lib/database.types";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

export function useNotificationTrigger() {
  const { prefs } = useNotifications();

  useEffect(() => {
    if (!prefs.enabled) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const channel = supabase
      .channel("notification-trigger")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "events" },
        (payload) => {
          const event = payload.new as EventRow;

          if (!shouldNotify(prefs, event.event_type as EventType, event.severity as EventSeverity)) {
            return;
          }

          const agent = event.agent_id ? getAgent(event.agent_id) : null;
          const tag = `mc-event-${event.id}`;

          new Notification(event.title, {
            body: [agent?.name, event.detail].filter(Boolean).join(" - ") || undefined,
            tag,
            icon: "/favicon.ico",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [prefs]);
}
