"use client";

import { LinkButton } from "@/components/ui/Button";
import { Stat } from "@/components/ui/Stat";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { formatNumber } from "@/lib/utils";

export function ElectionEyebrow({ stateName, electionType, year }: { stateName: string; electionType: string; year: number }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-accent">
      {stateName} · {electionType.replace("_", " ")} · {year}
    </p>
  );
}

export function ElectionHeroText({
  status,
  districtCount,
  constituencyCount,
  responseCount,
  districtsHref,
  resultsHref,
  analysisHref,
}: {
  status: string;
  districtCount: number;
  constituencyCount: number;
  responseCount: number;
  districtsHref: string;
  /** Contextual link to this election's Result Overview (src/app/results/[state]) —
   *  the Results journey itself starts independently at /results, this is just a
   *  secondary shortcut for someone already reading this election's information. */
  resultsHref: string;
  /** Contextual link to this state's Analysis hub — same reasoning as resultsHref. */
  analysisHref: string;
}) {
  const { t } = useLocale();
  const statusLabel =
    status === "ONGOING" ? t.hierarchy.statusOngoing : status === "COMPLETED" ? t.hierarchy.statusCompleted : t.hierarchy.statusUpcoming;

  return (
    <>
      <div className="mt-6 flex flex-wrap gap-6">
        <Stat label={t.hierarchy.statusLabel} value={statusLabel} />
        <Stat label={t.stats.districts} value={formatNumber(districtCount)} />
        <Stat label={t.district.assemblySeatsUnit} value={formatNumber(constituencyCount)} />
        <Stat label={t.stats.responses} value={formatNumber(responseCount)} />
      </div>

      {/* This first button's only real destination is the district list — taking
          the survey itself requires picking a district, then a constituency, so
          the label must not promise a "take the survey" action this click doesn't
          do. Results/Analysis below are contextual shortcuts, not the primary
          journeys — those live at /results and the state's own Analysis page. */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <LinkButton href={districtsHref} size="lg" variant="cta">
          {t.hierarchy.exploreDistricts}
        </LinkButton>
        <LinkButton href={resultsHref} size="lg" variant="outline">
          {t.constituency.viewResults}
        </LinkButton>
        <LinkButton href={analysisHref} size="lg" variant="outline">
          {t.siteHeader.analysis}
        </LinkButton>
      </div>
    </>
  );
}

export function ElectionDisclaimer() {
  const { t } = useLocale();
  return (
    <p className="rounded-xl border border-border bg-surface-2 p-4 text-xs leading-relaxed text-muted">
      {t.results.notElectionResult}
    </p>
  );
}
