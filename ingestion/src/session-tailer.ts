import { parseSessionLine, type ParsedSession } from "./session-parser.js";
import { supabase } from "./db.js";
import { open, stat } from "fs/promises";
import { watch } from "chokidar";

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

async function insertSessions(sessions: ParsedSession[]): Promise<void> {
  if (sessions.length === 0) return;

  for (let i = 0; i < sessions.length; i += 50) {
    const batch = sessions.slice(i, i + 50);
    const { error } = await supabase.from("sessions").insert(batch);
    if (error) {
      console.error(`[sessions] Error inserting batch: ${error.message}`);
      throw error;
    }
  }
}

export function tailSessionsLog(filePath: string): void {
  let processing = false;

  async function processNewLines() {
    if (processing) return;
    processing = true;

    try {
      const offset = await getOffset(filePath);
      const { lines, newOffset } = await readNewLines(filePath, offset);

      if (lines.length > 0) {
        const sessions = lines
          .map(parseSessionLine)
          .filter((s): s is ParsedSession => s !== null);

        console.log(
          `[sessions] Parsed ${sessions.length} sessions from ${lines.length} new lines`
        );

        await insertSessions(sessions);
        await saveOffset(filePath, newOffset);
      }
    } catch (err) {
      console.error("[sessions] Error processing:", err);
    } finally {
      processing = false;
    }
  }

  processNewLines();

  const watcher = watch(filePath, {
    persistent: true,
    usePolling: false,
    awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 },
  });

  watcher.on("change", () => {
    processNewLines();
  });

  console.log(`[sessions] Watching ${filePath}`);
}
