"use client";

import { BarChart, Bar, XAxis, YAxis, Legend, ResponsiveContainer, CartesianGrid, LabelList } from "recharts";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { ISSUE_COLORS, InlineState } from "@/components/results/ResultsDashboardParts";
import type { DemographicGroupPartyRow } from "@/lib/state-analysis";

// Reused for Age x Party (J), Gender x Party (K), Religion x Party (L) and
// the Party x Issue comparison (H) — a grouped vertical bar chart, one bar
// cluster per row, one bar per party colored with that party's real
// colorHex. Every percentage comes straight from state-analysis.ts's
// buildDemographicPartyRows; a group whose sample size is below the
// platform's privacy threshold is shown with an honest low-data note instead
// of a chart that implies a reliable split. No hover tooltip — every value
// this chart can show is already permanently visible via the LabelList above
// each bar, so a tooltip would only repeat what's already on screen. The
// data-derived "who leads which group" reading lives in the caller
// (buildDemographicPartyReading in analysis-summaries.ts) so it can sit in
// a dedicated summary column next to the chart instead of underneath it.
export function DemographicPartyChart({ rows }: { rows: DemographicGroupPartyRow[] }) {
  const { t, locale } = useLocale();

  const usable = rows.filter((r) => !r.lowData && r.sampleSize > 0);
  if (usable.length === 0) {
    return <InlineState>{t.results.resultsSuppressed}</InlineState>;
  }

  const partyMeta = usable[0].parties.map((p, index) => ({
    key: p.key,
    label: p.label,
    nameHindi: p.nameHindi,
    color: p.colorHex ?? ISSUE_COLORS[index % ISSUE_COLORS.length],
  }));

  const chartData = usable.map((row) => {
    const entry: Record<string, string | number> = { group: row.groupLabel };
    for (const p of row.parties) entry[p.key] = p.percentage;
    return entry;
  });

  const lowDataGroups = rows.filter((r) => r.lowData).map((r) => r.groupLabel);

  return (
    <div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 8, bottom: 0, left: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="group" tick={{ fontSize: 12 }} stroke="var(--muted)" />
            {/* width=44 + no negative margin so the "100%" Y-axis label never
                loses its leading digit — the old `left: -16` margin pulled
                the whole chart (axis included) past the container edge. */}
            <YAxis tick={{ fontSize: 12 }} stroke="var(--muted)" unit="%" width={44} allowDecimals={false} />
            <Legend
              formatter={(key: string) => {
                const meta = partyMeta.find((p) => p.key === key);
                return meta ? (locale === "hi" && meta.nameHindi ? meta.nameHindi : meta.label) : key;
              }}
              wrapperStyle={{ fontSize: 12 }}
            />
            {partyMeta.map((p) => (
              <Bar key={p.key} dataKey={p.key} fill={p.color} radius={[4, 4, 0, 0]} isAnimationActive={false}>
                {/* Percentage always visible above each bar — never
                    hover-only; the tooltip stays as secondary detail. */}
                <LabelList
                  dataKey={p.key}
                  position="top"
                  fontSize={10}
                  fill="var(--ink)"
                  formatter={(v: unknown) => {
                    const n = typeof v === "number" ? v : Number(v);
                    return n > 0 ? `${n}%` : "";
                  }}
                />
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-[11px] text-muted">{t.analysisHub.withinGroupNote}</p>
      {lowDataGroups.length > 0 && (
        <p className="mt-3 text-xs text-muted">
          {t.analysisHub.lowDataGroupsNote}: {lowDataGroups.join(", ")}
        </p>
      )}
    </div>
  );
}
