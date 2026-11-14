import { CONFIDENCE_LABEL, CONFIDENCE_TONE } from "@/lib/constants";
import { cn, formatDate } from "@/lib/format";
import type { Confidence, SourceRef } from "@/lib/types";

export function ConfidenceChip({ confidence }: { confidence: Confidence }) {
  return (
    <span className={cn("chip", CONFIDENCE_TONE[confidence])}>
      {CONFIDENCE_LABEL[confidence]}
    </span>
  );
}

export function SourceList({ sources }: { sources: SourceRef[] }) {
  if (!sources.length) {
    return (
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-mist-600">
        No source recorded
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {sources.map((source, index) => (
        <li key={`${source.url}-${index}`} className="border-l border-white/15 pl-3">
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer noopener"
            className="block text-xs leading-relaxed text-mist-300 underline decoration-white/20 underline-offset-4 transition-colors hover:text-orbit hover:decoration-orbit/50"
          >
            {source.provider}
          </a>
          <p className="mt-1 break-all font-mono text-[9px] uppercase tracking-[0.1em] text-mist-600">
            {source.recordId ? `record ${source.recordId} · ` : ""}
            {source.retrievedAt ? `retrieved ${formatDate(source.retrievedAt)}` : "retrieved date not recorded"}
          </p>
        </li>
      ))}
    </ul>
  );
}
