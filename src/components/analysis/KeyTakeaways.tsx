"use client";

import { CheckCircle2, TrendingUp, TrendingDown, Users, Vote } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { buildAnalysisInsights, type Insight } from "@/lib/analysis-insights";
import type { StateAnalysisData } from "@/lib/state-analysis";

// Every sentence below comes from buildAnalysisInsights (src/lib/analysis-insights.ts),
// which only reads values already present on StateAnalysisData — itself
// entirely derived from real survey answers. Nothing here is hardcoded, and
// an insight only appears when its underlying data cleared the platform's
// privacy/sample threshold upstream.
function iconFor(insight: Insight) {
  if (insight.id === "momentum-rise") return <TrendingUp size={18} className="mt-0.5 shrink-0 text-positive" />;
  if (insight.id === "momentum-fall") return <TrendingDown size={18} className="mt-0.5 shrink-0 text-danger" />;
  if (insight.id === "gender-gap") return <Users size={18} className="mt-0.5 shrink-0 text-accent" />;
  if (insight.id === "leading-party") return <Vote size={18} className="mt-0.5 shrink-0 text-accent" />;
  return <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-positive" />;
}

export function KeyTakeaways({ data }: { data: StateAnalysisData }) {
  const { t, locale } = useLocale();
  const insights = buildAnalysisInsights(data, t, locale);

  if (insights.length === 0) {
    return <p className="text-sm text-muted">{t.analysisHub.notEnoughTakeaways}</p>;
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {insights.map((insight, i) => (
        <li key={insight.id} className="flex items-start gap-2.5 rounded-xl border border-border bg-surface-2 p-3.5 text-sm text-foreground">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface font-display text-[11px] font-bold text-muted">
            {i + 1}
          </span>
          {iconFor(insight)}
          <span>{insight.headline}</span>
        </li>
      ))}
    </ul>
  );
}
