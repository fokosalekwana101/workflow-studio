import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { FileText } from "lucide-react";
import { useState } from "react";
import { summarizeMeeting, type MeetingResult } from "@/lib/ai.functions";
import { useGeneration } from "@/lib/use-generation";
import { recordGeneration, useAppStore } from "@/lib/store";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
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
  PriorityBadge,
  RegenerateButton,
  SectionTitle,
  VerificationChecklist,
} from "@/components/shared/tool-kit";

export const Route = createFileRoute("/meetings")({
  head: () => ({
    meta: [
      { title: "Meeting Summarizer — WorkFlow Studio" },
      { name: "description", content: "Turn raw meeting notes into an executive summary, decisions and action items." },
      { property: "og:title", content: "Meeting Summarizer — WorkFlow Studio" },
      { property: "og:description", content: "Turn raw meeting notes into an executive summary, decisions and action items." },
    ],
  }),
  component: MeetingsPage,
});

const CHECKLIST = ["Decisions verified", "Action items verified", "Owners verified", "Deadlines verified"];

const SAMPLE = `Weekly product sync — attendees: Dana (PM), Luis (Eng lead), Amara (Design), Tom (Support)

Dana: Q3 roadmap review. Onboarding redesign is top priority. We agreed to ship v1 by 12 Oct.
Luis: Backend migration is 70% done. Needs two more weeks. Risk: analytics pipeline not tested yet.
Amara: Will share final onboarding mockups Thursday. Needs copy from marketing.
Tom: Support tickets on export failures up 30% this month. Wants a fix prioritised.
Decision: export bug goes into this sprint, Luis owns it.
Decision: pause the dark-mode work until onboarding ships.
Dana to email leadership with revised timeline. Amara to book usability sessions.`;

function toMarkdown(items: MeetingResult["actionItems"]) {
  return items
    .map(
      (i) =>
        `- [ ] **${i.task}**\n  - Owner: ${i.owner}\n  - Deadline: ${i.deadline}\n  - Priority: ${i.priority}`,
    )
    .join("\n");
}

function summaryMarkdown(r: MeetingResult) {
  return `## Executive Summary\n${r.summary}\n\n## Key Decisions\n${r.decisions.map((d) => `- ${d}`).join("\n") || "- None recorded"}\n\n## Action Items\n${toMarkdown(r.actionItems) || "- None recorded"}`;
}

function MeetingsPage() {
  const { settings } = useAppStore();
  const fn = useServerFn(summarizeMeeting);
  const [notes, setNotes] = useState("");

  const { state, run, regenerate, reset } = useGeneration(async (input: { notes: string; style: typeof settings.responseStyle }) => {
    const r = await fn({ data: input });
    recordGeneration("meetings", "Meeting summarized");
    return r;
  });

  const canGenerate = notes.trim().length >= 40;

  return (
    <>
      <PageHeader
        icon={FileText}
        title="Meeting Notes Summarizer"
        description="Paste a transcript or raw notes. Get an executive summary, the decisions that were actually made, and copyable action items — with 'Not specified' wherever the source is silent."
      />
      <DualPane
        input={
          <div className="space-y-5">
            <Field label="Transcript or raw notes" required hint={`${notes.trim().length} chars · min 40`}>
              <Textarea
                rows={16}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Paste meeting notes, a call transcript or bullet points…"
                className="resize-none font-mono text-[13px] leading-6"
              />
            </Field>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" onClick={() => setNotes(SAMPLE)}>
              Insert sample notes
            </Button>
            <ActionBar
              onGenerate={() => run({ notes: notes.trim(), style: settings.responseStyle })}
              onReset={() => {
                setNotes("");
                reset();
              }}
              canGenerate={canGenerate}
              loading={state.status === "loading"}
              label="Summarize meeting"
            />
          </div>
        }
        output={
          state.status === "idle" ? (
            <EmptyState icon={FileText} title="Summary will appear here" body="Paste notes on the left. The AI extracts a summary, decisions and action items without adding anything you didn't say." />
          ) : state.status === "loading" ? (
            <LoadingState label="Summarizing meeting…" />
          ) : state.status === "error" ? (
            <ErrorState message={state.message} onRetry={regenerate} />
          ) : (
            <div className="animate-fade-up">
              <OutputFrame
                title="Meeting summary"
                toolbar={
                  <>
                    <CopyButton text={summaryMarkdown(state.data)} label="Copy summary" />
                    <CopyButton text={toMarkdown(state.data.actionItems)} label="Copy action items" />
                    <RegenerateButton onClick={regenerate} />
                  </>
                }
              >
                <div className="mb-5">
                  <AiLabel />
                </div>
                <SectionTitle>Executive summary</SectionTitle>
                <p className="doc-prose mb-8">{state.data.summary}</p>

                <SectionTitle>Key decisions</SectionTitle>
                {state.data.decisions.length ? (
                  <ol className="mb-8 space-y-2">
                    {state.data.decisions.map((d, i) => (
                      <li key={i} className="flex gap-3 text-[15px] leading-7">
                        <span className="mt-1.5 h-4 w-4 shrink-0 rounded-sm border text-center font-mono text-[10px] leading-4 text-muted-foreground">{i + 1}</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mb-8 text-sm text-muted-foreground">No explicit decisions were found in the notes.</p>
                )}

                <SectionTitle aside={<span className="text-[11px] text-muted-foreground">{state.data.actionItems.length} items</span>}>
                  Action items
                </SectionTitle>
                {state.data.actionItems.length ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {state.data.actionItems.map((item, i) => (
                      <div key={i} className="group rounded-lg border bg-card p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-medium leading-5">{item.task}</p>
                          <CopyButton
                            size="icon"
                            variant="ghost"
                            text={`- [ ] **${item.task}**\n  - Owner: ${item.owner}\n  - Deadline: ${item.deadline}\n  - Priority: ${item.priority}`}
                          />
                        </div>
                        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                          <dt className="text-muted-foreground">Owner</dt>
                          <dd className={item.owner.toLowerCase().includes("not specified") ? "italic text-muted-foreground" : ""}>{item.owner}</dd>
                          <dt className="text-muted-foreground">Deadline</dt>
                          <dd className={item.deadline.toLowerCase().includes("not specified") ? "italic text-muted-foreground" : ""}>{item.deadline}</dd>
                          <dt className="text-muted-foreground">Priority</dt>
                          <dd>
                            <PriorityBadge priority={item.priority} />
                          </dd>
                        </dl>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No action items were found in the notes.</p>
                )}
              </OutputFrame>
              <VerificationChecklist items={CHECKLIST} resetKey={state.runId} />
            </div>
          )
        }
      />
    </>
  );
}
