import type { PrismaClient } from "@prisma/client";
import { DEFAULT_ISSUES, AGE_GROUPS, GENDERS, SOCIAL_CATEGORIES, RELIGIONS } from "./enums";

// "Other", "NOTA" and "Undecided" are canonical global Party rows (slugs
// other/nota/undecided) always appended last to every state's survey,
// regardless of that state's featured-party configuration — they are not
// part of the 5-main-party cap.
const SPECIAL_PARTY_SLUG_ORDER = new Map([
  ["other", 0],
  ["nota", 1],
  ["undecided", 2],
]);
const SPECIAL_PARTY_SLUGS = [...SPECIAL_PARTY_SLUG_ORDER.keys()];

type SurveyParty = {
  id: string;
  shortName: string;
  slug: string;
  displayOrder: number;
  isActive: boolean;
};

export function orderPartiesForSurvey(parties: SurveyParty[]): SurveyParty[] {
  const active = parties.filter((party) => party.isActive);
  const ordinary = active
    .filter((party) => !SPECIAL_PARTY_SLUG_ORDER.has(party.slug))
    .sort((a, b) => a.displayOrder - b.displayOrder || a.shortName.localeCompare(b.shortName));
  const special = active
    .filter((party) => SPECIAL_PARTY_SLUG_ORDER.has(party.slug))
    .sort((a, b) => SPECIAL_PARTY_SLUG_ORDER.get(a.slug)! - SPECIAL_PARTY_SLUG_ORDER.get(b.slug)!);

  for (const slug of SPECIAL_PARTY_SLUGS) {
    if (!special.some((party) => party.slug === slug)) {
      throw new Error(`Active canonical Party records with slugs ${SPECIAL_PARTY_SLUGS.join(", ")} are required.`);
    }
  }
  return [...ordinary, ...special];
}

// Builds a state's public party list: that state's featured parties (from
// StateParty, capped at 5 by the admin API — see
// src/app/api/admin/states/[id]/parties/route.ts) plus the three always-on
// globals. A party featured in one state never leaks into another state's
// survey, since featuring is per-StateParty-row, not a property of Party
// itself (see tests/state-party-isolation.test.ts).
export async function getStatePartiesForSurvey(prisma: PrismaClient, stateId: string): Promise<SurveyParty[]> {
  const [featured, specials] = await Promise.all([
    prisma.stateParty.findMany({
      where: { stateId, isFeatured: true, party: { isActive: true } },
      include: { party: true },
      orderBy: { displayOrder: "asc" },
    }),
    prisma.party.findMany({ where: { slug: { in: SPECIAL_PARTY_SLUGS }, isActive: true } }),
  ]);
  return orderPartiesForSurvey([...featured.map((fp) => fp.party), ...specials]);
}

export async function syncPartyPreferenceOptions(prisma: PrismaClient, questionId: string, stateId: string) {
  const parties = await getStatePartiesForSurvey(prisma, stateId);
  const existing = await prisma.surveyOption.findMany({ where: { questionId } });
  const unused = new Map(existing.map((option) => [option.id, option]));

  for (let order = 0; order < parties.length; order++) {
    const party = parties[order];
    const option = existing.find((candidate) => candidate.partyId === party.id) ?? existing.find((candidate) => candidate.key === party.slug);
    if (option) {
      await prisma.surveyOption.update({
        where: { id: option.id },
        data: { key: party.slug, label: party.shortName, partyId: party.id, order, isActive: true },
      });
      unused.delete(option.id);
    } else {
      await prisma.surveyOption.create({
        data: { questionId, key: party.slug, label: party.shortName, partyId: party.id, order },
      });
    }
  }

  for (const stale of unused.values()) {
    await prisma.surveyOption.update({ where: { id: stale.id }, data: { isActive: false } });
  }
}

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
  stateId: string,
  opts?: { candidateQuestionLabel?: string; partyQuestionLabel?: string; issueQuestionLabel?: string }
) {
  const partyQ = await prisma.surveyQuestion.create({
    data: {
      surveyId,
      key: "party_preference",
      label: opts?.partyQuestionLabel ?? "अगर आज विधानसभा चुनाव हों, तो आप किस पार्टी को वोट देना पसंद करेंगे?",
      required: true,
      allowSkip: false,
      order: 1,
    },
  });
  await syncPartyPreferenceOptions(prisma, partyQ.id, stateId);

  const candidateQ = await prisma.surveyQuestion.create({
    data: {
      surveyId,
      key: "candidate_choice",
      label: opts?.candidateQuestionLabel ?? "आपकी चुनी हुई पार्टी की ओर से उम्मीदवार के रूप में आप किसे पसंद करेंगे?",
      required: false,
      allowSkip: true,
      order: 2,
    },
  });
  await prisma.surveyOption.create({
    data: { questionId: candidateQ.id, key: "other", label: "Other", order: 999 },
  });

  const issueQ = await prisma.surveyQuestion.create({
    data: {
      surveyId,
      key: "top_issue",
      label: opts?.issueQuestionLabel ?? "आपके क्षेत्र में सबसे बड़ा मुद्दा क्या है?",
      type: "MULTIPLE_CHOICE",
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
