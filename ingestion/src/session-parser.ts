// Parse session JSONL lines into sessions table rows

export interface ParsedSession {
  agent_id: string;
  started_at: string;
  ended_at: string | null;
  message_count: number;
  total_cost: number | null;
  tools_used: string[];
  summary: string | null;
}

interface SessionJsonLine {
  type?: string;
  session_id?: string;
  agent_id?: string;
  timestamp?: string;
  message_count?: number;
  total_cost?: number;
  tools_used?: string[];
  summary?: string;
  started_at?: string;
  ended_at?: string;
}

export function parseSessionLine(line: string): ParsedSession | null {
  try {
    const data: SessionJsonLine = JSON.parse(line);

    // We expect a session record with at minimum agent_id
    if (!data.agent_id) return null;

    return {
      agent_id: data.agent_id,
      started_at: data.started_at ?? data.timestamp ?? new Date().toISOString(),
      ended_at: data.ended_at ?? null,
      message_count: data.message_count ?? 0,
      total_cost: data.total_cost ?? null,
      tools_used: data.tools_used ?? [],
      summary: data.summary ?? null,
    };
  } catch {
    return null;
  }
}
