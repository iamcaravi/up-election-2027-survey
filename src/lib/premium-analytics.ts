import "server-only";
import { prisma } from "./prisma";
import { getMinCellSize, isSuppressed, roundPct, ELIGIBLE_RESPONSE_STATUS } from "./analytics-privacy";

// =============================================================================
// Premium Analytics Engine — the aggregate-only domain layer behind the
// future paid analytics product. See docs/analytics-engine.md for the full
// design write-up (dimensions, suppression policy, cross-tab rules).
//
// HARD RULES enforced throughout this file:
//   - Every query is scoped to exactly one surveyId (never a state/election/
//     constituency-wide or platform-wide aggregate).
//   - Nothing here ever returns a SurveyResponse row, an ipHash, a
//     fingerprint, a createdAt timestamp, or any other respondent-level
//     field — only counts, percentages, and suppression flags.
//   - Dimension/target keys are restricted to a fixed allowlist (below) —
//     never interpolated from arbitrary client input into a query.
// =============================================================================

// ---------------------------------------------------------------------------
// Allowlists — the ONLY question keys this engine will ever aggregate.
// ---------------------------------------------------------------------------

// Dimensions that can be crossed against a political-preference target
// (candidate_choice or party_preference), and/or shown as a standalone
// distribution. mla_performance / reelection_preference are included for
// forward-compatibility with the platform's documented survey concept —
// see the audit note in docs/analytics-engine.md: no seeded survey
// currently has these questions, so requesting them simply returns null,
// exactly like any other question a given survey doesn't have.
export const CROSSABLE_DIMENSIONS = [
  "gender",
  "age_group",
  "social_category",
  "religion",
  "top_issue",
  "mla_performance",
  "reelection_preference",
] as const;
export type CrossableDimension = (typeof CROSSABLE_DIMENSIONS)[number];

export const PREFERENCE_TARGETS = ["candidate_choice", "party_preference"] as const;
export type PreferenceTarget = (typeof PREFERENCE_TARGETS)[number];

export function isCrossableDimension(v: string): v is CrossableDimension {
  return (CROSSABLE_DIMENSIONS as readonly string[]).includes(v);
}
export function isPreferenceTarget(v: string): v is PreferenceTarget {
  return (PREFERENCE_TARGETS as readonly string[]).includes(v);
}

// ---------------------------------------------------------------------------
// Shared output shapes
// ---------------------------------------------------------------------------

// A bucket with count/pct omitted (not just zeroed) when it is
// individually below the suppression threshold — see Distribution below.
export type Bucket =
  | { key: string; label: string; suppressed: false; count: number; pct: number; colorHex?: string; candidateId?: string; partyId?: string }
  | { key: string; label: string; suppressed: true };

// A standalone distribution (e.g. "Gender Distribution"). Two suppression
// tiers:
//   1. Whole-distribution: if the question's total answered count is below
//      the threshold, the entire thing is suppressed — matches the exact
//      behavior of the existing public results calculation
//      (src/lib/analytics.ts's QuestionResult.sufficientSample).
//   2. Per-bucket: even when the overall total is large enough, any
//      individual bucket whose own count is below the threshold is
//      suppressed on its own (count/pct omitted) — an overall-large
//      distribution must not leak one small group's exact size (e.g. "ST: 2")
//      just because the question as a whole had plenty of respondents.
// KNOWN LIMITATION (documented in docs/analytics-engine.md): this is basic
// single-cell suppression, not full statistical disclosure control with
// secondary suppression — if exactly one bucket is hidden and `total` plus
// every other bucket is visible, its count is algebraically reconstructible
// by subtraction. Acceptable for this foundation phase; flagged as a
// follow-up hardening item.
export interface Distribution {
  questionKey: string;
  label: string;
  total: number;
  suppressed: boolean;
  minRequired: number;
  buckets: Bucket[]; // empty when whole-distribution suppressed
}

// One row of a cross-tab: a single dimension group (e.g. "OBC") and,
// if that group individually meets the threshold, its preference
// breakdown. Suppressed per-group — a large survey can safely reveal a
// big group's breakdown while hiding a small one's, without hiding the
// group's existence entirely (its total is still shown, per the group
// count already being public via getQuestionDistribution when
// unsuppressed — see docs/analytics-engine.md for the reasoning).
export interface CrossTabGroup {
  groupKey: string;
  groupLabel: string;
  total: number;
  suppressed: boolean;
  minRequired: number;
  breakdown: Bucket[]; // empty when suppressed
}

export interface CrossTab {
  dimension: CrossableDimension;
  target: PreferenceTarget;
  groups: CrossTabGroup[];
}

