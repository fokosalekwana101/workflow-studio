import { createOpenAI } from "@ai-sdk/openai";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";
const RUN_ID_HEADER = "X-Lovable-AIG-Run-ID";

export type RunIdFetch = { fetch: typeof fetch; getRunId: () => string | undefined };

/** Wraps fetch so the gateway run id is propagated across calls in one request. */
export function createLovableAiGatewayRunIdFetch(initialRunId?: string): RunIdFetch {
  let runId = initialRunId;
  const wrapped: typeof fetch = async (input, init) => {
    const headers = new Headers(init?.headers);
    if (runId) headers.set(RUN_ID_HEADER, runId);
    const res = await fetch(input, { ...init, headers });
    const got = res.headers.get(RUN_ID_HEADER);
    if (got) runId = got;
    return res;
  };
  return { fetch: wrapped, getRunId: () => runId };
}

export function getLovableAiGatewayRunId(request: Request) {
  return request.headers.get(RUN_ID_HEADER) ?? undefined;
}

export function withLovableAiGatewayRunIdHeader(response: Response, runIdFetch: RunIdFetch) {
  const runId = runIdFetch.getRunId();
  if (!runId) return response;
  const headers = new Headers(response.headers);
  headers.set(RUN_ID_HEADER, runId);
  return new Response(response.body, { status: response.status, headers });
}

/** Responses-API provider for openai/* models via Lovable AI Gateway. */
export function createLovableResponsesProvider(key: string, runIdFetch: RunIdFetch) {
  return createOpenAI({
    baseURL: GATEWAY_URL,
    apiKey: key, // satisfies the SDK; the gateway authenticates on the header below
    headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
}

export const CHAT_MODEL = "openai/gpt-6-astra";

export const responsesProviderOptions = {
  openai: {
    forceReasoning: true,
    reasoningEffort: "low" as const,
    reasoningSummary: "auto" as const,
    store: false,
    include: ["reasoning.encrypted_content"],
  },
};

/** Maps gateway/SDK failures to safe, user-facing messages. */
export function toFriendlyError(error: unknown): { message: string; status: number } {
  const err = error as { statusCode?: number; status?: number; message?: string; responseBody?: string };
  const status = err?.statusCode ?? err?.status ?? 500;
  let upstream = "";
  try {
    upstream = err?.responseBody ? (JSON.parse(err.responseBody)?.error?.message ?? "") : "";
  } catch {
    upstream = "";
  }
  switch (status) {
    case 400:
      return { status, message: "The request was invalid. Please shorten or adjust your input and try again." };
    case 401:
      return { status, message: "AI is not configured correctly. Please check the workspace AI settings." };
    case 402:
      return { status, message: upstream || "AI credits are exhausted. Add credits in workspace settings to continue." };
    case 403:
      return { status, message: upstream || "This request was not permitted by the AI provider." };
    case 429:
      return { status, message: "Too many requests right now. Please wait a moment and try again." };
    default:
      return { status: 500, message: "The AI service is temporarily unavailable. Please try again shortly." };
  }
}
