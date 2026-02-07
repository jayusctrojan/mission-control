import { supabase } from "./db.js";

async function reset() {
  const env = process.env.NODE_ENV ?? "development";
  if (env === "production") {
    console.error("Refusing to reset in production environment.");
    process.exit(1);
  }

  const { error: e1 } = await supabase.from("events").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("Cleared events:", e1?.message ?? "OK");

  const { error: e2 } = await supabase.from("ingestion_state").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("Cleared ingestion_state:", e2?.message ?? "OK");
}

// Only run when invoked directly
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  reset();
}
