// Dedicated fixture set for premium analytics tests — deliberately separate
// from tests/helpers/fixtures.ts (used by other suites) so this file's
// larger response volumes don't slow down or risk breaking unrelated tests.
// Lives only in the ephemeral test database; never written to prisma/dev.db.
import type { PrismaClient } from "@prisma/client";

export async function seedAnalyticsFixtures(prisma: PrismaClient) {
  const stateA = await prisma.state.create({ data: { name: "Analytics State A", slug: "analytics-state-a", code: "AAA" } });
  const stateB = await prisma.state.create({ data: { name: "Analytics State B", slug: "analytics-state-b", code: "AAB" } });

  const districtA = await prisma.district.create({ data: { stateId: stateA.id, name: "District A", slug: "district-a" } });
  const districtB = await prisma.district.create({ data: { stateId: stateB.id, name: "District B", slug: "district-b" } });

  const constituencyA = await prisma.constituency.create({
    data: { stateId: stateA.id, districtId: districtA.id, number: 1, name: "Constituency A", slug: "constituency-a" },
  });
  const constituencyB = await prisma.constituency.create({
    data: { stateId: stateB.id, districtId: districtB.id, number: 1, name: "Constituency B", slug: "constituency-b" },
  });

  const electionA = await prisma.election.create({
    data: { stateId: stateA.id, name: "Analytics Election A", slug: "analytics-election-a", year: 2031 },
  });
  const electionB = await prisma.election.create({
    data: { stateId: stateB.id, name: "Analytics Election B", slug: "analytics-election-b", year: 2031 },
  });

  await prisma.electionConstituency.create({ data: { electionId: electionA.id, constituencyId: constituencyA.id } });
  await prisma.electionConstituency.create({ data: { electionId: electionB.id, constituencyId: constituencyB.id } });

  const partyX = await prisma.party.create({ data: { name: "Party X", shortName: "PX", slug: "party-x", colorHex: "#ff0000" } });
  const partyY = await prisma.party.create({ data: { name: "Party Y", shortName: "PY", slug: "party-y", colorHex: "#0000ff" } });

  const candidateA1 = await prisma.candidate.create({
    data: { electionId: electionA.id, constituencyId: constituencyA.id, partyId: partyX.id, name: "Candidate A1", slug: "candidate-a1", status: "DECLARED" },
  });
  const candidateA2 = await prisma.candidate.create({
    data: { electionId: electionA.id, constituencyId: constituencyA.id, partyId: partyY.id, name: "Candidate A2", slug: "candidate-a2", status: "DECLARED" },
  });
  // A candidate belonging to a DIFFERENT election/constituency entirely —
  // must never appear in surveyA's candidate_choice options/analytics.
  const candidateB1 = await prisma.candidate.create({
    data: { electionId: electionB.id, constituencyId: constituencyB.id, partyId: partyX.id, name: "Candidate B1", slug: "candidate-b1", status: "DECLARED" },
  });

  // --- surveyA: the rich, fully-populated survey most tests target -------
  const surveyA = await prisma.survey.create({
    data: { electionId: electionA.id, constituencyId: constituencyA.id, title: "Survey A", isActive: true },
  });

  const qCandidate = await prisma.surveyQuestion.create({ data: { surveyId: surveyA.id, key: "candidate_choice", label: "Candidate", required: true, allowSkip: false, order: 1 } });
  const oCandA1 = await prisma.surveyOption.create({ data: { questionId: qCandidate.id, key: "candidate-a1", label: "Candidate A1", candidateRef: candidateA1.id, partyId: partyX.id, order: 0 } });
  const oCandA2 = await prisma.surveyOption.create({ data: { questionId: qCandidate.id, key: "candidate-a2", label: "Candidate A2", candidateRef: candidateA2.id, partyId: partyY.id, order: 1 } });
  await prisma.surveyOption.create({ data: { questionId: qCandidate.id, key: "other", label: "Other", order: 999 } });

  const qParty = await prisma.surveyQuestion.create({ data: { surveyId: surveyA.id, key: "party_preference", label: "Party", required: false, allowSkip: true, order: 2 } });
  const oPartyX = await prisma.surveyOption.create({ data: { questionId: qParty.id, key: "party-x", label: "Party X", partyId: partyX.id, order: 0 } });
  const oPartyY = await prisma.surveyOption.create({ data: { questionId: qParty.id, key: "party-y", label: "Party Y", partyId: partyY.id, order: 1 } });

  const qIssue = await prisma.surveyQuestion.create({ data: { surveyId: surveyA.id, key: "top_issue", label: "Top issue", required: false, allowSkip: true, order: 3 } });
  const oRoads = await prisma.surveyOption.create({ data: { questionId: qIssue.id, key: "roads", label: "Roads", order: 0 } });
  const oJobs = await prisma.surveyOption.create({ data: { questionId: qIssue.id, key: "jobs", label: "Jobs", order: 1 } });
  const oWater = await prisma.surveyOption.create({ data: { questionId: qIssue.id, key: "water", label: "Water", order: 2 } });

  const qGender = await prisma.surveyQuestion.create({ data: { surveyId: surveyA.id, key: "gender", label: "Gender", required: false, allowSkip: true, order: 4 } });
  const oMale = await prisma.surveyOption.create({ data: { questionId: qGender.id, key: "male", label: "Male", order: 0 } });
  const oFemale = await prisma.surveyOption.create({ data: { questionId: qGender.id, key: "female", label: "Female", order: 1 } });
  const oGenderOther = await prisma.surveyOption.create({ data: { questionId: qGender.id, key: "other", label: "Other", order: 2 } });
  const oGenderPreferNot = await prisma.surveyOption.create({ data: { questionId: qGender.id, key: "prefer_not_to_say", label: "Prefer not to say", order: 999 } });

  const qSocial = await prisma.surveyQuestion.create({ data: { surveyId: surveyA.id, key: "social_category", label: "Social category", required: false, allowSkip: true, order: 5 } });
  const oGeneral = await prisma.surveyOption.create({ data: { questionId: qSocial.id, key: "general", label: "General", order: 0 } });
  const oObc = await prisma.surveyOption.create({ data: { questionId: qSocial.id, key: "obc", label: "OBC", order: 1 } });
  const oSc = await prisma.surveyOption.create({ data: { questionId: qSocial.id, key: "sc", label: "SC", order: 2 } });
  const oSt = await prisma.surveyOption.create({ data: { questionId: qSocial.id, key: "st", label: "ST", order: 3 } });

  const qReligion = await prisma.surveyQuestion.create({ data: { surveyId: surveyA.id, key: "religion", label: "Religion", required: false, allowSkip: true, order: 6 } });
  const oHindu = await prisma.surveyOption.create({ data: { questionId: qReligion.id, key: "hindu", label: "Hindu", order: 0 } });
  const oMuslim = await prisma.surveyOption.create({ data: { questionId: qReligion.id, key: "muslim", label: "Muslim", order: 1 } });
  const oReligionOther = await prisma.surveyOption.create({ data: { questionId: qReligion.id, key: "other", label: "Other", order: 2 } });

  // --- surveyB: minimal, isolated survey (different state/election) ------
  const surveyB = await prisma.survey.create({
    data: { electionId: electionB.id, constituencyId: constituencyB.id, title: "Survey B", isActive: true },
  });
  const qCandidateB = await prisma.surveyQuestion.create({ data: { surveyId: surveyB.id, key: "candidate_choice", label: "Candidate", required: true, allowSkip: false, order: 1 } });
  const oCandB1 = await prisma.surveyOption.create({ data: { questionId: qCandidateB.id, key: "candidate-b1", label: "Candidate B1", candidateRef: candidateB1.id, order: 0 } });

  return {
    stateA, stateB, districtA, districtB, constituencyA, constituencyB, electionA, electionB,
    partyX, partyY, candidateA1, candidateA2, candidateB1,
    surveyA, surveyB,
    questions: { qCandidate, qParty, qIssue, qGender, qSocial, qReligion, qCandidateB },
    options: {
      candidateA1: oCandA1, candidateA2: oCandA2,
      partyX: oPartyX, partyY: oPartyY,
      roads: oRoads, jobs: oJobs, water: oWater,
      male: oMale, female: oFemale, genderOther: oGenderOther, genderPreferNot: oGenderPreferNot,
      general: oGeneral, obc: oObc, sc: oSc, st: oSt,
      hindu: oHindu, muslim: oMuslim, religionOther: oReligionOther,
      candidateB1: oCandB1,
    },
  };
}

