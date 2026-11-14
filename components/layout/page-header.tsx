import { cn } from "@/lib/format";

export function PageHeader({
  index,
  eyebrow,
  title,
  description,
  meta,
  className,
}: {
  index?: string;
  eyebrow: string;
  title: string;
  description: string;
  meta?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("border-b border-white/10 pb-8", className)}>
      <div className="flex items-center gap-3">
        {index ? (
          <span className="font-mono text-[10px] tracking-[0.2em] text-artifact">{index}</span>
        ) : null}
        <span className="label">{eyebrow}</span>
        <span className="h-px flex-1 bg-white/10" />
      </div>
      <h1 className="mt-5 max-w-4xl text-3xl font-medium tracking-tight text-balance text-mist-50 sm:text-4xl lg:text-[2.75rem] lg:leading-[1.08]">
        {title}
      </h1>
      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-mist-500 sm:text-[15px]">
        {description}
      </p>
      {meta ? <div className="mt-6 flex flex-wrap items-center gap-2">{meta}</div> : null}
    </div>
  );
}
