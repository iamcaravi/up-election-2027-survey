"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { ISSUE_COLORS, InlineState } from "@/components/results/ResultsDashboardParts";
import type { DemographicGroupPartyRow } from "@/lib/state-analysis";

// Reused for Age x Party (J), Gender x Party (K), Religion x Party (L) and
// the Party x Issue comparison (H) — a grouped vertical bar chart, one bar
// cluster per row, one bar per party colored with that party's real
// colorHex. Every percentage comes straight from state-analysis.ts's
// buildDemographicPartyRows; a group whose sample size is below the
// platform's privacy threshold is shown with an honest low-data note instead
// of a chart that implies a reliable split. `showLeaderTakeaways` adds one
// data-derived sentence per group ("Among surveyed 18–24 respondents, BJP
// has the highest reported support.") — only meaningful for genuine
// demographic groups, so Section H's issue-rows reuse leaves it off.
export function DemographicPartyChart({ rows, showLeaderTakeaways }: { rows: DemographicGroupPartyRow[]; showLeaderTakeaways?: boolean }) {
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
          <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="group" tick={{ fontSize: 12 }} stroke="var(--muted)" />
            <YAxis tick={{ fontSize: 12 }} stroke="var(--muted)" unit="%" width={40} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 13 }}
              formatter={(value, key) => {
                const meta = partyMeta.find((p) => p.key === key);
                const name = meta ? (locale === "hi" && meta.nameHindi ? meta.nameHindi : meta.label) : String(key);
                return [`${value}%`, name];
              }}
            />
            <Legend
              formatter={(key: string) => {
                const meta = partyMeta.find((p) => p.key === key);
                return meta ? (locale === "hi" && meta.nameHindi ? meta.nameHindi : meta.label) : key;
              }}
              wrapperStyle={{ fontSize: 12 }}
            />
            {partyMeta.map((p) => (
              <Bar key={p.key} dataKey={p.key} fill={p.color} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      {showLeaderTakeaways && (
        <ul className="mt-4 space-y-1.5 border-t border-border pt-3 text-xs text-foreground">
          {usable.map((row) => {
            const leader = row.parties.reduce((a, b) => (b.percentage > a.percentage ? b : a));
            if (leader.percentage <= 0) return null;
            const leaderName = locale === "hi" && leader.nameHindi ? leader.nameHindi : leader.label;
            return (
              <li key={row.groupKey}>
                {t.analysisHub.groupLeaderNote.replace("{group}", row.groupLabel).replace("{party}", leaderName).replace("{percentage}", String(leader.percentage))}
              </li>
            );
          })}
        </ul>
      )}
      {lowDataGroups.length > 0 && (
        <p className="mt-3 text-xs text-muted">
          {t.analysisHub.lowDataGroupsNote}: {lowDataGroups.join(", ")}
        </p>
      )}
    </div>
  );
}
