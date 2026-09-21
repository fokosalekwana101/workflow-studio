import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import {
  CHAT_MODEL,
  createLovableAiGatewayRunIdFetch,
  createLovableResponsesProvider,
  getLovableAiGatewayRunId,
  responsesProviderOptions,
  toFriendlyError,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/ai-gateway.server";
import { buildChatSystemPrompt } from "@/lib/prompts.server";

type ChatRequestBody = { messages?: unknown; style?: "concise" | "detailed" };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatRequestBody;
        const { messages } = body;
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const key = process.env["LOVABLE_API_KEY"];
        if (!key) {
          return new Response("AI is not configured for this workspace yet.", { status: 500 });
        }

        const initialRunId = getLovableAiGatewayRunId(request);
        const runIdFetch = createLovableAiGatewayRunIdFetch(initialRunId);
        const lovable = createLovableResponsesProvider(key, runIdFetch);

        try {
          const result = streamText({
            model: lovable.responses(CHAT_MODEL),
            system: buildChatSystemPrompt(body.style === "detailed" ? "detailed" : "concise"),
            messages: await convertToModelMessages(messages as UIMessage[]),
            providerOptions: responsesProviderOptions,
          });

          return withLovableAiGatewayRunIdHeader(
            result.toUIMessageStreamResponse({
              originalMessages: messages as UIMessage[],
              sendReasoning: false,
              onError: (error) => toFriendlyError(error).message,
              ...(initialRunId ? { headers: { "X-Lovable-AIG-Run-ID": initialRunId } } : {}),
            }),
            runIdFetch,
          );
        } catch (error) {
          const friendly = toFriendlyError(error);
          return new Response(friendly.message, { status: friendly.status });
        }
      },
    },
  },
});
