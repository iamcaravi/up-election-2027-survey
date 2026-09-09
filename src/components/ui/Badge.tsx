import { cn } from "@/lib/utils";
import { CANDIDATE_STATUS_LABELS, type CandidateStatus } from "@/lib/enums";

const STATUS_STYLES: Record<CandidateStatus, string> = {
  DECLARED: "bg-positive/10 text-positive border-positive/30",
  LIKELY: "bg-ink/10 text-ink border-ink/30",
  POSSIBLE: "bg-accent/15 text-[#8a6a15] dark:text-accent-2 border-accent/40",
  INCUMBENT: "bg-[#0f9b8e]/10 text-positive border-positive/30",
  HISTORICAL: "bg-muted/10 text-muted border-border",
  OTHER: "bg-muted/10 text-muted border-border",
};

export function StatusBadge({ status, className }: { status: CandidateStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase",
        STATUS_STYLES[status],
        className
      )}
    >
      {CANDIDATE_STATUS_LABELS[status]}
    </span>
  );
}

export function PartyPill({
  shortName,
  colorHex,
  className,
}: {
  shortName: string;
  colorHex?: string | null;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        className
      )}
      style={{
        borderColor: `${colorHex ?? "#6b7280"}55`,
        color: colorHex ?? "#6b7280",
        background: `${colorHex ?? "#6b7280"}12`,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: colorHex ?? "#6b7280" }} />
      {shortName}
    </span>
  );
}
