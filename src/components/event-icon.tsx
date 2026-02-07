import {
  Play,
  Square,
  Heart,
  RefreshCw,
  Settings,
  Plug,
  AlertTriangle,
  RotateCcw,
  MessageSquare,
  Zap,
  XCircle,
  Monitor,
  Target,
  PenLine,
  Send,
  type LucideIcon,
} from "lucide-react";
import type { EventType, EventSeverity } from "@/lib/database.types";

const TYPE_ICONS: Record<EventType, LucideIcon> = {
  bot_start: Play,
  bot_stop: Square,
  heartbeat: Heart,
  reload: RefreshCw,
  config_change: Settings,
  plugin_load: Plug,
  health_alert: AlertTriangle,
  gateway_restart: RotateCcw,
  message: MessageSquare,
  session_start: Zap,
  session_end: Square,
  error: XCircle,
  system: Monitor,
  mission_created: Target,
  mission_updated: PenLine,
  agent_push: Send,
};

const SEVERITY_COLORS: Record<EventSeverity, string> = {
  info: "text-zinc-400",
  warn: "text-amber-400",
  error: "text-red-400",
  critical: "text-red-500",
};

export function EventIcon({
  type,
  severity,
}: {
  type: EventType;
  severity: EventSeverity;
}) {
  const Icon = TYPE_ICONS[type] || Monitor;
  const colorClass = SEVERITY_COLORS[severity] || "text-zinc-400";

  return <Icon className={`h-4 w-4 shrink-0 ${colorClass}`} />;
}
