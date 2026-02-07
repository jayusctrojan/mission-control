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
  // cost_event specific fields
  model?: string;
  provider?: string;
  input_tokens?: number;
  output_tokens?: number;
  cost_usd?: number;
  session_id?: string;
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

  const supabase = getSupabaseServer();

  // Separate cost events from regular events
  const costEvents = events.filter((e) => e.event_type === "cost_event");
  const regularEvents = events.filter((e) => e.event_type !== "cost_event");

  let insertedRegular = 0;
  let insertedCosts = 0;

  // Insert regular events
  if (regularEvents.length > 0) {
    const rows = regularEvents.map((e) => ({
      event_type: e.event_type,
      title: e.title,
      agent_id: e.agent_id ?? null,
      source: e.source ?? "api",
      detail: e.detail ?? null,
      severity: e.severity ?? "info",
      occurred_at: e.occurred_at ?? new Date().toISOString(),
    }));

    const { error } = await supabase.from("events").insert(rows);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    insertedRegular = rows.length;
  }

  // Insert cost events into cost_events table + events table
  if (costEvents.length > 0) {
    const costRows = costEvents.map((e) => ({
      agent_id: e.agent_id ?? null,
      model: e.model ?? "unknown",
      provider: e.provider ?? "other",
      input_tokens: e.input_tokens ?? 0,
      output_tokens: e.output_tokens ?? 0,
      cost_usd: e.cost_usd ?? 0,
      session_id: e.session_id ?? null,
      occurred_at: e.occurred_at ?? new Date().toISOString(),
    }));

    const { error: costError } = await supabase.from("cost_events").insert(costRows);
    if (costError) {
      return NextResponse.json(
        { error: costError.message, inserted: insertedRegular },
        { status: insertedRegular > 0 ? 207 : 500 }
      );
    }

    // Also insert into events table for the activity feed
    const eventRows = costEvents.map((e) => ({
      event_type: "cost_event",
      title: e.title,
      agent_id: e.agent_id ?? null,
      source: e.source ?? "api",
      detail: e.detail ?? null,
      severity: e.severity ?? "info",
      occurred_at: e.occurred_at ?? new Date().toISOString(),
    }));

    const { error: mirrorError } = await supabase.from("events").insert(eventRows);
    if (mirrorError) {
      console.error("Cost event activity-feed mirror insert failed:", mirrorError.message);
    }
    insertedCosts = costRows.length;
  }

  return NextResponse.json({
    inserted: insertedRegular + insertedCosts,
    costs: insertedCosts,
  });
}
