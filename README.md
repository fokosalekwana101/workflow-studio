# WorkFlow Studio

An AI-powered workplace productivity assistant. WorkFlow Studio automates the busywork — drafting emails, summarizing meetings, planning your day, and producing research briefings — so you can focus on the work that matters.

## Features

- **Dashboard** — quick access to every tool, productivity metrics (emails generated, meetings summarized, tasks planned, research briefings, estimated time saved), and recent activity.
- **Email Generator** — turn rough notes into a polished, ready-to-send email. Choose audience (Client / Manager / Team / Other), tone (Formal / Direct / Persuasive) and tone intensity, then apply **Executive Polish** for a clearer, executive-level rewrite.
- **Meeting Summarizer** — paste raw notes or a transcript and get an executive summary, key decisions, and action items as copyable Markdown task cards (task, owner, deadline, priority).
- **Task Planner** — convert an unstructured task list into a realistic, time-ordered daily schedule with P1–P4 priorities and time-optimization suggestions.
- **Research Assistant** — briefings with a plain-English summary, key takeaways, potential risks, and actionable recommendations, with an explicit confidence level.
- **AI Chat** — a streaming workplace assistant with Markdown support, suggested prompts, copy, and clear-conversation controls.
- **Settings** — light/dark theme, concise/detailed AI responses, default email tone, Responsible AI notice, and local data reset.

## Responsible AI

WorkFlow Studio is built around safe AI use:

- A visible **Responsible AI Notice** reminds users to review outputs and never submit proprietary data.
- Every AI-generated output ships with an interactive **Verification Checklist** (facts, tone, recipients, deadlines, risks, and more, tailored per tool).
- Structured prompts (ROLE → CONTEXT → TASK → CONSTRAINTS → OUTPUT FORMAT → VERIFICATION RULES) instruct the model to use only the information you provide — it never invents names, dates, deadlines, sources, or commitments. Missing details are marked "Not specified".
- Metrics such as "estimated time saved" are clearly labelled as estimates.

## Tech Stack

- **TanStack Start** (React 19, file-based routing, server functions)
- **Tailwind CSS v4** with a strict monochrome design system (light + dark themes)
- **Lovable AI Gateway** for all model calls (no API keys in frontend code)
- **Vercel AI SDK** for structured outputs and streaming chat
- **shadcn/ui** components

## Architecture

- All AI calls run server-side via TanStack Start server functions and a `/api/chat` streaming route. The model key lives in server environment variables only.
- Structured outputs are validated with Zod schemas before reaching the UI.
- Productivity metrics, activity, and settings persist locally (localStorage) — no accounts, no tracking.

## Development

Requires Node.js (or Bun).

```sh
npm install
npm run dev
```

Then open http://localhost:8080.

## Built with

- [Lovable](https://lovable.dev)
- TanStack Start
- TypeScript
- React
- Tailwind CSS
