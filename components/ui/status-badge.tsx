import { STATUS_LABEL } from "@/lib/constants";
import { cn } from "@/lib/format";
import type { ObjectStatus } from "@/lib/types";

const DOT: Record<ObjectStatus, string> = {
  active: "bg-success",
  partially_operational: "bg-orbit",
  inactive: "bg-mist-600",
  mission_completed: "bg-mist-400",
  destroyed: "bg-warning",
  lost_contact: "bg-warning",
  unknown: "bg-mist-600",
};

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: ObjectStatus;
  label?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border border-white/12 bg-white/[0.03] px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-mist-300",
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", DOT[status])} />
      {label ?? STATUS_LABEL[status]}
    </span>
  );
}
