const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

export type ClaudeModel =
  | "claude-opus-4-7"
  | "claude-sonnet-4-6"
  | "claude-haiku-4-5-20251001";

export interface SystemBlock {
  type: "text";
  text: string;
  cache_control?: { type: "ephemeral" };
}

export interface MessagesRequest {
  model: ClaudeModel;
  max_tokens: number;
  system: SystemBlock[];
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  thinking?: { type: "disabled" } | { type: "adaptive" };
  output_config?: {
    format?: {
      type: "json_schema";
      schema: Record<string, unknown>;
    };
    effort?: "low" | "medium" | "high" | "max";
  };
}

interface MessagesResponse {
  content: Array<{ type: string; text?: string }>;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
}

export class ClaudeApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ClaudeApiError";
  }
}

export async function callClaude(
  body: MessagesRequest,
  opts: { signal?: AbortSignal } = {},
): Promise<MessagesResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new ClaudeApiError("ANTHROPIC_API_KEY is not set");
  }

  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
    signal: opts.signal,
  });

  if (!res.ok) {
    throw new ClaudeApiError(
      `Anthropic ${res.status}: ${await res.text()}`,
      res.status,
    );
  }

  return (await res.json()) as MessagesResponse;
}

export function extractText(res: MessagesResponse): string {
  return res.content
    .filter((b) => b.type === "text" && typeof b.text === "string")
    .map((b) => b.text!)
    .join("");
}
