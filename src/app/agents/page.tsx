"use client";

import { useRef } from "react";
import { BRAIN_AGENTS, HAND_AGENTS, type AgentInfo } from "@/lib/agents";
import { useAgentStatuses } from "@/hooks/use-agent-statuses";
import type { AgentData } from "@/hooks/use-agent-statuses";
import { AgentAvatar } from "@/components/agent-avatar";
import { AgentDot } from "@/components/agent-dot";
import { Badge } from "@/components/ui/badge";

function AgentCard({
  agent,
  agentData,
  onUpload,
}: {
  agent: AgentInfo;
  agentData: AgentData;
  onUpload: (agentId: string, file: File) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const hands = HAND_AGENTS.filter((h) => h.brainId === agent.id);

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 hover:border-zinc-700 transition-colors">
      <div className="flex items-center gap-3">
        <AgentAvatar
          agent={agent}
          status={agentData.status}
          avatarUrl={agentData.avatarUrl}
          size="lg"
          onClick={() => fileRef.current?.click()}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(agent.id, file);
          }}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-100">
              {agent.name}
            </span>
            <AgentDot color={agent.color} status={agentData.status} />
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
  const agentData = useAgentStatuses();

  async function handleUpload(agentId: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`/api/agents/${agentId}/avatar`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      console.error("Avatar upload failed:", await res.text());
    }
  }

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
            agentData={agentData[agent.id] ?? { status: "offline", avatarUrl: null }}
            onUpload={handleUpload}
          />
        ))}
      </div>
    </div>
  );
}
