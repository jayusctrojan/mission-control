-- Mission Control: Initial Schema
-- Run this in Supabase SQL Editor

-- Agents table: roster from openclaw.json
CREATE TABLE agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'general',
  model TEXT NOT NULL DEFAULT 'unknown',
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'error', 'idle')),
  color TEXT NOT NULL DEFAULT '#6366f1',
  is_hand BOOLEAN NOT NULL DEFAULT FALSE,
  brain_id TEXT REFERENCES agents(id),
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Events table: activity feed
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT REFERENCES agents(id),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'bot_start', 'bot_stop', 'heartbeat', 'reload', 'config_change',
    'plugin_load', 'health_alert', 'gateway_restart', 'message',
    'session_start', 'session_end', 'error', 'system'
  )),
  source TEXT NOT NULL DEFAULT 'gateway',
  title TEXT NOT NULL,
  detail TEXT,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warn', 'error', 'critical')),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sessions table: conversation summaries
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL REFERENCES agents(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  message_count INTEGER NOT NULL DEFAULT 0,
  total_cost NUMERIC(10, 6),
  tools_used TEXT[] DEFAULT '{}',
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ingestion state: track file positions to avoid re-processing
CREATE TABLE ingestion_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path TEXT NOT NULL UNIQUE,
  last_offset BIGINT NOT NULL DEFAULT 0,
  last_line TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_events_occurred_at ON events(occurred_at DESC);
CREATE INDEX idx_events_agent_id ON events(agent_id);
CREATE INDEX idx_events_event_type ON events(event_type);
CREATE INDEX idx_events_severity ON events(severity);
CREATE INDEX idx_sessions_agent_id ON sessions(agent_id);
CREATE INDEX idx_sessions_started_at ON sessions(started_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER ingestion_state_updated_at
  BEFORE UPDATE ON ingestion_state
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable Realtime on events and agents
ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE agents;

-- RLS: Allow anonymous read access (dashboard is internal-only)
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read on agents" ON agents FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow anonymous read on events" ON events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow anonymous read on sessions" ON sessions FOR SELECT TO anon, authenticated USING (true);

-- Service role gets full access (for ingestion)
CREATE POLICY "Service role full access agents" ON agents FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access events" ON events FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access sessions" ON sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access ingestion_state" ON ingestion_state FOR ALL TO service_role USING (true) WITH CHECK (true);
