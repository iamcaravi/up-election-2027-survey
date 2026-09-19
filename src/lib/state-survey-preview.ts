import "server-only";

import { prisma } from "@/lib/prisma";
import { getPublicStatewideResults } from "@/lib/public-statewide-results";
import { displayStateName } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/LocaleProvider";

export interface StatePreviewPartyStat {
  label: string;
  nameHindi: string | null;
  percentage: number;
  count: number;
  colorHex: string | null;
}

export interface StateSurveyPreviewData {
  stateSlug: string;
  stateNameEnglish: string;
  stateNameLocalized: string;
  totalResponses: number;
  hasSufficientData: boolean;
  partyDistribution: StatePreviewPartyStat[];
}

/**
 * Resolves aggregate public survey statistics for a state's current active election.
 * Directly reuses getPublicStatewideResults so definitions for total responses,
 * eligible responses, party preference, and privacy protections match the public analytics.
 */
export async function getStateSurveyPreviewData(
  stateSlug: string,
  locale: Locale = "hi"
): Promise<StateSurveyPreviewData | null> {
  const state = await prisma.state.findUnique({
    where: { slug: stateSlug },
    include: {
      elections: {
        where: { isActive: true },
        orderBy: { year: "desc" },
        take: 1,
      },
    },
  });

  if (!state) return null;

  const activeElection = state.elections[0] ?? null;
  const stateNameLocalized = displayStateName(state.name, state.slug, locale);

  if (!activeElection) {
    return {
      stateSlug: state.slug,
      stateNameEnglish: state.name,
      stateNameLocalized,
      totalResponses: 0,
      hasSufficientData: false,
      partyDistribution: [],
    };
  }

  const statewideResults = await getPublicStatewideResults(activeElection.id);

  if (!statewideResults || !statewideResults.sample.resultsAvailable || statewideResults.partyPreference.state !== "available") {
    return {
      stateSlug: state.slug,
      stateNameEnglish: state.name,
      stateNameLocalized,
      totalResponses: statewideResults?.sample.validResponseCount ?? 0,
      hasSufficientData: false,
      partyDistribution: [],
    };
  }

  const partyDistribution: StatePreviewPartyStat[] = [];
  for (const bucket of statewideResults.partyPreference.buckets) {
    if (bucket.state === "available") {
      partyDistribution.push({
        label: bucket.label,
        nameHindi: bucket.nameHindi ?? null,
        percentage: bucket.percentage,
        count: bucket.count,
        colorHex: bucket.colorHex ?? null,
      });
    }
  }

  return {
    stateSlug: state.slug,
    stateNameEnglish: state.name,
    stateNameLocalized,
    totalResponses: statewideResults.sample.validResponseCount,
    hasSufficientData: partyDistribution.length > 0,
    partyDistribution,
  };
}
