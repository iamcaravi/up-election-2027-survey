"use client";

import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { displayStateName } from "@/lib/utils";
import { resultsLandingPath } from "@/lib/routes";

export function ResultsStateHeading({ stateNameRaw, stateSlug }: { stateNameRaw: string; stateSlug: string }) {
  const { t, locale } = useLocale();
  const stateName = displayStateName(stateNameRaw, stateSlug, locale);
  return (
    <>
      <Breadcrumb items={[{ label: t.resultsHub.eyebrow, href: resultsLandingPath() }, { label: stateName }]} />
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">{t.resultsHub.eyebrow}</p>
      <h1 className="font-display text-3xl font-extrabold sm:text-5xl">
        {stateName} {t.resultsHub.stateHeadingSuffix}
      </h1>
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

