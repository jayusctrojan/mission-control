import { existsSync } from "fs";
import { syncAgents } from "./agents-sync.js";
import { tailGatewayLog, tailWatchdogLog, invalidateAgentCache } from "./log-tailer.js";
import { watchConfig } from "./config-watcher.js";
import { tailSessionsLog } from "./session-tailer.js";
import { watchTaskQueue } from "./markdown-sync.js";
import { config } from "./config.js";

async function main() {
  console.log("=== Mission Control Ingestion Service ===");
  console.log(`Supabase:    ${config.supabaseUrl}`);
  console.log(`Config:      ${config.openclawConfig}`);
  console.log(`Gateway:     ${config.gatewayLog}`);
  console.log(`Watchdog:    ${config.watchdogLog}`);
  console.log(`Sessions:    ${config.sessionsLog}`);
  console.log(`Task Queue:  ${config.taskQueueMd}`);
  console.log();

  // Step 1: Sync agent roster from openclaw.json
  await syncAgents();
  invalidateAgentCache();

  // Step 2: Start tailing logs
  tailGatewayLog(config.gatewayLog);
  tailWatchdogLog(config.watchdogLog);

  // Step 3: Tail sessions JSONL (if file exists)
  if (existsSync(config.sessionsLog)) {
    tailSessionsLog(config.sessionsLog);
  } else {
    console.log(`[sessions] ${config.sessionsLog} not found, skipping`);
  }

  // Step 4: Watch task-queue.md for markdown sync (if file exists)
  if (existsSync(config.taskQueueMd)) {
    watchTaskQueue(config.taskQueueMd);
  } else {
    console.log(`[markdown-sync] ${config.taskQueueMd} not found, skipping`);
  }

  // Step 5: Watch for config changes
  watchConfig();

  console.log("\n[main] Ingestion service running. Press Ctrl+C to stop.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
