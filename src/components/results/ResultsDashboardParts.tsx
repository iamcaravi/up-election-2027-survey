"use client";

// Shared presentational building blocks for BOTH results scopes —
// constituency (PublicResultsView) and statewide (StatewideResultsView).
// Keeping these in one place is what makes "मेरी विधानसभा" and "पूरा उत्तर
// प्रदेश" render as the same dashboard design with only the underlying data
// differing, instead of two independently-maintained layouts drifting apart.

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { TooltipContentProps, PieLabelRenderProps } from "recharts";
import { CheckCircle2, FlaskConical, Info, Share2, ShieldCheck, UserX } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { resolveOptionLabel } from "@/lib/option-labels";
import { buildResultShareHook, buildResultShareMessage } from "@/lib/share-message";
import { LinkButton } from "@/components/ui/Button";
import { SocialShareButtons } from "./SocialShareButtons";
import { CandidateAvatar } from "@/components/candidate/CandidateAvatar";
import { MLA_SATISFACTION_OPTIONS } from "@/lib/enums";
import type { CurrentMlaInfo } from "@/lib/current-mla";
import type { PublicAnalyticsBucket, PublicDistribution } from "@/lib/public-analytics-core";

export const ISSUE_COLORS = ["#138a4b", "#2563eb", "#ff5a00", "#dc2626", "#7c3aed", "#78350f", "#94a3b8", "#0891b2"];

// One tone per metric identity, defined once here rather than as ad-hoc
// className strings at each call site, so "the same metric keeps the same
// color wherever it appears" is enforced by the type system instead of by
// convention. Each tone pairs a very light tinted card background + matching
// soft border with a slightly stronger icon-tile fill — the "positive" tones
// reuse the app's existing --color-positive token (same green already used
// for delta-up indicators elsewhere) rather than introducing an unrelated
// emerald palette.
const SUMMARY_CARD_TONES = {
  blue: { bg: "bg-blue-50/70", border: "border-blue-100", icon: "bg-blue-100 text-blue-700" },
  green: { bg: "bg-positive/5", border: "border-positive/15", icon: "bg-positive/10 text-positive" },
  orange: { bg: "bg-orange-50/70", border: "border-orange-100", icon: "bg-orange-100 text-orange-700" },
  purple: { bg: "bg-purple-50/70", border: "border-purple-100", icon: "bg-purple-100 text-purple-700" },
  teal: { bg: "bg-teal-50/70", border: "border-teal-100", icon: "bg-teal-100 text-teal-700" },
} as const;