// ---------------------------------------------------------------------------
// Survey/election/constituency hierarchy validation — never trust a
// client-supplied surveyId in isolation; the caller must additionally prove
// which election+constituency it claims the survey belongs to.
// ---------------------------------------------------------------------------

export interface SurveyScope {
  id: string;
  title: string;
  electionId: string;
  constituencyId: string | null;
}

export async function resolveSurveyInScope(
  surveyId: string,
  electionId: string,
  constituencyId: string
): Promise<SurveyScope | null> {
  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
    select: { id: true, title: true, electionId: true, constituencyId: true },
  });
  if (!survey) return null;
  if (survey.electionId !== electionId || survey.constituencyId !== constituencyId) return null;
  return survey;
}

// ---------------------------------------------------------------------------
// Core aggregation primitives
// ---------------------------------------------------------------------------

async function eligibleResponseCount(surveyId: string): Promise<number> {
  return prisma.surveyResponse.count({ where: { surveyId, status: ELIGIBLE_RESPONSE_STATUS } });
}

// Builds one bucket, applying per-bucket suppression: a count below the
// threshold is never included, even inside an otherwise-unsuppressed
// distribution/breakdown.
function buildBucket(
  opt: { key: string; label: string; partyId?: string | null; candidateRef?: string | null; party?: { colorHex: string } | null },
  count: number,
  total: number,
  minRequired: number
): Bucket {
  if (isSuppressed(count, minRequired)) return { key: opt.key, label: opt.label, suppressed: true };
  return {
    key: opt.key,
    label: opt.label,
    suppressed: false,
    count,
    pct: roundPct(count, total),
    colorHex: opt.party?.colorHex,
    partyId: opt.partyId ?? undefined,
    candidateId: opt.candidateRef ?? undefined,
  };
}

// Single-question distribution. Uses a DB-side groupBy (one query) instead
// of loading raw answer rows into memory — this is the shape that scales to
// large surveys per the performance requirement.
export async function getQuestionDistribution(surveyId: string, questionKey: string): Promise<Distribution | null> {
  const question = await prisma.surveyQuestion.findFirst({
    where: { surveyId, key: questionKey },
    include: { options: { include: { party: true } } },
  });
  if (!question) return null;

  const minRequired = await getMinCellSize();

  const grouped = await prisma.surveyAnswer.groupBy({
    by: ["optionId"],
    where: { questionId: question.id, optionId: { not: null }, response: { surveyId, status: ELIGIBLE_RESPONSE_STATUS } },
    _count: { _all: true },
  });
  const countsByOption = new Map(grouped.map((g) => [g.optionId as string, g._count._all]));
  const total = grouped.reduce((sum, g) => sum + g._count._all, 0);
  const suppressed = isSuppressed(total, minRequired);

  const buckets: Bucket[] = suppressed
    ? []
    : question.options
        .filter((o) => (countsByOption.get(o.id) ?? 0) > 0)
        .map((o) => buildBucket(o, countsByOption.get(o.id) ?? 0, total, minRequired))
        .sort((a, b) => {
          const ca = a.suppressed ? -1 : a.count;
          const cb = b.suppressed ? -1 : b.count;
          return cb - ca;
        });

  return { questionKey, label: question.label, total, suppressed, minRequired, buckets };
}

