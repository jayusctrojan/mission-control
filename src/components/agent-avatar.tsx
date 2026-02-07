import type { AgentInfo } from "@/lib/agents";
import type { AgentStatus } from "@/lib/database.types";
import { cn } from "@/lib/utils";

interface AgentAvatarProps {
  agent: AgentInfo;
  status: AgentStatus;
  avatarUrl: string | null;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

const SIZE_MAP = {
  sm: { container: "h-6 w-6", text: "text-[10px]", dot: "h-2 w-2 -bottom-0.5 -right-0.5" },
  md: { container: "h-8 w-8", text: "text-xs", dot: "h-2.5 w-2.5 -bottom-0.5 -right-0.5" },
  lg: { container: "h-10 w-10", text: "text-sm", dot: "h-3 w-3 -bottom-0.5 -right-0.5" },
};

export function AgentAvatar({ agent, status, avatarUrl, size = "md", onClick }: AgentAvatarProps) {
  const s = SIZE_MAP[size];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "relative shrink-0 rounded-full",
        onClick && "cursor-pointer hover:ring-2 hover:ring-zinc-600 transition-all",
        !onClick && "cursor-default"
      )}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={agent.name}
          className={cn(s.container, "rounded-full object-cover")}
        />
      ) : (
        <div
          className={cn(
            s.container,
            s.text,
            "rounded-full flex items-center justify-center font-bold"
          )}
          style={{ backgroundColor: agent.color + "20", color: agent.color }}
        >
          {agent.emoji}
        </div>
      )}
      {/* Status dot */}
      <span
        className={cn(
          "absolute rounded-full border-2 border-zinc-950",
          s.dot
        )}
        style={{
          backgroundColor: status === "online" ? "#22c55e" : status === "error" ? "#ef4444" : "#52525b",
        }}
      />
    </button>
  );
}