export function SummaryCard({
  icon,
  tone,
  label,
  value,
  delta,
}: {
  icon: React.ReactNode;
  tone: keyof typeof SUMMARY_CARD_TONES;
  label: string;
  value: string;
  delta?: number | null;
}) {
  const { bg, border, icon: iconClass } = SUMMARY_CARD_TONES[tone];
  return (
    <div className={`rounded-2xl border ${border} ${bg} px-3.5 py-3 sm:px-4 sm:py-3.5 shadow-[var(--shadow-card)]`}>
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconClass}`}>{icon}</span>
      <p className="mt-2 sm:mt-2.5 truncate font-display text-xl sm:text-2xl font-extrabold leading-snug text-ink">{value}</p>
      <p className="mt-0.5 flex flex-wrap items-center gap-1 sm:gap-1.5 text-xs leading-snug text-muted">
        {label}
        {typeof delta === "number" && (
          <span className={delta >= 0 ? "font-bold text-positive" : "font-bold text-danger"}>
            {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}%
          </span>
        )}
      </p>
    </div>
  );
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const listener = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, []);
  return reduced;
}

function PartySupportTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0].payload as { name?: string; value?: number; count?: number } | undefined;
  if (!entry) return null;
  return (
    <div className="rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs shadow-sm">
      <p className="font-semibold text-ink">{entry.name}</p>
      <p className="text-muted">
        {entry.value}% {typeof entry.count === "number" ? `· ${entry.count}` : ""}
      </p>
    </div>
  );
}

const SEMICIRCLE_RADIAN = Math.PI / 180;

// News-channel-style semicircular gauge (left/main, ~65–70% width) + a
// compact party table (right, ~30–35%) — same underlying PublicAnalyticsBucket[]
// the old vertical bar chart read, same percentages/counts/order/colors/logos,
// just a different visual treatment. Segment angle is proportional to each
// bucket's own `percentage` (recharts normalizes slice angle by the sum of
// values passed in, same as every other pie/donut already in this app —
// the displayed labels are always the raw, unmodified bucket.percentage).
// `stacked` forces chart-above-table even on wide viewports, for a caller
// placed in a narrower grid column (e.g. the Analysis page's Party
// Landscape module) where the side-by-side layout would be too cramped —
// same escape hatch IssuesDonutChart's own `stacked` prop already uses.
export function PartySupportChart({
  buckets,
  locale,
  stacked,
  variant = "semiDonut",
}: {
  buckets: PublicAnalyticsBucket[];
  locale: "hi" | "en";
  stacked?: boolean;
  /** "semiDonut" (default) is the large TV-news-style half-circle + party
   *  table used on the public Results page. "bars" is the original vertical
   *  bar chart, kept for the Analysis page's Party Landscape module, which
   *  already shows a full donut (Current Vote Share) right next to this —
   *  two semi-/full-donuts side by side read as duplicated charts, so that
   *  page keeps the bars instead. Same data, same colors, same order,
   *  purely a different chart type per caller. */
  variant?: "semiDonut" | "bars";
}) {
  const { t } = useLocale();
  const reducedMotion = usePrefersReducedMotion();
  const available = buckets.filter(
    (bucket): bucket is Extract<PublicAnalyticsBucket, { state: "available" }> => bucket.state === "available"
  );
  const suppressed = buckets.filter((bucket) => bucket.state === "suppressed");

  if (available.length === 0) {
    return <InlineState>{t.results.resultsSuppressed}</InlineState>;
  }

  if (variant === "bars") {
    const maxPct = Math.max(1, ...available.map((b) => b.percentage));
    const BAR_AREA_HEIGHT = 128;
    return (
      <div className="flex flex-nowrap items-end gap-3 overflow-x-auto pb-1 sm:gap-4">
        {available.map((bucket, index) => {
          const name = locale === "hi" && bucket.nameHindi ? bucket.nameHindi : bucket.label;
          const color = bucket.colorHex ?? ISSUE_COLORS[index % ISSUE_COLORS.length];
          const barHeight = Math.max(6, (bucket.percentage / maxPct) * BAR_AREA_HEIGHT);
          return (
            <div key={bucket.key} className="flex w-14 shrink-0 flex-col items-center gap-1.5 text-center sm:w-[4.5rem]">
              <span className="font-display text-sm font-extrabold tabular-nums text-ink">{bucket.percentage}%</span>
              <div className="flex items-end" style={{ height: BAR_AREA_HEIGHT }}>
                <div
                  className="w-8 rounded-t-md transition-all duration-500 sm:w-10"
                  style={{ height: barHeight, background: color }}
                />
              </div>
              {bucket.logoUrl ? (
                <Image src={bucket.logoUrl} alt="" width={22} height={22} className="h-[22px] w-[22px] shrink-0 rounded-full object-contain" />
              ) : (
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: color }} />
              )}
              <span className="w-full truncate text-xs font-semibold text-ink">{name}</span>
            </div>
          );
        })}
        {suppressed.map((bucket) => (
          <div key={bucket.key} className="flex w-14 shrink-0 flex-col items-center gap-1.5 text-center text-muted sm:w-[4.5rem]">
            <span className="text-xs">{t.results.suppressed}</span>
            <div className="flex items-end" style={{ height: BAR_AREA_HEIGHT }}>
              <div className="h-1.5 w-8 rounded-t-md bg-border sm:w-10" />
            </div>
            <span className="h-3 w-3 shrink-0 rounded-full bg-border" />
            <span className="w-full truncate text-xs font-semibold">{bucket.label}</span>
          </div>
        ))}
      </div>
    );
  }

  const rows = available.map((bucket, index) => ({
    key: bucket.key,
    name: locale === "hi" && bucket.nameHindi ? bucket.nameHindi : bucket.label,
    value: bucket.percentage,
    count: bucket.count,
    color: bucket.colorHex ?? ISSUE_COLORS[index % ISSUE_COLORS.length],
    logoUrl: bucket.logoUrl,
  }));
  const totalResponses = available.reduce((sum, bucket) => sum + bucket.count, 0);
  const numberFormatter = new Intl.NumberFormat(locale === "hi" ? "hi-IN" : "en-IN");

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 py-2 ${stacked ? "!flex-col" : ""}`}>
      <div className="relative h-[210px] w-[210px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={rows}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius="90%"
              innerRadius="62%"
              paddingAngle={rows.length > 1 ? 2 : 0}
              stroke="var(--color-surface, #fff)"
              strokeWidth={2}
            >
              {rows.map((entry) => (
                <Cell key={entry.key} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(val: any, _name: any, item: any) => {
                const row = item?.payload as (typeof rows)[number] | undefined;
                return [
                  `${typeof val === "number" ? val : Number(val ?? 0)}%${row ? ` · ${numberFormatter.format(row.count)}` : ""}`,
                  row?.name ?? "",
                ];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-display text-2xl sm:text-3xl font-black tabular-nums text-ink leading-tight">
            {numberFormatter.format(totalResponses)}
          </span>
          <span className="text-[11px] font-medium text-muted mt-0.5">
            {locale === "hi" ? "कुल प्रतिक्रियाएं" : "Total Responses"}
          </span>
        </div>
      </div>

      <div className="w-full sm:w-auto sm:min-w-[190px] flex-1 space-y-2.5">
        {rows.map((entry) => (
          <div key={entry.key} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.logoUrl ? (
                <Image src={entry.logoUrl} alt="" width={16} height={16} className="h-4 w-4 shrink-0 rounded-full object-contain" />
              ) : null}
              <span className="font-medium text-ink truncate text-[13px] sm:text-sm">{entry.name}</span>
            </div>
            <div className="shrink-0 text-right font-display text-[13px] sm:text-sm">
              <span className="font-bold text-ink tabular-nums">{entry.value}%</span>
              <span className="ml-1 text-xs text-muted tabular-nums">({numberFormatter.format(entry.count)})</span>
            </div>
          </div>
        ))}
        {suppressed.map((bucket) => (
          <div key={bucket.key} className="flex items-center justify-between gap-3 text-sm text-muted">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-border" />
              <span className="font-medium truncate text-[13px] sm:text-sm">{bucket.label}</span>
            </div>
            <span className="shrink-0 text-xs">{t.results.suppressed}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0].payload as { name?: string; value?: number; count?: number } | undefined;
  if (!entry) return null;
  return (
    <div className="rounded-md border border-border bg-surface px-2 py-1 text-xs shadow-sm">
      <span className="font-semibold text-ink">{entry.name}</span>
      <span className="text-muted">
        {" "}
        — {entry.value}%{typeof entry.count === "number" ? ` · ${entry.count}` : ""}
      </span>
    </div>
  );
}

export function IssuesDonutChart({
  distribution,
  centerLabel,
  stacked,
  size = "md",
  hideLegend,
  tooltip,
}: {
  distribution: PublicDistribution;
  centerLabel: string;
  /** Always stack donut above legend, even at sm:+ widths — for callers
   *  placed inside a narrow grid column (e.g. a 4-up card grid) where the
   *  default side-by-side layout leaves the legend too little width and
   *  category names truncate to nothing. Every other caller keeps the
   *  existing side-by-side layout unchanged. */
  stacked?: boolean;
  /** "lg" for a caller with real room to spare (e.g. a 70%-width column),
   *  "xl" for a caller centering the donut alone with no side legend —
   *  every other existing caller keeps the original "md" size unchanged. */
  size?: "md" | "lg" | "xl";
  /** Skip the built-in side/below legend entirely — for a caller that
   *  already renders the same issue+percentage list itself in its own
   *  layout (e.g. a data grid below the chart), where the built-in legend
   *  would just be a second, redundant copy of the same list. */
  hideLegend?: boolean;
  /** Opt-in hover/focus tooltip (name, percentage, and response count when
   *  the distribution provides one) — off by default because most callers
   *  already show every value permanently via the legend, which makes a
   *  tooltip redundant; a caller that hides the legend (hideLegend) has no
   *  other on-chart way to read one slice's exact numbers, so it opts in. */
  tooltip?: boolean;
}) {
  const { locale, t } = useLocale();
  if (distribution.state !== "available" || distribution.buckets.length === 0) {
    return <InlineState>{distribution.state === "suppressed" ? t.results.resultsSuppressed : t.results.noBreakdownData}</InlineState>;
  }
  const available = distribution.buckets.filter(
    (bucket): bucket is Extract<PublicAnalyticsBucket, { state: "available" }> => bucket.state === "available"
  );
  if (available.length === 0) return <InlineState>{t.results.resultsSuppressed}</InlineState>;

  const chartData = available.map((bucket, index) => ({
    name: resolveOptionLabel(bucket.key, bucket, locale, t.surveyQuestions.options),
    value: bucket.percentage,
    count: bucket.count,
    color: bucket.colorHex ?? ISSUE_COLORS[index % ISSUE_COLORS.length],
  }));

  const sizeClass = size === "xl" ? "h-64 w-64 sm:h-80 sm:w-80" : size === "lg" ? "h-56 w-56 sm:h-64 sm:w-64" : "h-40 w-40 sm:h-44 sm:w-44";

  return (
    <div className={`flex flex-col items-center gap-6 ${stacked || hideLegend ? "" : "sm:flex-row sm:items-center"}`}>
      <div className={`relative shrink-0 ${sizeClass}`}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="100%" paddingAngle={2} stroke="none">
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            {tooltip && <Tooltip content={(props) => <DonutTooltip {...props} />} />}
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {/* max-w matched to the donut's own inner-hole size (innerRadius
              62% above) rather than just outer padding — a longer label
              (e.g. a full party name) now wraps to 2 lines within the hole
              instead of overflowing past the ring. text-center keeps a
              2-line label visually centered instead of ragged-left, which
              is what made short center labels look off-center before. */}
          <span
            className={`max-w-[62%] whitespace-pre-line break-words text-center font-display font-bold leading-tight text-ink ${
              size === "xl" ? "text-base sm:text-lg" : size === "lg" ? "text-sm sm:text-base" : "text-[11px] sm:text-xs"
            }`}
          >
            {centerLabel}
          </span>
        </div>
      </div>
      {!hideLegend && (
        <ul className="w-full min-w-0 space-y-2">
          {chartData.map((entry) => (
            <li key={entry.name} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: entry.color }} />
                <span className="truncate">{entry.name}</span>
              </span>
              <span className="shrink-0 font-bold tabular-nums text-ink">{entry.value}%</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// The Key Issues section as it appears on the public Results page and the
// state Analysis dashboard: a large donut (40%), the full issue list (25%),
// and the top-3 ranked issues (35%) side by side. Built once here so both
// pages share one implementation instead of drifting apart; falls back to
// IssuesDonutChart's own unavailable/suppressed placeholder when there's
// nothing to rank.
export const RANK_COLORS = [
  "#ea580c", // 1 - Orange
  "#2563eb", // 2 - Blue
  "#16a34a", // 3 - Green
  "#dc2626", // 4 - Red
  "#9333ea", // 5 - Purple
  "#d97706", // 6 - Amber
  "#c2410c", // 7 - Dark Orange
  "#64748b", // 8 - Slate
  "#0891b2", // 9 - Cyan
  "#4f46e5", // 10 - Indigo
];

export function KeyIssuesPanel({
  distribution,
  centerLabel,
  topIssuesLabel,
  totalResponses,
}: {
  distribution: PublicDistribution;
  centerLabel?: string;
  topIssuesLabel?: string;
  totalResponses?: number | null;
}) {
  const { locale, t } = useLocale();
  const numberFormatter = new Intl.NumberFormat(locale === "hi" ? "hi-IN" : "en-IN");
  const available =
    distribution.state === "available"
      ? distribution.buckets.filter((b): b is Extract<PublicAnalyticsBucket, { state: "available" }> => b.state === "available")
      : [];

  if (available.length === 0) {
    return <InlineState>{distribution.state === "suppressed" ? t.results.resultsSuppressed : t.results.noBreakdownData}</InlineState>;
  }

  const sorted = available
    .map((b) => ({
      key: b.key,
      label: resolveOptionLabel(b.key, b, locale, t.surveyQuestions.options),
      percentage: b.percentage,
      count: b.count,
    }))
    .sort((a, b) => b.percentage - a.percentage || b.count - a.count);

  return (
    <div className="w-full">
      {/* Desktop ranked bars (>=sm) */}
      <div className="hidden sm:block w-full">
        <div className="grid grid-cols-[minmax(180px,260px)_1fr_80px_90px] items-center gap-4 sm:gap-6 pb-2.5 border-b border-border text-xs font-bold uppercase tracking-wider text-muted">
          <div></div>
          <div></div>
          <div className="text-right">{locale === "hi" ? "प्रतिशत" : "Percent"}</div>
          <div className="text-right">{locale === "hi" ? "प्रतिक्रियाएं" : "Responses"}</div>
        </div>

        <div className="divide-y divide-border/40">
          {sorted.map((issue, index) => {
            const rankColor = RANK_COLORS[index % RANK_COLORS.length];
            return (
              <div
                key={issue.key}
                className="grid grid-cols-[minmax(180px,260px)_1fr_80px_90px] items-center gap-4 sm:gap-6 py-3"
              >
                <div className="flex items-center gap-3.5 min-w-0 pr-2">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-xs"
                    style={{ backgroundColor: rankColor }}
                  >
                    {index + 1}
                  </span>
                  <span className="font-semibold text-sm sm:text-base text-ink truncate">
                    {issue.label}
                  </span>
                </div>

                <div className="min-w-0 w-full">
                  <div className="h-3.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.max(3, issue.percentage))}%`,
                        backgroundColor: rankColor,
                      }}
                    />
                  </div>
                </div>

                <div
                  className="text-right font-display font-extrabold text-sm sm:text-base tabular-nums"
                  style={{ color: rankColor }}
                >
                  {issue.percentage}%
                </div>

                <div className="text-right font-semibold text-xs sm:text-sm text-muted tabular-nums">
                  {numberFormatter.format(issue.count)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile ranked bars (<sm) */}
      <div className="block sm:hidden w-full divide-y divide-border/40">
        {sorted.map((issue, index) => {
          const rankColor = RANK_COLORS[index % RANK_COLORS.length];
          return (
            <div key={issue.key} className="flex items-center gap-3 py-3">
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-xs"
                style={{ backgroundColor: rankColor }}
              >
                {index + 1}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold text-sm text-ink truncate">
                    {issue.label}
                  </span>
                  <div className="shrink-0 text-right font-display">
                    <span className="font-extrabold text-sm tabular-nums" style={{ color: rankColor }}>
                      {issue.percentage}%
                    </span>
                    <span className="ml-1 text-xs text-muted tabular-nums">
                      ({numberFormatter.format(issue.count)})
                    </span>
                  </div>
                </div>

                <div className="mt-1.5 h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(4, issue.percentage))}%`,
                      backgroundColor: rankColor,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// The single CTA that sends a public Results-page visitor from the
// simplified summary here into the full Analysis dashboard for the same
// state/election — always built from analysisHref (routes.ts's
// analysisPath), never a hardcoded "/analysis" path, so it stays correct
// for whichever state/election context the results page is currently in.
// "compact" is the same CTA rendered as a single button (no subtitle/card
// chrome) for a tight slot like the page header, next to the title — the
// destination and localized copy are identical, only the presentation
// differs; "card" (default) is the original full block used wherever the
// header isn't available (e.g. the standalone constituency results page).
export function DetailedAnalysisCta({
  analysisHref,
  variant = "card",
}: {
  analysisHref: string;
  variant?: "card" | "compact";
}) {
  const { t } = useLocale();

  if (variant === "compact") {
    return (
      <LinkButton href={analysisHref} variant="cta" className="w-full shrink-0 sm:w-auto">
        {t.results.detailedAnalysisCtaTitle}
        <span aria-hidden="true">→</span>
      </LinkButton>
    );
  }

  return (
    <div className="mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-border bg-surface p-5 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:p-6">
      <div className="min-w-0">
        <p className="font-display text-lg font-bold text-ink sm:text-xl">{t.results.detailedAnalysisCtaTitle}</p>
        <p className="mt-1 text-sm text-muted">{t.results.detailedAnalysisCtaBody}</p>
      </div>
      <LinkButton href={analysisHref} variant="cta" className="w-full shrink-0 sm:w-auto">
        {t.results.detailedAnalysisCtaButton}
        <span aria-hidden="true">→</span>
      </LinkButton>
    </div>
  );
}

export function StateCard({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: { href: string; label: string };
}) {
  return (
    <section className="mt-6 rounded-3xl border border-dashed border-border bg-surface-2 px-5 py-10 text-center sm:px-10">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ink/10 text-ink">{icon}</span>
      <h2 className="mt-5 font-display text-xl font-bold">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted">{body}</p>
      {action && (
        <Link href={action.href} className="mt-5 inline-flex rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white">
          {action.label}
        </Link>
      )}
    </section>
  );
}

// Shown near the results header whenever Demo Data Mode is on — this is the
// ONLY thing that visually distinguishes synthetic demo data from real
// survey results, so it must never be skipped or made easy to miss.
export function SyntheticDataBanner() {
  const { t } = useLocale();
  return (
    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-900">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-900">
        <FlaskConical size={16} />
      </span>
      <div>
        <p className="text-sm font-extrabold">{t.results.demoBadge}</p>
        <p className="mt-0.5 text-xs leading-5">{t.results.syntheticNotice}</p>
      </div>
    </div>
  );
}

export function PrivacyPill() {
  const { t } = useLocale();
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-positive/25 bg-positive/10 px-2.5 py-1 text-[11px] font-semibold text-positive">
      <ShieldCheck size={13} /> {t.results.privacyProtected}
    </span>
  );
}

export function InlineState({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-border bg-surface-2 p-5 text-center text-sm text-muted">{children}</p>;
}

// Voter Profile (Age Group / Gender / Religion) uses the exact same donut +
// legend visual language as Top Issues (IssuesDonutChart, reused as-is —
// not a second chart implementation) so the whole "distribution of X" family
// of charts on this dashboard reads as one consistent style. Only the
// presentation changed here — the underlying distribution (counts,
// percentages, privacy suppression) is untouched and comes from the exact
// same aggregation this card always received.
export function MethodItem({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs text-muted">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>;
}

// Self-contained disclaimer + share banner — used identically by both
// scopes. `shareTitle` differentiates the Web Share payload; the shared URL
// is always the page's own current URL (including whatever scope query the
// results toggle has written to it), so sharing from "पूरा उत्तर प्रदेश"
// never accidentally shares the constituency link, and vice versa.
// `electionYear` builds the same promotional hook text (never a bare URL —
// see src/lib/share-message.ts) for both the generic Web-Share button and
// the WhatsApp/Facebook/X/Instagram icons below it.
export function DisclaimerShareBar({ shareTitle, electionYear }: { shareTitle: string; electionYear: number }) {
  const { t, locale } = useLocale();
  const [shared, setShared] = useState(false);
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const hook = buildResultShareHook({ locale, electionYear, scopeName: shareTitle });

  async function handleShare() {
    const message = buildResultShareMessage({ locale, electionYear, scopeName: shareTitle, url: shareUrl });
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: message, url: shareUrl });
        return;
      } catch {
        // user cancelled or share failed — fall through to clipboard
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(message);
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3.5 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
          <Info size={16} />
        </span>
        <div>
          <p className="text-sm font-bold text-ink">{t.results.disclaimerBannerTitle}</p>
          <p className="mt-0.5 text-xs leading-5 text-muted">{t.results.disclaimerBannerBody}</p>
        </div>
      </div>
      <div className="flex flex-col items-start gap-3 sm:items-end">
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-ink/40 bg-white px-4 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-ink/5"
        >
          <Share2 size={16} /> {shared ? t.results.shareCopied : t.results.shareResults}
        </button>
        <SocialShareButtons hook={hook} url={shareUrl} />
      </div>
    </div>
  );
}

export function MlaIdentityCard({
  mla,
  locale = "hi",
}: {
  mla?: CurrentMlaInfo | null;
  locale?: string;
}) {
  const { t } = useLocale();

  if (!mla || !mla.isVerified || !mla.name) {
    return (
      <div className="flex items-center gap-3.5 rounded-2xl border border-dashed border-border bg-surface-2 p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ink/5 text-muted">
          <UserX size={22} />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted">{t.results.currentMla}</p>
          <p className="text-sm font-bold text-ink">{t.results.noMlaData}</p>
          <p className="text-xs text-muted">{t.results.currentMlaRepresentative}</p>
        </div>
      </div>
    );
  }

  const displayName = locale === "hi" && mla.nameHindi ? mla.nameHindi : mla.name;
  const displayParty = locale === "hi" && mla.partyHindi ? mla.partyHindi : (mla.party ?? mla.partyShortName);
  const acInfo = mla.constituencyNumber
    ? `${mla.constituencyName} (AC #${mla.constituencyNumber})`
    : mla.constituencyName;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3.5 min-w-0">
        <CandidateAvatar
          name={displayName}
          photoUrl={mla.photoUrl}
          size={52}
          className="shrink-0 rounded-xl"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">{t.results.currentMla}</span>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-positive/10 px-2 py-0.5 text-[10px] font-semibold text-positive">
              <CheckCircle2 size={11} /> {t.results.verifiedRepresentative}
            </span>
          </div>
          <h3 className="truncate font-display text-base font-bold text-ink sm:text-lg">{displayName}</h3>
          <p className="truncate text-xs text-muted">
            <span className="font-semibold text-foreground">{displayParty}</span>
            <span className="mx-1.5 text-muted/60">•</span>
            <span>{acInfo}</span>
          </p>
        </div>
      </div>
      <div className="border-t border-border pt-2 text-right sm:border-t-0 sm:pt-0">
        <span className="inline-flex items-center gap-1 text-[11px] text-muted">
          <ShieldCheck size={12} className="text-positive" />
          {mla.sourceName ? `${mla.sourceName}` : t.results.officialAssemblyRecords}
        </span>
      </div>
    </div>
  );
}

export function MlaSatisfactionChart({
  distribution,
  locale = "hi",
}: {
  distribution: PublicDistribution;
  locale?: string;
}) {
  const { t } = useLocale();
  const numberFormatter = new Intl.NumberFormat(locale === "hi" ? "hi-IN" : "en-IN");

  if (distribution.state === "unavailable") {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface-2 p-6 text-center text-sm text-muted">
        {t.results.zeroMlaSatisfaction}
      </div>
    );
  }

  if (distribution.state === "suppressed") {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface-2 p-6 text-center text-sm text-muted">
        {t.results.resultsSuppressed}
      </div>
    );
  }

  const total = distribution.denominator;
  const bucketsByKey = new Map(distribution.buckets.map((b) => [b.key, b]));
  const rows = MLA_SATISFACTION_OPTIONS.map((opt) => {
    const bucket = bucketsByKey.get(opt.key);
    return {
      key: opt.key,
      name: locale === "hi" ? opt.label : opt.labelEn,
      color: opt.colorHex,
      count: bucket && bucket.state === "available" ? bucket.count : 0,
      value: bucket && bucket.state === "available" ? bucket.percentage : 0,
      isSuppressed: bucket?.state === "suppressed",
    };
  });

  const chartRows = rows.filter((row) => !row.isSuppressed && row.value > 0);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 py-2">
      <div className="relative h-[210px] w-[210px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartRows.length > 0 ? chartRows : [{ key: "empty", value: 1, color: "#e2e8f0" }]}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius="90%"
              innerRadius="62%"
              paddingAngle={chartRows.length > 1 ? 2 : 0}
              stroke="var(--color-surface, #fff)"
              strokeWidth={2}
            >
              {chartRows.length > 0 ? (
                chartRows.map((row) => (
                  <Cell key={row.key} fill={row.color} />
                ))
              ) : (
                <Cell fill="#e2e8f0" />
              )}
            </Pie>
            <Tooltip
              formatter={(val: any, _name: any, item: any) => {
                const row = item?.payload as (typeof chartRows)[number] | undefined;
                return [
                  `${typeof val === "number" ? val : Number(val ?? 0)}%${row ? ` · ${numberFormatter.format(row.count)}` : ""}`,
                  row?.name ?? "",
                ];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-display text-2xl sm:text-3xl font-black tabular-nums text-ink leading-tight">
            {numberFormatter.format(total)}
          </span>
          <span className="text-[11px] font-medium text-muted mt-0.5">
            {locale === "hi" ? "कुल प्रतिक्रियाएं" : "Total Responses"}
          </span>
        </div>
      </div>

      <div className="w-full sm:w-auto sm:min-w-[190px] flex-1 space-y-3">
        {rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
              <span className="font-medium text-ink truncate text-sm">{row.name}</span>
            </div>
            <div className="shrink-0 text-right font-display text-sm">
              {row.isSuppressed ? (
                <span className="text-xs text-muted">{t.results.suppressed}</span>
              ) : (
                <>
                  <span className="font-bold text-ink tabular-nums">{row.value}%</span>
                  <span className="ml-1 text-xs text-muted tabular-nums">({numberFormatter.format(row.count)})</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
