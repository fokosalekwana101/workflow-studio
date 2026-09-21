import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Mail, Sparkle, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { generateEmail, polishEmail, type EmailResult } from "@/lib/ai.functions";
import { useGeneration } from "@/lib/use-generation";
import { recordGeneration, useAppStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
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
  Segmented,
  VerificationChecklist,
} from "@/components/shared/tool-kit";

export const Route = createFileRoute("/email")({
  head: () => ({
    meta: [
      { title: "Email Generator — WorkFlow Studio" },
      { name: "description", content: "Draft audience-aware, tone-controlled professional emails with AI." },
      { property: "og:title", content: "Email Generator — WorkFlow Studio" },
      { property: "og:description", content: "Draft audience-aware, tone-controlled professional emails with AI." },
    ],
  }),
  component: EmailPage,
});

const AUDIENCES = ["Client", "Manager", "Team", "Other"] as const;
const TONES = ["Formal", "Direct", "Persuasive"] as const;
type Audience = (typeof AUDIENCES)[number];
type Tone = (typeof TONES)[number];

const CHECKLIST = ["Facts verified", "Tone verified", "Recipient/audience verified", "Confidential information checked"];

type EmailInput = {
  recipient: string;
  audience: Audience;
  message: string;
  tone: Tone;
  intensity: number;
  style: "concise" | "detailed";
};

function EmailPage() {
  const { settings } = useAppStore();
  const gen = useServerFn(generateEmail);
  const polish = useServerFn(polishEmail);

  const [recipient, setRecipient] = useState("");
  const [audience, setAudience] = useState<Audience>("Client");
  const [message, setMessage] = useState("");
  const defaultTone = (settings.defaultTone.charAt(0).toUpperCase() + settings.defaultTone.slice(1)) as Tone;
  const [tone, setTone] = useState<Tone>(TONES.includes(defaultTone) ? defaultTone : "Formal");
  const [intensity, setIntensity] = useState(50);

  const [original, setOriginal] = useState<EmailResult | null>(null);
  const [polished, setPolished] = useState<EmailResult | null>(null);
  const [execPolish, setExecPolish] = useState(false);
  const [polishing, setPolishing] = useState(false);

  const { state, run, regenerate, reset } = useGeneration(async (input: EmailInput) => {
    const result = await gen({ data: input });
    setOriginal(result);
    setPolished(null);
    setExecPolish(false);
    recordGeneration("emails", `Email to ${input.recipient}`);
    return result;
  });

  const canGenerate = recipient.trim().length > 0 && message.trim().length >= 10;

  const onGenerate = () =>
    run({ recipient: recipient.trim(), audience, message: message.trim(), tone, intensity, style: settings.responseStyle });

  const onReset = () => {
    setRecipient("");
    setMessage("");
    setIntensity(50);
    setOriginal(null);
    setPolished(null);
    setExecPolish(false);
    reset();
  };

  const togglePolish = async (on: boolean) => {
    setExecPolish(on);
    if (!on || polished || !original) return;
    setPolishing(true);
    try {
      const result = await polish({ data: { ...original, audience } });
      setPolished(result);
    } catch (e) {
      setExecPolish(false);
      toast.error(e instanceof Error ? e.message : "Executive Polish failed.");
    } finally {
      setPolishing(false);
    }
  };

  const shown = execPolish && polished ? polished : original;
  const fullText = shown ? `Subject: ${shown.subject}\n\n${shown.body}` : "";

  return (
    <>
      <PageHeader
        icon={Mail}
        title="Smart Email Generator"
        description="Turn a core message into a polished, audience-aware email. The AI uses only what you provide — it never invents names, dates or commitments."
      />
      <DualPane
        input={
          <div className="space-y-5">
            <Field label="Recipient" required>
              <Input placeholder="e.g. Priya Nair, Head of Procurement" value={recipient} onChange={(e) => setRecipient(e.target.value)} />
            </Field>
            <Field label="Audience">
              <Segmented value={audience} onChange={setAudience} options={AUDIENCES} />
            </Field>
            <Field label="Core message" required hint={`${message.trim().length} chars · min 10`}>
              <Textarea
                rows={7}
                placeholder="What do you need to say? Include the key points, any dates or numbers, and the outcome you want."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="resize-none"
              />
            </Field>
            <Field label="Tone">
              <Segmented value={tone} onChange={setTone} options={TONES} />
            </Field>
            <Field label="Tone intensity" hint={intensity <= 33 ? "Light" : intensity <= 66 ? "Moderate" : "Strong"}>
              <Slider value={[intensity]} onValueChange={(v) => setIntensity(v[0] ?? 50)} max={100} step={1} className="py-2" />
            </Field>
            <ActionBar onGenerate={onGenerate} onReset={onReset} canGenerate={canGenerate} loading={state.status === "loading"} label="Generate email" />
          </div>
        }
        output={
          state.status === "idle" ? (
            <EmptyState icon={Mail} title="Your email will appear here" body="Fill in the recipient and core message, choose tone and audience, then generate." />
          ) : state.status === "loading" ? (
            <LoadingState label="Drafting your email…" />
          ) : state.status === "error" ? (
            <ErrorState message={state.message} onRetry={regenerate} />
          ) : shown ? (
            <div className="animate-fade-up">
              <OutputFrame
                title={execPolish && polished ? "Executive draft" : "Draft email"}
                toolbar={
                  <>
                    <label className="mr-2 flex items-center gap-2 text-xs font-medium">
                      {polishing ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkle className="size-3.5" />}
                      <span className="hidden sm:inline">Executive Polish</span>
                      <Switch checked={execPolish} onCheckedChange={togglePolish} disabled={polishing} aria-label="Executive Polish" />
                    </label>
                    <CopyButton text={fullText} />
                    <RegenerateButton onClick={regenerate} />
                  </>
                }
              >
                <div className="mb-5 flex items-center justify-between gap-3">
                  <AiLabel />
                  <span className="text-[11px] text-muted-foreground">
                    {audience} · {tone} · {intensity}/100
                  </span>
                </div>
                <div className="border-b pb-4">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Subject</div>
                  <h2 className="mt-1 text-lg font-semibold tracking-tight">{shown.subject}</h2>
                </div>
                <div className="doc-prose whitespace-pre-wrap pt-5">{shown.body}</div>
              </OutputFrame>
              <VerificationChecklist items={CHECKLIST} resetKey={`${state.runId}-${execPolish}`} />
            </div>
          ) : null
        }
      />
    </>
  );
}
