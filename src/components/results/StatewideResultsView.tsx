"use client";

import { BarChart3, CalendarDays, Globe, MapPin, Users } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { PublicStatewideResultsDto } from "@/lib/public-statewide-results";
import { analysisPath } from "@/lib/routes";
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

export function StatewideResultsView({
  data,
  showCta = true,
}: {
  data: PublicStatewideResultsDto;
  /** Off when the caller's own page header already carries the Detailed
   *  Analysis CTA (the Results Overview page) — on by default so the
   *  standalone constituency results page's "statewide" tab, which has no
   *  such header CTA, keeps showing it here. */
  showCta?: boolean;
}) {
  const { locale, t } = useLocale();
  const numberFormatter = new Intl.NumberFormat(locale === "hi" ? "hi-IN" : "en-IN");
  const isZeroState = data.sample.validResponseCount === 0;

  const weeklyDelta =
    data.sample.newResponsesPrior7Days > 0
      ? Math.round(((data.sample.newResponsesLast7Days - data.sample.newResponsesPrior7Days) / data.sample.newResponsesPrior7Days) * 100)
      : null;

  return (
    <div>
      {data.isSynthetic && <SyntheticDataBanner />}

      {!isZeroState && (
        <div id="summary" className="grid scroll-mt-24 grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <SummaryCard
            icon={<Users size={17} />}
            iconClass="bg-blue-100 text-blue-700"
            label={t.results.totalResponsesCard}
            value={numberFormatter.format(data.sample.validResponseCount)}
          />
          <SummaryCard
            icon={<BarChart3 size={17} />}
            iconClass="bg-positive/10 text-positive"
            label={t.results.newResponsesThisWeek}
            value={numberFormatter.format(data.sample.newResponsesLast7Days)}
            delta={weeklyDelta}
          />
          <SummaryCard
            icon={<CalendarDays size={17} />}
            iconClass="bg-orange-100 text-orange-700"
            label={t.results.electionYear}
            value={String(data.election.year)}
          />
          <SummaryCard
            icon={<MapPin size={17} />}
            iconClass="bg-blue-100 text-blue-700"
            label={t.surveyFlow.statState}
            value={data.state.name}
          />
          <SummaryCard
            icon={<Globe size={17} />}
            iconClass="bg-positive/10 text-positive"
            label={t.results.constituenciesSurveyed}
            value={`${numberFormatter.format(data.respondingConstituencyCount)} / ${numberFormatter.format(data.totalConstituencies)}`}
          />
        </div>
      )}

      {isZeroState && <StateCard icon={<BarChart3 size={28} />} title={t.results.zeroTitle} body={t.results.zeroBody} />}

      {!isZeroState && (
        <>
          <section id="party" className="card-surface scroll-mt-24 mt-6 rounded-2xl p-5 sm:p-6" aria-labelledby="statewide-party-heading">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="statewide-party-heading" className="font-display text-xl font-bold">{t.results.partySupport}</h2>
                <p className="mt-1 text-xs text-muted">{t.results.partyDenominator}</p>
              </div>
              <PrivacyPill />
            </div>
            <div className="mt-5 overflow-x-auto pb-1">
              {data.partyPreference.state === "available" ? (
                <PartySupportChart buckets={data.partyPreference.buckets} locale={locale} />
              ) : (
                <InlineState>{t.results.zeroParty}</InlineState>
              )}
            </div>
          </section>

          <section id="issues" className="card-surface scroll-mt-24 mt-6 rounded-2xl p-5 sm:p-6" aria-labelledby="statewide-issues-heading">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="statewide-issues-heading" className="font-display text-xl font-bold">{t.results.topIssues}</h2>
                <p className="mt-1 text-xs text-muted">{t.surveyFlow.stateWideNote.replace("{state}", data.state.name)}</p>
              </div>
              <PrivacyPill />
            </div>
            <div className="mt-5">
              <KeyIssuesPanel distribution={data.demographics.top_issue} centerLabel={t.results.topIssues} topIssuesLabel={t.analysisHub.topIssuesRankingLabel} />
            </div>
          </section>

          {showCta && <DetailedAnalysisCta analysisHref={analysisPath(data.state.slug, data.election.slug)} />}

          <DisclaimerShareBar
            shareTitle={t.surveyFlow.stateWideHeading.replace("{state}", data.state.name)}
            electionYear={data.election.year}
          />
        </>
      )}

      <section id="detailed" className="mt-8 scroll-mt-24 rounded-2xl border border-border bg-surface-2 p-5 sm:p-6" aria-labelledby="statewide-methodology-heading">
        <h2 id="statewide-methodology-heading" className="font-display text-xl font-bold">{t.results.methodologyTitle}</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <MethodItem label={t.surveyFlow.statState} value={data.state.name} />
          <MethodItem label={t.results.election} value={`${data.election.name} · ${data.election.year}`} />
          <MethodItem
            label={t.results.constituenciesSurveyed}
            value={`${numberFormatter.format(data.respondingConstituencyCount)} / ${numberFormatter.format(data.totalConstituencies)}`}
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
      </section>
    </div>
  );
}
