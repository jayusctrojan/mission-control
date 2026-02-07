import { readFile } from "fs/promises";
import { config } from "./config.js";
import { supabase } from "./db.js";

// Agent role mapping based on workspace paths
const ROLE_MAP: Record<string, string> = {
  main: "System / General",
  kevin: "Finance",
  "kevin-hand": "Finance (Hand)",
  axe: "Wealth",
  "axe-hand": "Wealth (Hand)",
  thomas: "Culinary",
  dinesh: "Coding / CTO",
  "dinesh-coder": "Coding (Hand)",
  richard: "Design / CDO",
  "richard-hand": "Design (Hand)",
  hormozi: "Marketing",
  "hormozi-hand": "Marketing (Hand)",
  tim: "Home Improvement",
  harvey: "Legal",
  cox: "Health",
  jared: "PM / Projects",
};

// Distinct colors per agent
const COLOR_MAP: Record<string, string> = {
  main: "#8b5cf6",
  kevin: "#f59e0b",
  "kevin-hand": "#f59e0b",
  axe: "#ef4444",
  "axe-hand": "#ef4444",
  thomas: "#10b981",
  dinesh: "#3b82f6",
  "dinesh-coder": "#3b82f6",
  richard: "#06b6d4",
  "richard-hand": "#06b6d4",
  hormozi: "#ec4899",
  "hormozi-hand": "#ec4899",
  tim: "#f97316",
  harvey: "#a855f7",
  cox: "#14b8a6",
  jared: "#6366f1",
};

interface OpenClawAgent {
  id: string;
  name: string;
  model?: { primary: string };
  subagents?: { allowAgents?: string[] };
}

interface OpenClawConfig {
  agents: {
    defaults: { model: { primary: string } };
    list: OpenClawAgent[];
  };
}

export async function syncAgents(): Promise<void> {
  console.log("[agents-sync] Reading openclaw.json...");

  let cfg: OpenClawConfig;
  try {
    const raw = await readFile(config.openclawConfig, "utf-8");
    cfg = JSON.parse(raw);
  } catch (err) {
    console.error("[agents-sync] Failed to read/parse openclaw.json:", err);
    return;
  }
  const defaultModel = cfg.agents.defaults.model.primary;

  // Build brain->hand mapping
  const handToBrain: Record<string, string> = {};
  for (const agent of cfg.agents.list) {
    if (agent.subagents?.allowAgents) {
      for (const handId of agent.subagents.allowAgents) {
        handToBrain[handId] = agent.id;
      }
    }
  }

  const rows = cfg.agents.list.map((agent) => {
    const isHand = handToBrain[agent.id] !== undefined;
    const model = agent.model?.primary || defaultModel;
    // Extract short model name
    const shortModel = model.split("/").pop()?.replace(/^claude-/, "") ?? model;

    return {
      id: agent.id,
      name: agent.name,
      role: ROLE_MAP[agent.id] || "General",
      model: shortModel,
      color: COLOR_MAP[agent.id] || "#6366f1",
      is_hand: isHand,
      brain_id: handToBrain[agent.id] || null,
      status: "offline" as const,
      last_seen_at: null,
    };
  });

  // Upsert all agents
  const { error } = await supabase
    .from("agents")
    .upsert(rows, { onConflict: "id" });

  if (error) {
    console.error("[agents-sync] Error upserting agents:", error.message);
  } else {
    console.log(`[agents-sync] Synced ${rows.length} agents`);
  }
}
