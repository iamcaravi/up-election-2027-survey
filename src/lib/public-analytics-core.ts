import { ELIGIBLE_RESPONSE_STATUS } from "./enums";
import { isCandidateEligibleForSurveyParty, isSpecialPartyPreferenceKey } from "./survey-eligibility";

export type PublicAnalyticsState = "unavailable" | "suppressed" | "available";
export type PublicUnavailableReason =
  | "no_responses"
  | "no_answers"
  | "no_candidates"
  | "not_applicable";

interface PublicBucketMetadata {
  key: string;
  label: string;
  nameHindi?: string | null;
  colorHex?: string | null;
  partyId?: string | null;
  candidateId?: string | null;
  displayOrder: number;
}

export type PublicAnalyticsBucket =
  | (PublicBucketMetadata & { state: "available"; count: number; percentage: number })
  | (PublicBucketMetadata & { state: "suppressed" });

export type PublicDistribution =
  | { state: "unavailable"; reason: PublicUnavailableReason; minRequired: number }
  | { state: "suppressed"; minRequired: number }
  | { state: "available"; denominator: number; minRequired: number; buckets: PublicAnalyticsBucket[] };

export interface PublicPartyOptionInput {
  id: string;
  key: string;
  label: string;
  order: number;
  isActive: boolean;
  partyId: string | null;
  party: {
    id: string;
    name: string;
    shortName: string;
    colorHex: string;
    displayOrder: number;
    isActive: boolean;
  } | null;
}

export interface PublicCandidateOptionInput {
  id: string;
  key: string;
  label: string;
  order: number;
  isActive: boolean;
  partyId: string | null;
  candidateRef: string | null;
}

export interface PublicCandidateInput {
  id: string;
  name: string;
  nameHindi?: string | null;
  electionId: string;
  constituencyId: string;
  partyId: string | null;
  status: string;
  isActive: boolean;
}

export interface PublicPreferenceAnswerInput {
  responseId: string;
  questionKey: "party_preference" | "candidate_choice";
  optionId: string;
}

export interface PublicDemographicCountInput {
  questionKey: "gender" | "age_group" | "social_category" | "religion" | "top_issue";
  optionId: string;
  count: number;
}

export interface PublicDemographicOptionInput {
  id: string;
  key: string;
  label: string;
  order: number;
  isActive: boolean;
  questionKey: PublicDemographicCountInput["questionKey"];
}

export interface PublicAnalyticsInput {
  electionId: string;
  constituencyId: string;
  minRequired: number;
  responses: Array<{ id: string; status: string }>;
  preferenceAnswers: PublicPreferenceAnswerInput[];
  partyOptions: PublicPartyOptionInput[];
  candidateOptions: PublicCandidateOptionInput[];
  candidates: PublicCandidateInput[];
  demographicCounts: PublicDemographicCountInput[];
  demographicOptions: PublicDemographicOptionInput[];
}

export interface PublicCandidatePartyResult {
  party: {
    key: string;
    partyId: string | null;
    name: string;
    nameHindi: string | null;
    colorHex: string | null;
    displayOrder: number;
    isSpecial: boolean;
  };
  distribution: PublicDistribution;
}

export interface PublicAnalyticsResult {
  validResponseCount: number;
  partyPreference: PublicDistribution;
  candidatePreferenceByParty: PublicCandidatePartyResult[];
  demographics: Record<PublicDemographicCountInput["questionKey"], PublicDistribution>;
}

interface CountedBucket extends PublicBucketMetadata {
  count: number;
}

export function roundPublicPercentage(count: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((count / denominator) * 1000) / 10;
}

/**
 * Suppresses every sub-threshold cell before serialization. When exactly one
 * cell would be hidden, the smallest visible cell is secondarily suppressed
 * so its count cannot be reconstructed by subtracting visible cells from the
 * published denominator.
 */
export function protectPublicCells(
  cells: CountedBucket[],
  denominator: number,
  minRequired: number
): PublicAnalyticsBucket[] {
  const suppressedIndexes = new Set<number>();
  cells.forEach((cell, index) => {
    if (cell.count < minRequired) suppressedIndexes.add(index);
  });

  if (suppressedIndexes.size === 1 && cells.length > 1) {
    const secondary = cells
      .map((cell, index) => ({ count: cell.count, index }))
      .filter(({ index }) => !suppressedIndexes.has(index))
      .sort((a, b) => a.count - b.count)[0];
    if (secondary) suppressedIndexes.add(secondary.index);
  }

  return cells.map(({ count, ...metadata }, index) =>
    suppressedIndexes.has(index)
      ? { ...metadata, state: "suppressed" as const }
      : {
          ...metadata,
          state: "available" as const,
          count,
          percentage: roundPublicPercentage(count, denominator),
        }
  );
}

