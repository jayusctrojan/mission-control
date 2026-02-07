// Env vars provided by Doppler (doppler run --)

export const config = {
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  openclawConfig: process.env.OPENCLAW_CONFIG || `${process.env.HOME}/.openclaw/openclaw.json`,
  gatewayLog: process.env.GATEWAY_LOG || `${process.env.HOME}/.openclaw/logs/gateway.log`,
  watchdogLog: process.env.WATCHDOG_LOG || `${process.env.HOME}/.openclaw/logs/watchdog.log`,
  sessionsLog: process.env.SESSIONS_LOG || `${process.env.HOME}/.openclaw/logs/sessions.jsonl`,
  taskQueueMd: process.env.TASK_QUEUE_MD || `${process.env.HOME}/.openclaw/task-queue.md`,
  cronJobsJson: process.env.CRON_JOBS_JSON || `${process.env.HOME}/.openclaw/cron/jobs.json`,
};

// Validate required env vars
if (!config.supabaseUrl || !config.supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
