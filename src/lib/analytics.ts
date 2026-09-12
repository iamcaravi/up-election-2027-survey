import "server-only";
import { prisma } from "./prisma";
import { getMinCellSize } from "./analytics-privacy";

export interface OptionTally {
  key: string;
  label: string;
  count: number;
  pct: number;
  colorHex?: string;
  candidateId?: string;
  partyId?: string;
}

export interface QuestionResult {
  questionKey: string;
  label: string;
  total: number;
  sufficientSample: boolean;
  minRequired: number;
  options: OptionTally[];
}

// Re-exported thin wrapper — analytics-privacy.ts is now the single source
// of truth for the suppression threshold; kept as a local name so the rest
// of this file (unchanged) doesn't need touching.
const getMinGroupSize = getMinCellSize;

async function tallyQuestion(surveyId: string, questionKey: string): Promise<QuestionResult | null> {
  const question = await prisma.surveyQuestion.findFirst({
    where: { surveyId, key: questionKey },
    include: { options: { include: { party: true } } },
  });
  if (!question) return null;

  const minRequired = await getMinGroupSize();

  const answers = await prisma.surveyAnswer.findMany({
    where: {
      questionId: question.id,
      optionId: { not: null },
      response: { status: "VALID" },
    },
    select: { optionId: true },
  });

  const counts = new Map<string, number>();
  for (const a of answers) {
    if (!a.optionId) continue;
    counts.set(a.optionId, (counts.get(a.optionId) ?? 0) + 1);
  }
  const total = answers.length;

  const options: OptionTally[] = question.options
    .filter((o) => o.key !== "prefer_not_to_say")
    .map((o) => {
      const count = counts.get(o.id) ?? 0;
      return {
        key: o.key,
        label: o.label,
        count,
        pct: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
        colorHex: o.party?.colorHex,
        partyId: o.partyId ?? undefined,
        candidateId: o.candidateRef ?? undefined,
      };
    })
    .sort((a, b) => b.count - a.count);

  return {
    questionKey,
    label: question.label,
    total,
    sufficientSample: total >= minRequired,
    minRequired,
    options,
  };
}

