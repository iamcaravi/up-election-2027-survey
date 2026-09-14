"use client";

import { Sparkles } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { buildAnalysisInsights } from "@/lib/analysis-insights";
import type { StateAnalysisData } from "@/lib/state-analysis";

const CHANGE_INSIGHT_IDS = new Set(["momentum-rise", "momentum-fall", "gender-gap", "age-spread"]);
const NON_MOMENTUM_CHANGE_IDS = new Set(["gender-gap", "age-spread"]);

// "इस महीने क्या बदला?" — a compact, time/movement-focused subset of the
// same insight engine that powers Key Takeaways (buildAnalysisInsights),
// filtered to only the observed-change insight types (momentum, gender gap,
// age-group spread) rather than static-snapshot ones (leading party, top
// issue) — this reuses the exact same computation, it does not run a second
// aggregation. Every line is real month-over-month or group-comparison
// movement, never a forecast.
//
// `heading` and `momentumOverride` let the Party Momentum month picker
// repoint this strip at an older month: the momentum-rise/momentum-fall
// lines (which the default `buildAnalysisInsights` call always derives from
// the LATEST month) get replaced with lines for the selected month's own
// transition, while gender-gap/age-spread — which aren't about any
// particular month — are left exactly as the insight engine computes them.
export function WhatChangedStrip({
  data,
  heading,
  momentumOverride,
}: {
  data: StateAnalysisData;
  heading?: string;
  momentumOverride?: string[];
}) {
  const { t, locale } = useLocale();
  const allInsights = buildAnalysisInsights(data, t, locale).filter((i) => CHANGE_INSIGHT_IDS.has(i.id));
  const momentumLines = momentumOverride ?? allInsights.filter((i) => !NON_MOMENTUM_CHANGE_IDS.has(i.id)).map((i) => i.headline);
  const otherLines = allInsights.filter((i) => NON_MOMENTUM_CHANGE_IDS.has(i.id)).map((i) => i.headline);
  const lines = [...momentumLines, ...otherLines].slice(0, 5);

  return (
    <div>
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-accent" />
        <div>
          <h3 className="font-display text-sm font-bold text-ink">{heading ?? t.analysisHub.whatChangedHeading}</h3>
          <p className="mt-0.5 text-xs text-muted">{t.analysisHub.whatChangedSubtitle}</p>
        </div>
      </div>
      {lines.length === 0 ? (
        <p className="mt-3 text-xs text-muted">{t.analysisHub.whatChangedEmpty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {lines.map((line, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-foreground">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
