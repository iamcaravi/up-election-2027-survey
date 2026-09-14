"use client";

import Link from "next/link";
import { BarChart3, CalendarDays, EyeOff, LockKeyhole, MapPin, Building2, Users } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { analysisPath } from "@/lib/routes";
import type { PublicSurveyResultsDto } from "@/lib/public-survey-results";
import {
  SummaryCard,
  PartySupportChart,
  KeyIssuesPanel,
  StateCard,
  PrivacyPill,
  InlineState,
  MethodItem,
  DisclaimerShareBar,
  SyntheticDataBanner,
  DetailedAnalysisCta,
} from "./ResultsDashboardParts";

export function PublicResultsView({
  data,
  surveyHref,
  showCta = true,
}: {
  data: PublicSurveyResultsDto;
  surveyHref: string;
  /** Off when the caller's own page header already carries the Detailed
   *  Analysis CTA (the Results Overview page) — on by default so the
   *  standalone constituency results page, which has no such header CTA,
   *  keeps showing it here. */
  showCta?: boolean;
}) {
  const { locale, t } = useLocale();
  const numberFormatter = new Intl.NumberFormat(locale === "hi" ? "hi-IN" : "en-IN");
  const dateTimeFormatter = new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const validResponseCount = data.sample.validResponseCount;
  const isZeroState = data.visibility.state === "visible" && validResponseCount === 0;
  const isInsufficient =
    data.visibility.state === "visible" && validResponseCount !== null && validResponseCount > 0 && !data.sample.resultsAvailable;

  const weeklyDelta =
    data.sample.newResponsesLast7Days !== null && data.sample.newResponsesPrior7Days
      ? Math.round(((data.sample.newResponsesLast7Days - data.sample.newResponsesPrior7Days) / data.sample.newResponsesPrior7Days) * 100)
      : null;

  return (
    <div>
      {data.isSynthetic && <SyntheticDataBanner />}

      {data.visibility.state === "visible" && !isZeroState && (
        <div id="summary" className="grid scroll-mt-24 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <SummaryCard
            icon={<Users size={17} />}
            tone="blue"
            label={t.results.totalResponsesCard}
            value={numberFormatter.format(validResponseCount ?? 0)}
          />
          <SummaryCard
            icon={<BarChart3 size={17} />}
            tone="green"
            label={t.results.newResponsesThisWeek}
            value={numberFormatter.format(data.sample.newResponsesLast7Days ?? 0)}
            delta={weeklyDelta}
          />
          <SummaryCard
            icon={<CalendarDays size={17} />}
            tone="orange"
            label={t.results.electionYear}
            value={String(data.context.election.year)}
          />
          <SummaryCard
            icon={<MapPin size={17} />}
            tone="blue"
            label={t.surveyFlow.statState}
            value={data.context.state.name}
          />
          <SummaryCard
            icon={<Building2 size={17} />}
            tone="purple"
            label={t.surveyFlow.statDistrict}
            value={data.context.district.name}
          />
          <SummaryCard
            icon={<Building2 size={17} />}
            tone="green"
            label={t.surveyFlow.statConstituency}
            value={data.context.constituency.name}
          />
        </div>
      )}

      {data.visibility.state === "hidden" && (
        <StateCard icon={<EyeOff size={28} />} title={t.results.unavailableTitle} body={t.results.unavailableBody} />
      )}

      {isZeroState && (
        <StateCard
          icon={<BarChart3 size={28} />}
          title={t.results.zeroTitle}
          body={t.results.zeroBody}
          action={{ href: surveyHref, label: t.results.takeSurvey }}
        />
      )}

      {isInsufficient && (
        <StateCard
          icon={<LockKeyhole size={28} />}
          title={t.results.insufficientTitle}
          body={t.results.insufficientBody.replace("{minimum}", numberFormatter.format(data.sample.minCellSize))}
        />
      )}

      {data.visibility.state === "visible" && !isZeroState && (
        <>
          <section id="party" className="card-surface scroll-mt-24 mt-6 rounded-2xl p-5 sm:p-6" aria-labelledby="party-results-heading">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="party-results-heading" className="font-display text-xl font-bold">{t.results.partySupport}</h2>
                <p className="mt-1 text-xs text-muted">{t.results.partyDenominator}</p>
              </div>
              <PrivacyPill />
            </div>
            <div className="mt-5 overflow-x-auto pb-1">
              {data.analytics?.partyPreference.state === "available" ? (
                <PartySupportChart buckets={data.analytics.partyPreference.buckets} locale={locale} />
              ) : (
                <InlineState>{isZeroState ? t.results.zeroParty : t.results.resultsSuppressed}</InlineState>
              )}
            </div>
          </section>

          <section id="issues" className="card-surface scroll-mt-24 mt-6 rounded-2xl p-5 sm:p-6" aria-labelledby="issues-heading">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="issues-heading" className="font-display text-xl font-bold">{t.results.topIssues}</h2>
                <p className="mt-1 text-xs text-muted">{t.results.amongRespondents}</p>
              </div>
              <PrivacyPill />
            </div>
            <div className="mt-5">
              <KeyIssuesPanel
                distribution={data.analytics?.demographics.top_issue ?? { state: "unavailable", reason: "no_answers", minRequired: data.sample.minCellSize }}
                centerLabel={t.results.topIssues}
                topIssuesLabel={t.analysisHub.topIssuesRankingLabel}
              />
            </div>
          </section>

          {showCta && <DetailedAnalysisCta analysisHref={analysisPath(data.context.state.slug, data.context.election.slug)} />}

          <DisclaimerShareBar shareTitle={data.context.constituency.name} electionYear={data.context.election.year} />
        </>
      )}

      <section id="detailed" className="mt-8 scroll-mt-24 rounded-2xl border border-border bg-surface-2 p-5 sm:p-6" aria-labelledby="methodology-heading">
        <h2 id="methodology-heading" className="font-display text-xl font-bold">{t.results.methodologyTitle}</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <MethodItem label={t.results.constituency} value={data.context.constituency.name} />
          <MethodItem label={t.results.collectionStatus} value={localizedStatus(data.survey.status, t)} />
          <MethodItem
            label={t.results.surveyPeriod}
            value={formatPeriod(data.survey.startsAt, data.survey.endsAt, dateTimeFormatter, t.results.notConfigured)}
          />
          <MethodItem
            label={t.results.privacyThreshold}
            value={t.results.privacyThresholdValue.replace("{minimum}", numberFormatter.format(data.sample.minCellSize))}
          />
        </dl>
        <div className="mt-5 space-y-2 border-t border-border pt-4 text-xs leading-5 text-muted">
          <p>{t.results.partyDenominatorNote}</p>
          <p>{t.results.notElectionResult}</p>
        </div>
        <Link href="/methodology" className="mt-4 inline-flex text-sm font-semibold text-ink underline underline-offset-4">
          {t.results.methodologyLink}
        </Link>
      </section>
    </div>
  );
}

function localizedStatus(status: string, t: ReturnType<typeof useLocale>["t"]): string {
  if (status === "ACTIVE") return t.results.active;
  if (status === "CLOSED") return t.results.closed;
  return t.results.unavailable;
}

function formatPeriod(
  startsAt: string | null,
  endsAt: string | null,
  formatter: Intl.DateTimeFormat,
  fallback: string
): string {
  if (!startsAt && !endsAt) return fallback;
  const start = startsAt ? formatter.format(new Date(startsAt)) : "…";
  const end = endsAt ? formatter.format(new Date(endsAt)) : "…";
  return `${start} – ${end}`;
}
