import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CalendarClock, Lightbulb } from "lucide-react";
import { useState } from "react";
import { planTasks, type TaskPlanResult } from "@/lib/ai.functions";
import { useGeneration } from "@/lib/use-generation";
import { recordGeneration, useAppStore } from "@/lib/store";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Task Planner — WorkFlow Studio" },
      { name: "description", content: "Turn an unstructured task list into a prioritized, time-blocked schedule." },
      { property: "og:title", content: "Task Planner — WorkFlow Studio" },
      { property: "og:description", content: "Turn an unstructured task list into a prioritized, time-blocked schedule." },
    ],
  }),
  component: TasksPage,
});

const CHECKLIST = ["Priorities verified", "Time estimates reviewed", "Schedule conflicts checked"];

const SAMPLE = `Finish quarterly budget spreadsheet (due today)
Reply to 12 unread emails
Prepare slides for Thursday's client review
1:1 with Sam at 14:00
Review two pull requests
Book travel for the conference
Read the competitor report
Update the project tracker`;

function toMarkdown(r: TaskPlanResult) {
  const rows = r.schedule.map((s) => `| ${s.time} | ${s.task} | ${s.duration} | ${s.priority} | ${s.notes} |`).join("\n");
  return `## AI-generated schedule (recommendation)\n${r.summary}\n\n| Time | Task | Duration | Priority | Notes |\n|---|---|---|---|---|\n${rows}\n\n## Time optimization suggestions\n${r.suggestions.map((s) => `- ${s}`).join("\n")}`;
}

function TasksPage() {
  const { settings } = useAppStore();
  const fn = useServerFn(planTasks);
  const [tasks, setTasks] = useState("");
  const [hours, setHours] = useState("09:00 – 17:30");
  const [priorities, setPriorities] = useState("");

  const { state, run, regenerate, reset } = useGeneration(
    async (input: { tasks: string; hours: string; priorities: string; style: typeof settings.responseStyle }) => {
      const r = await fn({ data: input });
      recordGeneration("tasks", `${r.schedule.length} tasks scheduled`);
      return r;
    },
  );

  const canGenerate = tasks.trim().length >= 10 && hours.trim().length >= 3;

  return (
    <>
      <PageHeader
        icon={CalendarClock}
        title="AI Task Planner & Scheduler"
        description="Drop in an unstructured task list and your working hours. Get a prioritized, time-blocked plan with buffers, plus suggestions to protect focus time. Presented as a recommendation, not a guarantee."
      />
      <DualPane
        input={
          <div className="space-y-5">
            <Field label="Task list" required hint="One task per line">
              <Textarea rows={9} value={tasks} onChange={(e) => setTasks(e.target.value)} placeholder="Paste or type everything on your plate today…" className="resize-none" />
            </Field>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" onClick={() => setTasks(SAMPLE)}>
              Insert sample tasks
            </Button>
            <Field label="Available working hours" required>
              <Input value={hours} onChange={(e) => setHours(e.target.value)} placeholder="e.g. 09:00 – 17:30 with lunch 12:30–13:00" />
            </Field>
            <Field label="Priority hints" hint="Optional">
              <Textarea rows={3} value={priorities} onChange={(e) => setPriorities(e.target.value)} placeholder="e.g. Budget is P1. Travel booking can slip to tomorrow." className="resize-none" />
            </Field>
            <ActionBar
              onGenerate={() => run({ tasks: tasks.trim(), hours: hours.trim(), priorities: priorities.trim(), style: settings.responseStyle })}
              onReset={() => {
                setTasks("");
                setPriorities("");
                setHours("09:00 – 17:30");
                reset();
              }}
              canGenerate={canGenerate}
              loading={state.status === "loading"}
              label="Plan my day"
            />
          </div>
        }
        output={
          state.status === "idle" ? (
            <EmptyState icon={CalendarClock} title="Your schedule will appear here" body="Add tasks and working hours. The planner assigns P1–P4 priorities and builds a time-blocked day." />
          ) : state.status === "loading" ? (
            <LoadingState label="Building your schedule…" />
          ) : state.status === "error" ? (
            <ErrorState message={state.message} onRetry={regenerate} />
          ) : (
            <div className="animate-fade-up">
              <OutputFrame
                title="Recommended schedule"
                toolbar={
                  <>
                    <CopyButton text={toMarkdown(state.data)} label="Copy plan" />
                    <RegenerateButton onClick={regenerate} />
                  </>
                }
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <AiLabel>AI-generated recommendation</AiLabel>
                  <span className="text-[11px] text-muted-foreground">{hours}</span>
                </div>
                <p className="doc-prose mb-6 text-sm text-muted-foreground">{state.data.summary}</p>

                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-surface text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2.5 font-medium">Time</th>
                        <th className="px-3 py-2.5 font-medium">Task</th>
                        <th className="px-3 py-2.5 font-medium">Duration</th>
                        <th className="px-3 py-2.5 font-medium">Priority</th>
                        <th className="hidden px-3 py-2.5 font-medium md:table-cell">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.data.schedule.map((row, i) => (
                        <tr key={i} className="border-t align-top transition-colors hover:bg-accent/50">
                          <td className="whitespace-nowrap px-3 py-3 font-mono text-xs">{row.time}</td>
                          <td className="px-3 py-3 font-medium">
                            {row.task}
                            <div className="mt-1 text-xs text-muted-foreground md:hidden">{row.notes}</div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">{row.duration}</td>
                          <td className="px-3 py-3">
                            <PriorityBadge priority={row.priority} />
                          </td>
                          <td className="hidden px-3 py-3 text-muted-foreground md:table-cell">{row.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-8">
                  <SectionTitle>Time optimization suggestions</SectionTitle>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {state.data.suggestions.map((s, i) => (
                      <li key={i} className="flex gap-2.5 rounded-lg border bg-card p-3 text-sm leading-6">
                        <Lightbulb className="mt-1.5 size-3.5 shrink-0 text-muted-foreground" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </OutputFrame>
              <VerificationChecklist items={CHECKLIST} resetKey={state.runId} />
            </div>
          )
        }
      />
    </>
  );
}
