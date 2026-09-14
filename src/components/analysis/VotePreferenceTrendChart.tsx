"use client";

import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import type { DotItemDotProps } from "recharts";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { ISSUE_COLORS, InlineState } from "@/components/results/ResultsDashboardParts";
import { monthLabel, fullMonthLabel } from "@/lib/analysis-summaries";
import type { VotePreferenceTrend } from "@/lib/state-analysis";

type PartyMetaEntry = { label: string; nameHindi: string | null; colorHex: string | null };

interface HoverState {
  key: string;
  cx: number;
  cy: number;
  value: number;
  fullMonth: string;
}

// LINE chart — the one place on the Analysis dashboard where a trend over
// time (not a single-moment distribution) is the right shape, per the
// dashboard's chart-type rule (Party Support/Current Vote Share are
// distributions, this is a time series). Every point comes from
// getStateAnalysis's month-by-month aggregation of real, timestamped survey
// responses (src/lib/state-analysis.ts) — if fewer than two months have any
// data yet, the caller renders the honest "not enough historical data"
// state instead of this chart.
//
// Hover behaviour is fully custom, not recharts' built-in <Tooltip>: recharts'
// LineChart only supports "axis" tooltip events (see its
// `allowedTooltipTypes`), meaning the built-in Tooltip always resolves to
// the nearest x-axis position and can't distinguish which of several
// overlapping lines the cursor is actually over — `shared={false}` still
// just reports one fixed series, not the hovered one. Each dot is rendered
// here as a real DOM element with its own onMouseEnter/onMouseLeave, so the
// label always corresponds to the exact line and point under the cursor.
export function VotePreferenceTrendChart({ trend }: { trend: VotePreferenceTrend }) {
  const { t, locale } = useLocale();
  const [hover, setHover] = useState<HoverState | null>(null);

  if (!trend.hasEnoughData) {
    return <InlineState>{t.analysisHub.notEnoughTrendData}</InlineState>;
  }

  const partyKeys = Array.from(new Set(trend.months.flatMap((m) => m.parties.map((p) => p.key))));
  const partyMeta = new Map<string, PartyMetaEntry>();
  for (const month of trend.months) {
    for (const party of month.parties) {
      if (!partyMeta.has(party.key)) partyMeta.set(party.key, { label: party.label, nameHindi: party.nameHindi, colorHex: party.colorHex });
    }
  }

  const chartData = trend.months.map((month) => {
    const row: Record<string, string | number> = { month: monthLabel(month.month, locale), fullMonth: fullMonthLabel(month.month, locale) };
    for (const party of month.parties) row[party.key] = party.percentage;
    return row;
  });

  const hoverMeta = hover ? partyMeta.get(hover.key) : null;
  const hoverName = hoverMeta ? (locale === "hi" && hoverMeta.nameHindi ? hoverMeta.nameHindi : hoverMeta.label) : hover?.key;

  return (
    <div className="relative h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--muted)" />
          <YAxis tick={{ fontSize: 12 }} stroke="var(--muted)" unit="%" width={40} />
          <Legend
            formatter={(key: string) => {
              const meta = partyMeta.get(key);
              return locale === "hi" && meta?.nameHindi ? meta.nameHindi : meta?.label ?? key;
            }}
            wrapperStyle={{ fontSize: 12, width: "100%", overflow: "hidden" }}
          />
          {partyKeys.map((key, index) => {
            const color = partyMeta.get(key)?.colorHex ?? ISSUE_COLORS[index % ISSUE_COLORS.length];
            const isHovered = hover?.key === key;
            return (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={color}
                strokeWidth={isHovered ? 3.5 : 2.5}
                isAnimationActive={false}
                dot={(dotProps: DotItemDotProps) => {
                  const { cx, cy } = dotProps;
                  const payload = dotProps.payload as Record<string, string | number> | undefined;
                  const value = payload?.[key] as number | undefined;
                  if (cx == null || cy == null || value == null || !payload) return <g key={`${key}-${payload?.month ?? cx}`} />;
                  const active = hover?.key === key && hover.cx === cx && hover.cy === cy;
                  return (
                    <g key={`${key}-${payload.month}`}>
                      <circle cx={cx} cy={cy} r={active ? 5 : 3} fill="#fff" stroke={color} strokeWidth={2} pointerEvents="none" />
                      {/* Larger invisible hit target — the visible dot (r=3) is too small
                          to reliably hover, this widens the interactive area without
                          changing what's drawn. */}
                      <circle
                        cx={cx}
                        cy={cy}
                        r={10}
                        fill="transparent"
                        style={{ cursor: "pointer" }}
                        onMouseEnter={() =>
                          setHover({ key, cx, cy, value: value as number, fullMonth: String(payload.fullMonth ?? payload.month ?? "") })
                        }
                        onMouseLeave={() => setHover((current) => (current?.key === key && current.cx === cx && current.cy === cy ? null : current))}
                      />
                    </g>
                  );
                }}
                activeDot={false}
                connectNulls
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>

      {/* Small, unobtrusive hover label — replaces the default recharts
          Tooltip entirely (see comment above). Clamped within the chart's
          own box so it never spills outside the container regardless of
          which point is hovered. */}
      {hover && (
        <div
          className="pointer-events-none absolute z-10 whitespace-nowrap rounded-md border border-border bg-surface px-2 py-1 text-xs shadow-sm"
          style={{
            left: `clamp(4px, ${hover.cx}px, calc(100% - 4px))`,
            top: `clamp(4px, ${hover.cy - 34}px, calc(100% - 28px))`,
            transform: "translateX(-50%)",
          }}
        >
          <span className="font-semibold text-ink">{hoverName}</span>
          <span className="text-muted">
            {" "}
            — {hover.value}%{hover.fullMonth ? ` · ${hover.fullMonth}` : ""}
          </span>
        </div>
      )}
    </div>
  );
}
