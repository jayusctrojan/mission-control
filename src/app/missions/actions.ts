"use server";

import { getSupabaseServer } from "@/lib/supabase-server";
import type { MissionStatus, MissionPriority } from "@/lib/database.types";

export async function updateMissionStatus(
  id: string,
  status: MissionStatus,
  sort_order: number
) {
  const supabase = getSupabaseServer();
  const update: Record<string, unknown> = { status, sort_order };
  if (status === "done") {
    update.completed_at = new Date().toISOString();
  }
  const { error } = await supabase.from("missions").update(update).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function createMission(data: {
  title: string;
  description?: string;
  priority?: MissionPriority;
  assigned_agent_id?: string | null;
  status?: MissionStatus;
}) {
  const supabase = getSupabaseServer();
  const { error } = await supabase.from("missions").insert({
    title: data.title,
    description: data.description ?? null,
    priority: data.priority ?? "medium",
    assigned_agent_id: data.assigned_agent_id ?? null,
    status: data.status ?? "backlog",
    source: "manual",
    sort_order: Date.now(),
  });
  if (error) throw new Error(error.message);
}

export async function updateMission(
  id: string,
  data: {
    title?: string;
    description?: string;
    priority?: MissionPriority;
    assigned_agent_id?: string | null;
    due_at?: string | null;
  }
) {
  const supabase = getSupabaseServer();
  const { error } = await supabase.from("missions").update(data).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteMission(id: string) {
  const supabase = getSupabaseServer();
  const { error } = await supabase.from("missions").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function addComment(
  mission_id: string,
  body: string,
  agent_id?: string | null
) {
  const supabase = getSupabaseServer();
  const { error } = await supabase.from("mission_comments").insert({
    mission_id,
    body,
    agent_id: agent_id ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function getComments(mission_id: string) {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("mission_comments")
    .select("*")
    .eq("mission_id", mission_id)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}
