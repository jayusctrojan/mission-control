"use client";

import { BRAIN_AGENTS, HAND_AGENTS, type AgentInfo } from "@/lib/agents";
import { useAgentStatuses } from "@/hooks/use-agent-statuses";
import { AgentDot } from "@/components/agent-dot";
import { Badge } from "@/components/ui/badge";

function AgentCard({ agent, status }: { agent: AgentInfo; status: string }) {
  const hands = HAND_AGENTS.filter((h) => h.brainId === agent.id);

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 hover:border-zinc-700 transition-colors">
      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold"
          style={{ backgroundColor: agent.color + "20", color: agent.color }}
        >
          {agent.emoji}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-100">
              {agent.name}
            </span>
            <AgentDot color={agent.color} status={status as "online" | "offline"} />
          </div>
          <div className="text-xs text-zinc-500">{agent.role}</div>
        </div>
        <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-400">
          {agent.model}
        </Badge>
      </div>

      {hands.length > 0 && (
        <div className="mt-3 pl-4 border-l border-zinc-800 space-y-1.5">
          {hands.map((hand) => (
            <div key={hand.id} className="flex items-center gap-2 text-xs text-zinc-500">
              <AgentDot color={hand.color} status="offline" />
              <span>{hand.name}</span>
              <span className="text-zinc-600">({hand.model})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AgentsPage() {
  const statuses = useAgentStatuses();

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">Agents</h2>
        <p className="text-sm text-zinc-500 mt-0.5">
          {BRAIN_AGENTS.length} brain agents, {HAND_AGENTS.length} hand agents
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {BRAIN_AGENTS.map((agent) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            status={statuses[agent.id] || "offline"}
          />
        ))}
      </div>
    </div>
  );
}
