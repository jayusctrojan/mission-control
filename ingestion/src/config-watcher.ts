import { watch } from "chokidar";
import { syncAgents } from "./agents-sync.js";
import { config } from "./config.js";

export function watchConfig(): void {
  const watcher = watch(config.openclawConfig, {
    persistent: true,
    usePolling: false,
    awaitWriteFinish: { stabilityThreshold: 1000, pollInterval: 200 },
  });

  watcher.on("change", async () => {
    console.log("[config-watcher] openclaw.json changed, re-syncing agents...");
    await syncAgents();
  });

  console.log(`[config-watcher] Watching ${config.openclawConfig}`);
}
