import { cn } from "@/lib/format";

export function SectionHeading({
  index,
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  index?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-6", className)}>
      <div className="max-w-3xl">
        <div className="flex items-center gap-3">
          {index ? (
            <span className="font-mono text-[10px] tracking-[0.2em] text-artifact">{index}</span>
          ) : null}
          {eyebrow ? <span className="label">{eyebrow}</span> : null}
          <span className="h-px w-10 bg-white/20" />
        </div>
        <h2 className="mt-3 text-2xl font-medium tracking-tight text-mist-50 sm:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-3 text-sm leading-relaxed text-mist-500">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function Stat({
  label,
  value,
  unit,
  hint,
  accent,
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
  accent?: string;
}) {
  return (
    <div className="relative border border-white/10 bg-ink-900/60 px-4 py-5">
      <span
        className="absolute left-0 top-0 h-px w-8"
        style={{ background: accent ?? "rgba(255,255,255,0.25)" }}
      />
      <p className="label">{label}</p>
      <p className="mt-3 flex items-baseline gap-1.5">
        <span className="data-num text-2xl font-medium text-mist-50">{value}</span>
        {unit ? (
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-mist-500">
            {unit}
          </span>
        ) : null}
      </p>
      {hint ? <p className="mt-2 text-xs leading-relaxed text-mist-600">{hint}</p> : null}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="border border-dashed border-white/12 bg-ink-900/40 px-6 py-10 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mist-300">{title}</p>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-mist-500">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
