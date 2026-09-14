import "server-only";

import { prisma } from "./prisma";
import { getSiteSetting } from "./data";
import { ELIGIBLE_RESPONSE_STATUS, CANONICAL_SPECIAL_PARTIES } from "./enums";
import { getMinCellSize } from "./analytics-privacy";
import { getPublicStatewideResults, type PublicStatewideResultsDto } from "./public-statewide-results";
import { protectPublicCells, type PublicDistribution } from "./public-analytics-core";
import { REAL_DATA_SOURCE, SYNTHETIC_DATA_MODE_KEY, SYNTHETIC_DATA_SOURCE } from "./synthetic-data";
import { ANALYSIS_CONFIG } from "./analysis-config";
import { computeMomentumForMonthIndex } from "./analysis-summaries";

// State-level Analysis dashboard data layer. Reuses getPublicStatewideResults
// (already computes partySupport + demographics + sample for the whole
// state) for everything that overlaps with the Results dashboard, and adds
// ONLY the analysis-specific aggregations below (month-by-month trend,
// party-issue crosstabs, demographic breakdowns, intersections). Every
// number here is derived from real SurveyResponse/SurveyAnswer rows —
// nothing is fabricated, and a shape with insufficient real data reports
// that honestly (a "not enough data"/"suppressed" state) rather than
// inventing values or silently showing a smaller group's number as if it
// were reliable.
//
// Every aggregation is scoped by `electionId` (one state's one election) —
// there is no query anywhere in this file that reads across states. The
// party list that shows up in every chart is whatever actually appears in
// that election's real party_preference answers, which is itself already
// state-curated (see prisma/data/state-seeds.ts's per-state `parties`, max
// 4–5) — this file never hardcodes a party list.

export interface TrendMonthParty {
  key: string;
  label: string;
  nameHindi: string | null;
  colorHex: string | null;
  percentage: number;
}

export interface TrendMonth {
  /** "2026-03" */
  month: string;
  /** Locale-formatted separately by the caller; this is just the raw month key. */
  parties: TrendMonthParty[];
}

export type VotePreferenceTrend = { hasEnoughData: true; months: TrendMonth[] } | { hasEnoughData: false };

export interface CompositionCell {
  key: string;
  label: string;
  percentage: number;
  count: number;
  lowData: boolean;
}

export interface PartyTopIssues {
  partyKey: string;
  partyLabel: string;
  partyNameHindi: string | null;
  colorHex: string | null;
  logoUrl: string | null;
  respondentCount: number;
  lowData: boolean;
  /** Percentage of THIS party's own supporters who picked each issue —
   *  denominator is respondentCount, never the sum of issue mentions. */
  topIssues: { key: string; label: string; percentage: number; count: number }[];
  /** What THIS party's own supporter base looks like demographically — e.g.
   *  "38% of BJP's supporters are women" — the inverse question from Age/
   *  Gender/Religion x Party (which asks "of women, how many support BJP").
   *  Denominator is respondentCount; religionComposition is empty when the
   *  survey collected no religion answers at all (never a fabricated "0%"
   *  category). A cell below the privacy threshold is flagged lowData
   *  individually — the rest of the same breakdown can still be shown. */
  genderComposition: CompositionCell[];
  ageComposition: CompositionCell[];
  religionComposition: CompositionCell[];
  casteComposition: CompositionCell[];
}

export type VoterVoice =
  | { kind: "issue"; issueKey: string; issueLabel: string; percentage: number; respondentCount: number }
  | {
      kind: "age" | "gender" | "religion";
      groupKey: string;
      groupLabel: string;
      issueKey: string;
      issueLabel: string;
      percentage: number;
      respondentCount: number;
    };

export interface PartyMomentumItem {
  partyKey: string;
  label: string;
  nameHindi: string | null;
  colorHex: string | null;
  currentPct: number;
  previousPct: number | null;
  changePp: number | null;
  direction: "up" | "down" | "stable" | "new";
}

export interface PartySegmentMeta {
  key: string;
  label: string;
  nameHindi: string | null;
  colorHex: string | null;
  logoUrl: string | null;
}

export interface DemographicGroupPartyRow {
  groupKey: string;
  groupLabel: string;
  sampleSize: number;
  lowData: boolean;
  parties: { key: string; label: string; nameHindi: string | null; colorHex: string | null; percentage: number; count: number }[];
}

