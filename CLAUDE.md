# Mission Control

AI-powered developer dashboard that ingests Claude Code session logs and displays them as a real-time activity feed with mission tracking, cost analytics, and agent management.

## Tech Stack

- **Dashboard**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **Database**: Supabase (Postgres + Realtime subscriptions + Storage)
- **Ingestion**: Standalone Node.js service using tsx + chokidar file watching
- **Secrets**: Doppler (NOT .env files — all scripts use `doppler run --` prefix)
- **Package manager**: npm
- **Hosting**: Render (Next.js dashboard only; ingestion runs locally)
- **CI/CD**: GitHub Actions with CodeRabbit auto-review + Claude Code auto-fix loop
- **Custom commands**: `.claude/commands/` — project-level slash commands

## Project Structure

```
src/
  app/              # Next.js App Router pages
    agents/         # Agent roster with avatar upload
    calendar/       # Calendar view with mission due dates
    costs/          # Cost tracking dashboard
    missions/       # Kanban board (actions.ts has server actions)
    api/            # API routes (ingest, missions, agents/avatar)
  components/       # React components
    ui/             # shadcn/ui primitives
    kanban/         # KanbanBoard, KanbanColumn, MissionCard, MissionDetail
    costs/          # CostStatsBar, CostByAgent, CostByModel, CostChart
    calendar/       # CalendarGrid, CalendarDayPanel
  hooks/            # Custom React hooks (use-events, use-missions, use-cost-data, etc.)
  lib/              # Supabase clients, types, utilities
ingestion/          # Standalone ingestion service (separate package.json)
supabase/           # Migrations and config
.github/workflows/  # CI/CD (claude.yml)
```

## Key Patterns

- **Supabase clients**: Browser client in `src/lib/supabase.ts` (anon key, lazy proxy), server client in `src/lib/supabase-server.ts` (service role key)
- **API auth**: Bearer token via `INGEST_API_KEY` checked in `src/lib/api-auth.ts` — used by `/api/ingest` and `/api/agents/[id]/avatar`
- **Server actions**: In `src/app/missions/actions.ts` — use `"use server"` directive + `getSupabaseServer()`
- **RLS**: anon/authenticated can SELECT (`USING (true)`), service_role has full access. All policies use explicit `TO` role clauses.
- **Realtime**: Enabled on `events`, `agents`, `missions`, `mission_comments`, `cost_events` tables
- **Database types**: `src/lib/database.types.ts` — manually maintained, must stay in sync with migrations
- **Event icons**: `src/components/event-icon.tsx` — `TYPE_ICONS` record must cover all EventType values
- **Agent avatars**: Uploaded via API route → Supabase Storage `avatars` bucket → `agents.avatar_url`
- **AgentAvatar component**: Used everywhere agents are displayed (sidebar, activity feed, kanban cards, mission detail). Takes `agent`, `status`, `avatarUrl`, `size` props.
- **useAgentStatuses hook**: Returns `Record<string, AgentData>` where `AgentData = { status, avatarUrl }`. Called ONCE at parent level (e.g., KanbanBoard, Sidebar) and passed down as props — never called per-card.
- **Cost tracking**: Separate `cost_events` table for aggregation. Cost events also mirrored to `events` table for the activity feed.
- **Notifications**: Browser Notification API with localStorage-backed preferences. Deep-merged on load to preserve new event types.
- **Kanban drag-and-drop**: dnd-kit with `PointerSensor` (distance: 8). Uses functional `setMissions` callbacks to avoid stale closures.

## Conventions

- Use TypeScript strict mode
- Prefer `const` over `let`
- Use named exports
- Tailwind classes for styling (no CSS modules)
- shadcn/ui for UI primitives (Button, Dialog, Select, etc.)
- Keep components focused — one responsibility per file
- Use Supabase migrations for schema changes (in `supabase/migrations/`)
- Always check Supabase response errors (`if (error)`) — Supabase resolves (not rejects) on DB errors
- Use `.maybeSingle()` instead of `.single()` when zero rows is a valid case
- Wrap async operations in try/catch and log errors — never silently swallow failures

## Common Gotchas

- Adding a new `EventType` requires updating BOTH `database.types.ts` AND the `TYPE_ICONS` record in `event-icon.tsx`
- Sidebar active state uses exact pathname match (`pathname === item.href`)
- dnd-kit uses `PointerSensor` with `distance: 8` activation constraint
- No `.env` files — Doppler injects all environment variables at runtime
- `useAgentStatuses` is a breaking API: returns `AgentData` objects (not plain `AgentStatus` strings). All consumers must destructure `.status` and `.avatarUrl`
- Avatar upload route requires auth (`authenticateRequest`) + file type/size validation
- `markdown_ref` in markdown-sync uses `filePath:title` (no status) to prevent duplicates when tasks move
- Calendar event counts use local date conversion (not UTC slice) to avoid off-by-one near midnight
- Kanban deep-link (`?detail=id`) only fires once via `deepLinkHandled` flag to prevent re-opening on realtime updates

## PR Workflow

After pushing to a PR, always run `/review-fix` to resolve CodeRabbit feedback. This:
1. Fetches all CodeRabbit inline comments from the PR
2. Fixes every issue (critical, major, minor, nitpicks)
3. Verifies TypeScript compiles, commits once, pushes once
4. Waits for re-review, repeats up to 3 rounds
5. Posts a summary comment on the PR after each round

The CI workflow (`.github/workflows/claude.yml`) also runs this automatically via `resolve-coderabbit` job, but `/review-fix` is the manual fallback when CI can't run (e.g., missing API key in Actions).