export type AnalyticsFixtures = Awaited<ReturnType<typeof seedAnalyticsFixtures>>;

interface ResponseAnswers {
  candidate_choice?: string;
  party_preference?: string;
  top_issue?: string;
  gender?: string;
  social_category?: string;
  religion?: string;
}

// Creates `count` VALID responses for a survey, each with the given answer
// set (question key -> SurveyOption id). A key omitted from `answers` means
// that response genuinely skipped the question — never coerced to a default.
export async function createAnalyticsResponses(
  prisma: PrismaClient,
  surveyId: string,
  constituencyId: string,
  questions: AnalyticsFixtures["questions"],
  answers: ResponseAnswers,
  count: number,
  fingerprintPrefix: string
) {
  const questionByKey: Record<string, { id: string } | undefined> = {
    candidate_choice: questions.qCandidate,
    party_preference: questions.qParty,
    top_issue: questions.qIssue,
    gender: questions.qGender,
    social_category: questions.qSocial,
    religion: questions.qReligion,
  };

  for (let i = 0; i < count; i++) {
    const response = await prisma.surveyResponse.create({
      data: { surveyId, constituencyId, status: "VALID", fingerprint: `${fingerprintPrefix}-${i}` },
    });
    for (const [key, optionId] of Object.entries(answers)) {
      const question = questionByKey[key];
      if (!question || !optionId) continue;
      await prisma.surveyAnswer.create({ data: { responseId: response.id, questionId: question.id, optionId } });
    }
  }
}

// A FLAGGED (ineligible) response — must never count toward any analytics total.
export async function createIneligibleResponse(
  prisma: PrismaClient,
  surveyId: string,
  constituencyId: string,
  questionId: string,
  optionId: string,
  status: "FLAGGED" | "REJECTED"
) {
  const response = await prisma.surveyResponse.create({
    data: { surveyId, constituencyId, status, fingerprint: `ineligible-${status}-${Date.now()}-${Math.random()}` },
  });
  await prisma.surveyAnswer.create({ data: { responseId: response.id, questionId, optionId } });
}
