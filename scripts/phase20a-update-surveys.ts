import { PrismaClient } from "@prisma/client";
import { syncPartyPreferenceOptions } from "../src/lib/survey-template-data";

const prisma = new PrismaClient();

async function snapshot() {
  const [surveys, responses, answers, candidates, parties] = await Promise.all([
    prisma.survey.findMany({
      select: {
        id: true,
        questions: { select: { id: true, key: true, order: true } },
      },
    }),
    prisma.surveyResponse.count(),
    prisma.surveyAnswer.count(),
    prisma.candidate.count(),
    prisma.party.count(),
  ]);
  return {
    surveys,
    counts: {
      surveys: surveys.length,
      sevenQuestionSurveys: surveys.filter((survey) => survey.questions.length === 7).length,
      responses,
      answers,
      candidates,
      parties,
    },
  };
}

function assertSafeCounts(counts: Awaited<ReturnType<typeof snapshot>>["counts"]) {
  const expected = {
    surveys: 403,
    sevenQuestionSurveys: 403,
    responses: 0,
    answers: 0,
    candidates: 402,
    parties: 11,
  };
  for (const [key, expectedValue] of Object.entries(expected)) {
    const actual = counts[key as keyof typeof counts];
    if (actual !== expectedValue) {
      throw new Error(`Safety check failed: ${key}=${actual}, expected ${expectedValue}. No survey data was updated.`);
    }
  }
}

async function main() {
  const before = await snapshot();
  assertSafeCounts(before.counts);
  console.log("Before:", before.counts);

  for (const survey of before.surveys) {
    const partyQuestion = survey.questions.find((question) => question.key === "party_preference");
    const candidateQuestion = survey.questions.find((question) => question.key === "candidate_choice");
    if (!partyQuestion || !candidateQuestion) {
      throw new Error(`Survey ${survey.id} is missing a required party/candidate question.`);
    }

    await prisma.surveyQuestion.update({
      where: { id: partyQuestion.id },
      data: {
        label: "अगर आज विधानसभा चुनाव हों, तो आप किस पार्टी को वोट देना पसंद करेंगे?",
        required: true,
        allowSkip: false,
        order: 1,
      },
    });
    await prisma.surveyQuestion.update({
      where: { id: candidateQuestion.id },
      data: {
        label: "आपकी चुनी हुई पार्टी की ओर से उम्मीदवार के रूप में आप किसे पसंद करेंगे?",
        required: false,
        allowSkip: true,
        order: 2,
      },
    });
    await syncPartyPreferenceOptions(prisma, partyQuestion.id);
  }

  const after = await snapshot();
  assertSafeCounts(after.counts);
  for (const survey of after.surveys) {
    const ordered = [...survey.questions].sort((a, b) => a.order - b.order);
    const expectedKeys = [
      "party_preference",
      "candidate_choice",
      "top_issue",
      "age_group",
      "gender",
      "social_category",
      "religion",
    ];
    if (ordered.map((question) => question.key).join("|") !== expectedKeys.join("|")) {
      throw new Error(`Survey ${survey.id} has an unexpected question order after update.`);
    }
  }
  console.log("After:", after.counts);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
