"use client";

import { useState, useEffect, useCallback } from "react";
import type { EventType, EventSeverity } from "@/lib/database.types";

const STORAGE_KEY = "mission-control:notification-prefs";

export interface NotificationPrefs {
  enabled: boolean;
  eventTypes: Record<string, boolean>;
  severities: Record<EventSeverity, boolean>;
}

const DEFAULT_PREFS: NotificationPrefs = {
  enabled: false,
  eventTypes: {
    error: true,
    health_alert: true,
    bot_start: false,
    bot_stop: false,
    heartbeat: false,
    reload: false,
    config_change: false,
    plugin_load: false,
    gateway_restart: false,
    message: false,
    session_start: false,
    session_end: false,
    system: false,
    mission_created: true,
    mission_updated: false,
    agent_push: false,
    cost_event: false,
  },
  severities: {
    info: false,
    warn: true,
    error: true,
    critical: true,
  },
};

function loadPrefs(): NotificationPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const stored = JSON.parse(raw) as Partial<NotificationPrefs>;
    return {
      ...DEFAULT_PREFS,
      ...stored,
      eventTypes: { ...DEFAULT_PREFS.eventTypes, ...(stored.eventTypes ?? {}) },
      severities: { ...DEFAULT_PREFS.severities, ...(stored.severities ?? {}) },
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

function savePrefs(prefs: NotificationPrefs): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function useNotifications() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    setPrefs(loadPrefs());
  }, []);

  const updatePrefs = useCallback((update: Partial<NotificationPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...update };
      savePrefs(next);
      return next;
    });
  }, []);

  const toggleEventType = useCallback((eventType: string) => {
    setPrefs((prev) => {
      const next = {
        ...prev,
        eventTypes: {
          ...prev.eventTypes,
          [eventType]: !prev.eventTypes[eventType],
        },
      };
      savePrefs(next);
      return next;
    });
  }, []);

  const toggleSeverity = useCallback((severity: EventSeverity) => {
    setPrefs((prev) => {
      const next = {
        ...prev,
        severities: { ...prev.severities, [severity]: !prev.severities[severity] },
      };
      savePrefs(next);
      return next;
    });
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    const result = await Notification.requestPermission();
    return result === "granted";
  }, []);

  const setEnabled = useCallback(
    async (enabled: boolean) => {
      if (enabled) {
        const granted = await requestPermission();
        if (!granted) return;
      }
      updatePrefs({ enabled });
    },
    [requestPermission, updatePrefs]
  );

  return { prefs, setEnabled, toggleEventType, toggleSeverity };
}

export function shouldNotify(
  prefs: NotificationPrefs,
  eventType: EventType,
  severity: EventSeverity
): boolean {
  if (!prefs.enabled) return false;
  // Notify if either the specific event type is enabled OR the severity threshold is met
  return prefs.eventTypes[eventType] === true || prefs.severities[severity] === true;
}
