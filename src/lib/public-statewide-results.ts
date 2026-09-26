import "server-only";

import { prisma } from "./prisma";
import { getSiteSetting } from "./data";
import { ELIGIBLE_RESPONSE_STATUS, MLA_SATISFACTION_OPTIONS } from "./enums";
import { protectPublicCells, type PublicDistribution } from "./public-analytics-core";
import { REAL_DATA_SOURCE, SYNTHETIC_DATA_MODE_KEY, SYNTHETIC_DATA_SOURCE } from "./synthetic-data";

// A statewide (Uttar-Pradesh-wide) view of survey sentiment: the same
// party-preference + demographic distributions as a single constituency's
// results (public-survey-results.ts), but pooled across every constituency
// survey belonging to one election. There is no per-constituency candidate
// breakdown here — candidates are constituency-scoped and don't aggregate
// meaningfully at state level.
const STATEWIDE_DEMOGRAPHIC_KEYS = ["gender", "age_group", "religion", "top_issue"] as const;
type StatewideDemographicKey = (typeof STATEWIDE_DEMOGRAPHIC_KEYS)[number];

export interface PublicStatewideResultsDto {
  election: { name: string; slug: string; year: number };
  state: { name: string; slug: string };
  /** Present only when this DTO was scoped to one district (see the
   *  `district` param of getPublicStatewideResults) — every count/
   *  distribution below is then pooled across just that district's
   *  constituencies instead of the whole state. */
  district: { id: string; name: string; slug: string } | null;
  sample: {
    validResponseCount: number;
    resultsAvailable: boolean;
    minCellSize: number;
    /** Valid responses recorded in the last 7 days. */
    newResponsesLast7Days: number;
    /** Valid responses recorded in the 7 days before that — used only for the week-over-week delta. */
    newResponsesPrior7Days: number;
    /** ISO timestamp of the most recent valid response across the state. Null when there are none. */
    lastResponseAt: string | null;
  };
  /** Total constituencies belonging to this state (real count, not an estimate). */
  totalConstituencies: number;
  /** Distinct constituencies with at least one valid response so far. */
  respondingConstituencyCount: number;
  /** True when Demo Data Mode is on and this DTO is built from synthetic_demo rows rather than real responses. */
  isSynthetic: boolean;
  partyPreference: PublicDistribution;
  demographics: Record<StatewideDemographicKey, PublicDistribution>;
  mlaSatisfaction: PublicDistribution;
}

const statewideCache = new Map<string, { data: PublicStatewideResultsDto; expiresAt: number }>();

