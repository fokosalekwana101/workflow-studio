import { cn } from "@/lib/utils";

/** WorkFlow Studio mark: three stacked flow bars converging to a point. */
export function Logo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-md bg-primary text-primary-foreground",
        className,
      )}
      aria-label="WorkFlow Studio"
    >
      <svg viewBox="0 0 24 24" fill="none" className="size-[60%]" aria-hidden="true">
        <path d="M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M7 12h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M10 17h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}
