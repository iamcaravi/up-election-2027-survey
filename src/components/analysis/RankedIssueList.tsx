"use client";

// Shared "top N issues" ranked visual — reused by KeyIssuesByParty (Section H)
// and IntersectionAnalysis (Section N) so the ranked-list markup/logic exists
// in exactly one place.
export function RankedIssueList({
  issues,
  emptyLabel,
}: {
  issues: { key: string; label: string; percentage: number }[];
  emptyLabel: string;
}) {
  if (issues.length === 0) {
    return <p className="text-xs text-muted">{emptyLabel}</p>;
  }
  return (
    <ol className="space-y-1.5">
      {issues.map((issue, index) => (
        <li key={issue.key} className="flex min-w-0 items-center justify-between gap-2 text-xs">
          <span className="min-w-0 truncate text-foreground">
            {index + 1}. {issue.label}
          </span>
          <span className="shrink-0 font-bold tabular-nums text-ink">{issue.percentage}%</span>
        </li>
      ))}
    </ol>
  );
}
