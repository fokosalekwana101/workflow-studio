import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Search, AlertTriangle, ListChecks, Target } from "lucide-react";
import { useState } from "react";
import { researchTopic, type ResearchResult } from "@/lib/ai.functions";
import { useGeneration } from "@/lib/use-generation";
import { recordGeneration, useAppStore } from "@/lib/store";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  ActionBar,
  AiLabel,
  CopyButton,
  DualPane,
  EmptyState,
  ErrorState,
  Field,
  LoadingState,
  OutputFrame,
  PageHeader,
  RegenerateButton,
  SectionTitle,
  VerificationChecklist,
} from "@/components/shared/tool-kit";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "Research Assistant — WorkFlow Studio" },
      {
        name: "description",
        content: "Turn a topic or pasted source into a plain-English briefing with takeaways, risks and recommendations.",
      },
      { property: "og:title", content: "Research Assistant — WorkFlow Studio" },
      {
        property: "og:description",
        content: "Turn a topic or pasted source into a plain-English briefing with takeaways, risks and recommendations.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResearchPage,
});

const CHECKLIST = ["Facts verified", "Sources verified", "Risks reviewed", "Recommendations reviewed"];

function toMarkdown(topic: string, r: ResearchResult) {
  return `# Research briefing: ${topic}\n_AI-generated · review required · confidence: ${r.confidence}_\n\n## Plain-English summary\n${r.summary}\n\n## Key takeaways\n${r.takeaways.map((t) => `- ${t}`).join("\n")}\n\n## Potential risks\n${r.risks.map((t) => `- ${t}`).join("\n")}\n\n## Actionable recommendations\n${r.recommendations.map((t) => `- ${t}`).join("\n")}\n\n## Uncertainty\n${r.confidenceNote}`;
}

function Bullets({ items, icon: Icon }: { items: string[]; icon: typeof Target }) {
  return (
    <ul className="grid gap-2">
      {items.map((t, i) => (
        <li key={i} className="flex gap-2.5 rounded-lg border bg-card p-3 text-sm leading-6">
          <Icon className="mt-1.5 size-3.5 shrink-0 text-muted-foreground" strokeWidth={1.8} />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function ResearchPage() {
  const { settings } = useAppStore();
  const fn = useServerFn(researchTopic);
  const [topic, setTopic] = useState("");
  const [source, setSource] = useState("");

  const { state, run, regenerate, reset } = useGeneration(
    async (input: { topic: string; source: string; style: typeof settings.responseStyle }) => {
      const r = await fn({ data: input });
      recordGeneration("research", input.topic);
      return r;
    },
  );

  const canGenerate = topic.trim().length >= 3;

  return (
    <>
      <PageHeader
        icon={Search}
        title="AI Research Assistant"
        description="Ask about a topic, or paste an article or report. You get a plain-English briefing with takeaways, risks and recommendations — grounded in what you provide, never invented sources."
      />
      <DualPane
        input={
          <div className="space-y-5">
            <Field label="Topic or question" required>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. What should we know before switching CRM vendors?"
              />
            </Field>
            <Field label="Source material" hint="Optional">
              <Textarea
                rows={12}
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Paste an article, report extract or internal note. Without a source, the briefing stays general and says so."
                className="resize-none"
              />
            </Field>
            <ActionBar
              onGenerate={() =>
                run({ topic: topic.trim(), source: source.trim(), style: settings.responseStyle })
              }
              onReset={() => {
                setTopic("");
                setSource("");
                reset();
              }}
              canGenerate={canGenerate}
              loading={state.status === "loading"}
              label="Build briefing"
            />
          </div>
        }
        output={
          state.status === "idle" ? (
            <EmptyState
              icon={Search}
              title="Your briefing will appear here"
              body="Enter a topic. Pasting source text produces a grounded briefing with clearer confidence."
            />
          ) : state.status === "loading" ? (
            <LoadingState label="Building your briefing…" />
          ) : state.status === "error" ? (
            <ErrorState message={state.message} onRetry={regenerate} />
          ) : (
            <div className="animate-fade-up">
              <OutputFrame
                title="Research briefing"
                toolbar={
                  <>
                    <CopyButton text={toMarkdown(topic, state.data)} label="Copy briefing" />
                    <RegenerateButton onClick={regenerate} />
                  </>
                }
              >
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <AiLabel>AI-generated briefing · verify before use</AiLabel>
                  <span className="rounded-sm border bg-muted px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    Confidence: {state.data.confidence}
                  </span>
                </div>

                <h2 className="text-lg font-semibold tracking-tight">{topic}</h2>

                <div className="mt-5">
                  <SectionTitle>Plain-English summary</SectionTitle>
                  <p className="doc-prose text-sm leading-7">{state.data.summary}</p>
                </div>

                <div className="mt-7">
                  <SectionTitle>Key takeaways</SectionTitle>
                  <Bullets items={state.data.takeaways} icon={ListChecks} />
                </div>

                <div className="mt-7">
                  <SectionTitle>Potential risks</SectionTitle>
                  <Bullets items={state.data.risks} icon={AlertTriangle} />
                </div>

                <div className="mt-7">
                  <SectionTitle
                    aside={<span className="text-[11px] text-muted-foreground">AI-generated suggestions</span>}
                  >
                    Actionable recommendations
                  </SectionTitle>
                  <Bullets items={state.data.recommendations} icon={Target} />
                </div>

                <p className="mt-7 rounded-lg border bg-surface p-3 text-xs leading-6 text-muted-foreground">
                  <span className="font-medium text-foreground">Uncertainty: </span>
                  {state.data.confidenceNote}
                </p>
              </OutputFrame>
              <VerificationChecklist items={CHECKLIST} resetKey={state.runId} />
            </div>
          )
        }
      />
    </>
  );
}