export interface IssuePartyMatrixCell {
  partyKey: string;
  percentage: number;
  count: number;
  lowData: boolean;
}

export interface IssuePartyMatrixRow {
  issueKey: string;
  issueLabel: string;
  cells: IssuePartyMatrixCell[];
}

export interface IssueByDemographicValue {
  groupKey: string;
  groupLabel: string;
  percentage: number;
  count: number;
  lowData: boolean;
}

export interface IssueByDemographicSeries {
  issueKey: string;
  issueLabel: string;
  values: IssueByDemographicValue[];
}

export type IntersectionDimension = "age_group" | "gender" | "religion" | "social_category";

export interface IntersectionCell {
  dimension: IntersectionDimension;
  groupKey: string;
  groupLabel: string;
  partyKey: string;
  partyLabel: string;
  partyNameHindi: string | null;
  sampleSize: number;
  lowData: boolean;
  topIssues: { key: string; label: string; percentage: number }[];
}

export interface StateAnalysisData {
  statewide: PublicStatewideResultsDto;
  votePreferenceTrend: VotePreferenceTrend;
  partyMomentum: PartyMomentumItem[];
  keyIssuesByParty: PartyTopIssues[];
  partySegments: PartySegmentMeta[];
  issuePartyMatrix: IssuePartyMatrixRow[];
  agePartyRows: DemographicGroupPartyRow[];
  genderPartyRows: DemographicGroupPartyRow[];
  religionPartyRows: DemographicGroupPartyRow[];
  castePartyRows: DemographicGroupPartyRow[];
  issueByAge: IssueByDemographicSeries[];
  issueByGender: IssueByDemographicSeries[];
  issueByReligion: IssueByDemographicSeries[];
  issueByCaste: IssueByDemographicSeries[];
  /** Caste/social-category composition of the whole state (for the "Support
   *  by Demographics" overview, alongside age/gender/religion) — computed
   *  here (not in public-statewide-results.ts, which doesn't collect this
   *  dimension) using the exact same protectPublicCells privacy policy. */
  casteDistribution: PublicDistribution;
  intersections: IntersectionCell[];
  voterVoices: VoterVoice[];
  /** Number of distinct real months with enough party_preference answers to
   *  appear in the trend — surfaced in the header as a plain data-quality
   *  fact ("N months of history available"), not a claim about reliability
   *  beyond what MIN_MONTHS_FOR_TREND already gates the trend chart on. */
  historicalMonthsAvailable: number;
}

const MIN_MONTHS_FOR_TREND = 2;
const TOP_ISSUES_PER_PARTY = 5;
const TOP_ISSUES_FOR_MATRIX = 8;
const MAX_VOTER_VOICES = 4;

export async function getStateAnalysis(electionId: string): Promise<StateAnalysisData | null> {
  const statewide = await getPublicStatewideResults(electionId);
  if (!statewide) return null;

  const isSynthetic = await getSiteSetting<boolean>(SYNTHETIC_DATA_MODE_KEY, false);
  const activeDataSource = isSynthetic ? SYNTHETIC_DATA_SOURCE : REAL_DATA_SOURCE;
  const minCellSize = await getMinCellSize();

  const [votePreferenceTrend, crosstabs] = await Promise.all([
    computeVotePreferenceTrend(electionId, activeDataSource),
    computeCrosstabAnalysis(electionId, activeDataSource, minCellSize),
  ]);

  const partyMomentum = ANALYSIS_CONFIG.advancedMomentum ? computePartyMomentum(votePreferenceTrend) : [];
  const voterVoices = computeVoterVoices(statewide.demographics.top_issue, crosstabs.issueByAge, crosstabs.issueByGender);

  return {
    statewide,
    votePreferenceTrend,
    partyMomentum,
    keyIssuesByParty: ANALYSIS_CONFIG.partyIssueAnalysis ? crosstabs.keyIssuesByParty : [],
    partySegments: crosstabs.partySegments,
    issuePartyMatrix: ANALYSIS_CONFIG.issuePartyMatrix ? crosstabs.issuePartyMatrix : [],
    agePartyRows: ANALYSIS_CONFIG.demographicAnalysis ? crosstabs.agePartyRows : [],
    genderPartyRows: ANALYSIS_CONFIG.demographicAnalysis ? crosstabs.genderPartyRows : [],
    religionPartyRows: ANALYSIS_CONFIG.demographicAnalysis ? crosstabs.religionPartyRows : [],
    castePartyRows: ANALYSIS_CONFIG.castePartyAnalysis ? crosstabs.castePartyRows : [],
    issueByAge: ANALYSIS_CONFIG.issueByDemographic ? crosstabs.issueByAge : [],
    issueByGender: ANALYSIS_CONFIG.issueByDemographic ? crosstabs.issueByGender : [],
    issueByReligion: ANALYSIS_CONFIG.issueByDemographic ? crosstabs.issueByReligion : [],
    issueByCaste: ANALYSIS_CONFIG.casteIssueAnalysis ? crosstabs.issueByCaste : [],
    casteDistribution: ANALYSIS_CONFIG.castePartyAnalysis ? crosstabs.casteDistribution : { state: "unavailable", reason: "not_applicable", minRequired: minCellSize },
    intersections: ANALYSIS_CONFIG.intersectionAnalysis ? crosstabs.intersections : [],
    voterVoices,
    historicalMonthsAvailable: votePreferenceTrend.hasEnoughData ? votePreferenceTrend.months.length : 0,
  };
}