// Cross-tab: `dimension` groups respondents (e.g. by gender), and within
// each group we tally their `target` answer (candidate_choice or
// party_preference). Each group is suppressed independently. This mirrors
// the exact algorithm the public results page already uses for its (single,
// hard-coded) demographic breakdown — generalized here to the full
// allowlist and reused rather than re-invented in a different shape.
export async function getCrossTab(
  surveyId: string,
  dimension: CrossableDimension,
  target: PreferenceTarget
): Promise<CrossTab | null> {
  const [dimensionQuestion, targetQuestion] = await Promise.all([
    prisma.surveyQuestion.findFirst({ where: { surveyId, key: dimension }, include: { options: true } }),
    prisma.surveyQuestion.findFirst({ where: { surveyId, key: target }, include: { options: { include: { party: true } } } }),
  ]);
  if (!dimensionQuestion || !targetQuestion) return null;

  const minRequired = await getMinCellSize();

  // response -> dimension group. A response with no answer to the
  // dimension question (skipped) is simply absent from this map — missing
  // is never coerced into a default category.
  const dimensionAnswers = await prisma.surveyAnswer.findMany({
    where: { questionId: dimensionQuestion.id, optionId: { not: null }, response: { surveyId, status: ELIGIBLE_RESPONSE_STATUS } },
    select: { responseId: true, option: { select: { key: true, label: true } } },
  });
  const responseToGroup = new Map<string, { key: string; label: string }>();
  for (const a of dimensionAnswers) {
    if (a.option) responseToGroup.set(a.responseId, { key: a.option.key, label: a.option.label });
  }

  const targetAnswers = await prisma.surveyAnswer.findMany({
    where: { questionId: targetQuestion.id, optionId: { not: null }, response: { surveyId, status: ELIGIBLE_RESPONSE_STATUS } },
    select: { responseId: true, optionId: true },
  });
  const optionMeta = new Map(targetQuestion.options.map((o) => [o.id, o]));

  const groupTally = new Map<string, { label: string; total: number; counts: Map<string, number> }>();
  for (const ta of targetAnswers) {
    const group = responseToGroup.get(ta.responseId);
    if (!group || !ta.optionId) continue;
    if (!groupTally.has(group.key)) groupTally.set(group.key, { label: group.label, total: 0, counts: new Map() });
    const g = groupTally.get(group.key)!;
    g.total += 1;
    g.counts.set(ta.optionId, (g.counts.get(ta.optionId) ?? 0) + 1);
  }

  const groups: CrossTabGroup[] = Array.from(groupTally.entries()).map(([groupKey, g]) => {
    const suppressed = isSuppressed(g.total, minRequired);
    const breakdown: Bucket[] = suppressed
      ? []
      : Array.from(g.counts.entries())
          .map(([optionId, count]) => {
            const opt = optionMeta.get(optionId);
            return buildBucket(opt ?? { key: optionId, label: "?" }, count, g.total, minRequired);
          })
          .sort((a, b) => {
            const ca = a.suppressed ? -1 : a.count;
            const cb = b.suppressed ? -1 : b.count;
            return cb - ca;
          });
    return { groupKey, groupLabel: g.label, total: g.total, suppressed, minRequired, breakdown };
  });
  groups.sort((a, b) => b.total - a.total);

  return { dimension, target, groups };
}

// ---------------------------------------------------------------------------
// Full survey analytics payload — the one function the API route calls.
// ---------------------------------------------------------------------------

export interface SurveyAnalytics {
  survey: { id: string; title: string; electionId: string; constituencyId: string | null };
  summary: { totalEligibleResponses: number; minCellSize: number };
  partyPreference: Distribution | null;
  candidatePreference: Distribution | null;
  demographics: {
    gender: Distribution | null;
    ageGroup: Distribution | null;
    socialCategory: Distribution | null;
    religion: Distribution | null;
  };
  issues: Distribution | null;
  mlaPerformance: Distribution | null;
  reelection: Distribution | null;
  crossTabs: {
    genderByParty: CrossTab | null;
    ageGroupByParty: CrossTab | null;
    socialCategoryByParty: CrossTab | null;
    religionByParty: CrossTab | null;
    issueByParty: CrossTab | null;
  };
}

export async function getSurveyAnalytics(scope: SurveyScope): Promise<SurveyAnalytics> {
  const surveyId = scope.id;

  const [
    totalEligibleResponses,
    minCellSize,
    partyPreference,
    candidatePreference,
    gender,
    ageGroup,
    socialCategory,
    religion,
    issues,
    mlaPerformance,
    reelection,
    genderByParty,
    ageGroupByParty,
    socialCategoryByParty,
    religionByParty,
    issueByParty,
  ] = await Promise.all([
    eligibleResponseCount(surveyId),
    getMinCellSize(),
    getQuestionDistribution(surveyId, "party_preference"),
    getQuestionDistribution(surveyId, "candidate_choice"),
    getQuestionDistribution(surveyId, "gender"),
    getQuestionDistribution(surveyId, "age_group"),
    getQuestionDistribution(surveyId, "social_category"),
    getQuestionDistribution(surveyId, "religion"),
    getQuestionDistribution(surveyId, "top_issue"),
    getQuestionDistribution(surveyId, "mla_performance"),
    getQuestionDistribution(surveyId, "reelection_preference"),
    getCrossTab(surveyId, "gender", "party_preference"),
    getCrossTab(surveyId, "age_group", "party_preference"),
    getCrossTab(surveyId, "social_category", "party_preference"),
    getCrossTab(surveyId, "religion", "party_preference"),
    getCrossTab(surveyId, "top_issue", "party_preference"),
  ]);

  return {
    survey: { id: scope.id, title: scope.title, electionId: scope.electionId, constituencyId: scope.constituencyId },
    summary: { totalEligibleResponses, minCellSize },
    partyPreference,
    candidatePreference,
    demographics: { gender, ageGroup, socialCategory, religion },
    issues,
    mlaPerformance,
    reelection,
    crossTabs: { genderByParty, ageGroupByParty, socialCategoryByParty, religionByParty, issueByParty },
  };
}
