"use client";

import { useMemo, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { InlineState } from "@/components/results/ResultsDashboardParts";
import { KeyReading } from "./KeyReading";
import type { IssueByDemographicSeries } from "@/lib/state-analysis";

const SELECT_CLASSNAME =
  "h-10 rounded-xl border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ink/30";

// Reused for Age x Issue, Gender x Issue, Religion x Issue and Caste x Issue
// (Sections M-O) — each caller passes its own already-computed series (one
// issue selected via the dropdown, one dimension fixed per section), so the
// same ranked-bar logic exists in exactly one place. Percentage is that
// demographic group's OWN share who picked the issue (see
// state-analysis.ts's buildIssueByDemographic) — a group below the
// privacy/sample threshold renders as a muted, honestly-labeled row instead
// of a real-looking number. Horizontal div-based bars (rather than a
// recharts vertical BarChart) avoid axis-label overlap/clipping when a
// group's label is long (e.g. a caste category name) at compact card width.
export function DemographicIssueAnalysis({ series, compact }: { series: IssueByDemographicSeries[]; compact?: boolean }) {
  const { t } = useLocale();
  const [issueKey, setIssueKey] = useState(series[0]?.issueKey ?? "");
  const activeSeries = series.find((s) => s.issueKey === issueKey) ?? series[0];

  const rows = useMemo(() => {
    if (!activeSeries) return [];
    return activeSeries.values.map((v) => ({ group: v.groupLabel, percentage: v.percentage, lowData: v.lowData }));
  }, [activeSeries]);

  const maxPct = Math.max(1, ...rows.filter((r) => !r.lowData).map((r) => r.percentage));

  const leader = rows.filter((r) => !r.lowData).reduce<typeof rows[number] | null>((best, r) => (!best || r.percentage > best.percentage ? r : best), null);

  if (series.length === 0) {
    return <InlineState>{t.results.resultsSuppressed}</InlineState>;
  }

  return (
    <div>
      <label className="block">
        <span className="mb-1.5 block text-xs font-semibold text-foreground">{t.analysisHub.selectIssueLabel}</span>
        <select value={issueKey} onChange={(e) => setIssueKey(e.target.value)} className={SELECT_CLASSNAME}>
          {series.map((s) => (
            <option key={s.issueKey} value={s.issueKey}>
              {s.issueLabel}
            </option>
          ))}
        </select>
      </label>

      <ul className={`mt-4 space-y-2 ${compact ? "" : "space-y-2.5"}`}>
        {rows.map((row) => (
          <li key={row.group} className="min-w-0">
            <div className="flex items-baseline justify-between gap-2">
              <span className="min-w-0 truncate text-xs font-semibold text-foreground">{row.group}</span>
              <span className="shrink-0 text-xs font-bold tabular-nums text-ink">{row.lowData ? t.results.suppressed : `${row.percentage}%`}</span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-surface-2">
              {!row.lowData && (
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${(row.percentage / maxPct) * 100}%` }}
                />
              )}
            </div>
          </li>
        ))}
      </ul>

      {activeSeries && leader && leader.percentage > 0 && (
        <KeyReading
          lines={[
            t.analysisHub.readingIssueLeaderGroup
              .replace("{group}", leader.group)
              .replace("{issue}", activeSeries.issueLabel)
              .replace("{percentage}", String(leader.percentage)),
          ]}
        />
      )}
    </div>
  );
}
