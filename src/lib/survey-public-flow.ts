export interface PublicPartySelection {
  key: string;
  partyId: string | null;
  isSpecialParty: boolean;
}

export interface PublicCandidateSelection {
  slug: string;
  partyId: string;
}

export function getCandidatesForSelectedParty<T extends PublicCandidateSelection>(
  party: PublicPartySelection | undefined,
  candidates: T[]
): T[] {
  if (!party || party.isSpecialParty || !party.partyId) return [];
  return candidates.filter((candidate) => candidate.partyId === party.partyId);
}

export function changePartySelection(
  answers: Record<string, string>,
  partyKey: string
): Record<string, string> {
  const next: Record<string, string> = { ...answers, party_preference: partyKey };
  delete next.candidate_choice;
  return next;
}

export function buildPublicSurveyAnswers(
  answers: Record<string, string>,
  party: PublicPartySelection | undefined,
  candidates: PublicCandidateSelection[],
  hasSyntheticOtherCandidate: boolean
): Array<{ questionKey: string; optionKey: string }> {
  if (!party || answers.party_preference !== party.key) {
    throw new Error("A party preference is required.");
  }

  const normalized = { ...answers };
  const availableCandidates = getCandidatesForSelectedParty(party, candidates);

  if (party.isSpecialParty || availableCandidates.length === 0) {
    delete normalized.candidate_choice;
  } else {
    const selectedCandidate = normalized.candidate_choice;
    const isRealCandidate = availableCandidates.some((candidate) => candidate.slug === selectedCandidate);
    const isSyntheticOther = selectedCandidate === "other" && hasSyntheticOtherCandidate;
    if (!isRealCandidate && !isSyntheticOther) {
      throw new Error("A candidate preference is required for this party.");
    }
  }

  return Object.entries(normalized)
    .filter(([, value]) => Boolean(value))
    .map(([questionKey, optionKey]) => ({ questionKey, optionKey }));
}