// ---------------------------------------------------------------------------
// Vote Preference Trend — month-by-month party % computed from each real
// response's own createdAt timestamp. A month only appears once it has at
// least one valid party-preference answer; the trend itself only renders
// once there are at least MIN_MONTHS_FOR_TREND such months, otherwise the
// caller shows the honest "not enough historical data" state instead of a
// single-point or fabricated line. Percentage denominator is the count of
// valid party_preference answers THAT MONTH — never the whole-election total
// — so an early, thin month is never silently diluted or inflated by later
// volume.
// ---------------------------------------------------------------------------
async function computeVotePreferenceTrend(electionId: string, dataSource: string): Promise<VotePreferenceTrend> {
  const rows = await prisma.surveyAnswer.findMany({
    where: {
      response: { status: ELIGIBLE_RESPONSE_STATUS, dataSource, survey: { electionId } },
      question: { key: "party_preference" },
      optionId: { not: null },
    },
    select: {
      response: { select: { createdAt: true } },
      option: {
        select: {
          key: true,
          partyId: true,
          party: { select: { nameEnglish: true, nameHindi: true, colorHex: true, displayOrder: true, isActive: true } },
        },
      },
    },
  });

  const monthBuckets = new Map<string, Map<string, { label: string; nameHindi: string | null; colorHex: string | null; displayOrder: number; count: number }>>();
  for (const row of rows) {
    const option = row.option;
    if (!option) continue;
    if (option.partyId && !option.party?.isActive) continue;
    const month = row.response.createdAt.toISOString().slice(0, 7);
    const groupKey = option.partyId ?? option.key;
    if (!monthBuckets.has(month)) monthBuckets.set(month, new Map());
    const parties = monthBuckets.get(month)!;
    const existing = parties.get(groupKey);
    if (existing) {
      existing.count += 1;
    } else {
      parties.set(groupKey, {
        label: option.party?.nameEnglish ?? option.key,
        nameHindi: option.party?.nameHindi ?? null,
        colorHex: option.party?.colorHex ?? null,
        displayOrder: option.party?.displayOrder ?? 0,
        count: 1,
      });
    }
  }

  const qualifyingMonths = Array.from(monthBuckets.entries())
    .filter(([, parties]) => Array.from(parties.values()).reduce((sum, p) => sum + p.count, 0) > 0)
    .sort(([a], [b]) => a.localeCompare(b));

  if (qualifyingMonths.length < MIN_MONTHS_FOR_TREND) {
    return { hasEnoughData: false };
  }

  const months: TrendMonth[] = qualifyingMonths.map(([month, parties]) => {
    const denominator = Array.from(parties.values()).reduce((sum, p) => sum + p.count, 0);
    const partyList = Array.from(parties.entries())
      .map(([key, p]) => ({
        key,
        label: p.label,
        nameHindi: p.nameHindi,
        colorHex: p.colorHex,
        percentage: Math.round((p.count / denominator) * 1000) / 10,
        displayOrder: p.displayOrder,
      }))
      .sort((a, b) => a.displayOrder - b.displayOrder || a.label.localeCompare(b.label));
    return { month, parties: partyList };
  });

  return { hasEnoughData: true, months };
}

