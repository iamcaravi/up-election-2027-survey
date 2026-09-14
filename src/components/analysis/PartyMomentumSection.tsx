"use client";

import { useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { PrivacyPill } from "@/components/results/ResultsDashboardParts";
import { PartyMomentum } from "./PartyMomentum";
import { WhatChangedStrip } from "./WhatChangedStrip";
import { computeMomentumForMonthIndex, buildMomentumReading, fullMonthLabel, fmt } from "@/lib/analysis-summaries";
import { ANALYSIS_CONFIG } from "@/lib/analysis-config";
import type { StateAnalysisData } from "@/lib/state-analysis";

// Section E — Party Momentum + What Changed, with a month picker added on
// top. The selected month is local component state (resets naturally on
// state/election navigation, since this component remounts along with the
// rest of the page — no extra reset logic needed). Every number still comes
// from `data.votePreferenceTrend`, the exact same month-by-month data the
// trend chart above already renders — computeMomentumForMonthIndex only
// picks which two adjacent months to diff, it never recomputes a
// percentage. The latest month (index = months.length - 1) reproduces the
// original single-month behavior exactly, using the same
// `data.partyMomentum` state-analysis.ts already computed server-side.
export function PartyMomentumSection({ data }: { data: StateAnalysisData }) {
  const { t, locale } = useLocale();
  const trend = data.votePreferenceTrend;
  const monthCount = trend.hasEnoughData ? trend.months.length : 0;
  const latestIndex = monthCount - 1;
  // Every index with a previous month to compare against — index 0 is
  // excluded because there's nothing before it to diff.
  const availableIndexes = monthCount >= 2 ? Array.from({ length: monthCount - 1 }, (_, i) => i + 1) : [];

  const [selectedIndex, setSelectedIndex] = useState(latestIndex);
  // Guard against an out-of-range index (e.g. this component's key didn't
  // change but the underlying data shrank) rather than crashing on
  // trend.months[selectedIndex] below.
  const effectiveIndex = trend.hasEnoughData && selectedIndex >= 1 && selectedIndex <= latestIndex ? selectedIndex : latestIndex;
  const isLatest = effectiveIndex === latestIndex;

  if (!ANALYSIS_CONFIG.advancedMomentum) return null;

  if (availableIndexes.length === 0) {
    return (
      <section className="mt-8 card-surface rounded-2xl p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold">{t.analysisHub.partyMomentumHeading}</h2>
            <p className="mt-0.5 text-xs text-muted">{t.analysisHub.partyMomentumSubtitle}</p>
          </div>
          <PrivacyPill />
        </div>
        <div className="mt-5">
          <PartyMomentum items={[]} />
        </div>
      </section>
    );
  }

  const momentum = isLatest ? data.partyMomentum : computeMomentumForMonthIndex(trend, effectiveIndex);
  const selectedMonthLabel = trend.hasEnoughData ? fullMonthLabel(trend.months[effectiveIndex].month, locale) : "";
  const prevMonthLabel = trend.hasEnoughData ? fullMonthLabel(trend.months[effectiveIndex - 1].month, locale) : "";
  const subtitle = isLatest
    ? t.analysisHub.partyMomentumSubtitle
    : fmt(t.analysisHub.momentumSubtitleForMonth, { month: selectedMonthLabel, prevMonth: prevMonthLabel });
  const cardVsLabel = isLatest ? undefined : fmt(t.analysisHub.momentumVsLabel, { month: prevMonthLabel });
  const whatChangedHeading = isLatest ? undefined : fmt(t.analysisHub.whatChangedHeadingForMonth, { month: selectedMonthLabel });
  const momentumOverride = isLatest ? undefined : buildMomentumReading(momentum, t, locale);

  return (
    <section className="mt-8 card-surface rounded-2xl p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">{t.analysisHub.partyMomentumHeading}</h2>
          <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="block">
            <span className="sr-only">{t.analysisHub.selectMonthLabel}</span>
            <select
              value={effectiveIndex}
              onChange={(e) => setSelectedIndex(Number(e.target.value))}
              className="h-9 rounded-lg border border-border bg-surface px-2.5 text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-ink/30"
            >
              {availableIndexes
                .slice()
                .reverse()
                .map((idx) => (
                  <option key={idx} value={idx}>
                    {trend.hasEnoughData ? fullMonthLabel(trend.months[idx].month, locale) : idx}
                  </option>
                ))}
            </select>
          </label>
          <PrivacyPill />
        </div>
      </div>
      <div className="mt-5">
        <PartyMomentum items={momentum} vsLabel={cardVsLabel} />
      </div>
      {ANALYSIS_CONFIG.advancedInsights && (
        <div className="mt-5 border-t border-border pt-5">
          <WhatChangedStrip data={data} heading={whatChangedHeading} momentumOverride={momentumOverride} />
        </div>
      )}
    </section>
  );
}