function buildDistribution(
  cells: CountedBucket[],
  denominator: number,
  minRequired: number,
  emptyReason: PublicUnavailableReason
): PublicDistribution {
  if (denominator === 0) return { state: "unavailable", reason: emptyReason, minRequired };
  if (denominator < minRequired) return { state: "suppressed", minRequired };
  return {
    state: "available",
    denominator,
    minRequired,
    buckets: protectPublicCells(cells.filter((cell) => cell.count > 0), denominator, minRequired),
  };
}

function partyMetadata(option: PublicPartyOptionInput) {
  return {
    key: option.key,
    partyId: option.partyId,
    name: option.party?.name ?? option.label,
    nameHindi: null,
    colorHex: option.party?.colorHex ?? null,
    displayOrder: option.party?.displayOrder ?? option.order,
    isSpecial: isSpecialPartyPreferenceKey(option.key),
  };
}

export function aggregatePublicAnalytics(input: PublicAnalyticsInput): PublicAnalyticsResult {
  const validResponseIds = new Set(
    input.responses.filter((response) => response.status === ELIGIBLE_RESPONSE_STATUS).map((response) => response.id)
  );
  const validResponseCount = validResponseIds.size;
  const activePartyOptions = input.partyOptions
    .filter((option) => option.isActive && (isSpecialPartyPreferenceKey(option.key) || Boolean(option.party?.isActive)))
    .sort((a, b) => {
      const left = partyMetadata(a);
      const right = partyMetadata(b);
      return left.displayOrder - right.displayOrder || left.name.localeCompare(right.name);
    });
  const partyOptionById = new Map(activePartyOptions.map((option) => [option.id, option]));

  const partyAnswerByResponse = new Map<string, PublicPartyOptionInput>();
  const candidateAnswerByResponse = new Map<string, PublicCandidateOptionInput>();
  const candidateOptionById = new Map(input.candidateOptions.filter((option) => option.isActive).map((option) => [option.id, option]));
  for (const answer of input.preferenceAnswers) {
    if (!validResponseIds.has(answer.responseId)) continue;
    if (answer.questionKey === "party_preference") {
      const option = partyOptionById.get(answer.optionId);
      if (option) partyAnswerByResponse.set(answer.responseId, option);
    } else {
      const option = candidateOptionById.get(answer.optionId);
      if (option) candidateAnswerByResponse.set(answer.responseId, option);
    }
  }

  const partyCounts = new Map<string, number>();
  for (const option of partyAnswerByResponse.values()) {
    partyCounts.set(option.id, (partyCounts.get(option.id) ?? 0) + 1);
  }
  const partyCells: CountedBucket[] = activePartyOptions.map((option) => {
    const metadata = partyMetadata(option);
    return {
      key: metadata.key,
      label: metadata.name,
      nameHindi: metadata.nameHindi,
      colorHex: metadata.colorHex,
      partyId: metadata.partyId,
      displayOrder: metadata.displayOrder,
      count: partyCounts.get(option.id) ?? 0,
    };
  });
  const partyPreference = validResponseCount < input.minRequired
    ? validResponseCount === 0
      ? { state: "unavailable" as const, reason: "no_responses" as const, minRequired: input.minRequired }
      : { state: "suppressed" as const, minRequired: input.minRequired }
    : buildDistribution(partyCells, partyAnswerByResponse.size, input.minRequired, "no_answers");

  const candidateById = new Map(input.candidates.map((candidate) => [candidate.id, candidate]));
  const candidatePreferenceByParty: PublicCandidatePartyResult[] = activePartyOptions.map((partyOption) => {
    const party = partyMetadata(partyOption);
    if (party.isSpecial || !party.partyId) {
      return {
        party,
        distribution: { state: "unavailable", reason: "not_applicable", minRequired: input.minRequired },
      };
    }

    const cohortIds = new Set(
      Array.from(partyAnswerByResponse.entries())
        .filter(([, option]) => option.id === partyOption.id)
        .map(([responseId]) => responseId)
    );
    const eligibleOptions = input.candidateOptions.filter((option) => {
      if (!option.isActive) return false;
      const isSyntheticOther = option.key === "other" && option.candidateRef === null && option.partyId === null;
      if (isSyntheticOther) return true;
      if (!option.candidateRef || option.partyId !== party.partyId) return false;
      const candidate = candidateById.get(option.candidateRef);
      return Boolean(
        candidate &&
        isCandidateEligibleForSurveyParty(input.electionId, input.constituencyId, party.partyId!, candidate)
      );
    });
    const realEligibleOptions = eligibleOptions.filter((option) => option.candidateRef);
    if (realEligibleOptions.length === 0) {
      return {
        party,
        distribution: { state: "unavailable", reason: "no_candidates", minRequired: input.minRequired },
      };
    }
    if (cohortIds.size === 0) {
      return {
        party,
        distribution: { state: "unavailable", reason: "no_responses", minRequired: input.minRequired },
      };
    }
    if (cohortIds.size < input.minRequired) {
      return { party, distribution: { state: "suppressed", minRequired: input.minRequired } };
    }

    const eligibleOptionById = new Map(eligibleOptions.map((option) => [option.id, option]));
    const counts = new Map<string, number>();
    for (const responseId of cohortIds) {
      const answer = candidateAnswerByResponse.get(responseId);
      if (!answer) continue;
      const option = eligibleOptionById.get(answer.id);
      if (!option) continue;
      counts.set(option.id, (counts.get(option.id) ?? 0) + 1);
    }
    const cells: CountedBucket[] = eligibleOptions.map((option) => {
      const candidate = option.candidateRef ? candidateById.get(option.candidateRef) : null;
      return {
        key: option.key,
        label: candidate?.name ?? option.label,
        nameHindi: candidate?.nameHindi ?? null,
        colorHex: party.colorHex,
        partyId: party.partyId,
        candidateId: candidate?.id ?? null,
        displayOrder: option.order,
        count: counts.get(option.id) ?? 0,
      };
    });
    return {
      party,
      distribution: buildDistribution(cells, cohortIds.size, input.minRequired, "no_answers"),
    };
  });

  const demographicKeys: PublicDemographicCountInput["questionKey"][] = [
    "gender",
    "age_group",
    "social_category",
    "religion",
    "top_issue",
  ];
  const demographics = Object.fromEntries(demographicKeys.map((questionKey) => {
    const options = input.demographicOptions
      .filter((option) => option.questionKey === questionKey && option.isActive)
      .sort((a, b) => a.order - b.order);
    const countsByOption = new Map(
      input.demographicCounts
        .filter((count) => count.questionKey === questionKey)
        .map((count) => [count.optionId, count.count])
    );
    const denominator = Array.from(countsByOption.values()).reduce((sum, count) => sum + count, 0);
    const cells: CountedBucket[] = options.map((option) => ({
      key: option.key,
      label: option.label,
      displayOrder: option.order,
      count: countsByOption.get(option.id) ?? 0,
    }));
    const distribution = validResponseCount < input.minRequired
      ? validResponseCount === 0
        ? { state: "unavailable" as const, reason: "no_responses" as const, minRequired: input.minRequired }
        : { state: "suppressed" as const, minRequired: input.minRequired }
      : buildDistribution(cells, denominator, input.minRequired, "no_answers");
    return [questionKey, distribution];
  })) as PublicAnalyticsResult["demographics"];

  return { validResponseCount, partyPreference, candidatePreferenceByParty, demographics };
}

