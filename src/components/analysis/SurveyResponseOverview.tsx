"use client";

import { Users, MapPin } from "lucide-react";
import { SummaryCard } from "@/components/results/ResultsDashboardParts";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { formatNumber } from "@/lib/utils";

// Sits beside AnalysisStateHeading in the Analysis page's hero grid (left =
// intro/badges, right = this) rather than as its own full-width section
// below the hero — same two numbers (Total Responses,
// Constituencies surveyed), just placed where the hero's own empty
// horizontal space already was instead of adding another vertical block.
export function SurveyResponseOverview({
  validResponseCount,
  respondingConstituencyCount,
  totalConstituencies,
}: {
  validResponseCount: number;
  respondingConstituencyCount: number;
  totalConstituencies: number;
}) {
  const { t } = useLocale();
  return (
    <div className="card-surface rounded-2xl p-3.5 sm:p-5">
      <h2 className="font-display text-sm font-bold uppercase tracking-wide text-muted">{t.analysisHub.responseOverviewHeading}</h2>
      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:gap-3">
        <SummaryCard
          icon={<Users size={17} />}
          tone="blue"
          label={t.surveyFlow.totalResponsesLabel}
          value={formatNumber(validResponseCount)}
        />
        <SummaryCard
          icon={<MapPin size={17} />}
          tone="green"
          label={t.results.constituenciesSurveyed}
          value={`${formatNumber(respondingConstituencyCount)} / ${formatNumber(totalConstituencies)}`}
        />
      </div>
    </div>
  );
}
