import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { config } from "./config.js";

const supabase = createClient(config.supabaseUrl, config.supabaseKey);

interface CronJob {
  id: string;
  name: string;
  kind: string;
  schedule: string;
  agent?: string;
  description?: string;
  enabled?: boolean;
}

export async function syncCronJobs(filePath: string): Promise<void> {
  let raw: string;
  try {
    raw = readFileSync(filePath, "utf-8");
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      console.log(`[cron-sync] ${filePath} not found, skipping`);
    } else {
      console.error(`[cron-sync] Failed to read ${filePath}:`, err);
    }
    return;
  }

  let jobs: CronJob[];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.error(`[cron-sync] Expected array in ${filePath}, got ${typeof parsed}`);
      return;
    }
    jobs = parsed;
  } catch (err) {
    console.error(`[cron-sync] Failed to parse ${filePath}:`, err);
    return;
  }

  // Filter to recurring cron jobs, skip high-frequency watchdogs (< 5 min intervals)
  const cronJobs = jobs.filter((j) => {
    if (j.kind !== "cron") return false;
    // Skip very high-frequency jobs (e.g. */2 * * * *)
    const parts = j.schedule.split(" ");
    if (parts && parts[0]?.startsWith("*/")) {
      const interval = parseInt(parts[0].slice(2), 10);
      if (interval < 5) return false;
    }
    return true;
  });

  if (cronJobs.length === 0) {
    console.log("[cron-sync] No cron jobs to sync");
    return;
  }

  console.log(`[cron-sync] Syncing ${cronJobs.length} cron jobs...`);

  // Phase 1: Upsert tasks with NULL agent_id (FK-safe)
  let synced = 0;
  for (const job of cronJobs) {
    try {
      const { error } = await supabase.from("scheduled_tasks").upsert(
        {
          external_id: job.id,
          name: job.name,
          schedule_expr: job.schedule,
          schedule_tz: "America/Chicago",
          agent_id: null,
          source: "openclaw" as const,
          enabled: job.enabled !== false,
          description: job.description || null,
        },
        { onConflict: "source,external_id" }
      );

      if (error) {
        console.error(`[cron-sync] Failed to upsert ${job.name}:`, error.message);
      } else {
        synced++;
      }
    } catch (err) {
      console.error(`[cron-sync] Failed to upsert ${job.name}:`, err);
    }
  }

  // Phase 2: Reconcile agent_ids where agents exist (safe no-op for missing agents)
  const agentJobs = cronJobs.filter((j) => j.agent);
  for (const job of agentJobs) {
    try {
      await supabase
        .from("scheduled_tasks")
        .update({ agent_id: job.agent! })
        .eq("external_id", job.id)
        .eq("source", "openclaw")
        .in("agent_id", [null, job.agent!]);
    } catch {
      // Agent doesn't exist yet — FK violation expected, silently skip
    }
  }

  console.log(`[cron-sync] Synced ${synced}/${cronJobs.length} cron jobs`);
}