export async function getPublicStatewideResults(
  electionId: string,
  district?: { id: string; name: string; slug: string }
): Promise<PublicStatewideResultsDto | null> {
  const cacheKey = `${electionId}:${district?.id ?? "all"}`;
  const nowMs = Date.now();
  const cached = statewideCache.get(cacheKey);
  if (cached && nowMs < cached.expiresAt) {
    return cached.data;
  }

  const election = await prisma.election.findUnique({ where: { id: electionId }, include: { state: true } });
  if (!election) return null;

  // Same as public-survey-results.ts: statewide (or district-scoped) results
  // show from the first valid response, with no minimum-sample-size gate.
  const minRequired = 1;
  const isSynthetic = await getSiteSetting<boolean>(SYNTHETIC_DATA_MODE_KEY, false);
  const activeDataSource = isSynthetic ? SYNTHETIC_DATA_SOURCE : REAL_DATA_SOURCE;
  // When `district` is passed, every query below narrows from "every
  // constituency in the state" to "every constituency in that one district" —
  // the same aggregation logic, just pooled over a smaller constituency set.
  const constituencyScope = district ? { districtId: district.id } : undefined;

  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const oneWeekAgo = new Date(nowMs - oneWeekMs);
  const twoWeeksAgo = new Date(nowMs - 2 * oneWeekMs);

  const responseWhere = {
    status: ELIGIBLE_RESPONSE_STATUS,
    dataSource: activeDataSource,
    survey: { electionId },
    constituency: constituencyScope,
  };

  const [
    responseAgg,
    countLast7Days,
    countPrior7Days,
    partyAnswers,
    demographicAnswers,
    mlaSatisfactionAnswers,
    totalConstituencies,
    respondingSurveys,
  ] = await Promise.all([
    prisma.surveyResponse.aggregate({
      where: responseWhere,
      _count: { _all: true },
      _max: { createdAt: true },
    }),
    prisma.surveyResponse.count({
      where: { ...responseWhere, createdAt: { gte: oneWeekAgo } },
    }),
    prisma.surveyResponse.count({
      where: { ...responseWhere, createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo } },
    }),
    prisma.surveyAnswer.findMany({
      where: {
        response: {
          status: ELIGIBLE_RESPONSE_STATUS,
          dataSource: activeDataSource,
          survey: { electionId },
          constituency: constituencyScope,
        },
        question: { key: "party_preference" },
        optionId: { not: null },
      },
      select: {
        option: {
          select: {
            key: true,
            label: true,
            order: true,
            partyId: true,
            party: { select: { nameEnglish: true, nameHindi: true, shortName: true, colorHex: true, logoUrl: true, displayOrder: true, isActive: true } },
          },
        },
      },
    }),
    prisma.surveyAnswer.findMany({
      where: {
        response: {
          status: ELIGIBLE_RESPONSE_STATUS,
          dataSource: activeDataSource,
          survey: { electionId },
          constituency: constituencyScope,
        },
        question: { key: { in: [...STATEWIDE_DEMOGRAPHIC_KEYS] } },
        optionId: { not: null },
      },
      select: {
        question: { select: { key: true } },
        option: { select: { key: true, label: true, order: true } },
      },
    }),
    prisma.surveyAnswer.findMany({
      where: {
        response: {
          status: ELIGIBLE_RESPONSE_STATUS,
          dataSource: activeDataSource,
          survey: { electionId },
          constituency: constituencyScope,
        },
        question: { key: "mla_satisfaction" },
        optionId: { not: null },
      },
      select: {
        option: { select: { key: true, label: true, order: true } },
      },
    }),
    prisma.constituency.count({ where: { stateId: election.stateId, ...constituencyScope } }),
    prisma.survey.findMany({
      where: {
        electionId,
        responses: { some: { status: ELIGIBLE_RESPONSE_STATUS, dataSource: activeDataSource } },
        constituency: constituencyScope,
      },
      select: { constituencyId: true },
      distinct: ["constituencyId"],
    }),
  ]);

  const validResponseCount = responseAgg._count._all;
  const lastResponseAt = responseAgg._max.createdAt;
  const newResponsesLast7Days = countLast7Days;
  const newResponsesPrior7Days = countPrior7Days;

  const partyPreference = buildPartyDistribution(partyAnswers, minRequired);

  const demographics = Object.fromEntries(
    STATEWIDE_DEMOGRAPHIC_KEYS.map((key) => [
      key,
      buildDemographicDistribution(
        demographicAnswers.filter((a) => a.question.key === key),
        minRequired
      ),
    ])
  ) as Record<StatewideDemographicKey, PublicDistribution>;

  const mlaSatisfaction = buildMlaSatisfactionDistribution(mlaSatisfactionAnswers, minRequired);

  const result: PublicStatewideResultsDto = {
    election: { name: election.name, slug: election.slug, year: election.year },
    state: { name: election.state.name, slug: election.state.slug },
    district: district ?? null,
    sample: {
      validResponseCount,
      resultsAvailable: validResponseCount > 0,
      minCellSize: minRequired,
      newResponsesLast7Days,
      newResponsesPrior7Days,
      lastResponseAt: lastResponseAt ? lastResponseAt.toISOString() : null,
    },
    totalConstituencies,
    respondingConstituencyCount: respondingSurveys.length,
    isSynthetic,
    partyPreference,
    demographics,
    mlaSatisfaction,
  };

  statewideCache.set(cacheKey, { data: result, expiresAt: nowMs + 60_000 });
  return result;
}

interface PartyAnswerRow {
  option: {
    key: string;
    label: string;
    order: number;
    partyId: string | null;
    party: { nameEnglish: string; nameHindi: string | null; shortName: string; colorHex: string; logoUrl: string | null; displayOrder: number; isActive: boolean } | null;
  } | null;
}

