import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { authenticateRequest } from "@/lib/api-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = authenticateRequest(req);
  if (authError) return authError;

  const { id } = await params;
  const supabase = getSupabaseServer();

  const [missionRes, commentsRes] = await Promise.all([
    supabase.from("missions").select("*").eq("id", id).single(),
    supabase
      .from("mission_comments")
      .select("*")
      .eq("mission_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (missionRes.error) {
    return NextResponse.json(
      { error: missionRes.error.message },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ...missionRes.data,
    comments: commentsRes.data ?? [],
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = authenticateRequest(req);
  if (authError) return authError;

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const allowed = [
    "title",
    "description",
    "status",
    "priority",
    "assigned_agent_id",
    "due_at",
    "sort_order",
  ];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  if (update.status === "done") {
    update.completed_at = new Date().toISOString();
  }

  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("missions")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = authenticateRequest(req);
  if (authError) return authError;

  const { id } = await params;
  const supabase = getSupabaseServer();
  const { error } = await supabase.from("missions").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