// electionId is required scoping: a constituency can in principle have more
// than one active survey across different elections (e.g. an Assembly and a
// Lok Sabha election both active at once), and results must never mix them.
export async function getConstituencyResults(constituencyId: string, electionId: string) {
  const survey = await prisma.survey.findFirst({ where: { constituencyId, electionId, isActive: true } });
  if (!survey) return null;

  const [candidateResult, partyResult, issueResult] = await Promise.all([
    tallyQuestion(survey.id, "candidate_choice"),
    tallyQuestion(survey.id, "party_preference"),
    tallyQuestion(survey.id, "top_issue"),
  ]);

  const latestResponse = await prisma.surveyResponse.findFirst({
    where: { surveyId: survey.id, status: "VALID" },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  return {
    surveyId: survey.id,
    candidateResult,
    partyResult,
    issueResult,
    lastUpdated: latestResponse?.createdAt ?? null,
  };
}

const DEMOGRAPHIC_DIMENSIONS = ["age_group", "gender", "social_category", "religion"] as const;
export type DemographicDimension = (typeof DEMOGRAPHIC_DIMENSIONS)[number];

export interface DemographicBreakdown {
  dimension: DemographicDimension;
  groups: Array<{
    groupKey: string;
    groupLabel: string;
    total: number;
    sufficientSample: boolean;
    minRequired: number;
    candidateOptions: OptionTally[];
    partyOptions: OptionTally[];
  }>;
}

// electionId is required scoping — without it this aggregates "top issue"
// answers across every election in every state, which is never the intended
// meaning of "statewide" despite the function's name (kept for the one
// election it was originally written against; a true multi-election
// statewide rollup would need to aggregate per-election explicitly).
export async function getStatewideTopIssues(electionId: string, limit = 6) {
  const minRequired = await getMinGroupSize();
  const answers = await prisma.surveyAnswer.findMany({
    where: {
      question: { key: "top_issue" },
      optionId: { not: null },
      response: { status: "VALID", survey: { electionId } },
    },
    select: { option: { select: { key: true, label: true } } },
  });
  const counts = new Map<string, { label: string; count: number }>();
  for (const a of answers) {
    if (!a.option || a.option.key === "other") continue;
    const cur = counts.get(a.option.key) ?? { label: a.option.label, count: 0 };
    cur.count += 1;
    counts.set(a.option.key, cur);
  }
  const total = answers.length;
  const sorted = Array.from(counts.entries())
    .map(([key, v]) => ({ key, label: v.label, count: v.count, pct: total ? Math.round((v.count / total) * 1000) / 10 : 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
  return { total, sufficientSample: total >= minRequired, minRequired, issues: sorted };
}

// Cross-state variant of getStatewideTopIssues: aggregates "top_issue"
// answers across every currently-active election rather than one. Used only
// by the homepage's "चुनावी मुद्दे" section, which has no single election to
// scope to. Kept as a separate function rather than changing the existing
// one's signature/behavior, since other callers depend on the single-election
// version exactly as it is.
export async function getTopIssuesOverall(limit = 6) {
  const minRequired = await getMinGroupSize();
  const answers = await prisma.surveyAnswer.findMany({
    where: {
      question: { key: "top_issue" },
      optionId: { not: null },
      response: { status: "VALID", survey: { election: { isActive: true } } },
    },
    select: { option: { select: { key: true, label: true } } },
  });
  const counts = new Map<string, { label: string; count: number }>();
  for (const a of answers) {
    if (!a.option || a.option.key === "other") continue;
    const cur = counts.get(a.option.key) ?? { label: a.option.label, count: 0 };
    cur.count += 1;
    counts.set(a.option.key, cur);
  }
  const total = answers.length;
  const sorted = Array.from(counts.entries())
    .map(([key, v]) => ({ key, label: v.label, count: v.count, pct: total ? Math.round((v.count / total) * 1000) / 10 : 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
  return { total, sufficientSample: total >= minRequired, minRequired, issues: sorted };
}

// Maps each homepage "मुद्दे जो मायने रखते हैं" card (src/components/home/
// IssuesSection.tsx) to the real Q2 top_issue option key(s) (src/lib/enums.ts
// DEFAULT_ISSUES) it aggregates. The two taxonomies are intentionally
// different — the homepage shows a small set of broad editorial categories,
// Q2 asks a longer specific list — so this mapping (not label-text matching)
// is the one place they're reconciled. `null` means there is no Q2 option
// this homepage card can honestly be backed by; that card shows a
// "no data source" state rather than a fabricated number. "mahangai" and
// "other" have no homepage card at all — their responses are still counted
// in the shared total, just not surfaced under any single card.
const HOMEPAGE_ISSUE_SOURCE_MAP: Record<string, string[] | null> = {
  rojgar: ["rojgar"],
  shiksha: ["shiksha"],
  kisan: ["krishi"],
  swasthya: ["swasthya"],
  infra: ["sadak", "bijli", "pani", "parivahan", "jal_nikasi"],
  kanoon: ["kanoon_vyavastha"],
  vikas: null,
  samajik_nyay: null,
};

export interface HomepageIssueStats {
  // Every valid Q2 (top_issue) answer across all active elections/surveys —
  // the shared denominator for every card's percentage.
  total: number;
  // One entry per HOMEPAGE_ISSUE_SOURCE_MAP key. `null` = no live Q2 source
  // (vikas/samajik_nyay) — render as "no data source", never a number.
  percentages: Record<string, number | null>;
}

export async function getHomepageIssueStats(): Promise<HomepageIssueStats> {
  // Each constituency's survey has its own SurveyOption rows for "top_issue"
  // (same `key` string, different row per survey), so there is no single
  // optionId to group by across surveys — a lean per-answer select of just
  // the option's stable key (not the full response/answer record) is the
  // correct aggregation here, matching the existing getTopIssuesOverall
  // pattern above.
  const answers = await prisma.surveyAnswer.findMany({
    where: {
      question: { key: "top_issue" },
      optionId: { not: null },
      response: { status: "VALID", survey: { election: { isActive: true } } },
    },
    select: { option: { select: { key: true } } },
  });

  const counts = new Map<string, number>();
  for (const answer of answers) {
    if (!answer.option) continue;
    counts.set(answer.option.key, (counts.get(answer.option.key) ?? 0) + 1);
  }
  const total = answers.length;

  const percentages: Record<string, number | null> = {};
  for (const [cardKey, sourceKeys] of Object.entries(HOMEPAGE_ISSUE_SOURCE_MAP)) {
    if (!sourceKeys || total === 0) {
      percentages[cardKey] = null;
      continue;
    }
    const sum = sourceKeys.reduce((acc, key) => acc + (counts.get(key) ?? 0), 0);
    percentages[cardKey] = (sum / total) * 100;
  }

  return { total, percentages };
}

export async function getConstituencyDemographicBreakdown(
  constituencyId: string,
  electionId: string,
  dimension: DemographicDimension,
  target: "candidate_choice" | "party_preference" = "candidate_choice"
): Promise<DemographicBreakdown | null> {
  const survey = await prisma.survey.findFirst({ where: { constituencyId, electionId, isActive: true } });
  if (!survey) return null;

  const minRequired = await getMinGroupSize();

  const dimensionQuestion = await prisma.surveyQuestion.findFirst({
    where: { surveyId: survey.id, key: dimension },
    include: { options: true },
  });
  const targetQuestion = await prisma.surveyQuestion.findFirst({
    where: { surveyId: survey.id, key: target },
    include: { options: { include: { party: true } } },
  });
  if (!dimensionQuestion || !targetQuestion) return null;

  // response -> selected dimension option key
  const dimensionAnswers = await prisma.surveyAnswer.findMany({
    where: {
      questionId: dimensionQuestion.id,
      optionId: { not: null },
      response: { status: "VALID" },
    },
    select: { responseId: true, optionId: true, option: { select: { key: true, label: true } } },
  });
  const responseToGroup = new Map<string, { key: string; label: string }>();
  for (const a of dimensionAnswers) {
    if (a.option && a.option.key !== "prefer_not_to_say") {
      responseToGroup.set(a.responseId, { key: a.option.key, label: a.option.label });
    }
  }

  const targetAnswers = await prisma.surveyAnswer.findMany({
    where: {
      questionId: targetQuestion.id,
      optionId: { not: null },
      response: { status: "VALID" },
    },
    select: { responseId: true, optionId: true },
  });

  const optionMeta = new Map(targetQuestion.options.map((o) => [o.id, o]));

  const groupTally = new Map<string, { label: string; total: number; counts: Map<string, number> }>();
  for (const ta of targetAnswers) {
    const group = responseToGroup.get(ta.responseId);
    if (!group || !ta.optionId) continue;
    if (!groupTally.has(group.key)) {
      groupTally.set(group.key, { label: group.label, total: 0, counts: new Map() });
    }
    const g = groupTally.get(group.key)!;
    g.total += 1;
    g.counts.set(ta.optionId, (g.counts.get(ta.optionId) ?? 0) + 1);
  }

  const groups = Array.from(groupTally.entries()).map(([groupKey, g]) => {
    const options: OptionTally[] = Array.from(g.counts.entries())
      .map(([optionId, count]) => {
        const opt = optionMeta.get(optionId);
        return {
          key: opt?.key ?? optionId,
          label: opt?.label ?? "?",
          count,
          pct: g.total > 0 ? Math.round((count / g.total) * 1000) / 10 : 0,
          colorHex: opt?.party?.colorHex,
          partyId: opt?.partyId ?? undefined,
        };
      })
      .sort((a, b) => b.count - a.count);

    return {
      groupKey,
      groupLabel: g.label,
      total: g.total,
      sufficientSample: g.total >= minRequired,
      minRequired,
      candidateOptions: target === "candidate_choice" ? options : [],
      partyOptions: target === "party_preference" ? options : [],
    };
  });

  return { dimension, groups };
}
