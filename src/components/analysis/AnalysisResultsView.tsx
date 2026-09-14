"use client";

import { LinkButton } from "@/components/ui/Button";
import { PartySupportChart, IssuesDonutChart, PrivacyPill, SyntheticDataBanner, ISSUE_COLORS } from "@/components/results/ResultsDashboardParts";
import { VotePreferenceTrendChart } from "@/components/analysis/VotePreferenceTrendChart";
import { PartyMomentumSection } from "@/components/analysis/PartyMomentumSection";
import { KeyIssuesByParty } from "@/components/analysis/KeyIssuesByParty";
import { PartyIssueComparisonChart } from "@/components/analysis/PartyIssueComparisonChart";
import { IssuePartyHeatmap } from "@/components/analysis/IssuePartyHeatmap";
import { DemographicPartyChart } from "@/components/analysis/DemographicPartyChart";
import { CastePartyHorizontalChart } from "@/components/analysis/CastePartyHorizontalChart";
import { DemographicIssueAnalysis } from "@/components/analysis/DemographicIssueAnalysis";
import { RespondentProfileCard } from "@/components/analysis/RespondentProfileCard";
import { IntersectionAnalysis } from "@/components/analysis/IntersectionAnalysis";
import { KeyTakeaways } from "@/components/analysis/KeyTakeaways";
import { VoterVoices } from "@/components/analysis/VoterVoices";
import { MethodologyCard } from "@/components/analysis/MethodologyCard";
import { AnalysisFilterBar, type AnalysisFilterState, type AnalysisFilterConstituency } from "@/components/analysis/AnalysisFilterBar";
import { KeyReading } from "@/components/analysis/KeyReading";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { resolveOptionLabel } from "@/lib/option-labels";
import { ANALYSIS_CONFIG } from "@/lib/analysis-config";
import { buildPartySupportReading, buildHeatmapReading, buildDemographicPartyReading } from "@/lib/analysis-summaries";
import type { StateAnalysisData } from "@/lib/state-analysis";

