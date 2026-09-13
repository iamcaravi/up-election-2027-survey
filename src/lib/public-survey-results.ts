import "server-only";

import { prisma } from "./prisma";
import { getSiteSetting } from "./data";
import { ELIGIBLE_RESPONSE_STATUS } from "./enums";
import {
  aggregatePublicAnalytics,
  evaluateResultsVisibility,
  type ElectionPeriodVisibility,
  type PublicAnalyticsResult,
  type PublicCandidateInput,
  type PublicCandidateOptionInput,
  type PublicDemographicCountInput,
  type PublicDemographicOptionInput,
  type PublicPartyOptionInput,
  type PublicPreferenceAnswerInput,
  type ResultsVisibility,
} from "./public-analytics-core";
import { REAL_DATA_SOURCE, SYNTHETIC_DATA_MODE_KEY, SYNTHETIC_DATA_SOURCE } from "./synthetic-data";

const PUBLIC_DEMOGRAPHIC_KEYS = ["gender", "age_group", "social_category", "religion", "top_issue"] as const;

export interface PublicSurveyResultsDto {
  survey: {
    id: string;
    title: string;
    status: string;
    startsAt: string | null;
    endsAt: string | null;
  };
  context: {
    state: { name: string; slug: string };
    election: { name: string; slug: string; year: number };
    district: { name: string; slug: string };
    constituency: { name: string; slug: string };
  };
  visibility: ResultsVisibility;
  sample: {
    validResponseCount: number | null;
    resultsAvailable: boolean;
    minCellSize: number;
    /** Valid responses recorded in the last 7 days. Null when results are hidden/unavailable. */
    newResponsesLast7Days: number | null;
    /** Valid responses recorded in the 7 days before that — used only to compute the week-over-week delta shown alongside newResponsesLast7Days. */
    newResponsesPrior7Days: number | null;
    /** ISO timestamp of the most recent valid response, for a "last updated" display. Null when there are none. */
    lastResponseAt: string | null;
  };
  /** True when Demo Data Mode is on and this DTO is built from synthetic_demo rows rather than real responses. */
  isSynthetic: boolean;
  analytics: PublicAnalyticsResult | null;
  methodology: {
    eligibleResponseStatus: typeof ELIGIBLE_RESPONSE_STATUS;
    partyDenominator: "valid_party_answers";
    candidateDenominator: "valid_selected_party_cohort";
    missingCandidateHandling: "excluded_not_reclassified";
    suppressionAppliedServerSide: true;
  };
}

