"use client";

import { Users, MapPin } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import { SummaryCard, PartySupportChart, IssuesDonutChart, PrivacyPill, SyntheticDataBanner, DistributionCard } from "@/components/results/ResultsDashboardParts";
import { VotePreferenceTrendChart } from "@/components/analysis/VotePreferenceTrendChart";
import { PartyMomentum } from "@/components/analysis/PartyMomentum";
import { KeyIssuesByParty } from "@/components/analysis/KeyIssuesByParty";
import { PartyIssueComparisonChart } from "@/components/analysis/PartyIssueComparisonChart";
import { IssuePartyHeatmap } from "@/components/analysis/IssuePartyHeatmap";
import { DemographicPartyChart } from "@/components/analysis/DemographicPartyChart";
import { DemographicIssueAnalysis } from "@/components/analysis/DemographicIssueAnalysis";
import { IntersectionAnalysis } from "@/components/analysis/IntersectionAnalysis";
import { KeyTakeaways } from "@/components/analysis/KeyTakeaways";
import { WhatChangedStrip } from "@/components/analysis/WhatChangedStrip";
import { VoterVoices } from "@/components/analysis/VoterVoices";
import { MethodologyCard } from "@/components/analysis/MethodologyCard";
import { AnalysisFilterBar, type AnalysisFilterState, type AnalysisFilterConstituency } from "@/components/analysis/AnalysisFilterBar";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { formatNumber } from "@/lib/utils";
import { ANALYSIS_CONFIG } from "@/lib/analysis-config";
import type { StateAnalysisData } from "@/lib/state-analysis";

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="font-display text-xl font-bold">{title}</h2>
        {subtitle && <p className="mt-1 text-xs text-muted">{subtitle}</p>}
      </div>
      <PrivacyPill />
    </div>
  );
}

