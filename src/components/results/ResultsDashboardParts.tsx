"use client";

// Shared presentational building blocks for BOTH results scopes —
// constituency (PublicResultsView) and statewide (StatewideResultsView).
// Keeping these in one place is what makes "मेरी विधानसभा" and "पूरा उत्तर
// प्रदेश" render as the same dashboard design with only the underlying data
// differing, instead of two independently-maintained layouts drifting apart.

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { TooltipContentProps } from "recharts";
import { FlaskConical, Info, Share2, ShieldCheck } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { buildResultShareHook, buildResultShareMessage } from "@/lib/share-message";
import { LinkButton } from "@/components/ui/Button";
import { SocialShareButtons } from "./SocialShareButtons";
import type { PublicAnalyticsBucket, PublicDistribution } from "@/lib/public-analytics-core";

export const ISSUE_COLORS = ["#138a4b", "#2563eb", "#ff5a00", "#dc2626", "#7c3aed", "#78350f", "#94a3b8", "#0891b2"];

export function SummaryCard({
  icon,
  iconClass,
  label,
  value,
  delta,
}: {
  icon: React.ReactNode;
  iconClass: string;
  label: string;
  value: string;
  delta?: number | null;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface px-4 py-3.5 shadow-[var(--shadow-card)]">
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconClass}`}>{icon}</span>
      <p className="mt-2.5 truncate font-display text-2xl font-extrabold text-ink">{value}</p>
      <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
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

// VERTICAL bar chart (not a donut, not horizontal bars) — Party Support and
// Current Vote Share are two different visualizations of the same
// underlying party distribution: Party Support is this vertical bar chart,
// Current Vote Share is the donut (IssuesDonutChart, reused as-is below).
// Bars sit in a left-aligned flex row (not a stretched grid), so 1–2
// parties render as a couple of normal-width columns instead of stretching
// to fill the container. A bucket without a party logo falls back to a
// colored dot using its colorHex (or the shared ISSUE_COLORS rotation) —
// never a random per-render color.
export function PartySupportChart({ buckets, locale }: { buckets: PublicAnalyticsBucket[]; locale: "hi" | "en" }) {
  const { t } = useLocale();
  const available = buckets.filter(
    (bucket): bucket is Extract<PublicAnalyticsBucket, { state: "available" }> => bucket.state === "available"
  );
  const suppressed = buckets.filter((bucket) => bucket.state === "suppressed");

  if (available.length === 0) {
    return <InlineState>{t.results.resultsSuppressed}</InlineState>;
  }

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
    name: locale === "hi" && bucket.nameHindi ? bucket.nameHindi : bucket.label,
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
export function KeyIssuesPanel({
  distribution,
  centerLabel,
  topIssuesLabel,
}: {
  distribution: PublicDistribution;
  centerLabel: string;
  topIssuesLabel: string;
}) {
  const { locale } = useLocale();
  const available =
    distribution.state === "available"
      ? distribution.buckets.filter((b): b is Extract<PublicAnalyticsBucket, { state: "available" }> => b.state === "available")
      : [];

  if (available.length === 0) {
    return <IssuesDonutChart distribution={distribution} centerLabel={centerLabel} />;
  }

  const sorted = available
    .map((b, index) => ({
      key: b.key,
      label: locale === "hi" && b.nameHindi ? b.nameHindi : b.label,
      percentage: b.percentage,
      color: b.colorHex ?? ISSUE_COLORS[index % ISSUE_COLORS.length],
    }))
    .sort((a, b) => b.percentage - a.percentage);

  return (
    <div className="grid gap-4 lg:grid-cols-[40fr_25fr_35fr] lg:items-start">
      <div className="flex min-w-0 justify-center lg:col-span-1">
        <IssuesDonutChart distribution={distribution} centerLabel={centerLabel} size="lg" hideLegend tooltip />
      </div>
      <div className="min-w-0 border-t border-border pt-4 lg:col-span-1 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
        <ul className="space-y-1.5">
          {sorted.map((issue) => (
            <li key={issue.key} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex min-w-0 items-center gap-1.5 text-foreground">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: issue.color }} />
                <span className="truncate">{issue.label}</span>
              </span>
              <span className="shrink-0 font-display font-bold tabular-nums text-ink">{issue.percentage}%</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="min-w-0 border-t border-border pt-4 lg:col-span-1 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
        <h3 className="font-display text-xs font-bold uppercase tracking-wide text-muted">{topIssuesLabel}</h3>
        <ol className="mt-3 space-y-2">
          {sorted.slice(0, 3).map((issue, index) => (
            <li key={issue.key} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2">
              <span className="flex min-w-0 items-center gap-2 text-sm text-foreground">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-white">
                  {index + 1}
                </span>
                <span className="truncate">{issue.label}</span>
              </span>
              <span className="shrink-0 font-display font-bold tabular-nums text-ink">{issue.percentage}%</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

// The single CTA that sends a public Results-page visitor from the
// simplified summary here into the full Analysis dashboard for the same
// state/election — always built from analysisHref (routes.ts's
// analysisPath), never a hardcoded "/analysis" path, so it stays correct
// for whichever state/election context the results page is currently in.
export function DetailedAnalysisCta({ analysisHref }: { analysisHref: string }) {
  const { t } = useLocale();
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
