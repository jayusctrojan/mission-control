"use client";

import { getAgent } from "@/lib/agents";
import type { CostByAgent } from "@/hooks/use-cost-data";

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function CostByAgentTable({ data }: { data: CostByAgent[] }) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-zinc-500 py-4 text-center">
        No cost data yet
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-800 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900/50">
            <th className="text-left px-4 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Agent
            </th>
            <th className="text-right px-4 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Input
            </th>
            <th className="text-right px-4 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Output
            </th>
            <th className="text-right px-4 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Cost
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const agent = getAgent(row.agentId);
            return (
              <tr
                key={row.agentId}
                className="border-b border-zinc-800/50 hover:bg-zinc-800/30"
              >
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: agent?.color ?? "#71717a" }}
                    />
                    <span className="text-zinc-200">
                      {agent?.name ?? row.agentId}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right text-zinc-400 tabular-nums">
                  {fmtTokens(row.inputTokens)}
                </td>
                <td className="px-4 py-2.5 text-right text-zinc-400 tabular-nums">
                  {fmtTokens(row.outputTokens)}
                </td>
                <td className="px-4 py-2.5 text-right text-zinc-100 font-medium tabular-nums">
                  ${row.costUsd.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