// ---------------------------------------------------------------------------
// Party Momentum — a pure derivation from the trend's last two qualifying
// months (no extra DB query). Change is expressed strictly as the
// PERCENTAGE-POINT difference between two already-computed monthly shares
// (current% - previous%) — never a raw response-count delta, which would
// conflate "more people answered this month" with "this party actually
// gained ground". "Rising"/"declining"/"stable" is a description of that
// already-observed change, never a forecast or a claim about who will win.
// ---------------------------------------------------------------------------
function computePartyMomentum(trend: VotePreferenceTrend): PartyMomentumItem[] {
  if (!trend.hasEnoughData || trend.months.length < 2) return [];
  // Delegates to the same month-indexed calculation the client-side Party
  // Momentum month picker uses (analysis-summaries.ts, which is safe to
  // import from a server module) — the latest month is just index
  // `months.length - 1`, so there is exactly one implementation of this
  // formula instead of two that could drift apart.
  return computeMomentumForMonthIndex(trend, trend.months.length - 1);
}

// ---------------------------------------------------------------------------
// Crosstab analysis — ONE combined fetch of every party_preference,
// top_issue, age_group, gender and religion answer for the election, then
// every party/issue/demographic crosstab below is derived in memory from
// that single result set — the matrix, the age/gender/religion x party
// breakdowns, the issue-by-demographic breakdowns and the intersection
// analysis all reuse the same per-response maps instead of re-querying the
// same answers five separate times.
// ---------------------------------------------------------------------------
interface CrosstabResult {
  keyIssuesByParty: PartyTopIssues[];
  partySegments: PartySegmentMeta[];
  issuePartyMatrix: IssuePartyMatrixRow[];
  agePartyRows: DemographicGroupPartyRow[];
  genderPartyRows: DemographicGroupPartyRow[];
  religionPartyRows: DemographicGroupPartyRow[];
  castePartyRows: DemographicGroupPartyRow[];
  issueByAge: IssueByDemographicSeries[];
  issueByGender: IssueByDemographicSeries[];
  issueByReligion: IssueByDemographicSeries[];
  issueByCaste: IssueByDemographicSeries[];
  casteDistribution: PublicDistribution;
  intersections: IntersectionCell[];
}

interface PartyGroup {
  key: string;
  label: string;
  nameHindi: string | null;
  colorHex: string | null;
  logoUrl: string | null;
  displayOrder: number;
  isReal: boolean;
  responseIds: Set<string>;
}

interface DemoGroup {
  label: string;
  responseIds: Set<string>;
}

