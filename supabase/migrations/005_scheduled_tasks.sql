-- Scheduled tasks / cron jobs table
CREATE TABLE scheduled_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id TEXT,
  name TEXT NOT NULL,
  schedule_expr TEXT NOT NULL,
  schedule_tz TEXT NOT NULL DEFAULT 'America/Chicago',
  agent_id TEXT REFERENCES agents(id),
  source TEXT NOT NULL DEFAULT 'openclaw',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(source, external_id)
);

-- Indexes
CREATE INDEX idx_scheduled_tasks_agent ON scheduled_tasks(agent_id);
CREATE INDEX idx_scheduled_tasks_enabled ON scheduled_tasks(enabled);

-- RLS
ALTER TABLE scheduled_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_scheduled_tasks"
  ON scheduled_tasks FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "service_role_all_scheduled_tasks"
  ON scheduled_tasks FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE scheduled_tasks;

-- Seed the 8 known cron jobs
INSERT INTO scheduled_tasks (external_id, name, schedule_expr, schedule_tz, agent_id, source, enabled, description)
VALUES
  ('kalshi_daily_alpha', 'Kalshi Daily Alpha Scan', '0 8 * * *', 'America/Chicago', 'axe', 'openclaw', true, 'Daily scan of Kalshi markets for alpha opportunities'),
  ('memory_synthesis', 'Memory Synthesis', '0 8 * * *', 'America/Chicago', NULL, 'launchagent', true, 'Daily memory consolidation and synthesis'),
  ('poly_30wallet', 'Polymarket 30-Wallet Signal Scanner', '*/15 * * * *', 'America/Chicago', 'axe', 'openclaw', true, 'Scans top 30 Polymarket wallets for trading signals every 15 minutes'),
  ('daily_whale', 'Daily Whale Scanner', '0 14 * * *', 'America/Chicago', 'axe', 'openclaw', true, 'Afternoon scan of whale wallet activity'),
  ('weekly_calendar', 'Weekly Calendar Planning', '0 17 * * 0', 'America/Chicago', 'main', 'openclaw', true, 'Sunday afternoon weekly planning and calendar review'),
  ('nightly_security', 'Nightly Security Health Check', '0 23 * * *', 'America/Chicago', 'main', 'openclaw', true, 'End-of-day security audit and health checks'),
  ('nightly_backup', 'Nightly Workspace Backup', '30 23 * * *', 'America/Chicago', 'main', 'openclaw', true, 'End-of-day workspace and configuration backup'),
  ('driftwood_statement', 'Driftwood Statement Reminder', '0 10 15 * *', 'America/Chicago', NULL, 'system_cron', true, 'Monthly reminder to review Driftwood financial statements');
