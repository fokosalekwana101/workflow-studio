import { createServerFn } from "@tanstack/react-start";
import { Output, streamText } from "ai";
import { z } from "zod";

const StyleSchema = z.enum(["concise", "detailed"]);

/* ---------- Schemas ---------- */

export const EmailResultSchema = z.object({ subject: z.string(), body: z.string() });
export type EmailResult = z.infer<typeof EmailResultSchema>;

export const MeetingResultSchema = z.object({
  summary: z.string(),
  decisions: z.array(z.string()),
  actionItems: z.array(
    z.object({ task: z.string(), owner: z.string(), deadline: z.string(), priority: z.string() }),
  ),
});
export type MeetingResult = z.infer<typeof MeetingResultSchema>;

export const TaskPlanResultSchema = z.object({
  schedule: z.array(
    z.object({
      time: z.string(),
      task: z.string(),
      duration: z.string(),
      priority: z.string(),
      notes: z.string(),
    }),
  ),
  suggestions: z.array(z.string()),
  summary: z.string(),
});
export type TaskPlanResult = z.infer<typeof TaskPlanResultSchema>;

export const ResearchResultSchema = z.object({
  summary: z.string(),
  takeaways: z.array(z.string()),
  risks: z.array(z.string()),
  recommendations: z.array(z.string()),
  confidence: z.enum(["high", "medium", "low"]),
  confidenceNote: z.string(),
});
export type ResearchResult = z.infer<typeof ResearchResultSchema>;

/* ---------- Shared runner ---------- */

async function runStructured<T>(
  prompt: { system: string; user: string },
  schema: z.ZodType<T>,
): Promise<T> {
  const {
    createLovableAiGatewayRunIdFetch,
    createLovableResponsesProvider,
    responsesProviderOptions,
    toFriendlyError,
    CHAT_MODEL,
  } = await import("./ai-gateway.server");

  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured for this workspace yet.");

  const runIdFetch = createLovableAiGatewayRunIdFetch();
  const lovable = createLovableResponsesProvider(key, runIdFetch);

  try {
    const result = streamText({
      model: lovable.responses(CHAT_MODEL),
      system: prompt.system,
      prompt: prompt.user,
      output: Output.object({ schema }),
      providerOptions: responsesProviderOptions,
    });
    const output = await result.output;
    return output as T;
  } catch (error) {
    console.error("[ai] structured generation failed", error);
    const friendly = toFriendlyError(error);
    throw new Error(friendly.message);
  }
}

/* ---------- Server functions ---------- */

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        recipient: z.string().min(1).max(200),
        audience: z.enum(["Client", "Manager", "Team", "Other"]),
        message: z.string().min(10).max(6000),
        tone: z.enum(["Formal", "Direct", "Persuasive"]),
        intensity: z.number().min(0).max(100),
        style: StyleSchema,
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { buildEmailPrompt } = await import("./prompts.server");
    return runStructured(buildEmailPrompt(data), EmailResultSchema);
  });

export const polishEmail = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({ subject: z.string().max(500), body: z.string().min(1).max(10000), audience: z.string().max(50) })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { buildPolishPrompt } = await import("./prompts.server");
    return runStructured(buildPolishPrompt(data), EmailResultSchema);
  });

export const summarizeMeeting = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z.object({ notes: z.string().min(40).max(40000), style: StyleSchema }).parse(d),
  )
  .handler(async ({ data }) => {
    const { buildMeetingPrompt } = await import("./prompts.server");
    return runStructured(buildMeetingPrompt(data), MeetingResultSchema);
  });

export const planTasks = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        tasks: z.string().min(10).max(8000),
        hours: z.string().min(3).max(120),
        priorities: z.string().max(2000),
        style: StyleSchema,
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { buildTaskPlanPrompt } = await import("./prompts.server");
    return runStructured(buildTaskPlanPrompt(data), TaskPlanResultSchema);
  });

export const researchTopic = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({ topic: z.string().min(3).max(500), source: z.string().max(40000), style: StyleSchema })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { buildResearchPrompt } = await import("./prompts.server");
    return runStructured(buildResearchPrompt(data), ResearchResultSchema);
  });
