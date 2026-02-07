import { supabase } from "./db.js";

async function verify() {
  const { count: agentCount } = await supabase.from("agents").select("*", { count: "exact", head: true });
  const { count: eventCount } = await supabase.from("events").select("*", { count: "exact", head: true });
  const { count: errorCount } = await supabase.from("events").select("*", { count: "exact", head: true }).in("severity", ["error", "critical"]);

  const { data: recentEvents } = await supabase
    .from("events")
    .select("event_type, title, severity, agent_id, occurred_at")
    .order("occurred_at", { ascending: false })
    .limit(10);

  const { data: agents } = await supabase.from("agents").select("id, name, status");

  console.log(`Agents: ${agentCount}`);
  console.log(`Events: ${eventCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log("\n--- Recent Events ---");
  for (const e of recentEvents ?? []) {
    console.log(`  [${e.severity}] ${e.event_type}: ${e.title} (${e.agent_id ?? "system"}) @ ${e.occurred_at}`);
  }
  console.log("\n--- Agents ---");
  for (const a of agents ?? []) {
    console.log(`  ${a.id}: ${a.name} [${a.status}]`);
  }
}

verify();
