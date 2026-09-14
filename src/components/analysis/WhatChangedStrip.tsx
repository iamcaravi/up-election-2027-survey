"use client";

import { Sparkles } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { buildAnalysisInsights } from "@/lib/analysis-insights";
import type { StateAnalysisData } from "@/lib/state-analysis";

const CHANGE_INSIGHT_IDS = new Set(["momentum-rise", "momentum-fall", "gender-gap", "age-spread"]);

// "इस महीने क्या बदला?" — a compact, time/movement-focused subset of the
// same insight engine that powers Key Takeaways (buildAnalysisInsights),
// filtered to only the observed-change insight types (momentum, gender gap,
// age-group spread) rather than static-snapshot ones (leading party, top
// issue) — this reuses the exact same computation, it does not run a second
// aggregation. Every line is real month-over-month or group-comparison
// movement, never a forecast.
export function WhatChangedStrip({ data }: { data: StateAnalysisData }) {
  const { t, locale } = useLocale();
  const insights = buildAnalysisInsights(data, t, locale).filter((i) => CHANGE_INSIGHT_IDS.has(i.id));

  return (
    <section className="mt-8 card-surface rounded-2xl p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-accent" />
        <div>
          <h2 className="font-display text-lg font-bold">{t.analysisHub.whatChangedHeading}</h2>
          <p className="mt-0.5 text-xs text-muted">{t.analysisHub.whatChangedSubtitle}</p>
        </div>
      </div>
      {insights.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{t.analysisHub.whatChangedEmpty}</p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {insights.slice(0, 5).map((insight) => (
            <li key={insight.id} className="flex items-start gap-2 text-sm text-foreground">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span>{insight.headline}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
