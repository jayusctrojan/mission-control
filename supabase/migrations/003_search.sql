-- Enable pg_trgm extension for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add fts tsvector column to events (GENERATED ALWAYS AS STORED)
ALTER TABLE events ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(detail, '')), 'B')
  ) STORED;

-- GIN index on events fts
CREATE INDEX idx_events_fts ON events USING GIN (fts);

-- Add fts tsvector column to missions
ALTER TABLE missions ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) STORED;

-- GIN index on missions fts
CREATE INDEX idx_missions_fts ON missions USING GIN (fts);

-- Trigram indexes on small tables
CREATE INDEX idx_agents_name_trgm ON agents USING GIN (name gin_trgm_ops);
CREATE INDEX idx_agents_role_trgm ON agents USING GIN (role gin_trgm_ops);
CREATE INDEX idx_mission_comments_body_trgm ON mission_comments USING GIN (body gin_trgm_ops);

-- Calendar indexes
CREATE INDEX idx_missions_due_at ON missions (due_at) WHERE due_at IS NOT NULL;
CREATE INDEX idx_missions_completed_at ON missions (completed_at) WHERE completed_at IS NOT NULL;

-- search_all RPC function
CREATE OR REPLACE FUNCTION search_all(
  query_text text,
  result_limit int DEFAULT 5
)
RETURNS TABLE (
  category text,
  id text,
  title text,
  subtitle text,
  occurred_at timestamptz,
  rank real
)
LANGUAGE plpgsql STABLE
AS $$
DECLARE
  tsq tsquery;
BEGIN
  tsq := plainto_tsquery('english', query_text);

  RETURN QUERY

  (
    SELECT
      'event'::text AS category,
      e.id::text,
      e.title,
      left(e.detail, 120) AS subtitle,
      e.occurred_at,
      ts_rank(e.fts, tsq) AS rank
    FROM events e
    WHERE e.fts @@ tsq
    ORDER BY rank DESC
    LIMIT result_limit
  )

  UNION ALL

  (
    SELECT
      'mission'::text AS category,
      m.id::text,
      m.title,
      left(m.description, 120) AS subtitle,
      m.created_at AS occurred_at,
      ts_rank(m.fts, tsq) AS rank
    FROM missions m
    WHERE m.fts @@ tsq
    ORDER BY rank DESC
    LIMIT result_limit
  )

  UNION ALL

  (
    SELECT
      'agent'::text AS category,
      a.id::text,
      a.name AS title,
      a.role AS subtitle,
      a.created_at AS occurred_at,
      similarity(a.name, query_text) AS rank
    FROM agents a
    WHERE a.name ILIKE '%' || query_text || '%'
       OR a.role ILIKE '%' || query_text || '%'
    ORDER BY rank DESC
    LIMIT result_limit
  )

  UNION ALL

  (
    SELECT
      'comment'::text AS category,
      mc.mission_id::text AS id,
      left(mc.body, 80) AS title,
      mc.mission_id::text AS subtitle,
      mc.created_at AS occurred_at,
      similarity(mc.body, query_text) AS rank
    FROM mission_comments mc
    WHERE mc.body ILIKE '%' || query_text || '%'
    ORDER BY rank DESC
    LIMIT result_limit
  );
END;
$$;
