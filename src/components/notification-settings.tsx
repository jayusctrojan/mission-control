"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useNotifications } from "@/hooks/use-notifications";
import type { EventSeverity } from "@/lib/database.types";

const EVENT_TYPE_LABELS: Record<string, string> = {
  error: "Errors",
  health_alert: "Health Alerts",
  bot_start: "Agent Start",
  bot_stop: "Agent Stop",
  session_start: "Session Start",
  session_end: "Session End",
  mission_created: "Mission Created",
  mission_updated: "Mission Updated",
  agent_push: "Agent Push",
  cost_event: "Cost Events",
};

const SEVERITY_LABELS: Record<EventSeverity, string> = {
  info: "Info",
  warn: "Warning",
  error: "Error",
  critical: "Critical",
};

const SEVERITY_COLORS: Record<EventSeverity, string> = {
  info: "bg-zinc-500",
  warn: "bg-amber-500",
  error: "bg-red-500",
  critical: "bg-red-600",
};

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
        checked ? "bg-violet-600" : "bg-zinc-700"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white transition-transform mt-0.5 ${
          checked ? "translate-x-4.5 ml-0.5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export function NotificationSettings({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { prefs, setEnabled, toggleEventType, toggleSeverity } = useNotifications();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">
            Notification Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Master toggle */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-zinc-200">Enable Notifications</div>
              <div className="text-[11px] text-zinc-500">
                Browser notifications for events
              </div>
            </div>
            <Toggle checked={prefs.enabled} onChange={() => setEnabled(!prefs.enabled)} />
          </div>

          <Separator className="bg-zinc-800" />

          {/* Severity levels */}
          <div>
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Severity Levels
            </span>
            <div className="space-y-2 mt-2">
              {(Object.keys(SEVERITY_LABELS) as EventSeverity[]).map((sev) => (
                <div key={sev} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${SEVERITY_COLORS[sev]}`} />
                    <span className="text-sm text-zinc-300">{SEVERITY_LABELS[sev]}</span>
                  </div>
                  <Toggle
                    checked={prefs.severities[sev]}
                    onChange={() => toggleSeverity(sev)}
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator className="bg-zinc-800" />

          {/* Event types */}
          <div>
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
              Event Types
            </span>
            <div className="space-y-2 mt-2">
              {Object.entries(EVENT_TYPE_LABELS).map(([type, label]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm text-zinc-300">{label}</span>
                  <Toggle
                    checked={prefs.eventTypes[type] ?? false}
                    onChange={() => toggleEventType(type)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
