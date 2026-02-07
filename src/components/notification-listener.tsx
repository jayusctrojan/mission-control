"use client";

import { useNotificationTrigger } from "@/hooks/use-notification-trigger";

export function NotificationListener() {
  useNotificationTrigger();
  return null;
}
