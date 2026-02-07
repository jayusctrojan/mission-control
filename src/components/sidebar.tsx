"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  LayoutDashboard,
  Bot,
  Radio,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { BRAIN_AGENTS } from "@/lib/agents";
import { AgentDot } from "@/components/agent-dot";
import { useAgentStatuses } from "@/hooks/use-agent-statuses";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Activity Feed", icon: Activity },
  { href: "/agents", label: "Agents", icon: Bot },
];

export function Sidebar() {
  const pathname = usePathname();
  const statuses = useAgentStatuses();

  const onlineCount = Object.values(statuses).filter(
    (s) => s === "online"
  ).length;

  return (
    <aside className="w-[280px] shrink-0 border-r border-border bg-zinc-950 flex flex-col h-screen">
      {/* Header */}
      <div className="p-5 pb-3">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <Radio className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide text-zinc-100">
              MISSION CONTROL
            </h1>
            <p className="text-[11px] text-zinc-500">
              {onlineCount} agent{onlineCount !== 1 ? "s" : ""} online
            </p>
          </div>
        </Link>
      </div>

      <Separator className="bg-zinc-800" />

      {/* Navigation */}
      <nav className="px-3 py-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Separator className="bg-zinc-800" />

      {/* Agent roster */}
      <div className="px-3 pt-3 pb-1">
        <span className="px-3 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          Agents
        </span>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-0.5 pb-4">
          {BRAIN_AGENTS.map((agent) => (
            <div
              key={agent.id}
              className="flex items-center gap-3 px-3 py-1.5 rounded-md text-sm text-zinc-300 hover:bg-zinc-800/50 transition-colors"
            >
              <AgentDot color={agent.color} status={statuses[agent.id] || "offline"} />
              <div className="flex-1 min-w-0">
                <div className="truncate text-[13px]">{agent.name}</div>
                <div className="text-[11px] text-zinc-500 truncate">
                  {agent.role}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <Separator className="bg-zinc-800" />
      <div className="p-3 flex items-center gap-2">
        <LayoutDashboard className="h-3.5 w-3.5 text-zinc-500" />
        <span className="text-[11px] text-zinc-500">OpenClaw v2026.2.3</span>
      </div>
    </aside>
  );
}
