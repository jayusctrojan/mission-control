// Parse gateway.log and watchdog.log lines into structured events

export interface ParsedEvent {
  agent_id: string | null;
  event_type: string;
  source: string;
  title: string;
  detail: string | null;
  severity: "info" | "warn" | "error" | "critical";
  occurred_at: string;
}

// Gateway log format: "2026-02-06T22:24:45.158Z [component] message"
const GATEWAY_RE = /^(\d{4}-\d{2}-\d{2}T[\d:.]+Z)\s+\[([^\]]+)\]\s+(.+)$/;

// Watchdog log format: "2026-02-01 08:18:47 ALERT: message"
const WATCHDOG_RE = /^(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+(ALERT|WARN|INFO|OK)?:?\s*(.+)$/;

// Telegram bot start: "[telegram] [accountId] starting provider (@botname)"
const TELEGRAM_START_RE = /^\[([^\]]+)\]\s+starting provider\s+\((@[^)]+)\)/;

// Gateway listening: "listening on ws://..."
const GATEWAY_LISTEN_RE = /^listening on\s+(.+)\s+\(PID\s+(\d+)\)/;

// Signal received
const SIGNAL_RE = /^signal\s+(SIG\w+)\s+received/;

// Reload: "config change detected; evaluating reload (fields...)"
const RELOAD_RE = /^config change detected; evaluating reload\s+\((.+)\)/;

// Plugin: "Plugin registered (N tools, ...)"
const PLUGIN_RE = /^Plugin registered\s+\((.+)\)/;

// Agent model line
const MODEL_RE = /^agent model:\s+(.+)/;

export function parseGatewayLine(line: string): ParsedEvent | null {
  const match = line.match(GATEWAY_RE);
  if (!match) return null;

  const [, timestamp, component, message] = match;
  const occurred_at = timestamp;

  // Telegram bot start
  if (component === "telegram") {
    const botMatch = message.match(TELEGRAM_START_RE);
    if (botMatch) {
      const [, accountId, botName] = botMatch;
      return {
        agent_id: accountId,
        event_type: "bot_start",
        source: "gateway",
        title: `${botName} started`,
        detail: null,
        severity: "info",
        occurred_at,
      };
    }
  }

  // Gateway listening (startup complete)
  if (component === "gateway") {
    const listenMatch = message.match(GATEWAY_LISTEN_RE);
    if (listenMatch) {
      return {
        agent_id: null,
        event_type: "system",
        source: "gateway",
        title: `Gateway started (PID ${listenMatch[2]})`,
        detail: listenMatch[1],
        severity: "info",
        occurred_at,
      };
    }

    const signalMatch = message.match(SIGNAL_RE);
    if (signalMatch) {
      const sig = signalMatch[1];
      return {
        agent_id: null,
        event_type: sig === "SIGTERM" ? "bot_stop" : "reload",
        source: "gateway",
        title: `Gateway received ${sig}`,
        detail: null,
        severity: sig === "SIGTERM" ? "warn" : "info",
        occurred_at,
      };
    }

    const modelMatch = message.match(MODEL_RE);
    if (modelMatch) {
      return {
        agent_id: null,
        event_type: "system",
        source: "gateway",
        title: `Agent model: ${modelMatch[1]}`,
        detail: null,
        severity: "info",
        occurred_at,
      };
    }
  }

  // Config reload
  if (component === "reload") {
    const reloadMatch = message.match(RELOAD_RE);
    if (reloadMatch) {
      return {
        agent_id: null,
        event_type: "config_change",
        source: "gateway",
        title: "Config change detected",
        detail: reloadMatch[1],
        severity: "info",
        occurred_at,
      };
    }
  }

  // Plugin load
  if (component === "plugins") {
    const pluginMatch = message.match(PLUGIN_RE);
    if (pluginMatch) {
      return {
        agent_id: null,
        event_type: "plugin_load",
        source: "gateway",
        title: `Plugin loaded (${pluginMatch[1]})`,
        detail: null,
        severity: "info",
        occurred_at,
      };
    }
  }

  // Heartbeat
  if (component === "heartbeat") {
    return {
      agent_id: null,
      event_type: "heartbeat",
      source: "gateway",
      title: "Heartbeat " + message,
      detail: null,
      severity: "info",
      occurred_at,
    };
  }

  // Generic fallback for other gateway lines
  return {
    agent_id: null,
    event_type: "system",
    source: "gateway",
    title: `[${component}] ${message}`,
    detail: null,
    severity: "info",
    occurred_at,
  };
}

export function parseWatchdogLine(line: string): ParsedEvent | null {
  const match = line.match(WATCHDOG_RE);
  if (!match) return null;

  const [, dateStr, level, message] = match;
  // Convert "2026-02-01 08:18:47" to ISO
  const occurred_at = new Date(dateStr.replace(" ", "T") + "Z").toISOString();

  let severity: ParsedEvent["severity"] = "info";
  let event_type = "system";

  if (level === "ALERT") {
    severity = "error";
    event_type = "health_alert";
  } else if (level === "WARN") {
    severity = "warn";
    event_type = "health_alert";
  }

  if (message.includes("restarted") || message.includes("Restarted")) {
    event_type = "gateway_restart";
  }

  return {
    agent_id: null,
    event_type,
    source: "watchdog",
    title: message,
    detail: null,
    severity,
    occurred_at,
  };
}
