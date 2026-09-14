"use client";

import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";
import { Stat } from "@/components/ui/Stat";
import { SectionHeading } from "@/components/home/SectionHeading";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { formatNumber } from "@/lib/utils";

// Server-rendered State page (src/app/[state]/page.tsx) has already fetched
// every value below — this client component only decides how to LABEL them,
// so the page keeps its normal server-side data fetching instead of being
// rewritten into a client component just to read the locale.
export function StateHeroText({
  election,
  districtCount,
  constituencyCount,
  responseCount,
  districtsHref,
  electionHref,
  resultsHref,
}: {
  election: { name: string; status: string } | null;
  districtCount: number;
  constituencyCount: number;
  responseCount: number;
  districtsHref: string;
  electionHref: string;
  resultsHref: string;
}) {
  const { t } = useLocale();
  const statusLabel =
    election?.status === "ONGOING"
      ? t.hierarchy.statusOngoing
      : election?.status === "COMPLETED"
        ? t.hierarchy.statusCompleted
        : t.hierarchy.statusUpcoming;

  return (
    <>
      {election && (
        <p className="mt-2 text-sm text-muted">
          {t.hierarchy.currentElection} <span className="font-medium text-foreground">{election.name}</span> ({statusLabel})
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-6">
        <Stat label={t.stats.districts} value={formatNumber(districtCount)} />
        <Stat label={t.district.assemblySeatsUnit} value={formatNumber(constituencyCount)} />
        <Stat label={t.stats.responses} value={formatNumber(responseCount)} />
      </div>

      {election && (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <LinkButton href={districtsHref} size="lg" variant="cta">
            {t.hierarchy.exploreDistricts}
          </LinkButton>
          <LinkButton href={resultsHref} size="lg" variant="outline">
            {t.constituency.viewResults}
          </LinkButton>
          <LinkButton href={electionHref} size="lg" variant="outline">
            {t.hierarchy.electionOverview}
          </LinkButton>
        </div>
      )}
    </>
  );
}

export function StateEyebrow() {
  const { t } = useLocale();
  return <p className="text-xs font-semibold uppercase tracking-wider text-accent">{t.hierarchy.stateEyebrow}</p>;
}

/** The second Container's fallback when a state has no active election — kept
 * here since it shares this file's `useLocale` import and props shape. */
export function NoElectionNotice() {
  const { t } = useLocale();
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface-2 p-10 text-center text-sm text-muted">
      {t.hierarchy.noElectionConfigured}
    </div>
  );
}

/** "Trending Constituencies" section heading — same reasoning as above. */
export function TrendingSectionHeading() {
  const { t } = useLocale();
  return <SectionHeading title={t.hierarchy.trendingHeading} subtitle={t.hierarchy.trendingSubtitle} />;
}

/** The "how results are collected" methodology link at the bottom of the page. */
export function MethodologyLink() {
  const { t } = useLocale();
  return (
    <Link href="/methodology" className="font-medium text-ink underline underline-offset-4">
      {t.hierarchy.methodologyLinkText}
    </Link>
  );
}
