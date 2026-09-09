import type { PrismaClient } from "@prisma/client";
import { DEFAULT_PARTIES, DEFAULT_ISSUES, AGE_GROUPS, GENDERS, SOCIAL_CATEGORIES, RELIGIONS } from "./enums";

// Creates the platform's standard survey question set on an already-created
// Survey row: candidate choice, party preference, top issue, and the four
// anonymous demographic questions (age group, gender, social category,
// religion — never sub-caste or any identifying field). This is the exact
// question architecture prisma/seed.ts has always used; extracted here so
// admin-created surveys (for states/elections beyond the seed script) get
// the identical structure instead of a hand-rolled duplicate.
//
// Candidate options are deliberately NOT created here — they are populated
// separately by syncCandidateChoiceOptions, which is the one place allowed
// to decide which candidates belong in a given (electionId, constituencyId)
// survey.
export async function createDefaultSurveyQuestions(
  prisma: PrismaClient,
  surveyId: string,
  opts?: { candidateQuestionLabel?: string; partyQuestionLabel?: string; issueQuestionLabel?: string }
) {
  const partiesByShortName = new Map(
    (await prisma.party.findMany({ where: { isActive: true }, orderBy: { displayOrder: "asc" } })).map((p) => [
      p.shortName,
      p,
    ])
  );

  const candidateQ = await prisma.surveyQuestion.create({
    data: {
      surveyId,
      key: "candidate_choice",
      label: opts?.candidateQuestionLabel ?? "2027 में आप अपने क्षेत्र से किसे विधायक देखना चाहते हैं?",
      required: true,
      allowSkip: false,
      order: 1,
    },
  });
  await prisma.surveyOption.create({
    data: { questionId: candidateQ.id, key: "other", label: "Other", order: 999 },
  });

  const partyQ = await prisma.surveyQuestion.create({
    data: {
      surveyId,
      key: "party_preference",
      label: opts?.partyQuestionLabel ?? "अगर आज विधानसभा चुनाव हों तो आप किस पार्टी को वोट देना पसंद करेंगे?",
      required: false,
      allowSkip: true,
      order: 2,
    },
  });
  for (let i = 0; i < DEFAULT_PARTIES.length; i++) {
    const p = DEFAULT_PARTIES[i];
    const party = partiesByShortName.get(p.shortName);
    await prisma.surveyOption.create({
      data: { questionId: partyQ.id, key: p.slug, label: p.shortName, order: i, partyId: party?.id },
    });
  }

  const issueQ = await prisma.surveyQuestion.create({
    data: {
      surveyId,
      key: "top_issue",
      label: opts?.issueQuestionLabel ?? "आपके क्षेत्र में सबसे बड़ा मुद्दा क्या है?",
      required: false,
      allowSkip: true,
      order: 3,
    },
  });
  for (let i = 0; i < DEFAULT_ISSUES.length; i++) {
    const issue = DEFAULT_ISSUES[i];
    await prisma.surveyOption.create({ data: { questionId: issueQ.id, key: issue.key, label: issue.label, order: i } });
  }

  const demoQuestions: Array<{ key: string; label: string; options: readonly { key: string; label: string }[] }> = [
    { key: "age_group", label: "आयु वर्ग", options: AGE_GROUPS },
    { key: "gender", label: "लिंग", options: GENDERS },
    { key: "social_category", label: "सामाजिक श्रेणी", options: SOCIAL_CATEGORIES },
    { key: "religion", label: "धर्म", options: RELIGIONS },
  ];
  let order = 4;
  for (const dq of demoQuestions) {
    const q = await prisma.surveyQuestion.create({
      data: { surveyId, key: dq.key, label: dq.label, required: false, allowSkip: true, order: order++ },
    });
    for (let i = 0; i < dq.options.length; i++) {
      const opt = dq.options[i];
      await prisma.surveyOption.create({ data: { questionId: q.id, key: opt.key, label: opt.label, order: i } });
    }
    await prisma.surveyOption.create({
      data: { questionId: q.id, key: "prefer_not_to_say", label: "Prefer not to say", order: 999 },
    });
  }
}
