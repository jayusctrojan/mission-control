-- Phase 4: Cost tracking, agent avatars, notifications

-- 1. cost_events table
CREATE TABLE IF NOT EXISTS cost_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
  model TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('anthropic', 'openai', 'google', 'xai', 'together', 'other')),
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd NUMERIC(10,6) NOT NULL DEFAULT 0,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cost_events_occurred_at ON cost_events (occurred_at DESC);
CREATE INDEX idx_cost_events_agent_id ON cost_events (agent_id);
CREATE INDEX idx_cost_events_provider ON cost_events (provider);
CREATE INDEX idx_cost_events_model ON cost_events (model);

-- RLS for cost_events
ALTER TABLE cost_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_select_cost_events" ON cost_events
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "service_role_all_cost_events" ON cost_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Enable realtime on cost_events
ALTER PUBLICATION supabase_realtime ADD TABLE cost_events;

-- 2. Add avatar_url to agents
ALTER TABLE agents ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 3. Extend events.event_type CHECK to include 'cost_event'
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_event_type_check;

ALTER TABLE events ADD CONSTRAINT events_event_type_check CHECK (
  event_type IN (
    'bot_start', 'bot_stop', 'heartbeat', 'reload',
    'config_change', 'plugin_load', 'health_alert', 'gateway_restart',
    'message', 'session_start', 'session_end', 'error', 'system',
    'mission_created', 'mission_updated', 'agent_push', 'cost_event'
  )
);

-- 4. Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars bucket
-- Public read for anyone, but only service_role can insert/modify (uploads go through API route)
CREATE POLICY "public_read_avatars" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'avatars');

CREATE POLICY "service_role_all_avatars" ON storage.objects
  FOR ALL TO service_role USING (bucket_id = 'avatars') WITH CHECK (bucket_id = 'avatars');
