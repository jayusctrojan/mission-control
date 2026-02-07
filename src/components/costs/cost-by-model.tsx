"use client";

import type { CostByModel } from "@/hooks/use-cost-data";

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const PROVIDER_COLORS: Record<string, string> = {
  anthropic: "text-violet-400",
  openai: "text-emerald-400",
  google: "text-blue-400",
  xai: "text-orange-400",
  together: "text-pink-400",
  other: "text-zinc-400",
};

export function CostByModelTable({ data }: { data: CostByModel[] }) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-zinc-500 py-4 text-center">
        No cost data yet
      </p>
    );
  }

  // Group by provider
  const grouped = new Map<string, CostByModel[]>();
  for (const row of data) {
    const existing = grouped.get(row.provider) ?? [];
    existing.push(row);
    grouped.set(row.provider, existing);
  }

  return (
    <div className="rounded-lg border border-zinc-800 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900/50">
            <th className="text-left px-4 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Provider / Model
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
          {Array.from(grouped.entries()).map(([provider, models]) => (
            models.map((row, i) => (
              <tr
                key={`${provider}-${row.model}`}
                className="border-b border-zinc-800/50 hover:bg-zinc-800/30"
              >
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    {i === 0 && (
                      <span className={`text-xs font-medium uppercase ${PROVIDER_COLORS[provider] ?? "text-zinc-400"}`}>
                        {provider}
                      </span>
                    )}
                    {i > 0 && <span className="w-16" />}
                    <span className="text-zinc-300">{row.model}</span>
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
            ))
          ))}
        </tbody>
      </table>
    </div>
  );
}
