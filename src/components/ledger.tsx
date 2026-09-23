import { Check, Copy, Search } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { gradeTone } from "@/lib/grading";

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-lg bg-card ring-1 ring-black/5",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function PanelHeader({
  title,
  hint,
  actions,
}: {
  title: string;
  hint?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-secondary/40 px-4 py-3">
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
        {hint ? <span className="text-[11px] text-mute">{hint}</span> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function LedgerButton({
  variant = "outline",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "outline" | "solid" | "danger" }) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
        variant === "outline" && "border border-border bg-card text-inksoft hover:bg-secondary",
        variant === "solid" && "bg-oxblood text-paper hover:bg-sealred",
        variant === "danger" && "border border-destructive/30 bg-card text-destructive hover:bg-destructive/10",
        className,
      )}
    />
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-mute" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-border bg-background py-1.5 pl-8 pr-3 text-sm placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-ring/40"
      />
    </div>
  );
}

export function TextField({
  label,
  required,
  hint,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="label-caps block">
        {label}
        {required ? <span className="text-oxblood"> *</span> : null}
      </span>
      <input
        {...props}
        required={required}
        className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
      />
      {hint ? <span className="mt-1 block text-[11px] text-mute">{hint}</span> : null}
    </label>
  );
}

export function TextArea({
  label,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="label-caps block">{label}</span>
      <textarea
        {...props}
        className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
      />
    </label>
  );
}

export function GradeBadge({ grade }: { grade: string }) {
  const tone = gradeTone(grade);
  return (
    <span
      className={cn(
        "inline-flex min-w-9 items-center justify-center rounded-md px-2 py-0.5 text-xs font-semibold ring-1",
        tone === "good" && "bg-forest/10 text-forest ring-forest/20",
        tone === "mid" && "bg-gold/15 text-late ring-gold/25",
        tone === "low" && "bg-secondary text-inksoft ring-border",
        tone === "fail" && "bg-sealred/10 text-sealred ring-sealred/20",
      )}
    >
      {grade}
    </span>
  );
}

export function StatusPill({ status }: { status: "present" | "late" | "absent" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full py-1 pl-1.5 pr-2.5 text-xs font-medium capitalize ring-1",
        status === "present" && "bg-forest/10 text-forest ring-forest/20",
        status === "late" && "bg-gold/15 text-late ring-gold/25",
        status === "absent" && "bg-sealred/10 text-sealred ring-sealred/20",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "present" && "bg-forest",
          status === "late" && "bg-late",
          status === "absent" && "bg-sealred",
        )}
      />
      {status}
    </span>
  );
}

export function CopyCode({ code, dark = false }: { code: string; dark?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-md py-1.5 pl-3 pr-2 ring-1",
        dark ? "bg-paper/10 ring-paper/15" : "bg-background ring-border",
      )}
    >
      <span className={cn("label-caps", dark && "text-paper/55")}>Class code</span>
      <span className={cn("num text-sm", dark ? "text-paper" : "text-foreground")}>{code}</span>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        }}
        className={cn(
          "inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] transition-colors",
          dark ? "bg-paper/15 text-paper hover:bg-paper/25" : "bg-secondary hover:bg-border",
        )}
      >
        {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="text-sm font-semibold">{title}</p>
      {description ? (
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-mute">{description}</p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Loading({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 px-6 py-12 text-sm text-mute">
      <span className="size-2 animate-pulse rounded-full bg-mute" />
      {label}…
    </div>
  );
}

export function Meter({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-border/70">
      <div
        className={cn(
          "h-full rounded-full",
          value >= 75 ? "bg-forest" : value >= 60 ? "bg-gold" : "bg-sealred",
        )}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function ConfirmButton({
  label,
  message,
  onConfirm,
  variant = "danger",
}: {
  label: string;
  message: string;
  onConfirm: () => void;
  variant?: "danger" | "outline";
}) {
  return (
    <LedgerButton
      variant={variant}
      onClick={() => {
        if (window.confirm(message)) onConfirm();
      }}
    >
      {label}
    </LedgerButton>
  );
}
