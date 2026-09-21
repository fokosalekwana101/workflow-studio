import { Check, Copy, Loader2, AlertTriangle, RotateCcw, Eraser, type LucideIcon } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

/* ---------- Page header ---------- */

export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md border bg-card shadow-sm">
            <Icon className="size-4" strokeWidth={1.8} />
          </div>
        )}
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ---------- Dual pane ---------- */

export function DualPane({ input, output }: { input: ReactNode; output: ReactNode }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(320px,420px)_1fr]">
      <section className="rounded-xl border bg-card p-5 shadow-sm lg:sticky lg:top-24 lg:self-start">{input}</section>
      <section className="min-w-0">{output}</section>
    </div>
  );
}

export function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
          {required && <span className="ml-1 text-foreground">*</span>}
        </label>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

/** Segmented control for small enumerations. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly T[];
}) {
  return (
    <div className="grid auto-cols-fr grid-flow-col gap-1 rounded-md border bg-muted p-1">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          className={cn(
            "h-7 rounded-sm text-xs font-medium transition-colors",
            value === o ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export function ActionBar({
  onGenerate,
  onReset,
  canGenerate,
  loading,
  label = "Generate",
}: {
  onGenerate: () => void;
  onReset: () => void;
  canGenerate: boolean;
  loading: boolean;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-2 pt-2">
      <Button onClick={onGenerate} disabled={!canGenerate || loading} className="flex-1">
        {loading ? <Loader2 className="size-4 animate-spin" /> : null}
        {loading ? "Generating…" : label}
      </Button>
      <Button variant="outline" size="icon" onClick={onReset} aria-label="Clear inputs" disabled={loading}>
        <Eraser className="size-4" />
      </Button>
    </div>
  );
}

/* ---------- Output states ---------- */

export function OutputFrame({
  title,
  toolbar,
  children,
}: {
  title: string;
  toolbar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border bg-paper shadow-paper">
      <div className="flex h-12 items-center justify-between gap-2 border-b bg-surface px-4">
        <div className="flex items-center gap-2">
          <span className="flex gap-1">
            <span className="size-2 rounded-full bg-border" />
            <span className="size-2 rounded-full bg-border" />
            <span className="size-2 rounded-full bg-border" />
          </span>
          <span className="ml-1 text-xs font-medium text-muted-foreground">{title}</span>
        </div>
        <div className="flex items-center gap-1.5">{toolbar}</div>
      </div>
      <div className="p-5 md:p-7">{children}</div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
  return (
    <div className="dot-grid flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-dashed text-center">
      <div className="flex size-11 items-center justify-center rounded-lg border bg-card shadow-sm">
        <Icon className="size-5" strokeWidth={1.6} />
      </div>
      <h3 className="mt-4 text-sm font-medium">{title}</h3>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

export function LoadingState({ label = "Drafting with AI…" }: { label?: string }) {
  return (
    <OutputFrame title={label}>
      <div className="space-y-4 animate-fade-in">
        <div className="h-5 w-2/3 rounded bg-muted animate-pulse-soft" />
        <div className="space-y-2.5 pt-2">
          {[100, 92, 96, 78, 88, 60].map((w, i) => (
            <div
              key={i}
              className="h-3.5 rounded bg-muted animate-pulse-soft"
              style={{ width: `${w}%`, animationDelay: `${i * 90}ms` }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          Structured prompt running · outputs are AI-generated and require review
        </div>
      </div>
    </OutputFrame>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border bg-card text-center animate-fade-in">
      <div className="flex size-11 items-center justify-center rounded-lg border bg-muted">
        <AlertTriangle className="size-5" strokeWidth={1.8} />
      </div>
      <h3 className="mt-4 text-sm font-medium">Generation failed</h3>
      <p className="mt-1 max-w-sm px-4 text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
        <RotateCcw className="size-3.5" /> Try again
      </Button>
    </div>
  );
}

/* ---------- Copy / regenerate ---------- */

export function CopyButton({
  text,
  label = "Copy",
  size = "sm",
  variant = "outline",
}: {
  text: string;
  label?: string;
  size?: "sm" | "icon";
  variant?: "outline" | "ghost";
}) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed. Select the text and copy manually.");
    }
  };
  return (
    <Button variant={variant} size={size} onClick={copy} aria-label={label} className={size === "icon" ? "size-8" : "h-8"}>
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {size === "sm" && <span>{copied ? "Copied" : label}</span>}
    </Button>
  );
}

export function RegenerateButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <Button variant="outline" size="sm" className="h-8" onClick={onClick} disabled={disabled}>
      <RotateCcw className="size-3.5" /> Regenerate
    </Button>
  );
}

/* ---------- Verification checklist ---------- */

export function VerificationChecklist({ items, resetKey }: { items: string[]; resetKey?: string | number }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  useEffect(() => setChecked({}), [resetKey]);
  const done = items.filter((i) => checked[i]).length;
  const complete = done === items.length;
  return (
    <div className="mt-6 rounded-lg border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Verification checklist</span>
          <Badge variant="outline" className="h-5 rounded-sm px-1.5 font-mono text-[10px] font-normal">
            {done}/{items.length}
          </Badge>
        </div>
        <span className="text-[11px] text-muted-foreground">
          {complete ? "Reviewed — ready for workplace use" : "Review before using this output"}
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <label
            key={item}
            className={cn(
              "flex cursor-pointer items-center gap-2.5 rounded-md border bg-card px-3 py-2 text-sm transition-colors hover:bg-accent",
              checked[item] && "text-muted-foreground line-through decoration-border",
            )}
          >
            <Checkbox
              checked={!!checked[item]}
              onCheckedChange={(v) => setChecked((c) => ({ ...c, [item]: v === true }))}
            />
            {item}
          </label>
        ))}
      </div>
    </div>
  );
}

/* ---------- Misc ---------- */

export function PriorityBadge({ priority }: { priority: string }) {
  const p = priority.toUpperCase().replace(/[^P0-9]/g, "").slice(0, 2) || priority;
  const map: Record<string, string> = {
    P1: "bg-primary text-primary-foreground border-primary",
    P2: "bg-foreground/80 text-background border-transparent",
    P3: "bg-muted text-foreground",
    P4: "bg-transparent text-muted-foreground",
  };
  const label: Record<string, string> = { P1: "Critical", P2: "High", P3: "Normal", P4: "Low" };
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-sm border px-2 font-mono text-[11px] font-medium",
        map[p] ?? "bg-muted",
      )}
    >
      {p}
      {label[p] && <span className="font-sans font-normal opacity-80">{label[p]}</span>}
    </span>
  );
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between border-b pb-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{children}</h3>
      {aside}
    </div>
  );
}

export function AiLabel({ children = "AI-generated · review required" }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-sm border bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
      <span className="size-1.5 rounded-full bg-foreground/60" />
      {children}
    </span>
  );
}
