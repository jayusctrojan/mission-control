import { syncAgents } from "./agents-sync.js";
import { tailGatewayLog, tailWatchdogLog } from "./log-tailer.js";
import { watchConfig } from "./config-watcher.js";
import { config } from "./config.js";

async function main() {
  console.log("=== Mission Control Ingestion Service ===");
  console.log(`Supabase: ${config.supabaseUrl}`);
  console.log(`Config:   ${config.openclawConfig}`);
  console.log(`Gateway:  ${config.gatewayLog}`);
  console.log(`Watchdog: ${config.watchdogLog}`);
  console.log();

  // Step 1: Sync agent roster from openclaw.json
  await syncAgents();

  // Step 2: Start tailing logs
  tailGatewayLog(config.gatewayLog);
  tailWatchdogLog(config.watchdogLog);

  // Step 3: Watch for config changes
  watchConfig();

  console.log("\n[main] Ingestion service running. Press Ctrl+C to stop.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
