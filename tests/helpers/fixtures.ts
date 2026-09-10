// Builds a small, clearly-labelled test fixture across TWO states with
// deliberately colliding constituency numbers/slugs and district slugs —
// the exact scenario that must never cross-contaminate. This lives only in
// the ephemeral test database created by setupTestDb(); it is never written
// to prisma/dev.db and is not real election data.
import type { PrismaClient } from "@prisma/client";

export async function seedFixtures(prisma: PrismaClient) {
  const stateA = await prisma.state.create({
    data: { name: "Test State Alpha", slug: "test-state-alpha", code: "TSA" },
  });
  const stateB = await prisma.state.create({
    data: { name: "Test State Beta", slug: "test-state-beta", code: "TSB" },
  });

  // Also seed a "uttar-pradesh" slugged state so legacy default-slug
  // fallback behavior (used by /api/districts, /api/constituencies/*) can
  // be exercised without touching the real product database.
  const stateUP = await prisma.state.create({
    data: { name: "Uttar Pradesh", slug: "uttar-pradesh", code: "TUP" },
  });

  // Minimal fixture under the "uttar-pradesh" slug — used only to exercise
  // the legacy API routes' `?state=uttar-pradesh` default-fallback behavior
  // in isolation. Not the real seeded UP dataset.
  const districtUP = await prisma.district.create({
    data: { stateId: stateUP.id, name: "Fixture District", slug: "fixture-district" },
  });
  const constituencyUP = await prisma.constituency.create({
    data: { stateId: stateUP.id, districtId: districtUP.id, number: 1, name: "Fixture AC", slug: "fixture-ac" },
  });
  const electionUP = await prisma.election.create({
    data: { stateId: stateUP.id, name: "Fixture Election", slug: "fixture-election", year: 2030 },
  });
  await prisma.electionConstituency.create({
    data: { electionId: electionUP.id, constituencyId: constituencyUP.id },
  });

  const districtA = await prisma.district.create({
    data: { stateId: stateA.id, name: "District One", slug: "district-one" },
  });
  const districtB = await prisma.district.create({
    data: { stateId: stateB.id, name: "District One", slug: "district-one" }, // same slug, different state
  });

  // Same AC number AND same slug in both states — the exact collision the
  // multi-state migration must handle safely.
  const constituencyA = await prisma.constituency.create({
    data: { stateId: stateA.id, districtId: districtA.id, number: 1, name: "Central", slug: "central" },
  });
  const constituencyB = await prisma.constituency.create({
    data: { stateId: stateB.id, districtId: districtB.id, number: 1, name: "Central", slug: "central" },
  });

  const electionA = await prisma.election.create({
    data: { stateId: stateA.id, name: "Test Election Alpha 2030", slug: "test-election-2030", year: 2030 },
  });
  const electionB = await prisma.election.create({
    data: { stateId: stateB.id, name: "Test Election Beta 2030", slug: "test-election-2030", year: 2030 }, // same slug, different state
  });

  // A constituency that exists in state A / district A but is deliberately
  // NOT linked to electionA — used to test that unlinked constituencies
  // never surface on an election-scoped page.
  const constituencyAUnlinked = await prisma.constituency.create({
    data: { stateId: stateA.id, districtId: districtA.id, number: 2, name: "Unlinked", slug: "unlinked" },
  });

  const ecA = await prisma.electionConstituency.create({
    data: { electionId: electionA.id, constituencyId: constituencyA.id },
  });
  const ecB = await prisma.electionConstituency.create({
    data: { electionId: electionB.id, constituencyId: constituencyB.id },
  });

  // A constituency whose ElectionConstituency mapping exists but is
  // disabled (isActive: false) — used to prove a technically-existing but
  // inactive mapping is still rejected, distinct from a missing one.
  const constituencyADisabled = await prisma.constituency.create({
    data: { stateId: stateA.id, districtId: districtA.id, number: 3, name: "Disabled Mapping", slug: "disabled-mapping" },
  });
  await prisma.electionConstituency.create({
    data: { electionId: electionA.id, constituencyId: constituencyADisabled.id, isActive: false },
  });

  // A SECOND election for state A, reusing the SAME constituency (a
  // constituency can legitimately contest more than one election over
  // time) — used to prove syncCandidateChoiceOptions never mixes one
  // election's candidates into another election's survey options.
  const electionA2 = await prisma.election.create({
    data: { stateId: stateA.id, name: "Test Election Alpha 2035", slug: "test-election-2035", year: 2035 },
  });
  await prisma.electionConstituency.create({
    data: { electionId: electionA2.id, constituencyId: constituencyA.id },
  });

  const party = await prisma.party.create({
    data: { name: "Test Party", shortName: "TP", slug: "test-party" },
  });
  const partyJansatta = await prisma.party.create({
    data: {
      name: "Jansatta Dal Loktantrik Party",
      shortName: "Jansatta Dal Loktantrik Party",
      slug: "jansatta-dal-loktantrik-party",
      displayOrder: 8,
    },
  });
  const partyOther = await prisma.party.create({
    data: { name: "Other / Independent", shortName: "Other", slug: "other", displayOrder: 98 },
  });
  const partyUndecided = await prisma.party.create({
    data: { name: "Undecided", shortName: "Undecided", slug: "undecided", displayOrder: 99 },
  });

  const candidateA = await prisma.candidate.create({
    data: {
      electionId: electionA.id,
      constituencyId: constituencyA.id,
      partyId: party.id,
      name: "Candidate A",
      slug: "candidate-a",
      status: "DECLARED",
    },
  });
  const candidateB = await prisma.candidate.create({
    data: {
      electionId: electionB.id,
      constituencyId: constituencyB.id,
      partyId: party.id,
      name: "Candidate B",
      slug: "candidate-b",
      status: "DECLARED",
    },
  });

  const candidateA2 = await prisma.candidate.create({
    data: {
      electionId: electionA2.id,
      constituencyId: constituencyA.id,
      partyId: party.id,
      name: "Candidate A2",
      slug: "candidate-a2",
      status: "DECLARED",
    },
  });

  const surveyA = await prisma.survey.create({
    data: { electionId: electionA.id, constituencyId: constituencyA.id, title: "Survey A", isActive: true },
  });
  const surveyB = await prisma.survey.create({
    data: { electionId: electionB.id, constituencyId: constituencyB.id, title: "Survey B", isActive: true },
  });
  // Same constituency as surveyA, but for the second election — the
  // scenario syncCandidateChoiceOptions must keep separate.
  const surveyA2 = await prisma.survey.create({
    data: { electionId: electionA2.id, constituencyId: constituencyA.id, title: "Survey A2", isActive: true },
  });

  const questionA = await prisma.surveyQuestion.create({
    data: { surveyId: surveyA.id, key: "candidate_choice", label: "Choice", required: true, allowSkip: false },
  });
  const optionA = await prisma.surveyOption.create({
    data: { questionId: questionA.id, key: "candidate-a", label: "Candidate A", candidateRef: candidateA.id },
  });
  const questionB = await prisma.surveyQuestion.create({
    data: { surveyId: surveyB.id, key: "candidate_choice", label: "Choice", required: true, allowSkip: false },
  });
  const optionB = await prisma.surveyOption.create({
    data: { questionId: questionB.id, key: "candidate-b", label: "Candidate B", candidateRef: candidateB.id },
  });
  // No pre-created option for surveyA2's question — syncCandidateChoiceOptions
  // is expected to create it from candidateA2.
  const questionA2 = await prisma.surveyQuestion.create({
    data: { surveyId: surveyA2.id, key: "candidate_choice", label: "Choice", required: true, allowSkip: false },
  });

  return {
    stateA,
    stateB,
    stateUP,
    districtUP,
    constituencyUP,
    electionUP,
    districtA,
    districtB,
    constituencyA,
    constituencyB,
    constituencyAUnlinked,
    constituencyADisabled,
    electionA,
    electionB,
    ecA,
    ecB,
    party,
    partyJansatta,
    partyOther,
    partyUndecided,
    candidateA,
    candidateB,
    candidateA2,
    electionA2,
    surveyA,
    surveyB,
    surveyA2,
    questionA,
    optionA,
    questionB,
    optionB,
    questionA2,
  };
}

// Creates `count` VALID survey responses for a given survey/question/option,
// each with a distinct fake fingerprint hash so duplicate detection doesn't
// collapse them.
export async function createResponses(
  prisma: PrismaClient,
  surveyId: string,
  constituencyId: string,
  questionId: string,
  optionId: string,
  count: number
) {
  for (let i = 0; i < count; i++) {
    const response = await prisma.surveyResponse.create({
      data: {
        surveyId,
        constituencyId,
        status: "VALID",
        fingerprint: `fixture-fp-${surveyId}-${i}`,
      },
    });
    await prisma.surveyAnswer.create({
      data: { responseId: response.id, questionId, optionId },
    });
  }
}
