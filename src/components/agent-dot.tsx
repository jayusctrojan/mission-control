import type { AgentStatus } from "@/lib/database.types";
import { cn } from "@/lib/utils";

interface AgentDotProps {
  color: string;
  status: AgentStatus;
  size?: "sm" | "md";
}

export function AgentDot({ color, status, size = "sm" }: AgentDotProps) {
  const dim = size === "sm" ? "h-2.5 w-2.5" : "h-3.5 w-3.5";
  return (
    <span className="relative flex shrink-0">
      <span
        className={cn("rounded-full", dim)}
        style={{
          backgroundColor: status === "offline" ? "#52525b" : color,
          opacity: status === "offline" ? 0.5 : 1,
        }}
      />
      {status === "online" && (
        <span
          className={cn("absolute inset-0 rounded-full animate-ping", dim)}
          style={{ backgroundColor: color, opacity: 0.4 }}
        />
      )}
    </span>
  );
}
