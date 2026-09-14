"use client";

import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { InlineState } from "@/components/results/ResultsDashboardParts";
import type { IssueByDemographicSeries } from "@/lib/state-analysis";

const SELECT_CLASSNAME =
  "h-10 rounded-xl border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ink/30";

// Reused for Age x Issue, Gender x Issue and Religion x Issue (Sections M, N,
// O) — each caller passes its own already-computed series (one dimension
// fixed per section) plus an issue selector, so the same grouped-bar chart
// logic exists in exactly one place. Percentage is that demographic group's
// OWN share who picked the issue (see state-analysis.ts's
// buildIssueByDemographic) — a group below the privacy/sample threshold
// renders as a muted, honestly-labeled bar instead of a real-looking number.
export function DemographicIssueAnalysis({ series, compact }: { series: IssueByDemographicSeries[]; compact?: boolean }) {
  const { t } = useLocale();
  const [issueKey, setIssueKey] = useState(series[0]?.issueKey ?? "");
  const activeSeries = series.find((s) => s.issueKey === issueKey) ?? series[0];

  const chartData = useMemo(() => {
    if (!activeSeries) return [];
    return activeSeries.values.map((v) => ({ group: v.groupLabel, percentage: v.percentage, lowData: v.lowData }));
  }, [activeSeries]);

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

      <div className={`mt-4 w-full ${compact ? "h-40" : "h-64"}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 4, bottom: 0, left: compact ? -20 : -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="group" tick={{ fontSize: compact ? 10 : 12 }} stroke="var(--muted)" interval={0} />
            <YAxis tick={{ fontSize: compact ? 10 : 12 }} stroke="var(--muted)" unit="%" width={compact ? 32 : 40} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 13 }}
              formatter={(value, _key, item) => [item?.payload?.lowData ? t.results.suppressed : `${value}%`, activeSeries?.issueLabel ?? ""]}
            />
            <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
              {chartData.map((row, index) => (
                <Cell key={index} fill={row.lowData ? "var(--border)" : "#2563eb"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
