import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  CalendarClock,
  Clock,
  FileText,
  Mail,
  MessageSquare,
  Search,
  type LucideIcon,
} from "lucide-react";
import { TIME_ESTIMATES, useAppStore, type MetricKey } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — WorkFlow Studio" },
      {
        name: "description",
        content:
          "WorkFlow Studio is an AI workplace assistant for email drafting, meeting summaries, task planning and research briefings.",
      },
      { property: "og:title", content: "WorkFlow Studio — AI workplace productivity assistant" },
      {
        property: "og:description",
        content:
          "Draft emails, summarise meetings, plan your day and build research briefings with reviewable AI output.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const TOOLS: { to: string; label: string; icon: LucideIcon; body: string }[] = [
  { to: "/email", label: "Email Generator", icon: Mail, body: "Draft audience-aware emails with tone and intensity control." },
  { to: "/meetings", label: "Meeting Summarizer", icon: FileText, body: "Turn raw notes into decisions and owned action items." },
  { to: "/tasks", label: "Task Planner", icon: CalendarClock, body: "Convert a messy list into a prioritized, time-blocked day." },
  { to: "/research", label: "Research Assistant", icon: Search, body: "Summaries, takeaways, risks and recommendations." },
  { to: "/chat", label: "AI Chat", icon: MessageSquare, body: "Ask workplace questions and iterate on any draft." },
];

const METRICS: { key: MetricKey; label: string }[] = [
  { key: "emails", label: "Emails Generated" },
  { key: "meetings", label: "Meetings Summarized" },
  { key: "tasks", label: "Tasks Planned" },
  { key: "research", label: "Research Briefings" },
];

const TOOL_LABEL: Record<MetricKey | "chat", string> = {
  emails: "Email Generator",
  meetings: "Meeting Summarizer",
  tasks: "Task Planner",
  research: "Research Assistant",
  chat: "AI Chat",
};

function timeAgo(at: number) {
  const mins = Math.max(1, Math.round((Date.now() - at) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function Dashboard() {
  const { metrics, activity } = useAppStore();
  const hours = Math.floor(metrics.minutesSaved / 60);
  const mins = metrics.minutesSaved % 60;

  return (
    <div className="animate-fade-up space-y-8">
      <section className="dot-grid overflow-hidden rounded-xl border bg-card p-6 shadow-sm md:p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          AI workplace productivity
        </p>
        <h1 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight md:text-3xl">
          Welcome back. Let&rsquo;s clear the busywork.
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          WorkFlow Studio drafts your emails, summarises your meetings, plans your day and briefs you on any
          topic. Every output is structured, copyable and paired with a verification checklist so you stay the
          final editor.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            to="/email"
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Draft an email <ArrowUpRight className="size-3.5" />
          </Link>
          <Link
            to="/chat"
            className="inline-flex h-9 items-center gap-2 rounded-md border bg-card px-4 text-sm font-medium transition-colors hover:bg-accent"
          >
            Open AI Chat
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Workflows</h2>
          <span className="text-[11px] text-muted-foreground">5 tools</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {TOOLS.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className="group flex flex-col rounded-xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-float"
            >
              <div className="flex items-start justify-between">
                <div className="flex size-9 items-center justify-center rounded-md border bg-surface">
                  <t.icon className="size-4" strokeWidth={1.8} />
                </div>
                <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>
              <h3 className="mt-4 text-sm font-medium">{t.label}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{t.body}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your usage</h2>
          <span className="text-[11px] text-muted-foreground">
            Local to this browser · time saved is an estimate, not a measured outcome
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {METRICS.map((m) => (
            <div key={m.key} className="rounded-xl border bg-card p-5 shadow-sm">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className="mt-2 font-mono text-2xl font-semibold tracking-tight">{metrics[m.key]}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                ≈ {TIME_ESTIMATES[m.key]} min saved each (estimate)
              </p>
            </div>
          ))}
          <div className="rounded-xl border bg-foreground p-5 text-background shadow-sm">
            <p className="flex items-center gap-1.5 text-xs opacity-70">
              <Clock className="size-3.5" /> Estimated Time Saved
            </p>
            <p className="mt-2 font-mono text-2xl font-semibold tracking-tight">
              {hours > 0 ? `${hours}h ${mins}m` : `${mins}m`}
            </p>
            <p className="mt-1 text-[11px] opacity-70">Estimate based on your generations</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Recent activity
        </h2>
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          {activity.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Nothing yet. Your generations will be listed here.
            </p>
          ) : (
            <ul>
              {activity.slice(0, 6).map((a) => (
                <li key={a.id} className="flex items-center gap-3 border-b px-5 py-3 text-sm last:border-b-0">
                  <span className="rounded-sm border bg-surface px-2 py-0.5 text-[11px] text-muted-foreground">
                    {TOOL_LABEL[a.tool]}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{a.title}</span>
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{timeAgo(a.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