async function computeCrosstabAnalysis(electionId: string, dataSource: string, minCellSize: number): Promise<CrosstabResult> {
  const rows = await prisma.surveyAnswer.findMany({
    where: {
      response: { status: ELIGIBLE_RESPONSE_STATUS, dataSource, survey: { electionId } },
      question: { key: { in: ["party_preference", "top_issue", "age_group", "gender", "religion", "social_category"] } },
      optionId: { not: null },
    },
    select: {
      responseId: true,
      question: { select: { key: true } },
      option: {
        select: {
          key: true,
          label: true,
          partyId: true,
          party: { select: { nameEnglish: true, nameHindi: true, colorHex: true, logoUrl: true, displayOrder: true, isActive: true } },
        },
      },
    },
  });

  const partyGroups = new Map<string, PartyGroup>();
  const ageGroups = new Map<string, DemoGroup>();
  const genderGroups = new Map<string, DemoGroup>();
  const religionGroups = new Map<string, DemoGroup>();
  const casteGroups = new Map<string, DemoGroup>();
  const issuesByResponse = new Map<string, { key: string; label: string }[]>();
  const partyByResponse = new Map<string, string>();

  function addToGroup(groups: Map<string, DemoGroup>, key: string, label: string, responseId: string) {
    const existing = groups.get(key);
    if (existing) existing.responseIds.add(responseId);
    else groups.set(key, { label, responseIds: new Set([responseId]) });
  }

  for (const row of rows) {
    const option = row.option;
    if (!option) continue;
    const questionKey = row.question.key;

    if (questionKey === "party_preference") {
      if (option.partyId && !option.party?.isActive) continue;
      const groupKey = option.partyId ?? option.key;
      partyByResponse.set(row.responseId, groupKey);
      const existing = partyGroups.get(groupKey);
      if (existing) {
        existing.responseIds.add(row.responseId);
      } else {
        partyGroups.set(groupKey, {
          key: groupKey,
          label: option.party?.nameEnglish ?? option.key,
          nameHindi: option.party?.nameHindi ?? null,
          colorHex: option.party?.colorHex ?? null,
          logoUrl: option.party?.logoUrl ?? null,
          displayOrder: option.party?.displayOrder ?? 0,
          isReal: Boolean(option.partyId),
          responseIds: new Set([row.responseId]),
        });
      }
    } else if (questionKey === "age_group") {
      addToGroup(ageGroups, option.key, option.label, row.responseId);
    } else if (questionKey === "gender") {
      addToGroup(genderGroups, option.key, option.label, row.responseId);
    } else if (questionKey === "religion") {
      addToGroup(religionGroups, option.key, option.label, row.responseId);
    } else if (questionKey === "social_category") {
      addToGroup(casteGroups, option.key, option.label, row.responseId);
    } else if (questionKey === "top_issue") {
      // MULTIPLE_CHOICE — one response can carry several issue answers, so
      // each response id must map to a LIST, not a single overwritten value.
      const list = issuesByResponse.get(row.responseId);
      if (list) list.push({ key: option.key, label: option.label });
      else issuesByResponse.set(row.responseId, [{ key: option.key, label: option.label }]);
    }
  }

  // "Issue segments" — real parties plus the "Other" catch-all bucket (the
  // dropdown set the spec asks for: state's own major parties + Others).
  // NOTA and Undecided are excluded here because "which issues do NOTA
  // voters care about" isn't a meaningful supporter-issue profile — but they
  // ARE kept in the full age/gender/religion x party breakdown below, where
  // showing the whole vote (including undecided) is exactly the point. The
  // party list itself is never hardcoded: it's whichever parties actually
  // appear in this election's real party_preference answers, which is
  // already state-curated at the survey/seed level (max 4–5 per state).
  const realPartyGroups = Array.from(partyGroups.values())
    .filter((g) => g.isReal)
    .sort((a, b) => a.displayOrder - b.displayOrder || a.label.localeCompare(b.label));
  const otherGroup = partyGroups.get("other");
  const otherMeta = CANONICAL_SPECIAL_PARTIES.find((p) => p.slug === "other");
  const issueSegments: PartyGroup[] = [
    ...realPartyGroups,
    ...(otherGroup && otherMeta
      ? [{ ...otherGroup, label: otherMeta.nameEnglish, nameHindi: otherMeta.nameHindi, colorHex: otherMeta.colorHex, displayOrder: 999 }]
      : []),
  ];

  const partySegments: PartySegmentMeta[] = issueSegments.map((g) => ({
    key: g.key,
    label: g.label,
    nameHindi: g.nameHindi,
    colorHex: g.colorHex,
    logoUrl: g.logoUrl,
  }));

  // ---- Key Issues by Party (Section G) — percentage denominator is THIS
  // party's own supporter count (group.responseIds.size), matching the spec's
  // formula exactly: "BJP-supporter issue selections / valid BJP supporters".
  // A party below the privacy/sample threshold is flagged lowData and its
  // ranking is not computed at all, rather than shown from too few people. ----
  // Demographic composition of one party's own supporter base ("what % of
  // BJP's supporters are women" — NOT "what % of women support BJP", which
  // is the age/gender/religion x party tables further down). Each cell's
  // OWN count is checked against the privacy threshold independently, so a
  // party with enough total supporters can still safely hide just its
  // thinnest slice (e.g. a single 65+ respondent) while showing the rest.
  function buildComposition(partyResponseIds: Set<string>, demoGroups: Map<string, DemoGroup>): CompositionCell[] {
    const denominator = partyResponseIds.size;
    if (denominator === 0) return [];
    return Array.from(demoGroups.entries())
      .map(([key, demoGroup]) => {
        let count = 0;
        for (const id of partyResponseIds) if (demoGroup.responseIds.has(id)) count += 1;
        return { key, label: demoGroup.label, count, percentage: Math.round((count / denominator) * 1000) / 10, lowData: count < minCellSize };
      })
      .filter((cell) => cell.count > 0);
  }

  const keyIssuesByParty: PartyTopIssues[] = issueSegments.map((group) => {
    const respondentCount = group.responseIds.size;
    const lowData = respondentCount < minCellSize;
    if (lowData) {
      return {
        partyKey: group.key,
        partyLabel: group.label,
        partyNameHindi: group.nameHindi,
        colorHex: group.colorHex,
        logoUrl: group.logoUrl,
        respondentCount,
        lowData,
        topIssues: [],
        genderComposition: [],
        ageComposition: [],
        religionComposition: [],
        casteComposition: [],
      };
    }
    const issueCounts = new Map<string, { label: string; count: number }>();
    for (const responseId of group.responseIds) {
      const issues = issuesByResponse.get(responseId) ?? [];
      for (const issue of issues) {
        const existing = issueCounts.get(issue.key);
        if (existing) existing.count += 1;
        else issueCounts.set(issue.key, { label: issue.label, count: 1 });
      }
    }
    const topIssues = Array.from(issueCounts.entries())
      .map(([key, { label, count }]) => ({ key, label, percentage: Math.round((count / respondentCount) * 1000) / 10, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, TOP_ISSUES_PER_PARTY);

    return {
      partyKey: group.key,
      partyLabel: group.label,
      partyNameHindi: group.nameHindi,
      colorHex: group.colorHex,
      logoUrl: group.logoUrl,
      respondentCount,
      lowData,
      topIssues,
      genderComposition: buildComposition(group.responseIds, genderGroups),
      ageComposition: buildComposition(group.responseIds, ageGroups),
      religionComposition: buildComposition(group.responseIds, religionGroups),
      casteComposition: buildComposition(group.responseIds, casteGroups),
    };
  });

  // ---- overall issue frequency, to pick which issues appear in the matrix
  // and the issue-by-demographic breakdowns (top N by total mentions) ----
  const overallIssueCounts = new Map<string, { label: string; count: number }>();
  for (const issues of issuesByResponse.values()) {
    for (const issue of issues) {
      const existing = overallIssueCounts.get(issue.key);
      if (existing) existing.count += 1;
      else overallIssueCounts.set(issue.key, { label: issue.label, count: 1 });
    }
  }
  const topIssueKeys = Array.from(overallIssueCounts.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, TOP_ISSUES_FOR_MATRIX)
    .map(([key, { label }]) => ({ key, label }));

  // ---- Issue x Party matrix (Section I) / Party x Issue comparison
  // (Section H reuses these exact rows) — denominator is that party's own
  // supporter count, identical formula to Key Issues by Party above (same
  // number, two visual presentations — never recomputed differently). ----
  const issuePartyMatrix: IssuePartyMatrixRow[] = topIssueKeys.map(({ key: issueKey, label: issueLabel }) => ({
    issueKey,
    issueLabel,
    cells: issueSegments.map((group) => {
      const denominator = group.responseIds.size;
      let count = 0;
      for (const responseId of group.responseIds) {
        const issues = issuesByResponse.get(responseId);
        if (issues?.some((i) => i.key === issueKey)) count += 1;
      }
      return {
        partyKey: group.key,
        percentage: denominator > 0 ? Math.round((count / denominator) * 1000) / 10 : 0,
        count,
        lowData: denominator < minCellSize,
      };
    }),
  }));

  // ---- Age/Gender/Religion x Party (Sections J, K, L) — uses the FULL
  // party set (including Other/NOTA/Undecided) so the breakdown represents
  // the whole demographic group's vote. Denominator is that group's own
  // members who ALSO answered party_preference — never the state's overall
  // response count. ----
  const fullPartyGroups = Array.from(partyGroups.values()).sort(
    (a, b) => a.displayOrder - b.displayOrder || a.label.localeCompare(b.label)
  );

  function buildDemographicPartyRows(groups: Map<string, DemoGroup>): DemographicGroupPartyRow[] {
    return Array.from(groups.entries()).map(([groupKey, group]) => {
      const memberIds = group.responseIds;
      let denominator = 0;
      const counts = new Map<string, number>();
      for (const responseId of memberIds) {
        const partyKey = partyByResponse.get(responseId);
        if (!partyKey) continue;
        denominator += 1;
        counts.set(partyKey, (counts.get(partyKey) ?? 0) + 1);
      }
      return {
        groupKey,
        groupLabel: group.label,
        sampleSize: denominator,
        lowData: denominator < minCellSize,
        parties: fullPartyGroups.map((g) => ({
          key: g.key,
          label: g.label,
          nameHindi: g.nameHindi,
          colorHex: g.colorHex,
          percentage: denominator > 0 ? Math.round(((counts.get(g.key) ?? 0) / denominator) * 1000) / 10 : 0,
          count: counts.get(g.key) ?? 0,
        })),
      };
    });
  }

  const agePartyRows = buildDemographicPartyRows(ageGroups);
  const genderPartyRows = buildDemographicPartyRows(genderGroups);
  const religionPartyRows = buildDemographicPartyRows(religionGroups);
  const castePartyRows = buildDemographicPartyRows(casteGroups);

  // ---- Issue importance by demographic (Sections M, N, O) — for each top
  // issue, what share of each demographic group's OWN members selected it.
  // Denominator is that group's member count, never the state total. ----
  function buildIssueByDemographic(groups: Map<string, DemoGroup>): IssueByDemographicSeries[] {
    return topIssueKeys.map(({ key: issueKey, label: issueLabel }) => ({
      issueKey,
      issueLabel,
      values: Array.from(groups.entries()).map(([groupKey, group]) => {
        const denominator = group.responseIds.size;
        let count = 0;
        for (const responseId of group.responseIds) {
          const issues = issuesByResponse.get(responseId);
          if (issues?.some((i) => i.key === issueKey)) count += 1;
        }
        return {
          groupKey,
          groupLabel: group.label,
          percentage: denominator > 0 ? Math.round((count / denominator) * 1000) / 10 : 0,
          count,
          lowData: denominator < minCellSize,
        };
      }),
    }));
  }

  const issueByAge = buildIssueByDemographic(ageGroups);
  const issueByGender = buildIssueByDemographic(genderGroups);
  const issueByReligion = buildIssueByDemographic(religionGroups);
  const issueByCaste = buildIssueByDemographic(casteGroups);

  // ---- Caste/social-category overview distribution (for the "Support by
  // Demographics" donut, alongside age/gender/religion) — same
  // protectPublicCells privacy policy as every other published distribution
  // on this platform, computed here since public-statewide-results.ts does
  // not collect this dimension for the statewide DTO. ----
  const casteTotal = Array.from(casteGroups.values()).reduce((sum, g) => sum + g.responseIds.size, 0);
  const casteDistribution: PublicDistribution =
    casteTotal === 0
      ? { state: "unavailable", reason: "no_answers", minRequired: minCellSize }
      : {
          state: "available",
          denominator: casteTotal,
          minRequired: minCellSize,
          buckets: protectPublicCells(
            Array.from(casteGroups.entries()).map(([key, g], index) => ({ key, label: g.label, displayOrder: index, count: g.responseIds.size })),
            casteTotal,
            minCellSize
          ),
        };

  // ---- Cross-demographic intersection analysis (Section P) — demographic
  // group x party, top issues within that intersected set only. Limited to
  // the single-dimension x party intersections the spec lists first (Gender
  // x Party, Age x Party, Religion x Party, each then narrowed to top
  // issues) — deliberately NOT expanded into three-way combinations
  // (Age x Gender x Party etc.), which would multiply the suppressed/
  // low-data cells far faster than the useful ones ("prioritize useful
  // intersections", not dozens of near-empty tables). ----
  const intersections: IntersectionCell[] = [];
  const dimensionGroups: Array<{ dimension: IntersectionDimension; groups: Map<string, DemoGroup> }> = [
    { dimension: "age_group", groups: ageGroups },
    { dimension: "gender", groups: genderGroups },
    { dimension: "religion", groups: religionGroups },
    { dimension: "social_category", groups: casteGroups },
  ];
  for (const { dimension, groups } of dimensionGroups) {
    for (const [groupKey, group] of groups) {
      for (const segment of issueSegments) {
        const intersectionIds = new Set<string>();
        for (const responseId of segment.responseIds) {
          if (group.responseIds.has(responseId)) intersectionIds.add(responseId);
        }
        const sampleSize = intersectionIds.size;
        const lowData = sampleSize < minCellSize;
        let topIssues: { key: string; label: string; percentage: number }[] = [];
        if (!lowData) {
          const issueCounts = new Map<string, { label: string; count: number }>();
          for (const responseId of intersectionIds) {
            const issues = issuesByResponse.get(responseId) ?? [];
            for (const issue of issues) {
              const existing = issueCounts.get(issue.key);
              if (existing) existing.count += 1;
              else issueCounts.set(issue.key, { label: issue.label, count: 1 });
            }
          }
          // Within-group denominator, same rule as everywhere else in this
          // file: percentage of THIS intersected group's members, not of
          // total issue mentions.
          topIssues = Array.from(issueCounts.entries())
            .map(([key, { label, count }]) => ({ key, label, percentage: Math.round((count / sampleSize) * 1000) / 10 }))
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, TOP_ISSUES_PER_PARTY);
        }
        intersections.push({
          dimension,
          groupKey,
          groupLabel: group.label,
          partyKey: segment.key,
          partyLabel: segment.label,
          partyNameHindi: segment.nameHindi,
          sampleSize,
          lowData,
          topIssues,
        });
      }
    }
  }

  return {
    keyIssuesByParty,
    partySegments,
    issuePartyMatrix,
    agePartyRows,
    genderPartyRows,
    religionPartyRows,
    castePartyRows,
    issueByAge,
    issueByGender,
    issueByReligion,
    issueByCaste,
    casteDistribution,
    intersections,
  };
}

function topIssueForGroup(
  series: IssueByDemographicSeries[],
  groupKey: string
): { key: string; label: string; percentage: number; count: number } | null {
  let best: { key: string; label: string; percentage: number; count: number } | null = null;
  for (const s of series) {
    const value = s.values.find((v) => v.groupKey === groupKey && !v.lowData);
    if (value && value.count > 0 && (!best || value.percentage > best.percentage)) {
      best = { key: s.issueKey, label: s.issueLabel, percentage: value.percentage, count: value.count };
    }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Voter Voices — derived strictly from real selection data (never a stored
// free-text comment: the schema has no public voter-comment field). Mixes
// the overall top issue with one age-derived and one gender-derived
// "data voice" (e.g. "young surveyed respondents most frequently selected
// X") so this section reads less like a single repeated stat — every entry
// still traces back to an actually-available, non-suppressed bucket.
// ---------------------------------------------------------------------------
function computeVoterVoices(
  topIssueDistribution: PublicDistribution,
  issueByAge: IssueByDemographicSeries[],
  issueByGender: IssueByDemographicSeries[]
): VoterVoice[] {
  const voices: VoterVoice[] = [];

  if (topIssueDistribution.state === "available") {
    const available = topIssueDistribution.buckets
      .filter((b): b is Extract<typeof b, { state: "available" }> => b.state === "available")
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 2);
    for (const b of available) {
      voices.push({ kind: "issue", issueKey: b.key, issueLabel: b.label, percentage: b.percentage, respondentCount: b.count });
    }
  }

  const youngest = topIssueForGroup(issueByAge, "18-24");
  if (youngest) {
    const groupLabel = issueByAge[0]?.values.find((v) => v.groupKey === "18-24")?.groupLabel ?? "18-24";
    voices.push({
      kind: "age",
      groupKey: "18-24",
      groupLabel,
      issueKey: youngest.key,
      issueLabel: youngest.label,
      percentage: youngest.percentage,
      respondentCount: youngest.count,
    });
  }

  const female = topIssueForGroup(issueByGender, "female");
  if (female) {
    const groupLabel = issueByGender[0]?.values.find((v) => v.groupKey === "female")?.groupLabel ?? "female";
    voices.push({
      kind: "gender",
      groupKey: "female",
      groupLabel,
      issueKey: female.key,
      issueLabel: female.label,
      percentage: female.percentage,
      respondentCount: female.count,
    });
  }

  return voices.slice(0, MAX_VOTER_VOICES);
}

// Re-exported so callers that only need privacy-safe cell protection for a
// custom aggregation elsewhere don't need a second import path.
export { protectPublicCells };