export async function getPublicSurveyResults(
  electionId: string,
  constituencyId: string,
  surveyId?: string
): Promise<PublicSurveyResultsDto | null> {
  const survey = surveyId
    ? await prisma.survey.findUnique({
        where: { id: surveyId },
        include: publicSurveyInclude,
      })
    : await prisma.survey.findFirst({
        where: { electionId, constituencyId },
        orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
        include: publicSurveyInclude,
      });
  if (!survey || survey.electionId !== electionId || survey.constituencyId !== constituencyId || !survey.constituency) {
    return null;
  }

  // Results are shown from the very first valid response — there is no
  // minimum-sample-size gate on public results, so the "privacy cell" floor
  // is fixed at 1 (i.e. effectively disabled) rather than read from the
  // MIN_ANALYTICS_GROUP_SIZE site setting used elsewhere (e.g. premium
  // analytics). Response counting, storage and percentage calculation are
  // unaffected — every bucket's percentage is always computed from the real
  // current vote count.
  const minCellSize = 1;
  const [electionPeriodMode, isSynthetic] = await Promise.all([
    getSiteSetting<ElectionPeriodVisibility>("ELECTION_PERIOD_MODE", { restricted: false }),
    getSiteSetting<boolean>(SYNTHETIC_DATA_MODE_KEY, false),
  ]);
  const activeDataSource = isSynthetic ? SYNTHETIC_DATA_SOURCE : REAL_DATA_SOURCE;
  const visibility = evaluateResultsVisibility(survey, electionPeriodMode);
  const base = {
    survey: {
      id: survey.id,
      title: survey.title,
      status: survey.status,
      startsAt: survey.startsAt?.toISOString() ?? null,
      endsAt: survey.endsAt?.toISOString() ?? null,
    },
    context: {
      state: { name: survey.election.state.name, slug: survey.election.state.slug },
      election: { name: survey.election.name, slug: survey.election.slug, year: survey.election.year },
      district: { name: survey.constituency.district.name, slug: survey.constituency.district.slug },
      constituency: { name: survey.constituency.name, slug: survey.constituency.slug },
    },
    visibility,
    methodology: {
      eligibleResponseStatus: ELIGIBLE_RESPONSE_STATUS,
      partyDenominator: "valid_party_answers" as const,
      candidateDenominator: "valid_selected_party_cohort" as const,
      missingCandidateHandling: "excluded_not_reclassified" as const,
      suppressionAppliedServerSide: true as const,
    },
  };

  if (visibility.state === "hidden") {
    return {
      ...base,
      sample: {
        validResponseCount: null,
        resultsAvailable: false,
        minCellSize,
        newResponsesLast7Days: null,
        newResponsesPrior7Days: null,
        lastResponseAt: null,
      },
      isSynthetic,
      analytics: null,
    };
  }

  const questionByKey = new Map(survey.questions.map((question) => [question.key, question]));
  const partyQuestion = questionByKey.get("party_preference");
  const candidateQuestion = questionByKey.get("candidate_choice");
  if (!partyQuestion || !candidateQuestion) return null;

  const demographicQuestionIds = new Map(
    PUBLIC_DEMOGRAPHIC_KEYS.flatMap((key) => {
      const question = questionByKey.get(key);
      return question ? [[question.id, key] as const] : [];
    })
  );
  const candidateRefs = candidateQuestion.options.flatMap((option) => option.candidateRef ? [option.candidateRef] : []);

  const [responses, preferenceAnswers, candidates, groupedDemographics] = await Promise.all([
    prisma.surveyResponse.findMany({
      where: { surveyId: survey.id, status: ELIGIBLE_RESPONSE_STATUS, dataSource: activeDataSource },
      select: { id: true, status: true, createdAt: true },
    }),
    prisma.surveyAnswer.findMany({
      where: {
        response: { surveyId: survey.id, status: ELIGIBLE_RESPONSE_STATUS, dataSource: activeDataSource },
        question: { key: { in: ["party_preference", "candidate_choice"] } },
        optionId: { not: null },
      },
      select: { responseId: true, optionId: true, question: { select: { key: true } } },
    }),
    candidateRefs.length
      ? prisma.candidate.findMany({
          where: { id: { in: candidateRefs } },
          select: {
            id: true,
            name: true,
            nameHindi: true,
            electionId: true,
            constituencyId: true,
            partyId: true,
            status: true,
            isActive: true,
          },
        })
      : Promise.resolve([]),
    demographicQuestionIds.size
      ? prisma.surveyAnswer.groupBy({
          by: ["questionId", "optionId"],
          where: {
            questionId: { in: Array.from(demographicQuestionIds.keys()) },
            optionId: { not: null },
            response: { surveyId: survey.id, status: ELIGIBLE_RESPONSE_STATUS, dataSource: activeDataSource },
          },
          _count: { _all: true },
        })
      : Promise.resolve([]),
  ]);

  const partyOptions: PublicPartyOptionInput[] = partyQuestion.options.map((option) => ({
    id: option.id,
    key: option.key,
    label: option.label,
    order: option.order,
    isActive: option.isActive,
    partyId: option.partyId,
    party: option.party
      ? {
          id: option.party.id,
          nameEnglish: option.party.nameEnglish,
          nameHindi: option.party.nameHindi,
          shortName: option.party.shortName,
          colorHex: option.party.colorHex,
          logoUrl: option.party.logoUrl,
          displayOrder: option.party.displayOrder,
          isActive: option.party.isActive,
        }
      : null,
  }));
  const candidateOptions: PublicCandidateOptionInput[] = candidateQuestion.options.map((option) => ({
    id: option.id,
    key: option.key,
    label: option.label,
    order: option.order,
    isActive: option.isActive,
    partyId: option.partyId,
    candidateRef: option.candidateRef,
  }));
  const safePreferenceAnswers: PublicPreferenceAnswerInput[] = preferenceAnswers.flatMap((answer) => {
    if (!answer.optionId || (answer.question.key !== "party_preference" && answer.question.key !== "candidate_choice")) return [];
    return [{ responseId: answer.responseId, optionId: answer.optionId, questionKey: answer.question.key }];
  });
  const demographicCounts: PublicDemographicCountInput[] = groupedDemographics.flatMap((group) => {
    const questionKey = demographicQuestionIds.get(group.questionId);
    if (!questionKey || !group.optionId) return [];
    return [{ questionKey, optionId: group.optionId, count: group._count._all }];
  });
  const demographicOptions: PublicDemographicOptionInput[] = PUBLIC_DEMOGRAPHIC_KEYS.flatMap((questionKey) =>
    questionByKey.get(questionKey)?.options.map((option) => ({
      id: option.id,
      key: option.key,
      label: option.label,
      order: option.order,
      isActive: option.isActive,
      questionKey,
    })) ?? []
  );

  const analytics = aggregatePublicAnalytics({
    electionId,
    constituencyId,
    minRequired: minCellSize,
    responses,
    preferenceAnswers: safePreferenceAnswers,
    partyOptions,
    candidateOptions,
    candidates: candidates as PublicCandidateInput[],
    demographicCounts,
    demographicOptions,
  });

  // Real week-over-week counts (never a fabricated/placeholder delta) for
  // the "new responses this week" summary card — computed directly off the
  // same eligible-response set used everywhere else on this page.
  const now = Date.now();
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  let newResponsesLast7Days = 0;
  let newResponsesPrior7Days = 0;
  let lastResponseAt: Date | null = null;
  for (const response of responses) {
    const ageMs = now - response.createdAt.getTime();
    if (ageMs <= oneWeekMs) newResponsesLast7Days += 1;
    else if (ageMs <= oneWeekMs * 2) newResponsesPrior7Days += 1;
    if (!lastResponseAt || response.createdAt > lastResponseAt) lastResponseAt = response.createdAt;
  }

  return {
    ...base,
    sample: {
      validResponseCount: analytics.validResponseCount,
      // The results page/tab itself opens as soon as there is at least one
      // valid response — individual breakdowns (party/demographics) still
      // apply the minCellSize privacy floor independently (see
      // public-analytics-core.ts), so a thin early sample renders with a
      // real response count while its buckets show as "suppressed" until
      // they clear that floor.
      resultsAvailable: analytics.validResponseCount > 0,
      minCellSize,
      newResponsesLast7Days,
      newResponsesPrior7Days,
      lastResponseAt: lastResponseAt ? lastResponseAt.toISOString() : null,
    },
    isSynthetic,
    analytics,
  };
}

const publicSurveyInclude = {
  election: { include: { state: true } },
  constituency: { include: { district: true } },
  questions: {
    include: {
      options: {
        where: { isActive: true },
        include: { party: true },
        orderBy: { order: "asc" as const },
      },
    },
  },
} as const;
