import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { SurveyValidationDb, SubmissionSurvey, SubmittedSurveyAnswer } from "../src/lib/survey-response-validation";
import type { SurveyCandidateEligibilityRecord } from "../src/lib/survey-eligibility";
import {
  SurveySubmissionValidationError,
  validateSurveySubmission,
} from "../src/lib/survey-response-validation";
import { isCandidateEligibleForSurveyParty } from "../src/lib/survey-eligibility";
import { orderPartiesForSurvey } from "../src/lib/survey-template-data";

const ids = {
  election: "election-a",
  constituency: "constituency-a",
  bjp: "party-bjp",
  sp: "party-sp",
};

function candidate(overrides: Partial<SurveyCandidateEligibilityRecord> = {}): SurveyCandidateEligibilityRecord {
  return {
    electionId: ids.election,
    constituencyId: ids.constituency,
    partyId: ids.bjp,
    status: "DECLARED",
    isActive: true,
    ...overrides,
  };
}

function option(
  id: string,
  key: string,
  partyId: string | null,
  candidateRef: string | null,
  party: { id: string; isActive: boolean } | null = partyId ? { id: partyId, isActive: true } : null
) {
  return { id, key, partyId, candidateRef, party, isActive: true };
}

function survey(overrides: Partial<SubmissionSurvey> = {}): SubmissionSurvey {
  return {
    id: "survey-a",
    electionId: ids.election,
    constituencyId: ids.constituency,
    status: "ACTIVE",
    isActive: true,
    startsAt: null,
    endsAt: null,
    questions: [
      {
        id: "q-party",
        key: "party_preference",
        type: "SINGLE_CHOICE",
        required: true,
        options: [
          option("o-bjp", "bjp", ids.bjp, null),
          option("o-sp", "sp", ids.sp, null),
          option("o-party-other", "other", "party-other", null),
          option("o-undecided", "undecided", "party-undecided", null),
        ],
      },
      {
        id: "q-candidate",
        key: "candidate_choice",
        type: "SINGLE_CHOICE",
        required: false,
        options: [
          option("o-candidate-bjp", "candidate-bjp", ids.bjp, "candidate-bjp"),
          option("o-candidate-sp", "candidate-sp", ids.sp, "candidate-sp"),
          option("o-candidate-other", "other", null, null),
          option("o-candidate-incumbent", "candidate-incumbent", ids.bjp, "candidate-incumbent"),
          option("o-candidate-historical", "candidate-historical", ids.bjp, "candidate-historical"),
          option("o-candidate-inactive", "candidate-inactive", ids.bjp, "candidate-inactive"),
          option("o-candidate-wrong-election", "candidate-wrong-election", ids.bjp, "candidate-wrong-election"),
          option("o-candidate-wrong-constituency", "candidate-wrong-constituency", ids.bjp, "candidate-wrong-constituency"),
        ],
      },
      {
        id: "q-issue",
        key: "top_issue",
        type: "SINGLE_CHOICE",
        required: false,
        options: [option("o-jobs", "jobs", null, null)],
      },
    ],
    ...overrides,
  };
}

function dbFixture(overrides: Record<string, SurveyCandidateEligibilityRecord> = {}, eligiblePool?: SurveyCandidateEligibilityRecord[]) {
  const records: Record<string, SurveyCandidateEligibilityRecord> = {
    "candidate-bjp": candidate(),
    "candidate-sp": candidate({ partyId: ids.sp }),
    "candidate-incumbent": candidate({ status: "INCUMBENT" }),
    "candidate-historical": candidate({ status: "HISTORICAL" }),
    "candidate-inactive": candidate({ isActive: false }),
    "candidate-wrong-election": candidate({ electionId: "election-b" }),
    "candidate-wrong-constituency": candidate({ constituencyId: "constituency-b" }),
    ...overrides,
  };
  const pool = eligiblePool ?? [records["candidate-bjp"]];
  const fake = {
    electionConstituency: {
      findUnique: async () => ({ isActive: true }),
    },
    candidate: {
      findMany: async () => pool,
      findUnique: async ({ where }: { where: { id: string } }) => records[where.id] ?? null,
    },
  };
  return fake as unknown as SurveyValidationDb;
}

