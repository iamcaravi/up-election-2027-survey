import "server-only";

import { prisma } from "./prisma";
import { ELIGIBLE_RESPONSE_STATUS } from "./enums";
import { protectPublicCells, type PublicDistribution } from "./public-analytics-core";

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
  sample: { validResponseCount: number; resultsAvailable: boolean; minCellSize: number };
  partyPreference: PublicDistribution;
  demographics: Record<StatewideDemographicKey, PublicDistribution>;
}

export async function getPublicStatewideResults(electionId: string): Promise<PublicStatewideResultsDto | null> {
  const election = await prisma.election.findUnique({ where: { id: electionId }, include: { state: true } });
  if (!election) return null;

  // Same as public-survey-results.ts: statewide results show from the first
  // valid response, with no minimum-sample-size gate.
  const minRequired = 1;

  const [validResponseCount, partyAnswers, demographicAnswers] = await Promise.all([
    prisma.surveyResponse.count({
      where: { status: ELIGIBLE_RESPONSE_STATUS, survey: { electionId } },
    }),
    prisma.surveyAnswer.findMany({
      where: {
        response: { status: ELIGIBLE_RESPONSE_STATUS, survey: { electionId } },
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
            party: { select: { name: true, shortName: true, colorHex: true, displayOrder: true, isActive: true } },
          },
        },
      },
    }),
    prisma.surveyAnswer.findMany({
      where: {
        response: { status: ELIGIBLE_RESPONSE_STATUS, survey: { electionId } },
        question: { key: { in: [...STATEWIDE_DEMOGRAPHIC_KEYS] } },
        optionId: { not: null },
      },
      select: {
        question: { select: { key: true } },
        option: { select: { key: true, label: true, order: true } },
      },
    }),
  ]);

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

  return {
    election: { name: election.name, slug: election.slug, year: election.year },
    state: { name: election.state.name, slug: election.state.slug },
    sample: {
      validResponseCount,
      resultsAvailable: validResponseCount > 0,
      minCellSize: minRequired,
    },
    partyPreference,
    demographics,
  };
}

interface PartyAnswerRow {
  option: {
    key: string;
    label: string;
    order: number;
    partyId: string | null;
    party: { name: string; shortName: string; colorHex: string; displayOrder: number; isActive: boolean } | null;
  } | null;
}

function buildPartyDistribution(rows: PartyAnswerRow[], minRequired: number): PublicDistribution {
  if (rows.length === 0) return { state: "unavailable", reason: "no_responses", minRequired };

  const counts = new Map<string, { label: string; colorHex: string | null; displayOrder: number; partyId: string | null; count: number }>();
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
        label: option.party?.name ?? option.label,
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
