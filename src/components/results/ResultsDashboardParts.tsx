"use client";

// Shared presentational building blocks for BOTH results scopes —
// constituency (PublicResultsView) and statewide (StatewideResultsView).
// Keeping these in one place is what makes "मेरी विधानसभा" and "पूरा उत्तर
// प्रदेश" render as the same dashboard design with only the underlying data
// differing, instead of two independently-maintained layouts drifting apart.

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { FlaskConical, Info, Share2, ShieldCheck } from "lucide-react";
import { ResultBars } from "./ResultBars";
import { useLocale } from "@/lib/i18n/LocaleProvider";
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

export function PartySupportChart({ buckets, locale }: { buckets: PublicAnalyticsBucket[]; locale: "hi" | "en" }) {
  const maxPct = Math.max(1, ...buckets.map((b) => (b.state === "available" ? b.percentage : 0)));
  return (
    <div className="flex min-w-max items-end gap-4 sm:gap-6">
      {buckets.map((bucket, index) => {
        const displayName = locale === "hi" && bucket.nameHindi ? bucket.nameHindi : bucket.label;
        const logoUrl = bucket.logoUrl ?? null;
        const pct = bucket.state === "available" ? bucket.percentage : null;
        const barHeightPx = pct === null ? 4 : Math.max(6, (pct / maxPct) * 96);
        return (
          <div key={bucket.key} className="flex w-16 shrink-0 flex-col items-center gap-2 text-center sm:w-[4.5rem]">
            <span className="font-display text-lg font-extrabold tabular-nums text-ink">{pct === null ? "—" : `${pct}%`}</span>
            <div className="flex h-24 w-full items-end justify-center">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: barHeightPx }}
                transition={{ duration: 0.6, delay: index * 0.04, ease: "easeOut" }}
                className="w-8 rounded-t-md sm:w-10"
                style={{ background: bucket.colorHex ?? "var(--ink)" }}
              />
            </div>
            {logoUrl ? (
              <Image src={logoUrl} alt="" width={32} height={32} className="h-8 w-8 object-contain" />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-[10px] font-bold text-muted">
                {displayName.slice(0, 3).toUpperCase()}
              </span>
            )}
            <span className="text-[11px] font-bold leading-tight text-ink">{bucket.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function IssuesDonutChart({ distribution, centerLabel }: { distribution: PublicDistribution; centerLabel: string }) {
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
    color: bucket.colorHex ?? ISSUE_COLORS[index % ISSUE_COLORS.length],
  }));

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
      <div className="relative h-40 w-40 shrink-0 sm:h-44 sm:w-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="100%" paddingAngle={2} stroke="none">
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center">
          <span className="font-display text-sm font-bold leading-tight text-ink">{centerLabel}</span>
        </div>
      </div>
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

export function DistributionCard({ title, distribution }: { title: string; distribution: PublicDistribution }) {
  const { t } = useLocale();
  return (
    <div className="card-surface rounded-2xl p-5">
      <h3 className="font-display font-bold">{title}</h3>
      <div className="mt-4">
        {distribution.state === "available" && distribution.buckets.length > 0 ? (
          <ResultBars options={distribution.buckets} />
        ) : (
          <InlineState>{distribution.state === "suppressed" ? t.results.resultsSuppressed : t.results.noBreakdownData}</InlineState>
        )}
      </div>
    </div>
  );
}

export function MethodItem({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs text-muted">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>;
}

// Self-contained disclaimer + share banner — used identically by both
// scopes. `shareTitle` differentiates the Web Share payload; the shared URL
// is always the page's own current URL (including whatever scope query the
// results toggle has written to it), so sharing from "पूरा उत्तर प्रदेश"
// never accidentally shares the constituency link, and vice versa.
export function DisclaimerShareBar({ shareTitle }: { shareTitle: string }) {
  const { t } = useLocale();
  const [shared, setShared] = useState(false);

  async function handleShare() {
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url: shareUrl });
        return;
      } catch {
        // user cancelled or share failed — fall through to clipboard
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    }
  }

  return (
    <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
          <Info size={16} />
        </span>
        <div>
          <p className="text-sm font-bold text-ink">{t.results.disclaimerBannerTitle}</p>
          <p className="mt-0.5 text-xs leading-5 text-muted">{t.results.disclaimerBannerBody}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-ink/40 bg-white px-4 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-ink/5"
      >
        <Share2 size={16} /> {shared ? t.results.shareCopied : t.results.shareResults}
      </button>
    </div>
  );
}
