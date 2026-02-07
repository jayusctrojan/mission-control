// Extracts cost data from Claude Code session JSONL lines
// Looks for usage/cost metadata in the JSON output

export interface ParsedCostEvent {
  agent_id: string;
  model: string;
  provider: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  session_id: string | null;
  occurred_at: string;
}

// Model → provider mapping
const MODEL_PROVIDERS: Record<string, string> = {
  "opus-4-5": "anthropic",
  "claude-opus-4-5": "anthropic",
  "sonnet-4-5": "anthropic",
  "claude-sonnet-4-5": "anthropic",
  "haiku-4-5": "anthropic",
  "claude-haiku-4-5": "anthropic",
  "gpt-4o": "openai",
  "gpt-4-turbo": "openai",
  "o1": "openai",
  "o3": "openai",
  "gemini-3-flash": "google",
  "gemini-2.5-pro": "google",
  "grok-3": "xai",
  "deepseek-r1": "together",
  "kimi-k2": "together",
};

function inferProvider(model: string): string {
  // Check exact match first
  if (MODEL_PROVIDERS[model]) return MODEL_PROVIDERS[model];
  // Check prefix match
  for (const [key, provider] of Object.entries(MODEL_PROVIDERS)) {
    if (model.includes(key)) return provider;
  }
  if (model.startsWith("claude") || model.includes("opus") || model.includes("sonnet") || model.includes("haiku")) return "anthropic";
  if (model.startsWith("gpt") || model.startsWith("o1") || model.startsWith("o3")) return "openai";
  if (model.startsWith("gemini")) return "google";
  if (model.startsWith("grok")) return "xai";
  return "other";
}

export function parseCostLine(
  line: string,
  agentId: string
): ParsedCostEvent | null {
  try {
    const data = JSON.parse(line);

    // Look for cost/usage data in various formats
    const usage = data.usage ?? data.costEvent ?? data.cost;
    if (!usage) return null;

    const model = usage.model ?? data.model ?? "unknown";
    const inputTokens = usage.input_tokens ?? usage.inputTokens ?? usage.prompt_tokens ?? 0;
    const outputTokens = usage.output_tokens ?? usage.outputTokens ?? usage.completion_tokens ?? 0;
    const costUsd = usage.cost_usd ?? usage.costUsd ?? usage.total_cost ?? 0;

    // Skip if no meaningful data
    if (inputTokens === 0 && outputTokens === 0 && costUsd === 0) return null;

    return {
      agent_id: agentId,
      model,
      provider: usage.provider ?? inferProvider(model),
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_usd: costUsd,
      session_id: usage.session_id ?? data.session_id ?? null,
      occurred_at: data.timestamp ?? data.occurred_at ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
