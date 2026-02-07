import { supabase } from "./db.js";

async function reset() {
  const { error: e1 } = await supabase.from("events").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("Cleared events:", e1?.message ?? "OK");

  const { error: e2 } = await supabase.from("ingestion_state").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("Cleared ingestion_state:", e2?.message ?? "OK");
}

reset();
