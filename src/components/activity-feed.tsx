"use client";

import { formatDistanceToNow } from "date-fns";
import { useEvents } from "@/hooks/use-events";
import { getAgent } from "@/lib/agents";
import { EventIcon } from "@/components/event-icon";
import { AgentDot } from "@/components/agent-dot";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { EventType, EventSeverity } from "@/lib/database.types";

export function ActivityFeed() {
  const { events, loading } = useEvents(100);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-zinc-500">
        Loading events...
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-zinc-500 gap-2">
        <p className="text-sm">No events yet</p>
        <p className="text-xs text-zinc-600">
          Start the ingestion service to see activity here
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-200px)]">
      <div className="space-y-1">
        {events.map((event) => {
          const agent = event.agent_id ? getAgent(event.agent_id) : null;
          const time = formatDistanceToNow(new Date(event.occurred_at), {
            addSuffix: true,
          });

          return (
            <div
              key={event.id}
              className="flex items-start gap-3 rounded-md px-3 py-2.5 hover:bg-zinc-800/40 transition-colors group"
            >
              {/* Agent avatar */}
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-medium"
                style={{ color: agent?.color ?? "#71717a" }}
              >
                {agent ? (
                  <AgentDot color={agent.color} status="online" size="md" />
                ) : (
                  <span className="text-zinc-500">SYS</span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <EventIcon
                    type={event.event_type as EventType}
                    severity={event.severity as EventSeverity}
                  />
                  <span className="text-[13px] text-zinc-200 truncate">
                    {event.title}
                  </span>
                </div>
                {event.detail && (
                  <p className="text-xs text-zinc-500 mt-0.5 truncate">
                    {event.detail}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  {agent && (
                    <span
                      className="text-[11px] font-medium"
                      style={{ color: agent.color }}
                    >
                      {agent.name}
                    </span>
                  )}
                  <span className="text-[11px] text-zinc-600">{time}</span>
                </div>
              </div>

              {/* Source badge */}
              <span className="text-[10px] text-zinc-600 uppercase tracking-wider mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {event.source}
              </span>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
