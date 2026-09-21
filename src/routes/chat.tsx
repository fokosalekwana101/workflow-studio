import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { AlertTriangle, Eraser, MessageSquare, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/Logo";
import { AiLabel, CopyButton, PageHeader, VerificationChecklist } from "@/components/shared/tool-kit";
import { recordChat, useAppStore } from "@/lib/store";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Chat — WorkFlow Studio" },
      { name: "description", content: "A workplace productivity assistant for drafting, summarising and planning." },
      { property: "og:title", content: "AI Chat — WorkFlow Studio" },
      {
        property: "og:description",
        content: "A workplace productivity assistant for drafting, summarising and planning.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatPage,
});

const SUGGESTIONS = [
  "Summarize this document",
  "Help me write a professional email",
  "Turn these tasks into a schedule",
  "Explain this topic simply",
  "Prepare talking points for my meeting",
];

const CHECKLIST = ["Response reviewed", "Facts verified", "No sensitive information shared"];

const textOf = (m: UIMessage) =>
  m.parts
    .filter((p) => p.type === "text")
    .map((p) => (p as { text: string }).text)
    .join("");

function ChatPage() {
  const { settings } = useAppStore();
  const [input, setInput] = useState("");

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat", body: { style: settings.responseStyle } }),
    [settings.responseStyle],
  );

  const { messages, sendMessage, status, stop, error, setMessages, regenerate, clearError } = useChat({
    transport,
  });

  const busy = status === "submitted" || status === "streaming";

  const send = (text: string) => {
    const value = text.trim();
    if (!value || busy) return;
    clearError();
    void sendMessage({ text: value });
    recordChat(value.length > 60 ? `${value.slice(0, 60)}…` : value);
    setInput("");
  };

  const lastAssistantId = [...messages].reverse().find((m) => m.role === "assistant")?.id;

  return (
    <>
      <PageHeader
        icon={MessageSquare}
        title="AI Chat"
        description="A workplace assistant for drafting, summarising, planning and explaining. Responses stream in Markdown and always need your review."
        actions={
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            disabled={messages.length === 0 || busy}
            onClick={() => {
              setMessages([]);
              clearError();
            }}
          >
            <Eraser className="size-3.5" /> Clear conversation
          </Button>
        }
      />

      <div className="flex h-[calc(100vh-15rem)] min-h-[520px] flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
        <Conversation className="flex-1">
          <ConversationContent className="mx-auto w-full max-w-3xl">
            {messages.length === 0 && (
              <ConversationEmptyState
                icon={<Logo className="size-9" />}
                title="What are we getting done today?"
                description="Ask anything about workplace writing, meetings, planning or research."
              />
            )}

            {messages.map((m) => (
              <Message from={m.role} key={m.id}>
                <MessageContent>
                  {m.role === "assistant" ? (
                    <MessageResponse>{textOf(m)}</MessageResponse>
                  ) : (
                    <span className="whitespace-pre-wrap">{textOf(m)}</span>
                  )}
                </MessageContent>

                {m.role === "assistant" && textOf(m).length > 0 && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <AiLabel />
                      <CopyButton text={textOf(m)} label="Copy response" />
                      {m.id === lastAssistantId && !busy && (
                        <Button variant="outline" size="sm" className="h-8" onClick={() => void regenerate()}>
                          <RotateCcw className="size-3.5" /> Regenerate
                        </Button>
                      )}
                    </div>
                    {m.id === lastAssistantId && !busy && (
                      <VerificationChecklist items={CHECKLIST} resetKey={m.id} />
                    )}
                  </div>
                )}
              </Message>
            ))}

            {status === "submitted" && (
              <Message from="assistant">
                <MessageContent>
                  <Shimmer>Thinking…</Shimmer>
                </MessageContent>
              </Message>
            )}

            {error && (
              <div className="mx-auto flex w-full max-w-xl items-start gap-3 rounded-lg border bg-surface p-4 text-sm animate-fade-in">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">Message failed</p>
                  <p className="mt-1 text-muted-foreground">{error.message}</p>
                </div>
                <Button variant="outline" size="sm" className="h-8" onClick={() => void regenerate()}>
                  <RotateCcw className="size-3.5" /> Retry
                </Button>
              </div>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <div className="border-t bg-surface p-3 md:p-4">
          <div className="mx-auto w-full max-w-3xl space-y-3">
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={busy}
                  onClick={() => send(s)}
                  className="rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>

            <PromptInput
              onSubmit={(_message, event) => {
                event.preventDefault();
                send(input);
              }}
            >
              <PromptInputTextarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about an email, a meeting, a plan or a topic…"
              />
              <PromptInputFooter className="justify-end">
                <PromptInputSubmit
                  status={status}
                  disabled={!busy && input.trim().length === 0}
                  onStop={stop}
                />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>
      </div>
    </>
  );
}