function SectionHeader({ eyebrow, title, subtitle, hideBadge }: { eyebrow?: string; title: string; subtitle?: string; hideBadge?: boolean }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        {eyebrow && <p className="text-[11px] font-bold uppercase tracking-wide text-accent">{eyebrow}</p>}
        <h2 className="font-display text-xl font-bold">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      </div>
      {!hideBadge && <PrivacyPill />}
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
  // Same key→color assignment IssuesDonutChart computes internally for this
  // exact distribution (available buckets in their original order, index
  // fallback into the shared ISSUE_COLORS palette) — kept in sync here so
  // the Top Issues ranking badges visually match their donut segment
  // instead of picking an unrelated color.
  const issueColorByKey = new Map<string, string>();
  if (statewide.demographics.top_issue.state === "available") {
    statewide.demographics.top_issue.buckets
      .filter((b): b is Extract<typeof b, { state: "available" }> => b.state === "available")
      .forEach((b, index) => issueColorByKey.set(b.key, b.colorHex ?? ISSUE_COLORS[index % ISSUE_COLORS.length]));
  }
  const overallTopIssues =
    statewide.demographics.top_issue.state === "available"
      ? statewide.demographics.top_issue.buckets
          .filter((b): b is Extract<typeof b, { state: "available" }> => b.state === "available")
          .sort((a, b) => b.percentage - a.percentage)
          .slice(0, 5)
          .map((b) => ({
            key: b.key,
            label: resolveOptionLabel(b.key, b, locale, t.surveyQuestions.options),
            percentage: b.percentage,
            color: issueColorByKey.get(b.key) ?? ISSUE_COLORS[0],
          }))
      : [];
  // Every available issue (not sliced to 5) for the Key Issues data grid —
  // same sort, same source, same colors as overallTopIssues above; this is
  // just the unsliced version so the grid shows every category the survey
  // actually has, whatever that count happens to be for this state.
  const allIssuesForGrid =
    statewide.demographics.top_issue.state === "available"
      ? statewide.demographics.top_issue.buckets
          .filter((b): b is Extract<typeof b, { state: "available" }> => b.state === "available")
          .sort((a, b) => b.percentage - a.percentage)
          .map((b) => ({
            key: b.key,
            label: resolveOptionLabel(b.key, b, locale, t.surveyQuestions.options),
            percentage: b.percentage,
            color: issueColorByKey.get(b.key) ?? ISSUE_COLORS[0],
          }))
      : [];
  const partySupportBuckets = statewide.partyPreference.state === "available" ? statewide.partyPreference.buckets : [];
  const partySupportReading = buildPartySupportReading(partySupportBuckets, t, locale);
  const heatmapReading = buildHeatmapReading(data.issuePartyMatrix, data.partySegments, t, locale);

  return (
    <>
      <AnalysisFilterBar
        currentStateSlug={currentStateSlug}
        currentElectionSlug={currentElectionSlug}
        states={states}
        constituencies={constituencies}
        electionName={electionName}
      />

      {statewide.isSynthetic && (
        <div className="mt-6">
          <SyntheticDataBanner />
        </div>
      )}

      {hasResults ? (
        <>
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
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-accent">{t.analysisHub.partyLandscapeEyebrow}</p>
                <h2 className="font-display text-xl font-bold">{t.analysisHub.partyLandscapeHeading}</h2>
                <p className="mt-0.5 text-xs text-muted">{t.analysisHub.partyLandscapeSubtitle}</p>
              </div>
              <PrivacyPill />
            </div>
            <div className="mt-5 grid gap-5 lg:grid-cols-5">
              <div className="min-w-0 lg:col-span-3">
                <h3 className="font-display text-sm font-bold text-ink">{t.analysisHub.partySupportHeading}</h3>
                <p className="mt-0.5 text-xs text-muted">{t.analysisHub.partySupportSubtitle}</p>
                <div className="mt-4">
                  <PartySupportChart buckets={partySupportBuckets} locale={locale} variant="bars" />
                </div>
              </div>
              {ANALYSIS_CONFIG.currentVoteShare && (
                <div className="min-w-0 border-t border-border pt-5 lg:col-span-2 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                  <h3 className="font-display text-sm font-bold text-ink">{t.analysisHub.currentVoteShareHeading}</h3>
                  <p className="mt-0.5 text-xs text-muted">{t.analysisHub.currentVoteShareSubtitle}</p>
                  <div className="mt-4">
                    <IssuesDonutChart distribution={statewide.partyPreference} centerLabel={t.analysisHub.currentVoteShareHeading} />
                  </div>
                </div>
              )}
            </div>
            <KeyReading lines={partySupportReading} />
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

          {/* Section E — Party Momentum + What Changed, as ONE dashboard
              module: momentum cards on top, the movement-only insight strip
              (a filtered reuse of the same Key Takeaways engine — no second
              computation) directly beneath, separated by a hairline rather
              than living in two separate stacked cards. A month picker lets
              the visitor re-point both at an older month/previous-month
              transition; see PartyMomentumSection for that logic. */}
          <PartyMomentumSection data={data} />

          {/* Section F — Key Issues Overall: one vertically-stacked module —
              a large, centered donut on top (size="xl", legend hidden since
              the grid below already lists every issue) and a compact
              3-column issue+percentage grid underneath, replacing the
              earlier side-by-side chart+ranking-panel layout. Each grid
              cell's dot is colored via issueColorByKey (computed above from
              the same distribution the donut reads), so a cell's color
              always matches its own donut slice. allIssuesForGrid is the
              same sorted list as overallTopIssues, just not sliced to 5 —
              same distribution, same numbers, only the presentation
              changed. */}
          {ANALYSIS_CONFIG.keyIssues && (
            <section className="mt-8 card-surface rounded-2xl p-5 sm:p-6">
              <SectionHeader eyebrow={t.analysisHub.keyIssuesEyebrow} title={t.analysisHub.keyIssuesOverallHeading} subtitle={t.analysisHub.keyIssuesOverallSubtitle} />
              <div className="mt-5 grid gap-4 lg:grid-cols-[40fr_25fr_35fr] lg:items-start">
                <div className="flex min-w-0 justify-center lg:col-span-1">
                  <IssuesDonutChart
                    distribution={statewide.demographics.top_issue}
                    centerLabel={t.analysisHub.keyIssuesOverallHeading}
                    size="lg"
                    hideLegend
                    tooltip
                  />
                </div>
                <div className="min-w-0 border-t border-border pt-4 lg:col-span-1 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
                  {allIssuesForGrid.length > 0 ? (
                    <ul className="space-y-1.5">
                      {allIssuesForGrid.map((issue) => (
                        <li key={issue.key} className="flex items-center justify-between gap-2 text-sm">
                          <span className="flex min-w-0 items-center gap-1.5 text-foreground">
                            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: issue.color }} />
                            <span className="truncate">{issue.label}</span>
                          </span>
                          <span className="shrink-0 font-display font-bold tabular-nums text-ink">{issue.percentage}%</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-muted">{t.analysisHub.notEnoughTakeaways}</p>
                  )}
                </div>
                <div className="min-w-0 border-t border-border pt-4 lg:col-span-1 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                  <h3 className="font-display text-xs font-bold uppercase tracking-wide text-muted">{t.analysisHub.topIssuesRankingLabel}</h3>
                  {allIssuesForGrid.length > 0 ? (
                    <ol className="mt-3 space-y-2">
                      {allIssuesForGrid.slice(0, 6).map((issue, index) => (
                        <li key={issue.key} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2">
                          <span className="flex min-w-0 items-center gap-2 text-sm text-foreground">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-white">
                              {index + 1}
                            </span>
                            <span className="truncate">{issue.label}</span>
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
              <KeyReading lines={heatmapReading} />
            </section>
          )}

          {/* Section I — Issue x Party Heatmap */}
          {ANALYSIS_CONFIG.issuePartyMatrix && (
            <section className="mt-8 card-surface rounded-2xl p-5 sm:p-6">
              <SectionHeader title={t.analysisHub.issuePartyMatrixHeading} subtitle={t.analysisHub.issuePartyMatrixSubtitle} />
              <div className="mt-5">
                <IssuePartyHeatmap rows={data.issuePartyMatrix} segments={data.partySegments} />
              </div>
              <KeyReading lines={heatmapReading} />
            </section>
          )}

          {/* Sections J, K, L, L2 — Support by Demographics: party
              preference within each Age/Gender/Religion/Caste group. Each
              dimension is its own full-width module with the chart at ~60%
              and its data-derived reading at ~40% alongside it (same
              col-span-3/col-span-2 pattern the Party Landscape module above
              already uses for chart+donut) rather than four small 2x2 cards
              — at four-up, the chart itself was too cramped to read and the
              reading had nowhere to live but underneath it. */}
          {ANALYSIS_CONFIG.demographicAnalysis && (
            <section className="mt-8">
              <SectionHeader eyebrow={t.analysisHub.demographicsEyebrow} title={t.analysisHub.supportByDemographicsHeading} subtitle={t.analysisHub.supportByDemographicsSubtitle} />
              <div className="mt-4 space-y-4">
                <div className="card-surface min-w-0 rounded-2xl p-4 sm:p-5">
                  <h3 className="font-display text-sm font-bold text-ink">{t.analysisHub.agePartyHeading}</h3>
                  <p className="mt-0.5 text-xs text-muted">{t.analysisHub.demographicPartySubtitle}</p>
                  <div className="mt-4 grid gap-5 lg:grid-cols-10 lg:items-start">
                    <div className="min-w-0 lg:col-span-7">
                      <DemographicPartyChart rows={data.agePartyRows} />
                    </div>
                    <div className="min-w-0 border-t border-border pt-4 lg:col-span-3 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                      <KeyReading lines={buildDemographicPartyReading(data.agePartyRows, t, locale)} />
                    </div>
                  </div>
                </div>
                <div className="card-surface min-w-0 rounded-2xl p-4 sm:p-5">
                  <h3 className="font-display text-sm font-bold text-ink">{t.analysisHub.genderPartyHeading}</h3>
                  <p className="mt-0.5 text-xs text-muted">{t.analysisHub.demographicPartySubtitle}</p>
                  <div className="mt-4 grid gap-5 lg:grid-cols-10 lg:items-start">
                    <div className="min-w-0 lg:col-span-7">
                      <DemographicPartyChart rows={data.genderPartyRows} />
                    </div>
                    <div className="min-w-0 border-t border-border pt-4 lg:col-span-3 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                      <KeyReading lines={buildDemographicPartyReading(data.genderPartyRows, t, locale)} />
                    </div>
                  </div>
                </div>
                {hasReligion && (
                  <div className="card-surface min-w-0 rounded-2xl p-4 sm:p-5">
                    <h3 className="font-display text-sm font-bold text-ink">{t.analysisHub.religionPartyHeading}</h3>
                    <p className="mt-0.5 text-xs text-muted">{t.analysisHub.demographicPartySubtitle}</p>
                    <div className="mt-4 grid gap-5 lg:grid-cols-10 lg:items-start">
                      <div className="min-w-0 lg:col-span-7">
                        <DemographicPartyChart rows={data.religionPartyRows} />
                      </div>
                      <div className="min-w-0 border-t border-border pt-4 lg:col-span-3 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                        <KeyReading lines={buildDemographicPartyReading(data.religionPartyRows, t, locale)} />
                      </div>
                    </div>
                  </div>
                )}
                {ANALYSIS_CONFIG.castePartyAnalysis && hasCaste && (
                  <div className="card-surface min-w-0 rounded-2xl p-4 sm:p-5">
                    <h3 className="font-display text-sm font-bold text-ink">{t.analysisHub.castePartyHeading}</h3>
                    <p className="mt-0.5 text-xs text-muted">{t.analysisHub.demographicPartySubtitle}</p>
                    <div className="mt-4 grid gap-5 lg:grid-cols-10 lg:items-start">
                      <div className="min-w-0 lg:col-span-7">
                        <CastePartyHorizontalChart rows={data.castePartyRows} />
                      </div>
                      <div className="min-w-0 border-t border-border pt-4 lg:col-span-3 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                        <KeyReading lines={buildDemographicPartyReading(data.castePartyRows, t, locale)} />
                      </div>
                    </div>
                  </div>
                )}
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

          {/* Respondent Profile — sample composition (distinct from the
              party-crossed breakdowns above). Deliberately the LAST section
              on the page: every other section answers "what do voters
              think"; this one answers "who took this survey", which reads
              better as a closing appendix than as the second thing a visitor
              sees. */}
          <section className="mt-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold">{t.analysisHub.demographicsHeading}</h2>
                <p className="mt-0.5 text-xs text-muted">{t.analysisHub.demographicsSubtitle}</p>
              </div>
              <PrivacyPill />
            </div>
            {/* lg: (not sm:) — at sm:/tablet width, three donut+legend cards
                side by side don't leave the legend enough room next to
                IssuesDonutChart's fixed-size donut, which was overflowing
                each card at ~768px. One column comfortably fits a donut +
                legend until there's truly enough width for three. */}
            <div className={`mt-4 grid gap-4 lg:grid-cols-3 ${hasCaste ? "xl:grid-cols-4" : ""}`}>
              <RespondentProfileCard title={t.results.ageGroup} distribution={statewide.demographics.age_group} />
              <RespondentProfileCard title={t.results.gender} distribution={statewide.demographics.gender} />
              <RespondentProfileCard title={t.results.religion} distribution={statewide.demographics.religion} />
              {hasCaste && <RespondentProfileCard title={t.results.socialCategory} distribution={data.casteDistribution} />}
            </div>
          </section>
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
