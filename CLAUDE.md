# Mission Control

AI-powered developer dashboard that ingests Claude Code session logs and displays them as a real-time activity feed with mission tracking.

## Tech Stack

- **Dashboard**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS 4 + shadcn/ui components
- **Database**: Supabase (Postgres + Realtime subscriptions)
- **Ingestion**: Standalone Node.js service using tsx
- **Secrets**: Doppler (NOT .env files — all scripts use `doppler run --` prefix)
- **Package manager**: npm

## Project Structure

```
src/
  app/           # Next.js App Router pages (layout.tsx, page.tsx, etc.)
  components/    # React components (sidebar, event-icon, kanban, calendar, ui/)
  hooks/         # Custom React hooks
  lib/           # Supabase clients, types, utilities
ingestion/       # Standalone ingestion service (separate package.json)
supabase/        # Migrations and config
```

## Key Patterns

- **Supabase clients**: Browser client in `src/lib/supabase.ts` (anon key, lazy proxy), server client in `src/lib/supabase-server.ts` (service role key)
- **API auth**: Bearer token via `INGEST_API_KEY` checked in `src/lib/api-auth.ts`
- **Server actions**: In `src/app/missions/actions.ts` — use `"use server"` directive + `getSupabaseServer()`
- **RLS**: anon can SELECT (`USING (true)`), service_role has full access
- **Realtime**: Enabled on `events`, `agents`, `missions`, `mission_comments` tables
- **Database types**: `src/lib/database.types.ts` — manually maintained, must stay in sync with migrations
- **Event icons**: `src/components/event-icon.tsx` — `TYPE_ICONS` record must cover all EventType values

## Conventions

- Use TypeScript strict mode
- Prefer `const` over `let`
- Use named exports
- Tailwind classes for styling (no CSS modules)
- shadcn/ui for UI primitives (Button, Dialog, Select, etc.)
- Keep components focused — one responsibility per file
- Use Supabase migrations for schema changes (in `supabase/migrations/`)

## Common Gotchas

- Adding a new `EventType` requires updating BOTH `database.types.ts` AND the `TYPE_ICONS` record in `event-icon.tsx`
- Sidebar active state uses exact pathname match (`pathname === item.href`)
- dnd-kit uses `PointerSensor` with `distance: 8` activation constraint
- No `.env` files — Doppler injects all environment variables at runtime
