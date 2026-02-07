"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { AgentAvatar } from "@/components/agent-avatar";
import type { AgentData } from "@/hooks/use-agent-statuses";
import { getAgent } from "@/lib/agents";
import type { Database, MissionPriority } from "@/lib/database.types";

type MissionRow = Database["public"]["Tables"]["missions"]["Row"];

const PRIORITY_COLORS: Record<MissionPriority, string> = {
  low: "border-zinc-600 text-zinc-400",
  medium: "border-blue-600 text-blue-400",
  high: "border-amber-600 text-amber-400",
  critical: "border-red-600 text-red-400",
};

export function MissionCard({
  mission,
  agentData,
  onClick,
}: {
  mission: MissionRow;
  agentData: Record<string, AgentData>;
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: mission.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const agent = mission.assigned_agent_id
    ? getAgent(mission.assigned_agent_id)
    : null;
  const data = mission.assigned_agent_id ? agentData[mission.assigned_agent_id] : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => { if (!isDragging) onClick(); }}
      className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-3 cursor-grab active:cursor-grabbing hover:border-zinc-700 transition-colors"
    >
      <div className="text-[13px] text-zinc-200 leading-snug mb-2">
        {mission.title}
      </div>
      <div className="flex items-center justify-between">
        <Badge
          variant="outline"
          className={`text-[10px] ${PRIORITY_COLORS[mission.priority as MissionPriority]}`}
        >
          {mission.priority}
        </Badge>
        {agent && (
          <div className="flex items-center gap-1.5">
            <AgentAvatar
              agent={agent}
              status={data?.status ?? "offline"}
              avatarUrl={data?.avatarUrl ?? null}
              size="sm"
            />
            <span className="text-[11px] text-zinc-500">{agent.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}
