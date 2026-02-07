# Mission Control - Phase 1 Checkpoint (2026-02-06)

## What's Done

### Infrastructure
- **Supabase project**: `zdyervwjssvhiockkpbn` (mission-control, US East)
- **Migration applied**: 4 tables (agents, events, sessions, ingestion_state) with RLS, indexes, Realtime
- **GitHub repo**: `jayusctrojan/mission-control` (private)
- **Local path**: `/Users/jaybajaj/Documents/ai/mission-control/`
- **MCP config**: `.mcp.json` in project root points to mission-control Supabase

### Dashboard (Next.js 15)
- Dark mode shell, zinc-950 sidebar (280px)
- 11 brain agents listed with colored status dots + ping animation
- Nav: Activity Feed (`/`), Agents (`/agents`)
- Stats bar: Agents Online / Events Today / Errors (24h)
- Activity feed with Supabase Realtime subscriptions
- Agents page with brain/hand hierarchy cards
- shadcn/ui (Badge, Button, Card, ScrollArea, Separator, Tooltip)
- Build passes clean (`npm run build`)

### Ingestion Service (`/ingestion/`)
- Parses `openclaw.json` → upserts 16 agents
- Tails `gateway.log` + `watchdog.log` with offset tracking
- Watches `openclaw.json` for config changes
- FK-safe: validates agent_ids before insert
- **Already ran once**: 16 agents synced, ~19,496 events + 1,039 errors ingested

### Env Vars (local .env files, gitignored)
- `.env.local` — NEXT_PUBLIC_SUPABASE_URL + ANON_KEY
- `ingestion/.env` — SUPABASE_URL + SERVICE_ROLE_KEY

### Supabase Keys
- **URL**: `https://zdyervwjssvhiockkpbn.supabase.co`
- **Anon key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkeWVydndqc3N2aGlvY2trcGJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MzE2MTcsImV4cCI6MjA4NjAwNzYxN30.9JtCJA-3JZXMgt67Ryr3P1g8pGxuWdCbyMHswalonAA`
- **Service role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkeWVydndqc3N2aGlvY2trcGJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQzMTYxNywiZXhwIjoyMDg2MDA3NjE3fQ.2oMHgwd8c9vTBAtcyxHJGdGKZ7S64w0QCtqaNr0SKBw`

## What's Next

### Immediate (when resuming)
1. **Verify MCP** — run `mcp__supabase__list_tables` to confirm connection to mission-control
2. **Start dashboard** — `npm run dev` → open `localhost:3000`
3. **Start ingestion** — `cd ingestion && npm start` (runs in background)
4. **Visual check** — verify sidebar shows agents, activity feed shows events

### Phase 2 (next session)
- Kanban board (`/missions`) with `@dnd-kit` drag-and-drop
- `missions` + `mission_comments` tables
- POST `/api/ingest` endpoint for agent push
- `mission-control` OpenClaw skill for agents
- Session JSONL ingestion
- Markdown sync (task-queue.md → kanban)

### Phase 3
- Calendar (`/calendar`)
- Global search (Cmd+K)
- `pg_trgm` + `tsvector` search

### Phase 4
- Cost tracking page
- Deploy dashboard to Render
- Agent avatars
- Browser notifications

## Key Commands
```bash
# Dashboard
cd ~/Documents/ai/mission-control && npm run dev

# Ingestion
cd ~/Documents/ai/mission-control/ingestion && npm start

# Verify data
cd ~/Documents/ai/mission-control/ingestion && npx tsx src/verify.ts

# Reset ingestion (re-process all logs)
cd ~/Documents/ai/mission-control/ingestion && npx tsx src/reset.ts
```

## File Structure
```
mission-control/
├── .mcp.json                    # MCP config (mission-control Supabase)
├── .env.local                   # Dashboard env vars
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Dark mode root layout + sidebar
│   │   ├── page.tsx             # Activity feed page
│   │   └── agents/page.tsx      # Agents grid page
│   ├── components/
│   │   ├── sidebar.tsx          # Fixed sidebar with agent roster
│   │   ├── activity-feed.tsx    # Real-time event feed
│   │   ├── stats-bar.tsx        # Online/Events/Errors counters
│   │   ├── agent-dot.tsx        # Colored status indicator
│   │   └── event-icon.tsx       # Event type icons
│   ├── hooks/
│   │   ├── use-agent-statuses.ts # Realtime agent status subscription
│   │   ├── use-events.ts        # Realtime events subscription
│   │   └── use-stats.ts         # Aggregated stats polling
│   └── lib/
│       ├── agents.ts            # Agent roster constants
│       ├── database.types.ts    # TypeScript types
│       └── supabase.ts          # Supabase client (lazy init)
├── ingestion/
│   ├── .env                     # Ingestion env vars
│   └── src/
│       ├── index.ts             # Entry point
│       ├── agents-sync.ts       # openclaw.json → agents table
│       ├── log-parser.ts        # Gateway + watchdog line parsers
│       ├── log-tailer.ts        # File tailing + batch insert
│       ├── config-watcher.ts    # Watch openclaw.json changes
│       ├── verify.ts            # Data verification script
│       └── reset.ts             # Clear events + reset offsets
└── supabase/migrations/
    └── 001_initial_schema.sql   # Full schema
```
