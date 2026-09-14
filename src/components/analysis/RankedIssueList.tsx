"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";
import { resolveOptionLabel } from "@/lib/option-labels";

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
  const { t, locale } = useLocale();
  if (issues.length === 0) {
    return <p className="text-xs text-muted">{emptyLabel}</p>;
  }
  return (
    <ol className="space-y-1.5">
      {issues.map((issue, index) => (
        <li key={issue.key} className="flex min-w-0 items-center justify-between gap-2 text-xs">
          <span className="min-w-0 truncate text-foreground">
            {index + 1}. {resolveOptionLabel(issue.key, issue, locale, t.surveyQuestions.options)}
          </span>
          <span className="shrink-0 font-bold tabular-nums text-ink">{issue.percentage}%</span>
        </li>
      ))}
    </ol>
  );
}
