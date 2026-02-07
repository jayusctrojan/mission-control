-- Phase 2: Missions + Mission Comments
-- Run this in Supabase SQL Editor

-- Missions table: kanban board items
CREATE TABLE missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'backlog' CHECK (status IN ('backlog', 'in_progress', 'review', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assigned_agent_id TEXT REFERENCES agents(id),
  created_by TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  sort_order INTEGER NOT NULL DEFAULT 0,
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  markdown_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mission comments
CREATE TABLE mission_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  agent_id TEXT REFERENCES agents(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_missions_status ON missions(status);
CREATE INDEX idx_missions_assigned_agent ON missions(assigned_agent_id);
CREATE INDEX idx_missions_sort_order ON missions(sort_order);
CREATE INDEX idx_missions_markdown_ref ON missions(markdown_ref);
CREATE INDEX idx_mission_comments_mission_id ON mission_comments(mission_id);

-- Updated_at trigger for missions
CREATE TRIGGER missions_updated_at
  BEFORE UPDATE ON missions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE missions;
ALTER PUBLICATION supabase_realtime ADD TABLE mission_comments;

-- RLS
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read on missions" ON missions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow anonymous read on mission_comments" ON mission_comments FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Service role full access missions" ON missions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access mission_comments" ON mission_comments FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Extend events.event_type CHECK to include new types
ALTER TABLE events DROP CONSTRAINT events_event_type_check;
ALTER TABLE events ADD CONSTRAINT events_event_type_check CHECK (event_type IN (
  'bot_start', 'bot_stop', 'heartbeat', 'reload', 'config_change',
  'plugin_load', 'health_alert', 'gateway_restart', 'message',
  'session_start', 'session_end', 'error', 'system',
  'mission_created', 'mission_updated', 'agent_push'
));
