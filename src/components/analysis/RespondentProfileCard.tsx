"use client";

import { IssuesDonutChart } from "@/components/results/ResultsDashboardParts";
import { KeyReading } from "./KeyReading";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { buildDistributionInsight } from "@/lib/analysis-summaries";
import type { PublicDistribution } from "@/lib/public-analytics-core";

// Respondent Profile card — "who took this survey", not party preference.
// Always stacks the donut above a full-width legend (IssuesDonutChart's
// `stacked` prop) so "[dot] Category — XX.X%" stays readable even inside a
// 3–4-up card grid, plus one data-derived KEY READING line so the chart's
// meaning doesn't depend on reading percentages against unlabeled colors.
export function RespondentProfileCard({ title, distribution }: { title: string; distribution: PublicDistribution }) {
  const { t, locale } = useLocale();
  const insight = buildDistributionInsight(distribution, t, locale);
  return (
    <div className="card-surface min-w-0 rounded-2xl p-5">
      <h3 className="font-display font-bold">{title}</h3>
      <div className="mt-4">
        <IssuesDonutChart distribution={distribution} centerLabel={`${title}\n${t.analysisHub.distributionLabel}`} stacked />
      </div>
      {insight && <KeyReading lines={[insight]} />}
    </div>
  );
}
