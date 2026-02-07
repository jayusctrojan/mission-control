import { readFile } from "fs/promises";
import { watch } from "chokidar";
import { supabase } from "./db.js";

interface ParsedMission {
  title: string;
  status: string;
  markdown_ref: string;
  completed: boolean;
}

const STATUS_MAP: Record<string, string> = {
  backlog: "backlog",
  "to do": "backlog",
  todo: "backlog",
  "in progress": "in_progress",
  doing: "in_progress",
  review: "review",
  done: "done",
  completed: "done",
};

function normalizeStatus(header: string): string {
  const lower = header.toLowerCase().trim();
  return STATUS_MAP[lower] ?? "backlog";
}

function parseTaskQueue(content: string, filePath: string): ParsedMission[] {
  const missions: ParsedMission[] = [];
  let currentStatus = "backlog";
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // ## Section headers define status columns
    const headerMatch = line.match(/^##\s+(.+)$/);
    if (headerMatch) {
      currentStatus = normalizeStatus(headerMatch[1]);
      continue;
    }

    // - [ ] unchecked or - [x] checked items are missions
    const taskMatch = line.match(/^-\s+\[([ xX])\]\s+(.+)$/);
    if (taskMatch) {
      const completed = taskMatch[1] !== " ";
      const title = taskMatch[2].trim();
      // Use stable identifier based on file + title only (not status, which changes when tasks move)
      const markdownRef = `${filePath}:${title}`;

      missions.push({
        title,
        status: completed ? "done" : currentStatus,
        markdown_ref: markdownRef,
        completed,
      });
    }
  }

  return missions;
}

async function syncMissions(filePath: string): Promise<void> {
  let content: string;
  try {
    content = await readFile(filePath, "utf-8");
  } catch {
    console.error(`[markdown-sync] Cannot read ${filePath}`);
    return;
  }

  const parsed = parseTaskQueue(content, filePath);
  if (parsed.length === 0) return;

  console.log(
    `[markdown-sync] Parsed ${parsed.length} missions from ${filePath}`
  );

  for (const mission of parsed) {
    const { data: existing } = await supabase
      .from("missions")
      .select("id")
      .eq("markdown_ref", mission.markdown_ref)
      .maybeSingle();

    if (existing) {
      const { error: updateErr } = await supabase
        .from("missions")
        .update({
          title: mission.title,
          status: mission.status,
          completed_at: mission.completed ? new Date().toISOString() : null,
        })
        .eq("id", existing.id);
      if (updateErr) {
        console.error(`[markdown-sync] Update failed for "${mission.title}":`, updateErr.message);
      }
    } else {
      const { error: insertErr } = await supabase.from("missions").insert({
        title: mission.title,
        status: mission.status,
        source: "markdown",
        markdown_ref: mission.markdown_ref,
        sort_order: Date.now(),
        completed_at: mission.completed ? new Date().toISOString() : null,
      });
      if (insertErr) {
        console.error(`[markdown-sync] Insert failed for "${mission.title}":`, insertErr.message);
      }
    }
  }

  console.log(`[markdown-sync] Synced ${parsed.length} missions`);
}

export function watchTaskQueue(filePath: string): void {
  // Initial sync
  syncMissions(filePath).catch((err) =>
    console.error("[markdown-sync] Initial sync error:", err)
  );

  const watcher = watch(filePath, {
    persistent: true,
    usePolling: false,
    awaitWriteFinish: { stabilityThreshold: 1000, pollInterval: 200 },
  });

  watcher.on("change", () => {
    console.log("[markdown-sync] task-queue.md changed, re-syncing...");
    syncMissions(filePath).catch((err) =>
      console.error("[markdown-sync] Sync error:", err)
    );
  });

  console.log(`[markdown-sync] Watching ${filePath}`);
}
