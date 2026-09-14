"use client";

import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { displayStateName } from "@/lib/utils";
import { resultsLandingPath } from "@/lib/routes";
import { DetailedAnalysisCta } from "./ResultsDashboardParts";

export function ResultsStateHeading({
  stateNameRaw,
  stateSlug,
  analysisHref,
}: {
  stateNameRaw: string;
  stateSlug: string;
  /** Omitted when the state has no active election yet — nothing to
   *  analyze, so the header shows no CTA rather than a dead link. */
  analysisHref?: string | null;
}) {
  const { t, locale } = useLocale();
  const stateName = displayStateName(stateNameRaw, stateSlug, locale);
  return (
    <>
      <Breadcrumb items={[{ label: t.resultsHub.eyebrow, href: resultsLandingPath() }, { label: stateName }]} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">{t.resultsHub.eyebrow}</p>
          <h1 className="font-display text-3xl font-extrabold sm:text-5xl">
            {stateName} {t.resultsHub.stateHeadingSuffix}
          </h1>
        </div>
        {analysisHref && <DetailedAnalysisCta analysisHref={analysisHref} variant="compact" />}
      </div>
    </>
  );
}

export function NoElectionForResultsNotice() {
  const { t } = useLocale();
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface-2 p-10 text-center text-sm text-muted">
      {t.resultsHub.noElectionForResults}
    </div>
  );
}

