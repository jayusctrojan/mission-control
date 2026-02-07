import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { authenticateRequest } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const authError = authenticateRequest(req);
  if (authError) return authError;

  const supabase = getSupabaseServer();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const agent = searchParams.get("agent");

  let query = supabase
    .from("missions")
    .select("*")
    .order("sort_order", { ascending: true });

  if (status) query = query.eq("status", status);
  if (agent) query = query.eq("assigned_agent_id", agent);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const authError = authenticateRequest(req);
  if (authError) return authError;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("missions")
    .insert({
      title: body.title as string,
      description: (body.description as string) ?? null,
      priority: (body.priority as string) ?? "medium",
      status: (body.status as string) ?? "backlog",
      assigned_agent_id: (body.assigned_agent_id as string) ?? null,
      created_by: (body.created_by as string) ?? null,
      source: (body.source as string) ?? "api",
      sort_order: Date.now(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
