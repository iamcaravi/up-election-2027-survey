"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart3, CalendarDays, EyeOff, LockKeyhole, ShieldCheck, Users } from "lucide-react";
import { ResultBars } from "./ResultBars";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { PublicDistribution } from "@/lib/public-analytics-core";
import type { PublicSurveyResultsDto } from "@/lib/public-survey-results";

export function PublicResultsView({ data, surveyHref }: { data: PublicSurveyResultsDto; surveyHref: string }) {
  const { locale, t } = useLocale();
  const [selectedPartyKey, setSelectedPartyKey] = useState("");
  const numberFormatter = new Intl.NumberFormat(locale === "hi" ? "hi-IN" : "en-IN");
  const dateFormatter = new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const selectedCandidateGroup = data.analytics?.candidatePreferenceByParty.find(
    (group) => group.party.key === selectedPartyKey
  );
  const validResponseCount = data.sample.validResponseCount;
  const isZeroState = data.visibility.state === "visible" && validResponseCount === 0;
  const isInsufficient =
    data.visibility.state === "visible" && validResponseCount !== null && validResponseCount > 0 && !data.sample.resultsAvailable;

  return (
    <div>
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">
          {data.context.district.name}, {data.context.state.name}
        </p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          {data.context.constituency.name} — {t.results.currentSurveyPreference}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{t.results.amongRespondents}</p>
      </header>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <ContextStat
          icon={<Users size={17} />}
          label={t.results.totalResponses}
          value={validResponseCount === null ? "—" : numberFormatter.format(validResponseCount)}
        />
        <ContextStat icon={<CalendarDays size={17} />} label={t.results.election} value={data.context.election.name} />
        <ContextStat
          icon={<ShieldCheck size={17} />}
          label={t.results.visibility}
          value={data.visibility.state === "visible" ? t.results.visible : t.results.unavailable}
        />
      </div>

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

      {data.visibility.state === "visible" && (
        <>
          <section className="mt-8 card-surface rounded-2xl p-5 sm:p-6" aria-labelledby="party-results-heading">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="party-results-heading" className="font-display text-xl font-bold">{t.results.partyPreference}</h2>
                <p className="mt-1 text-sm text-muted">{t.results.partyDenominator}</p>
              </div>
              <PrivacyPill />
            </div>
            <div className="mt-5">
              {data.analytics?.partyPreference.state === "available" ? (
                <ResultBars options={data.analytics.partyPreference.buckets} />
              ) : (
                <InlineState>{isZeroState ? t.results.zeroParty : t.results.resultsSuppressed}</InlineState>
              )}
            </div>
          </section>

          <section className="mt-6 card-surface rounded-2xl p-5 sm:p-6" aria-labelledby="candidate-results-heading">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="candidate-results-heading" className="font-display text-xl font-bold">{t.results.candidatePreference}</h2>
                <p className="mt-1 text-sm text-muted">{t.results.candidateInstruction}</p>
              </div>
              <PrivacyPill />
            </div>

            {data.analytics?.partyPreference.state === "available" ? (
              <>
                <label className="mt-5 block max-w-sm text-sm font-semibold" htmlFor="candidate-party-selector">
                  {t.results.selectParty}
                </label>
                <select
                  id="candidate-party-selector"
                  value={selectedPartyKey}
                  onChange={(event) => setSelectedPartyKey(event.target.value)}
                  className="mt-2 h-11 w-full max-w-sm rounded-xl border border-border bg-surface px-3.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
                >
                  <option value="">{t.results.selectPartyPlaceholder}</option>
                  {data.analytics.candidatePreferenceByParty.map((group) => (
                    <option key={group.party.key} value={group.party.key}>{group.party.name}</option>
                  ))}
                </select>
                <div className="mt-5">
                  {!selectedCandidateGroup ? (
                    <InlineState>{t.results.selectPartyPrompt}</InlineState>
                  ) : (
                    <CandidateDistribution group={selectedCandidateGroup} />
                  )}
                </div>
              </>
            ) : (
              <InlineState>{isZeroState ? t.results.noCandidateData : t.results.resultsSuppressed}</InlineState>
            )}
          </section>

          {data.analytics && data.sample.resultsAvailable && (
            <section className="mt-6" aria-labelledby="aggregate-breakdowns-heading">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 id="aggregate-breakdowns-heading" className="font-display text-xl font-bold">{t.results.aggregateBreakdowns}</h2>
                  <p className="mt-1 text-sm text-muted">{t.results.aggregateBreakdownsNote}</p>
                </div>
                <PrivacyPill />
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <DistributionCard title={t.results.topIssues} distribution={data.analytics.demographics.top_issue} />
                <DistributionCard title={t.results.gender} distribution={data.analytics.demographics.gender} />
                <DistributionCard title={t.results.ageGroup} distribution={data.analytics.demographics.age_group} />
                <DistributionCard title={t.results.socialCategory} distribution={data.analytics.demographics.social_category} />
                <DistributionCard title={t.results.religion} distribution={data.analytics.demographics.religion} />
              </div>
            </section>
          )}
        </>
      )}

      <section className="mt-8 rounded-2xl border border-border bg-surface-2 p-5 sm:p-6" aria-labelledby="methodology-heading">
        <h2 id="methodology-heading" className="font-display text-lg font-bold">{t.results.methodologyTitle}</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <MethodItem label={t.results.constituency} value={data.context.constituency.name} />
          <MethodItem label={t.results.collectionStatus} value={localizedStatus(data.survey.status, t)} />
          <MethodItem
            label={t.results.surveyPeriod}
            value={formatPeriod(data.survey.startsAt, data.survey.endsAt, dateFormatter, t.results.notConfigured)}
          />
          <MethodItem
            label={t.results.privacyThreshold}
            value={t.results.privacyThresholdValue.replace("{minimum}", numberFormatter.format(data.sample.minCellSize))}
          />
        </dl>
        <div className="mt-5 space-y-2 border-t border-border pt-4 text-xs leading-5 text-muted">
          <p>{t.results.partyDenominatorNote}</p>
          <p>{t.results.candidateDenominatorNote}</p>
          <p>{t.results.missingCandidateNote}</p>
          <p>{t.results.notElectionResult}</p>
        </div>
        <Link href="/methodology" className="mt-4 inline-flex text-sm font-semibold text-ink underline underline-offset-4">
          {t.results.methodologyLink}
        </Link>
      </section>
    </div>
  );
}

function ContextStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface px-4 py-3 shadow-[var(--shadow-card)]">
      <p className="flex items-center gap-2 text-xs font-medium text-muted">{icon}{label}</p>
      <p className="mt-1 truncate font-display text-sm font-bold">{value}</p>
    </div>
  );
}

function StateCard({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: { href: string; label: string };
}) {
  return (
    <section className="mt-8 rounded-3xl border border-dashed border-border bg-surface-2 px-5 py-10 text-center sm:px-10">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ink/10 text-ink">{icon}</span>
      <h2 className="mt-5 font-display text-xl font-bold">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted">{body}</p>
      {action && (
        <Link href={action.href} className="mt-5 inline-flex rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-[#1a1305]">
          {action.label}
        </Link>
      )}
    </section>
  );
}

function PrivacyPill() {
  const { t } = useLocale();
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-positive/25 bg-positive/10 px-2.5 py-1 text-[11px] font-semibold text-positive">
      <ShieldCheck size={13} /> {t.results.privacyProtected}
    </span>
  );
}

function InlineState({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-border bg-surface-2 p-5 text-center text-sm text-muted">{children}</p>;
}

function CandidateDistribution({
  group,
}: {
  group: NonNullable<PublicSurveyResultsDto["analytics"]>["candidatePreferenceByParty"][number];
}) {
  const { t } = useLocale();
  const distribution = group.distribution;
  if (group.party.isSpecial || (distribution.state === "unavailable" && distribution.reason === "not_applicable")) {
    return <InlineState>{t.results.candidateNotApplicable}</InlineState>;
  }
  if (distribution.state === "unavailable") {
    return <InlineState>{distribution.reason === "no_candidates" ? t.results.noEligibleCandidates : t.results.noCandidateData}</InlineState>;
  }
  if (distribution.state === "suppressed") return <InlineState>{t.results.resultsSuppressed}</InlineState>;
  if (distribution.buckets.length === 0) return <InlineState>{t.results.noCandidateData}</InlineState>;
  return (
    <div>
      <p className="mb-4 text-sm font-semibold">
        {t.results.candidateAmongParty.replace("{party}", group.party.name)}
      </p>
      <ResultBars options={distribution.buckets} />
    </div>
  );
}

function DistributionCard({ title, distribution }: { title: string; distribution: PublicDistribution }) {
  const { t } = useLocale();
  return (
    <div className="card-surface rounded-2xl p-5">
      <h3 className="font-display font-bold">{title}</h3>
      <div className="mt-4">
        {distribution.state === "available" && distribution.buckets.length > 0 ? (
          <ResultBars options={distribution.buckets} />
        ) : (
          <InlineState>{distribution.state === "suppressed" ? t.results.resultsSuppressed : t.results.noBreakdownData}</InlineState>
        )}
      </div>
    </div>
  );
}

function MethodItem({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs text-muted">{label}</dt><dd className="mt-1 font-semibold">{value}</dd></div>;
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