function buildPartyDistribution(rows: PartyAnswerRow[], minRequired: number): PublicDistribution {
  if (rows.length === 0) return { state: "unavailable", reason: "no_responses", minRequired };

  const counts = new Map<string, { label: string; nameHindi: string | null; logoUrl: string | null; colorHex: string | null; displayOrder: number; partyId: string | null; count: number }>();
  for (const row of rows) {
    const option = row.option;
    if (!option) continue;
    // Group by party identity when linked to a real Party row (active only);
    // special options (other/undecided) group by their own key instead.
    if (option.partyId && !option.party?.isActive) continue;
    const groupKey = option.partyId ?? option.key;
    const existing = counts.get(groupKey);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(groupKey, {
        label: option.party?.nameEnglish ?? option.label,
        nameHindi: option.party?.nameHindi ?? null,
        logoUrl: option.party?.logoUrl ?? null,
        colorHex: option.party?.colorHex ?? null,
        displayOrder: option.party?.displayOrder ?? option.order,
        partyId: option.partyId,
        count: 1,
      });
    }
  }

  const cells = Array.from(counts.entries())
    .map(([key, value]) => ({
      key,
      label: value.label,
      nameHindi: value.nameHindi,
      logoUrl: value.logoUrl,
      colorHex: value.colorHex,
      partyId: value.partyId,
      displayOrder: value.displayOrder,
      count: value.count,
    }))
    .sort((a, b) => b.count - a.count);

  const denominator = cells.reduce((sum, cell) => sum + cell.count, 0);
  if (denominator === 0) return { state: "unavailable", reason: "no_answers", minRequired };
  if (denominator < minRequired) return { state: "suppressed", minRequired };

  return {
    state: "available",
    denominator,
    minRequired,
    buckets: protectPublicCells(cells, denominator, minRequired),
  };
}

interface DemographicAnswerRow {
  option: { key: string; label: string; order: number } | null;
}

function buildDemographicDistribution(rows: DemographicAnswerRow[], minRequired: number): PublicDistribution {
  if (rows.length === 0) return { state: "unavailable", reason: "no_responses", minRequired };

  const counts = new Map<string, { label: string; order: number; count: number }>();
  for (const row of rows) {
    const option = row.option;
    if (!option) continue;
    const existing = counts.get(option.key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(option.key, { label: option.label, order: option.order, count: 1 });
    }
  }

  const cells = Array.from(counts.entries()).map(([key, value]) => ({
    key,
    label: value.label,
    displayOrder: value.order,
    count: value.count,
  }));

  const denominator = cells.reduce((sum, cell) => sum + cell.count, 0);
  if (denominator === 0) return { state: "unavailable", reason: "no_answers", minRequired };
  if (denominator < minRequired) return { state: "suppressed", minRequired };

  return {
    state: "available",
    denominator,
    minRequired,
    buckets: protectPublicCells(cells, denominator, minRequired),
  };
}

interface MlaSatisfactionAnswerRow {
  option: { key: string; label: string; order: number } | null;
}

function buildMlaSatisfactionDistribution(rows: MlaSatisfactionAnswerRow[], minRequired: number): PublicDistribution {
  if (rows.length === 0) return { state: "unavailable", reason: "no_responses", minRequired };

  const counts = new Map<string, number>();
  for (const row of rows) {
    if (!row.option) continue;
    counts.set(row.option.key, (counts.get(row.option.key) ?? 0) + 1);
  }

  const cells = MLA_SATISFACTION_OPTIONS.map((opt, index) => ({
    key: opt.key,
    label: opt.label,
    colorHex: opt.colorHex,
    displayOrder: index + 1,
    count: counts.get(opt.key) ?? 0,
  }));

  const denominator = cells.reduce((sum, cell) => sum + cell.count, 0);
  if (denominator === 0) return { state: "unavailable", reason: "no_answers", minRequired };
  if (denominator < minRequired) return { state: "suppressed", minRequired };

  return {
    state: "available",
    denominator,
    minRequired,
    buckets: protectPublicCells(cells, denominator, minRequired),
  };
}

