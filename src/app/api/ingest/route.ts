import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { authenticateRequest } from "@/lib/api-auth";

interface IngestEvent {
  event_type: string;
  title: string;
  agent_id?: string;
  source?: string;
  detail?: string;
  severity?: string;
  occurred_at?: string;
}

export async function POST(req: NextRequest) {
  const authError = authenticateRequest(req);
  if (authError) return authError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const events: IngestEvent[] = Array.isArray(body) ? body : [body];

  // Validate required fields
  for (const event of events) {
    if (!event.event_type || !event.title) {
      return NextResponse.json(
        { error: "Each event requires event_type and title" },
        { status: 400 }
      );
    }
  }

  const rows = events.map((e) => ({
    event_type: e.event_type,
    title: e.title,
    agent_id: e.agent_id ?? null,
    source: e.source ?? "api",
    detail: e.detail ?? null,
    severity: e.severity ?? "info",
    occurred_at: e.occurred_at ?? new Date().toISOString(),
  }));

  const supabase = getSupabaseServer();
  const { error } = await supabase.from("events").insert(rows);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ inserted: rows.length });
}
