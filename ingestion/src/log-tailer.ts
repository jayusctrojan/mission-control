import { open, stat } from "fs/promises";
import { watch } from "chokidar";
import { supabase } from "./db.js";
import { parseGatewayLine, parseWatchdogLine, type ParsedEvent } from "./log-parser.js";

type LineParser = (line: string) => ParsedEvent | null;

async function getOffset(filePath: string): Promise<number> {
  const { data } = await supabase
    .from("ingestion_state")
    .select("last_offset")
    .eq("file_path", filePath)
    .single();
  return data?.last_offset ?? 0;
}

async function saveOffset(filePath: string, offset: number): Promise<void> {
  await supabase
    .from("ingestion_state")
    .upsert(
      { file_path: filePath, last_offset: offset },
      { onConflict: "file_path" }
    );
}

async function readNewLines(
  filePath: string,
  fromOffset: number
): Promise<{ lines: string[]; newOffset: number }> {
  const fileStat = await stat(filePath).catch(() => null);
  if (!fileStat) return { lines: [], newOffset: fromOffset };

  // If file was truncated/rotated, start from beginning
  const startOffset = fileStat.size < fromOffset ? 0 : fromOffset;

  if (fileStat.size <= startOffset) {
    return { lines: [], newOffset: startOffset };
  }

  const handle = await open(filePath, "r");
  try {
    const buf = Buffer.alloc(fileStat.size - startOffset);
    await handle.read(buf, 0, buf.length, startOffset);
    const text = buf.toString("utf-8");
    const lines = text.split("\n").filter((l) => l.trim().length > 0);
    return { lines, newOffset: fileStat.size };
  } finally {
    await handle.close();
  }
}

// Cache valid agent IDs to avoid FK violations
let validAgentIds: Set<string> | null = null;

async function getValidAgentIds(): Promise<Set<string>> {
  if (validAgentIds) return validAgentIds;
  const { data } = await supabase.from("agents").select("id");
  validAgentIds = new Set((data ?? []).map((r: { id: string }) => r.id));
  return validAgentIds;
}

// Call this after agent sync to refresh the cache
export function invalidateAgentCache(): void {
  validAgentIds = null;
}

async function insertEvents(events: ParsedEvent[]): Promise<void> {
  if (events.length === 0) return;

  const agentIds = await getValidAgentIds();

  // Null out agent_ids that don't exist in the agents table
  const cleaned = events.map((e) => ({
    ...e,
    agent_id: e.agent_id && agentIds.has(e.agent_id) ? e.agent_id : null,
  }));

  // Batch insert, max 100 at a time
  for (let i = 0; i < cleaned.length; i += 100) {
    const batch = cleaned.slice(i, i + 100);
    const { error } = await supabase.from("events").insert(batch);
    if (error) {
      console.error(`[insert] Error inserting events batch: ${error.message}`);
    }
  }
}

// Update agent statuses based on bot_start events
async function updateAgentStatuses(events: ParsedEvent[]): Promise<void> {
  const botStarts = events.filter(
    (e) => e.event_type === "bot_start" && e.agent_id
  );
  for (const ev of botStarts) {
    await supabase
      .from("agents")
      .update({ status: "online", last_seen_at: ev.occurred_at })
      .eq("id", ev.agent_id!);
  }

  // If gateway received SIGTERM, mark all agents offline
  const shutdowns = events.filter(
    (e) =>
      e.event_type === "bot_stop" &&
      e.title.includes("SIGTERM")
  );
  if (shutdowns.length > 0) {
    await supabase
      .from("agents")
      .update({ status: "offline" })
      .neq("id", "__never__"); // update all
  }
}

export function tailLog(
  filePath: string,
  parser: LineParser,
  label: string
): void {
  let processing = false;

  async function processNewLines() {
    if (processing) return;
    processing = true;

    try {
      const offset = await getOffset(filePath);
      const { lines, newOffset } = await readNewLines(filePath, offset);

      if (lines.length > 0) {
        const events = lines
          .map(parser)
          .filter((e): e is ParsedEvent => e !== null);

        console.log(
          `[${label}] Parsed ${events.length} events from ${lines.length} new lines`
        );

        await insertEvents(events);
        await updateAgentStatuses(events);
        await saveOffset(filePath, newOffset);
      }
    } catch (err) {
      console.error(`[${label}] Error processing:`, err);
    } finally {
      processing = false;
    }
  }

  // Initial read
  processNewLines();

  // Watch for changes
  const watcher = watch(filePath, {
    persistent: true,
    usePolling: false,
    awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 },
  });

  watcher.on("change", () => {
    processNewLines();
  });

  console.log(`[${label}] Watching ${filePath}`);
}

export function tailGatewayLog(filePath: string): void {
  tailLog(filePath, parseGatewayLine, "gateway");
}

export function tailWatchdogLog(filePath: string): void {
  tailLog(filePath, parseWatchdogLine, "watchdog");
}
