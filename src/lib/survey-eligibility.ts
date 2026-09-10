import { SURVEY_ELIGIBLE_CANDIDATE_STATUSES } from "./enums";

export interface SurveyCandidateEligibilityRecord {
  electionId: string;
  constituencyId: string;
  partyId: string | null;
  status: string;
  isActive: boolean;
}

const SPECIAL_PARTY_PREFERENCE_KEYS = new Set(["other", "undecided", "prefer_not_to_say"]);

export function isSpecialPartyPreferenceKey(key: string): boolean {
  return SPECIAL_PARTY_PREFERENCE_KEYS.has(key);
}

/**
 * The single application-level definition of whether a candidate can be
 * selected for a party in a constituency survey.
 */
export function isCandidateEligibleForSurveyParty(
  electionId: string,
  constituencyId: string,
  partyId: string,
  candidate: SurveyCandidateEligibilityRecord
): boolean {
  return (
    candidate.isActive &&
    candidate.electionId === electionId &&
    candidate.constituencyId === constituencyId &&
    candidate.partyId === partyId &&
    (SURVEY_ELIGIBLE_CANDIDATE_STATUSES as readonly string[]).includes(candidate.status)
  );
}