const validAnswers: SubmittedSurveyAnswer[] = [
  { questionKey: "party_preference", optionKey: "bjp" },
  { questionKey: "candidate_choice", optionKey: "candidate-bjp" },
];

async function expectInvalid(
  answers: SubmittedSurveyAnswer[],
  options: { targetSurvey?: SubmissionSurvey; db?: SurveyValidationDb; now?: Date } = {}
) {
  await assert.rejects(
    validateSurveySubmission(options.db ?? dbFixture(), options.targetSurvey ?? survey(), answers, options.now),
    SurveySubmissionValidationError
  );
}

test("party-first template contract is represented by order and static requiredness", () => {
  const target = survey();
  assert.equal(target.questions[0].key, "party_preference");
  assert.equal(target.questions[0].required, true);
  assert.equal(target.questions[1].key, "candidate_choice");
  assert.equal(target.questions[1].required, false);
});

test("active canonical parties include Jansatta deterministically with Other and Undecided last", () => {
  const ordered = orderPartiesForSurvey([
    { id: "other", name: "Other", shortName: "Other", slug: "other", displayOrder: 0, isActive: true },
    { id: "bjp", name: "BJP", shortName: "BJP", slug: "bjp", displayOrder: 0, isActive: true },
    {
      id: "jansatta",
      name: "Jansatta Dal Loktantrik Party",
      shortName: "Jansatta Dal Loktantrik Party",
      slug: "jansatta-dal-loktantrik-party",
      displayOrder: 8,
      isActive: true,
    },
    { id: "undecided", name: "Undecided", shortName: "Undecided", slug: "undecided", displayOrder: 1, isActive: true },
    { id: "inactive", name: "Inactive", shortName: "Inactive", slug: "inactive", displayOrder: 2, isActive: false },
  ]);
  assert.deepEqual(ordered.map((party) => party.slug), ["bjp", "jansatta-dal-loktantrik-party", "other", "undecided"]);
});

test("shared eligibility helper accepts only active, same-scope, same-party eligible statuses", () => {
  for (const status of ["DECLARED", "LIKELY", "POSSIBLE"]) {
    assert.equal(isCandidateEligibleForSurveyParty(ids.election, ids.constituency, ids.bjp, candidate({ status })), true);
  }
  for (const status of ["INCUMBENT", "HISTORICAL", "OTHER"]) {
    assert.equal(isCandidateEligibleForSurveyParty(ids.election, ids.constituency, ids.bjp, candidate({ status })), false);
  }
  assert.equal(isCandidateEligibleForSurveyParty(ids.election, ids.constituency, ids.bjp, candidate({ isActive: false })), false);
});

test("valid same-party candidate resolves only option IDs", async () => {
  assert.deepEqual(await validateSurveySubmission(dbFixture(), survey(), validAnswers), [
    { questionId: "q-party", optionId: "o-bjp" },
    { questionId: "q-candidate", optionId: "o-candidate-bjp" },
  ]);
});

test("candidate is conditionally required when an ordinary party has eligible candidates", async () => {
  await expectInvalid([{ questionKey: "party_preference", optionKey: "bjp" }]);
});

test("Other party accepts an absent candidate answer", async () => {
  const result = await validateSurveySubmission(dbFixture(), survey(), [
    { questionKey: "party_preference", optionKey: "other" },
  ]);
  assert.equal(result.length, 1);
});

test("Undecided accepts an absent candidate answer", async () => {
  const result = await validateSurveySubmission(dbFixture(), survey(), [
    { questionKey: "party_preference", optionKey: "undecided" },
  ]);
  assert.equal(result.length, 1);
});

test("zero-candidate party accepts an absent candidate answer", async () => {
  const result = await validateSurveySubmission(dbFixture({}, []), survey(), [
    { questionKey: "party_preference", optionKey: "bjp" },
  ]);
  assert.equal(result.length, 1);
});

test("wrong-party candidate is rejected", async () => {
  await expectInvalid([
    { questionKey: "party_preference", optionKey: "bjp" },
    { questionKey: "candidate_choice", optionKey: "candidate-sp" },
  ]);
});