// The state Analysis dashboard. Every number comes from StateAnalysisData
// (src/lib/state-analysis.ts), itself built from real SurveyResponse/
// SurveyAnswer rows scoped to ONE election (one state) — no section here
// computes or invents its own numbers, and nothing aggregates across states.
// Section order follows the A–S structure: response overview, current
// preference, trend, momentum, issues overall, issues-by-party, party x
// issue comparisons (grouped bar + heatmap), demographic x party (age,
// gender, religion — religion only rendered when the state's survey
// actually collects it), demographic x issue (age, gender, religion),
// cross-demographic intersections, then Key Takeaways, Voter Voices and
// Methodology last. Advanced modules are each gated behind ANALYSIS_CONFIG
// so a later premium tier can disable individual sections purely by
// configuration — every flag is `true` today, so nothing is hidden or locked.
export function AnalysisResultsView({
  data,
  currentStateSlug,
  currentElectionSlug,
  states,
  constituencies,
  electionName,
  surveyHref,
}: {
  data: StateAnalysisData;
  currentStateSlug: string;
  currentElectionSlug: string;
  states: AnalysisFilterState[];
  constituencies: AnalysisFilterConstituency[];
  electionName: string;
  surveyHref: string;
}) {
  const { t, locale } = useLocale();
  const { statewide } = data;
  const hasResults = statewide.sample.validResponseCount > 0;
  const hasReligion = data.religionPartyRows.length > 0;
  const hasCaste = data.castePartyRows.length > 0;
  const overallTopIssues =
    statewide.demographics.top_issue.state === "available"
      ? statewide.demographics.top_issue.buckets
          .filter((b): b is Extract<typeof b, { state: "available" }> => b.state === "available")
          .sort((a, b) => b.percentage - a.percentage)
          .slice(0, 5)
          .map((b) => ({ key: b.key, label: locale === "hi" && b.nameHindi ? b.nameHindi : b.label, percentage: b.percentage }))
      : [];

  return (
    <>
      <AnalysisFilterBar
        currentStateSlug={currentStateSlug}
        currentElectionSlug={currentElectionSlug}
        states={states}
        constituencies={constituencies}
        electionName={electionName}
      />

      {/* Section B — Survey Response Overview */}
      <div className="mt-8">
        <h2 className="font-display text-lg font-bold">{t.analysisHub.responseOverviewHeading}</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard
            icon={<Users size={17} />}
            iconClass="bg-blue-100 text-blue-700"
            label={t.surveyFlow.totalResponsesLabel}
            value={formatNumber(statewide.sample.validResponseCount)}
          />
          <SummaryCard
            icon={<MapPin size={17} />}
            iconClass="bg-positive/10 text-positive"
            label={t.results.constituenciesSurveyed}
            value={`${formatNumber(statewide.respondingConstituencyCount)} / ${formatNumber(statewide.totalConstituencies)}`}
          />
        </div>
      </div>

      {statewide.isSynthetic && (
        <div className="mt-6">
          <SyntheticDataBanner />
        </div>
      )}

      {hasResults ? (
        <>
          {/* Respondent demographics — sample composition (distinct from the
              party-crossed breakdowns further down). */}
          <section className="mt-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-display text-xl font-bold">{t.analysisHub.demographicsHeading}</h2>
              <PrivacyPill />
            </div>
            {/* lg: (not sm:) — at sm:/tablet width, three donut+legend cards
                side by side don't leave the legend enough room next to
                IssuesDonutChart's fixed-size donut, which was overflowing
                each card at ~768px. One column comfortably fits a donut +
                legend until there's truly enough width for three. */}
            <div className={`mt-4 grid gap-4 lg:grid-cols-3 ${hasCaste ? "xl:grid-cols-4" : ""}`}>
              <DistributionCard title={t.results.ageGroup} distribution={statewide.demographics.age_group} />
              <DistributionCard title={t.results.gender} distribution={statewide.demographics.gender} />
              <DistributionCard title={t.results.religion} distribution={statewide.demographics.religion} />
              {hasCaste && <DistributionCard title={t.results.socialCategory} distribution={data.casteDistribution} />}
            </div>
          </section>

          {/* Section C — Party Landscape: Party Support (bar) and Current
              Vote Share (donut) are two views of the exact same underlying
              party distribution, so they live side by side in one unified
              module rather than two stacked cards. lg:grid-cols-2 (not sm:)
              for the same reason the demographics grid above uses lg: — a
              donut + legend needs real room next to a bar chart at tablet
              widths. Both panels are read straight off the same
              statewide.partyPreference distribution; no formula changed. */}
          <section className="mt-8 card-surface rounded-2xl p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="font-display text-xl font-bold">{t.analysisHub.partyLandscapeHeading}</h2>
              <PrivacyPill />
            </div>
            <div className="mt-5 grid gap-6 lg:grid-cols-2">
              <div className="min-w-0">
                <h3 className="font-display text-sm font-bold text-ink">{t.analysisHub.partySupportHeading}</h3>
                <p className="mt-0.5 text-xs text-muted">{t.analysisHub.partySupportSubtitle}</p>
                <div className="mt-4">
                  <PartySupportChart buckets={statewide.partyPreference.state === "available" ? statewide.partyPreference.buckets : []} locale={locale} />
                </div>
              </div>
              {ANALYSIS_CONFIG.currentVoteShare && (
                <div className="min-w-0 border-t border-border pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                  <h3 className="font-display text-sm font-bold text-ink">{t.analysisHub.currentVoteShareHeading}</h3>
                  <p className="mt-0.5 text-xs text-muted">{t.analysisHub.currentVoteShareSubtitle}</p>
                  <div className="mt-4">
                    <IssuesDonutChart distribution={statewide.partyPreference} centerLabel={t.analysisHub.currentVoteShareHeading} />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Section D — Vote Preference Trend */}
          {ANALYSIS_CONFIG.voteTrend && (
            <section className="mt-8 card-surface rounded-2xl p-5 sm:p-6">
              <SectionHeader title={t.analysisHub.votePreferenceTrendHeading} subtitle={t.analysisHub.votePreferenceTrendSubtitle} />
              <div className="mt-5">
                <VotePreferenceTrendChart trend={data.votePreferenceTrend} />
              </div>
              {data.partyMomentum.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-border pt-4 text-xs">
                  {data.partyMomentum.map((m) => {
                    const name = locale === "hi" && m.nameHindi ? m.nameHindi : m.label;
                    return (
                      <span key={m.partyKey} className="font-semibold text-foreground">
                        {name}{" "}
                        <span className={m.changePp === null ? "text-muted" : m.changePp >= 0 ? "text-positive" : "text-danger"}>
                          {m.changePp === null ? t.analysisHub.momentumNew : `${m.changePp > 0 ? "+" : ""}${m.changePp} pp`}
                        </span>
                      </span>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Section E — Party Momentum */}
          {ANALYSIS_CONFIG.advancedMomentum && (
            <section className="mt-8 card-surface rounded-2xl p-5 sm:p-6">
              <SectionHeader title={t.analysisHub.partyMomentumHeading} subtitle={t.analysisHub.partyMomentumSubtitle} />
              <div className="mt-5">
                <PartyMomentum items={data.partyMomentum} />
              </div>
            </section>
          )}

          {/* "What Changed?" — a compact, movement-only reuse of the Key
              Takeaways insight engine, placed right beside Trend/Momentum. */}
          {ANALYSIS_CONFIG.advancedInsights && <WhatChangedStrip data={data} />}

          {/* Section F — Key Issues Overall: compact donut on the left,
              ranked top-3 + multi-select disclosure on the right, instead of
              one oversized donut+giant-legend card. Same distribution, same
              numbers — just a denser layout. */}
          {ANALYSIS_CONFIG.keyIssues && (
            <section className="mt-8 card-surface rounded-2xl p-5 sm:p-6">
              <SectionHeader title={t.analysisHub.keyIssuesOverallHeading} subtitle={t.analysisHub.keyIssuesOverallSubtitle} />
              <div className="mt-5 grid gap-6 lg:grid-cols-2">
                <div className="min-w-0">
                  <IssuesDonutChart distribution={statewide.demographics.top_issue} centerLabel={t.analysisHub.keyIssuesOverallHeading} />
                </div>
                <div className="min-w-0 border-t border-border pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                  <h3 className="font-display text-xs font-bold uppercase tracking-wide text-muted">{t.analysisHub.topTakeawaysLabel}</h3>
                  {overallTopIssues.length > 0 ? (
                    <ol className="mt-3 space-y-2">
                      {overallTopIssues.slice(0, 3).map((issue, index) => (
                        <li key={issue.key} className="flex items-center justify-between gap-2 text-sm">
                          <span className="min-w-0 truncate text-foreground">
                            <span className="mr-1.5 text-xs font-semibold text-muted">
                              {index === 0 ? t.analysisHub.keyIssuesTopLabel : index === 1 ? t.analysisHub.keyIssuesSecondLabel : t.analysisHub.keyIssuesThirdLabel}:
                            </span>
                            {issue.label}
                          </span>
                          <span className="shrink-0 font-display font-bold tabular-nums text-ink">{issue.percentage}%</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="mt-3 text-xs text-muted">{t.analysisHub.notEnoughTakeaways}</p>
                  )}
                  <p className="mt-4 text-[11px] leading-relaxed text-muted">{t.analysisHub.issueMultiSelectNote}</p>
                </div>
              </div>
            </section>
          )}

          {/* Section G — Key Issues by Party Supporters */}
          {ANALYSIS_CONFIG.partyIssueAnalysis && (
            <section className="mt-8 card-surface rounded-2xl p-5 sm:p-6">
              <SectionHeader title={t.analysisHub.keyIssuesByPartyHeading} subtitle={t.analysisHub.keyIssuesByPartySubtitle} />
              <div className="mt-5">
                <KeyIssuesByParty parties={data.keyIssuesByParty} overallTopIssues={overallTopIssues} />
              </div>
            </section>
          )}

          {/* Section H — Party x Issue Comparison */}
          {ANALYSIS_CONFIG.issuePartyMatrix && data.issuePartyMatrix.length > 0 && (
            <section className="mt-8 card-surface rounded-2xl p-5 sm:p-6">
              <SectionHeader title={t.analysisHub.issuePartyCompareHeading} subtitle={t.analysisHub.issuePartyCompareSubtitle} />
              <div className="mt-5">
                <PartyIssueComparisonChart rows={data.issuePartyMatrix} segments={data.partySegments} />
              </div>
            </section>
          )}

          {/* Section I — Issue x Party Heatmap */}
          {ANALYSIS_CONFIG.issuePartyMatrix && (
            <section className="mt-8 card-surface rounded-2xl p-5 sm:p-6">
              <SectionHeader title={t.analysisHub.issuePartyMatrixHeading} subtitle={t.analysisHub.issuePartyMatrixSubtitle} />
              <div className="mt-5">
                <IssuePartyHeatmap rows={data.issuePartyMatrix} segments={data.partySegments} />
              </div>
            </section>
          )}

          {/* Section J — Age Group x Party */}
          {ANALYSIS_CONFIG.demographicAnalysis && (
            <section className="mt-8 card-surface rounded-2xl p-5 sm:p-6">
              <SectionHeader title={t.analysisHub.agePartyHeading} />
              <div className="mt-5">
                <DemographicPartyChart rows={data.agePartyRows} showLeaderTakeaways />
              </div>
            </section>
          )}

          {/* Section K — Gender x Party */}
          {ANALYSIS_CONFIG.demographicAnalysis && (
            <section className="mt-8 card-surface rounded-2xl p-5 sm:p-6">
              <SectionHeader title={t.analysisHub.genderPartyHeading} />
              <div className="mt-5">
                <DemographicPartyChart rows={data.genderPartyRows} showLeaderTakeaways />
              </div>
            </section>
          )}

          {/* Section L — Religion/Community x Party (only when the survey
              actually collects religion — never fabricated categories). */}
          {ANALYSIS_CONFIG.demographicAnalysis && hasReligion && (
            <section className="mt-8 card-surface rounded-2xl p-5 sm:p-6">
              <SectionHeader title={t.analysisHub.religionPartyHeading} />
              <div className="mt-5">
                <DemographicPartyChart rows={data.religionPartyRows} showLeaderTakeaways />
              </div>
            </section>
          )}

          {/* Section L2 — Caste/Social Category x Party (same "social_category"
              question every state's survey already collects — only rendered
              when the state's survey actually has answers for it). */}
          {ANALYSIS_CONFIG.castePartyAnalysis && hasCaste && (
            <section className="mt-8 card-surface rounded-2xl p-5 sm:p-6">
              <SectionHeader title={t.analysisHub.castePartyHeading} />
              <div className="mt-5">
                <DemographicPartyChart rows={data.castePartyRows} showLeaderTakeaways />
              </div>
            </section>
          )}

          {/* Sections M, N, O (+ Caste) — Issue Priority by Age / Gender /
              Religion / Caste, as one row of compact cards (each keeps its
              own issue-select dropdown) instead of four full-width stacked
              sections. lg:grid-cols-4 only once there's genuinely enough
              width for four compact charts side by side; 2 columns at
              tablet, 1 on mobile. */}
          {ANALYSIS_CONFIG.issueByDemographic && (
            <section className="mt-8">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 className="font-display text-xl font-bold">{t.analysisHub.issueByDemographicHeading}</h2>
                <PrivacyPill />
              </div>
              <p className="mt-1 text-xs text-muted">{t.analysisHub.issueByDemographicSubtitle}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <div className="card-surface min-w-0 rounded-2xl p-4">
                  <h3 className="font-display text-sm font-bold text-ink">{t.analysisHub.ageIssueHeading}</h3>
                  <div className="mt-3">
                    <DemographicIssueAnalysis series={data.issueByAge} compact />
                  </div>
                </div>
                <div className="card-surface min-w-0 rounded-2xl p-4">
                  <h3 className="font-display text-sm font-bold text-ink">{t.analysisHub.genderIssueHeading}</h3>
                  <div className="mt-3">
                    <DemographicIssueAnalysis series={data.issueByGender} compact />
                  </div>
                </div>
                {hasReligion && (
                  <div className="card-surface min-w-0 rounded-2xl p-4">
                    <h3 className="font-display text-sm font-bold text-ink">{t.analysisHub.religionIssueHeading}</h3>
                    <div className="mt-3">
                      <DemographicIssueAnalysis series={data.issueByReligion} compact />
                    </div>
                  </div>
                )}
                {ANALYSIS_CONFIG.casteIssueAnalysis && hasCaste && (
                  <div className="card-surface min-w-0 rounded-2xl p-4">
                    <h3 className="font-display text-sm font-bold text-ink">{t.analysisHub.casteIssueHeading}</h3>
                    <div className="mt-3">
                      <DemographicIssueAnalysis series={data.issueByCaste} compact />
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Section P — Cross-Demographic / Intersection Analysis */}
          {ANALYSIS_CONFIG.intersectionAnalysis && (
            <section className="mt-8 card-surface rounded-2xl p-5 sm:p-6">
              <SectionHeader title={t.analysisHub.intersectionHeading} subtitle={t.analysisHub.intersectionSubtitle} />
              <div className="mt-5">
                <IntersectionAnalysis cells={data.intersections} hasReligion={hasReligion} hasCaste={hasCaste} />
              </div>
            </section>
          )}

          {/* Section Q — Key Takeaways */}
          {ANALYSIS_CONFIG.advancedInsights && (
            <section className="mt-8 card-surface rounded-2xl p-5 sm:p-6">
              <h2 className="font-display text-xl font-bold">{t.analysisHub.keyTakeawaysHeading}</h2>
              <div className="mt-4">
                <KeyTakeaways data={data} />
              </div>
            </section>
          )}

          {/* Section R — Voter Voices */}
          <section className="mt-8">
            <div>
              <h2 className="font-display text-xl font-bold">{t.analysisHub.voterVoicesHeading}</h2>
              <p className="mt-1 text-xs text-muted">{t.analysisHub.voterVoicesSubtitle}</p>
            </div>
            <div className="mt-4">
              <VoterVoices voices={data.voterVoices} />
            </div>
          </section>

          {/* Section S — Methodology */}
          <div className="mt-8">
            <MethodologyCard statewide={statewide} />
          </div>
        </>
      ) : (
        <section className="mt-8 rounded-2xl border border-dashed border-border bg-surface-2 p-10 text-center text-sm text-muted">
          {t.results.zeroBody}
        </section>
      )}

      <div className="mt-8 flex justify-center">
        <LinkButton href={surveyHref} size="lg" variant="cta">
          {t.constituency.takeSurvey}
        </LinkButton>
      </div>
    </>
  );
}
