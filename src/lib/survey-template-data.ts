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

type DefaultQuestionOpts = { candidateQuestionLabel?: string; partyQuestionLabel?: string; issueQuestionLabel?: string };
type DefaultQuestionDef = {
  key: string;
  label: string;
  order: number;
  required: boolean;
  allowSkip: boolean;
  type?: string;
};

const DEMO_QUESTION_DEFS: Array<{ key: string; label: string; order: number; options: readonly { key: string; label: string }[] }> = [
  { key: "age_group", label: "आयु वर्ग", order: 4, options: AGE_GROUPS },
  { key: "gender", label: "लिंग", order: 5, options: GENDERS },
  { key: "social_category", label: "सामाजिक श्रेणी", order: 6, options: SOCIAL_CATEGORIES },
  { key: "religion", label: "धर्म", order: 7, options: RELIGIONS },
];

// The platform's standard 7-question set, as flat question definitions —
// shared by both the fast bulk-insert path (createDefaultSurveyQuestions)
// and the upsert-based repair path (ensureDefaultSurveyQuestions) so the
// two can never drift out of sync.
function buildDefaultQuestionDefs(opts?: DefaultQuestionOpts): DefaultQuestionDef[] {
  return [
    {
      key: "party_preference",
      label: opts?.partyQuestionLabel ?? "अगर आज विधानसभा चुनाव हों, तो आप किस पार्टी को वोट देना पसंद करेंगे?",
      required: true,
      allowSkip: false,
      order: 1,
    },
    {
      key: "candidate_choice",
      label: opts?.candidateQuestionLabel ?? "आपकी चुनी हुई पार्टी की ओर से उम्मीदवार के रूप में आप किसे पसंद करेंगे?",
      required: false,
      allowSkip: true,
      order: 2,
    },
    {
      key: "top_issue",
      label: opts?.issueQuestionLabel ?? "आपके क्षेत्र में सबसे बड़ा मुद्दा क्या है?",
      type: "MULTIPLE_CHOICE",
      required: false,
      allowSkip: true,
      order: 3,
    },
    ...DEMO_QUESTION_DEFS.map((dq) => ({ key: dq.key, label: dq.label, required: false, allowSkip: true, order: dq.order })),
  ];
}

// Builds every option row for the standard question set, given each
// question's already-created id (keyed by question `key`) and the state's
// resolved party list. Shared by both the fast and repair paths.
function buildDefaultOptionRows(
  questionIdByKey: Map<string, string>,
  parties: SurveyParty[]
): Array<{ questionId: string; key: string; label: string; order: number; partyId?: string }> {
  const partyQId = questionIdByKey.get("party_preference")!;
  const candidateQId = questionIdByKey.get("candidate_choice")!;
  const issueQId = questionIdByKey.get("top_issue")!;

  const optionRows: Array<{ questionId: string; key: string; label: string; order: number; partyId?: string }> = [];

  parties.forEach((party, order) => {
    optionRows.push({ questionId: partyQId, key: party.slug, label: party.shortName, partyId: party.id, order });
  });

  optionRows.push({ questionId: candidateQId, key: "other", label: "Other", order: 999 });

  DEFAULT_ISSUES.forEach((issue, i) => {
    optionRows.push({ questionId: issueQId, key: issue.key, label: issue.label, order: i });
  });

  for (const dq of DEMO_QUESTION_DEFS) {
    const qId = questionIdByKey.get(dq.key)!;
    dq.options.forEach((opt, i) => {
      optionRows.push({ questionId: qId, key: opt.key, label: opt.label, order: i });
    });
    optionRows.push({ questionId: qId, key: "prefer_not_to_say", label: "Prefer not to say", order: 999 });
  }

  return optionRows;
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
//
// Performance note: this must only be called against a brand-new Survey
// with zero existing questions/options (prisma/seed.ts only calls it right
// after creating the Survey row) — every row here is a pure insert via
// createManyAndReturn + createMany inside one transaction, instead of one
// network round trip per row, since a full multi-state seed over a remote
// Postgres connection previously meant tens of thousands of sequential
// round trips. If a Survey might already have partial question/option data
// (e.g. resuming a seed run that was interrupted mid-way), use
// ensureDefaultSurveyQuestions instead — calling this on a non-empty survey
// will fail on the questions' unique (surveyId, key) constraint.
// createManyAndReturn does not guarantee its result order matches the input
// array, so questions are looked up by their (per-survey unique) `key`
// rather than by array position.
export async function createDefaultSurveyQuestions(
  prisma: PrismaClient,
  surveyId: string,
  stateId: string,
  opts?: DefaultQuestionOpts
) {
  const parties = await getStatePartiesForSurvey(prisma, stateId);
  const questionDefs = buildDefaultQuestionDefs(opts);

  await prisma.$transaction(async (tx) => {
    const createdQuestions = await tx.surveyQuestion.createManyAndReturn({
      data: questionDefs.map((qd) => ({ surveyId, ...qd })),
    });
    const questionIdByKey = new Map(createdQuestions.map((q) => [q.key, q.id]));
    const optionRows = buildDefaultOptionRows(questionIdByKey, parties);
    await tx.surveyOption.createMany({ data: optionRows });
  });
}

// Idempotent, upsert-based variant of createDefaultSurveyQuestions for a
// Survey that may already have SOME (but not necessarily all) of its
// default questions/options — the state a Survey is left in if a seed run
// is interrupted (e.g. a dropped database connection) between creating the
// Survey row and this module's own transaction completing. Never deletes
// anything and is always safe to call, including on an already-fully-seeded
// survey (every write becomes a no-op update). Used by prisma/seed.ts to
// resume a seed run without losing or duplicating existing structural data.
// Slower than createDefaultSurveyQuestions (one round trip per question/
// option, not batched) — acceptable because it only ever runs for the rare
// already-partially-seeded case, never for the bulk of untouched surveys.
export async function ensureDefaultSurveyQuestions(
  prisma: PrismaClient,
  surveyId: string,
  stateId: string,
  opts?: DefaultQuestionOpts
) {
  const parties = await getStatePartiesForSurvey(prisma, stateId);
  const questionDefs = buildDefaultQuestionDefs(opts);

  const questionIdByKey = new Map<string, string>();
  for (const qd of questionDefs) {
    const question = await prisma.surveyQuestion.upsert({
      where: { surveyId_key: { surveyId, key: qd.key } },
      update: {},
      create: { surveyId, ...qd },
    });
    questionIdByKey.set(qd.key, question.id);
  }

  const optionRows = buildDefaultOptionRows(questionIdByKey, parties);
  for (const option of optionRows) {
    await prisma.surveyOption.upsert({
      where: { questionId_key: { questionId: option.questionId, key: option.key } },
      update: {},
      create: option,
    });
  }
}
