"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { ISSUE_COLORS, InlineState } from "@/components/results/ResultsDashboardParts";
import type { VotePreferenceTrend } from "@/lib/state-analysis";

const MONTH_LABELS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_LABELS_HI = ["जन", "फ़र", "मार्च", "अप्रैल", "मई", "जून", "जुल", "अग", "सित", "अक्तू", "नव", "दिस"];

function monthLabel(monthKey: string, locale: "hi" | "en"): string {
  const [, monthStr] = monthKey.split("-");
  const monthIndex = Number(monthStr) - 1;
  const labels = locale === "hi" ? MONTH_LABELS_HI : MONTH_LABELS_EN;
  return labels[monthIndex] ?? monthKey;
}

// LINE chart — the one place on the Analysis dashboard where a trend over
// time (not a single-moment distribution) is the right shape, per the
// dashboard's chart-type rule (Party Support/Current Vote Share are
// distributions, this is a time series). Every point comes from
// getStateAnalysis's month-by-month aggregation of real, timestamped survey
// responses (src/lib/state-analysis.ts) — if fewer than two months have any
// data yet, the caller renders the honest "not enough historical data"
// state instead of this chart.
export function VotePreferenceTrendChart({ trend }: { trend: VotePreferenceTrend }) {
  const { t, locale } = useLocale();

  if (!trend.hasEnoughData) {
    return <InlineState>{t.analysisHub.notEnoughTrendData}</InlineState>;
  }

  const partyKeys = Array.from(new Set(trend.months.flatMap((m) => m.parties.map((p) => p.key))));
  const partyMeta = new Map<string, { label: string; nameHindi: string | null; colorHex: string | null }>();
  for (const month of trend.months) {
    for (const party of month.parties) {
      if (!partyMeta.has(party.key)) partyMeta.set(party.key, { label: party.label, nameHindi: party.nameHindi, colorHex: party.colorHex });
    }
  }

  const chartData = trend.months.map((month) => {
    const row: Record<string, string | number> = { month: monthLabel(month.month, locale) };
    for (const party of month.parties) row[party.key] = party.percentage;
    return row;
  });

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--muted)" />
          <YAxis tick={{ fontSize: 12 }} stroke="var(--muted)" unit="%" width={40} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", fontSize: 13 }}
            formatter={(value, key) => [`${value}%`, partyMeta.get(String(key))?.label ?? String(key)]}
          />
          <Legend
            formatter={(key: string) => {
              const meta = partyMeta.get(key);
              return locale === "hi" && meta?.nameHindi ? meta.nameHindi : meta?.label ?? key;
            }}
            wrapperStyle={{ fontSize: 12 }}
          />
          {partyKeys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={partyMeta.get(key)?.colorHex ?? ISSUE_COLORS[index % ISSUE_COLORS.length]}
              strokeWidth={2.5}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
