"use client";

import { BarChart3, ShieldCheck, Users } from "lucide-react";
import { ResultBars } from "./ResultBars";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { PublicDistribution } from "@/lib/public-analytics-core";
import type { PublicStatewideResultsDto } from "@/lib/public-statewide-results";

export function StatewideResultsView({ data }: { data: PublicStatewideResultsDto }) {
  const { locale, t } = useLocale();
  const numberFormatter = new Intl.NumberFormat(locale === "hi" ? "hi-IN" : "en-IN");
  const leadingParty = data.partyPreference.state === "available" ? data.partyPreference.buckets[0] : null;

  return (
    <div>
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">{data.state.name}</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          {t.surveyFlow.stateWideHeading}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{t.surveyFlow.stateWideNote}</p>
      </header>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <ContextStat
          icon={<Users size={17} />}
          label={t.surveyFlow.totalResponsesLabel}
          value={numberFormatter.format(data.sample.validResponseCount)}
        />
        <ContextStat
          icon={<BarChart3 size={17} />}
          label={t.surveyFlow.leadingPartyLabel}
          value={leadingParty ? `${leadingParty.label} — ${leadingParty.state === "available" ? leadingParty.percentage : "—"}%` : "—"}
        />
        <ContextStat icon={<ShieldCheck size={17} />} label={t.results.election} value={`${data.election.name} · ${data.election.year}`} />
      </div>

      <p className="mt-4 rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-xs font-medium text-muted">
        {t.surveyFlow.surveyTrendNote}
      </p>

      {data.sample.validResponseCount === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-border bg-surface-2 px-5 py-10 text-center sm:px-10">
          <p className="text-sm text-muted">{t.results.zeroBody}</p>
        </div>
      ) : (
        <>
          <section className="mt-8 card-surface rounded-2xl p-5 sm:p-6" aria-labelledby="statewide-party-heading">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="statewide-party-heading" className="font-display text-xl font-bold">{t.results.partyPreference}</h2>
                <p className="mt-1 text-sm text-muted">{t.results.partyDenominator}</p>
              </div>
              <PrivacyPill />
            </div>
            <div className="mt-5">
              <DistributionBlock distribution={data.partyPreference} />
            </div>
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-2">
            <DistributionCard title={t.results.topIssues} distribution={data.demographics.top_issue} />
            <DistributionCard title={t.results.gender} distribution={data.demographics.gender} />
            <DistributionCard title={t.results.ageGroup} distribution={data.demographics.age_group} />
            <DistributionCard title={t.results.religion} distribution={data.demographics.religion} />
          </section>
        </>
      )}
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

function DistributionBlock({ distribution }: { distribution: PublicDistribution }) {
  const { t } = useLocale();
  if (distribution.state === "available" && distribution.buckets.length > 0) {
    return <ResultBars options={distribution.buckets} />;
  }
  return <InlineState>{distribution.state === "suppressed" ? t.results.resultsSuppressed : t.results.zeroParty}</InlineState>;
}

function DistributionCard({ title, distribution }: { title: string; distribution: PublicDistribution }) {
  return (
    <div className="card-surface rounded-2xl p-5">
      <h3 className="font-display font-bold">{title}</h3>
      <div className="mt-4">
        <DistributionBlock distribution={distribution} />
      </div>
    </div>
  );
}
