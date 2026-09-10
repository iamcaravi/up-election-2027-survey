import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStateAndElection, getConstituencyBySlug, getFullSurveyForConstituency } from "@/lib/data";
import { SurveyFlow } from "@/components/survey/SurveyFlow";
import { Container } from "@/components/ui/Container";
import { electionPath } from "@/lib/routes";
import { isCandidateEligibleForSurveyParty, isSpecialPartyPreferenceKey } from "@/lib/survey-eligibility";
import { SURVEY_ELIGIBLE_CANDIDATE_STATUSES } from "@/lib/enums";

export const metadata: Metadata = { title: "Take the Survey" };

export default async function SurveyPage({
  params,
}: {
  params: Promise<{ state: string; election: string; constituency: string }>;
}) {
  const { state: stateSlug, election: electionSlug, constituency: slug } = await params;
  const result = await getStateAndElection(stateSlug, electionSlug);
  if (!result?.election) notFound();
  const { state, election } = result;

  const constituency = await getConstituencyBySlug(stateSlug, slug, electionSlug);
  if (!constituency) notFound();

  const survey = await getFullSurveyForConstituency(constituency.id, election.id);
  if (!survey) notFound();

  const candidateQuestion = survey.questions.find((question) => question.key === "candidate_choice");
  const candidateOptionsByRef = new Map(
    candidateQuestion?.options
      .filter((option) => option.candidateRef)
      .map((option) => [option.candidateRef as string, option]) ?? []
  );

  // The browser receives only candidates that satisfy the shared Phase 20A
  // eligibility rule (SURVEY_ELIGIBLE_CANDIDATE_STATUSES) and have an active
  // option in this exact survey.
  const eligibleCandidates = constituency.candidates
    .filter((candidate) => (SURVEY_ELIGIBLE_CANDIDATE_STATUSES as readonly string[]).includes(candidate.status))
    .flatMap((candidate) => {
      if (!candidate.partyId || !candidate.party?.isActive) return [];
      const option = candidateOptionsByRef.get(candidate.id);
      if (
        !option ||
        option.partyId !== candidate.partyId ||
        !isCandidateEligibleForSurveyParty(election.id, constituency.id, candidate.partyId, candidate)
      ) {
        return [];
      }
    return [{
      id: candidate.id,
      slug: option.key,
      name: candidate.name,
      status: candidate.status,
      confidenceScore: candidate.confidenceScore,
      photoUrl: candidate.photoUrl,
      partyId: candidate.partyId,
      party: {
        shortName: candidate.party.shortName,
        colorHex: candidate.party.colorHex,
      },
    }];
  });

  return (
    <Container className="max-w-2xl py-10 sm:py-16">
      <SurveyFlow
        surveyId={survey.id}
        constituencyName={constituency.name}
        basePath={electionPath(state.slug, election.slug)}
        constituencySlug={slug}
        candidates={eligibleCandidates}
        questions={survey.questions.map((q) => ({
          key: q.key,
          label: q.label,
          required: q.required,
          allowSkip: q.allowSkip,
          options: q.options
            .filter((option) => q.key !== "candidate_choice" || !option.candidateRef)
            .map((option) => ({
              key: option.key,
              label: option.label,
              partyId: option.partyId,
              isSpecialParty: q.key === "party_preference" && isSpecialPartyPreferenceKey(option.key),
              colorHex: option.party?.colorHex ?? null,
            })),
        }))}
      />
    </Container>
  );
}