test("wrong-election candidate is rejected", async () => {
  await expectInvalid([
    { questionKey: "party_preference", optionKey: "bjp" },
    { questionKey: "candidate_choice", optionKey: "candidate-wrong-election" },
  ]);
});

test("wrong-constituency candidate is rejected", async () => {
  await expectInvalid([
    { questionKey: "party_preference", optionKey: "bjp" },
    { questionKey: "candidate_choice", optionKey: "candidate-wrong-constituency" },
  ]);
});

for (const [label, optionKey] of [
  ["INCUMBENT", "candidate-incumbent"],
  ["HISTORICAL", "candidate-historical"],
  ["inactive", "candidate-inactive"],
] as const) {
  test(`${label} candidate is rejected`, async () => {
    await expectInvalid([
      { questionKey: "party_preference", optionKey: "bjp" },
      { questionKey: "candidate_choice", optionKey },
    ]);
  });
}

test("unknown question key is rejected", async () => {
  await expectInvalid([...validAnswers, { questionKey: "unknown", optionKey: "x" }]);
});

test("duplicate answer is rejected", async () => {
  await expectInvalid([...validAnswers, { questionKey: "party_preference", optionKey: "bjp" }]);
});

test("invalid option is rejected", async () => {
  await expectInvalid([{ questionKey: "party_preference", optionKey: "not-an-option" }]);
});

test("choice question with valueText is rejected", async () => {
  await expectInvalid([{ questionKey: "party_preference", valueText: "BJP" }]);
});

test("inactive and closed surveys are rejected", async () => {
  await expectInvalid(validAnswers, { targetSurvey: survey({ isActive: false }) });
  await expectInvalid(validAnswers, { targetSurvey: survey({ status: "CLOSED" }) });
  await expectInvalid(validAnswers, { targetSurvey: survey({ status: "DRAFT" }) });
});

test("survey outside its configured date window is rejected", async () => {
  const now = new Date("2030-01-10T00:00:00.000Z");
  await expectInvalid(validAnswers, {
    targetSurvey: survey({ startsAt: new Date("2030-01-11T00:00:00.000Z") }),
    now,
  });
  await expectInvalid(validAnswers, {
    targetSurvey: survey({ endsAt: new Date("2030-01-09T00:00:00.000Z") }),
    now,
  });
});

test("synthetic Other candidate is accepted only when eligible candidates exist", async () => {
  const otherAnswers = [
    { questionKey: "party_preference", optionKey: "bjp" },
    { questionKey: "candidate_choice", optionKey: "other" },
  ];
  await assert.doesNotReject(validateSurveySubmission(dbFixture(), survey(), otherAnswers));
  await expectInvalid(otherAnswers, { db: dbFixture({}, []) });
});

test("synthetic Other candidate is rejected for Other and Undecided party options", async () => {
  for (const partyKey of ["other", "undecided"]) {
    await expectInvalid([
      { questionKey: "party_preference", optionKey: partyKey },
      { questionKey: "candidate_choice", optionKey: "other" },
    ]);
  }
});

test("inactive party option relation is rejected", async () => {
  const target = survey();
  target.questions[0].options[0].party = { id: ids.bjp, isActive: false };
  await expectInvalid(validAnswers, { targetSurvey: target });
});

test("inactive election-constituency context is rejected", async () => {
  const fake = dbFixture() as unknown as {
    electionConstituency: { findUnique(): Promise<{ isActive: boolean }> };
  };
  fake.electionConstituency.findUnique = async () => ({ isActive: false });
  await expectInvalid(validAnswers, { db: fake as unknown as SurveyValidationDb });
});

test("response route validates before one explicit transaction and does not write answers separately", () => {
  const source = readFileSync(
    path.resolve(__dirname, "../src/app/api/surveys/[surveyId]/responses/route.ts"),
    "utf8"
  );
  assert.ok(source.indexOf("validateSurveySubmission") < source.indexOf("prisma.$transaction"));
  assert.match(source, /prisma\.\$transaction\(async \(tx\)/);
  assert.match(source, /answers:\s*\{\s*create:\s*resolvedAnswers\s*\}/);
  assert.ok(!/prisma\.surveyAnswer\.create/.test(source));
});