export interface ResultsVisibilityInput {
  isActive: boolean;
  status: string;
}

export interface ElectionPeriodVisibility {
  restricted?: boolean;
  resultsHiddenFrom?: string | null;
  resultsHiddenUntil?: string | null;
}

export type ResultsVisibility =
  | { state: "visible" }
  | { state: "hidden"; reason: "survey_unavailable" | "compliance_restriction" | "visibility_window" };

export function evaluateResultsVisibility(
  survey: ResultsVisibilityInput,
  mode: ElectionPeriodVisibility,
  now = new Date()
): ResultsVisibility {
  if (!survey.isActive || survey.status !== "ACTIVE") {
    return { state: "hidden", reason: "survey_unavailable" };
  }
  if (mode.restricted) return { state: "hidden", reason: "compliance_restriction" };

  const hiddenFrom = mode.resultsHiddenFrom ? new Date(mode.resultsHiddenFrom) : null;
  const hiddenUntil = mode.resultsHiddenUntil ? new Date(mode.resultsHiddenUntil) : null;
  const validFrom = hiddenFrom && !Number.isNaN(hiddenFrom.getTime()) ? hiddenFrom : null;
  const validUntil = hiddenUntil && !Number.isNaN(hiddenUntil.getTime()) ? hiddenUntil : null;
  const withinWindow =
    (validFrom && validUntil && now >= validFrom && now < validUntil) ||
    (validFrom && !validUntil && now >= validFrom) ||
    (!validFrom && validUntil && now < validUntil);
  return withinWindow ? { state: "hidden", reason: "visibility_window" } : { state: "visible" };
}
