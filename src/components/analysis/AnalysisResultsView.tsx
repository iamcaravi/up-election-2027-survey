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
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <DistributionCard title={t.results.ageGroup} distribution={statewide.demographics.age_group} />
              <DistributionCard title={t.results.gender} distribution={statewide.demographics.gender} />
              <DistributionCard title={t.results.religion} distribution={statewide.demographics.religion} />
            </div>
          </section>

          {/* Section C — Current Vote Preference */}
          <section className="mt-8 card-surface rounded-2xl p-5 sm:p-6">
            <SectionHeader title={t.analysisHub.partySupportHeading} subtitle={t.analysisHub.partySupportSubtitle} />
            <div className="mt-5">
              <PartySupportChart buckets={statewide.partyPreference.state === "available" ? statewide.partyPreference.buckets : []} locale={locale} />
            </div>
            {ANALYSIS_CONFIG.currentVoteShare && (
              <div className="mt-6 border-t border-border pt-6">
                <h3 className="font-display text-sm font-bold text-ink">{t.analysisHub.currentVoteShareHeading}</h3>
                <div className="mt-4">
                  <IssuesDonutChart distribution={statewide.partyPreference} centerLabel={t.analysisHub.currentVoteShareHeading} />
                </div>
              </div>
            )}
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

          {/* Section F — Key Issues Overall */}
          {ANALYSIS_CONFIG.keyIssues && (
            <section className="mt-8 card-surface rounded-2xl p-5 sm:p-6">
              <SectionHeader title={t.analysisHub.keyIssuesOverallHeading} subtitle={t.analysisHub.keyIssuesOverallSubtitle} />
              <div className="mt-5">
                <IssuesDonutChart distribution={statewide.demographics.top_issue} centerLabel={t.analysisHub.keyIssuesOverallHeading} />
                <p className="mt-3 text-[11px] leading-relaxed text-muted">{t.analysisHub.issueMultiSelectNote}</p>
              </div>
            </section>
          )}

          {/* Section G — Key Issues by Party Supporters */}
          {ANALYSIS_CONFIG.partyIssueAnalysis && (
            <section className="mt-8 card-surface rounded-2xl p-5 sm:p-6">
              <SectionHeader title={t.analysisHub.keyIssuesByPartyHeading} subtitle={t.analysisHub.keyIssuesByPartySubtitle} />
              <div className="mt-5">
                <KeyIssuesByParty parties={data.keyIssuesByParty} />
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

          {/* Section M — Age x Issue */}
          {ANALYSIS_CONFIG.issueByDemographic && (
            <section className="mt-8 card-surface rounded-2xl p-5 sm:p-6">
              <SectionHeader title={t.analysisHub.ageIssueHeading} subtitle={t.analysisHub.ageIssueSubtitle} />
              <div className="mt-5">
                <DemographicIssueAnalysis series={data.issueByAge} />
              </div>
            </section>
          )}

          {/* Section N — Gender x Issue */}
          {ANALYSIS_CONFIG.issueByDemographic && (
            <section className="mt-8 card-surface rounded-2xl p-5 sm:p-6">
              <SectionHeader title={t.analysisHub.genderIssueHeading} subtitle={t.analysisHub.genderIssueSubtitle} />
              <div className="mt-5">
                <DemographicIssueAnalysis series={data.issueByGender} />
              </div>
            </section>
          )}

          {/* Section O — Religion x Issue */}
          {ANALYSIS_CONFIG.issueByDemographic && hasReligion && (
            <section className="mt-8 card-surface rounded-2xl p-5 sm:p-6">
              <SectionHeader title={t.analysisHub.religionIssueHeading} subtitle={t.analysisHub.religionIssueSubtitle} />
              <div className="mt-5">
                <DemographicIssueAnalysis series={data.issueByReligion} />
              </div>
            </section>
          )}

          {/* Section P — Cross-Demographic / Intersection Analysis */}
          {ANALYSIS_CONFIG.intersectionAnalysis && (
            <section className="mt-8 card-surface rounded-2xl p-5 sm:p-6">
              <SectionHeader title={t.analysisHub.intersectionHeading} subtitle={t.analysisHub.intersectionSubtitle} />
              <div className="mt-5">
                <IntersectionAnalysis cells={data.intersections} hasReligion={hasReligion} />
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
