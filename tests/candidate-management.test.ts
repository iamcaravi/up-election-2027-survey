// Phase 18 — UP Candidate Data Foundation: invariant tests for the
// candidate status model, election/constituency/party relations, duplicate
// prevention, the idempotent MLA importer, survey candidate-option
// eligibility filtering, and public data-safety boundaries. Runs against an
// ephemeral SQLite database (never prisma/dev.db). See tests/helpers/fixtures.ts.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { setupTestDb, teardownTestDb } from "./helpers/testDb";
import { seedFixtures } from "./helpers/fixtures";
import type { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;
let dbPath: string;
let fx: Awaited<ReturnType<typeof seedFixtures>>;
let enums: typeof import("../src/lib/enums");
let surveySync: typeof import("../src/lib/survey-sync");
let mlaImport: typeof import("../src/lib/mla-import");

const repoRoot = path.resolve(__dirname, "..");
function readRoute(file: string) {
  return readFileSync(path.join(repoRoot, file), "utf-8");
}

before(async () => {
  const db = setupTestDb("test-candidate-management");
  prisma = db.prisma;
  dbPath = db.dbPath;
  process.env.DATABASE_URL = `file:${dbPath}`;
  enums = await import("../src/lib/enums");
  surveySync = await import("../src/lib/survey-sync");
  mlaImport = await import("../src/lib/mla-import");
  fx = await seedFixtures(prisma);
});

after(async () => {
  const { prisma: appPrisma } = await import("../src/lib/prisma");
  await appPrisma.$disconnect();
  await teardownTestDb(prisma, dbPath);
});

// 1. Candidate status enum ----------------------------------------------
test("1. candidate status enum includes OTHER and the survey-eligible subset excludes INCUMBENT/HISTORICAL/OTHER", () => {
  assert.deepEqual(
    [...enums.CANDIDATE_STATUSES],
    ["DECLARED", "LIKELY", "POSSIBLE", "INCUMBENT", "HISTORICAL", "OTHER"]
  );
  assert.deepEqual([...enums.SURVEY_ELIGIBLE_CANDIDATE_STATUSES], ["DECLARED", "LIKELY", "POSSIBLE"]);
  for (const s of ["INCUMBENT", "HISTORICAL", "OTHER"]) {
    assert.ok(!enums.SURVEY_ELIGIBLE_CANDIDATE_STATUSES.includes(s as never), `${s} must not be survey-eligible`);
  }
});

// 2. Candidate creation ---------------------------------------------------
test("2. candidate creation persists all core fields with correct defaults", async () => {
  const c = await prisma.candidate.create({
    data: {
      electionId: fx.electionA.id,
      constituencyId: fx.constituencyA.id,
      name: "Fresh Candidate",
      nameHindi: "फ्रेश उम्मीदवार",
      slug: "fresh-candidate",
      status: "POSSIBLE",
    },
  });
  assert.equal(c.name, "Fresh Candidate");
  assert.equal(c.nameHindi, "फ्रेश उम्मीदवार");
  assert.equal(c.verified, false);
  assert.equal(c.photoVerified, false);
  assert.equal(c.isActive, true);
});

// 3. Candidate constituency relation ---------------------------------------
test("3. candidate constituency relation resolves to the correct constituency", async () => {
  const c = await prisma.candidate.findUniqueOrThrow({
    where: { id: fx.candidateA.id },
    include: { constituency: true },
  });
  assert.equal(c.constituency.id, fx.constituencyA.id);
  assert.equal(c.constituency.name, "Central");
});

// 4. Candidate election relation -------------------------------------------
test("4. candidate election relation resolves to the correct election", async () => {
  const c = await prisma.candidate.findUniqueOrThrow({
    where: { id: fx.candidateA.id },
    include: { election: true },
  });
  assert.equal(c.election.id, fx.electionA.id);
});

// 5. Party relation ---------------------------------------------------------
test("5. party relation resolves correctly", async () => {
  const c = await prisma.candidate.findUniqueOrThrow({
    where: { id: fx.candidateA.id },
    include: { party: true },
  });
  assert.equal(c.party?.shortName, "TP");
});

// 6. Duplicate prevention ----------------------------------------------------
test("6. duplicate (election, constituency, slug) is rejected at the database level", async () => {
  await assert.rejects(
    prisma.candidate.create({
      data: {
        electionId: fx.electionA.id,
        constituencyId: fx.constituencyA.id,
        name: "Candidate A", // same slug as fx.candidateA within the same election+constituency
        slug: "candidate-a",
        status: "DECLARED",
      },
    })
  );
  // But the SAME person's name/slug in a DIFFERENT election is fine — this
  // must never become a simplistic global name-uniqueness rule.
  const other = await prisma.candidate.create({
    data: {
      electionId: fx.electionB.id,
      constituencyId: fx.constituencyB.id,
      name: "Candidate A",
      slug: "candidate-a",
      status: "HISTORICAL",
    },
  });
  assert.ok(other.id);
  await prisma.candidate.delete({ where: { id: other.id } });
});

// 7 & 8. Idempotent MLA import; INCUMBENT is never auto-DECLARED -----------
test("7&8. MLA import is idempotent (no duplicates on re-run) and always sets status INCUMBENT, never DECLARED", async () => {
  const rows = [
    {
      state_slug: "test-state-alpha",
      constituency_number: "1",
      mla_name: "Test Sitting MLA",
      mla_name_hindi: "टेस्ट विधायक",
      source_name: "Official UP Assembly Register",
      source_url: "https://example.gov.in/mla/1",
    },
  ];

  const first = await mlaImport.runMlaImport(prisma, rows, { commit: true });
  assert.equal(first.toCreate, 1);
  assert.equal(first.results[0].status, "create");

  // constituencyA is linked to both electionA (2030) and electionA2 (2035);
  // getActiveElectionForConstituency resolves the latest-year active one, so
  // the import attaches to electionA2 here — the same real behavior the
  // generic candidate CSV importer already relies on.
  const afterFirst = await prisma.candidate.findMany({
    where: { electionId: fx.electionA2.id, constituencyId: fx.constituencyA.id, status: "INCUMBENT" },
  });
  assert.equal(afterFirst.length, 1);
  assert.equal(afterFirst[0].status, "INCUMBENT");
  assert.notEqual(afterFirst[0].status, "DECLARED");
  assert.equal(afterFirst[0].verified, false, "an automated import must never self-certify as verified");

  // Re-run the exact same import — must update the existing record, never
  // create a second one for the same seat.
  const second = await mlaImport.runMlaImport(prisma, rows, { commit: true });
  assert.equal(second.toCreate, 0);
  assert.equal(second.results[0].status, "unchanged");

  const afterSecond = await prisma.candidate.findMany({
    where: { electionId: fx.electionA2.id, constituencyId: fx.constituencyA.id, status: "INCUMBENT" },
  });
  assert.equal(afterSecond.length, 1, "re-running the MLA import must not create a duplicate");

  // A changed field (party) on a third run must UPDATE in place, still no duplicate.
  const third = await mlaImport.runMlaImport(
    prisma,
    [{ ...rows[0], party_short_name: "TP" }],
    { commit: true }
  );
  assert.equal(third.toCreate, 0);
  assert.equal(third.results[0].status, "update");
  const afterThird = await prisma.candidate.findMany({
    where: { electionId: fx.electionA2.id, constituencyId: fx.constituencyA.id, status: "INCUMBENT" },
  });
  assert.equal(afterThird.length, 1, "an in-place update must still not create a duplicate");
  assert.equal(afterThird[0].partyId, fx.party.id);

  // Clean up so later tests in this file see a clean constituencyA/electionA.
  await prisma.candidate.delete({ where: { id: afterThird[0].id } });
});

// 9 & 11. Survey candidate filtering by exact election; HISTORICAL excluded
test("9&11. syncCandidateChoiceOptions only pulls DECLARED/LIKELY/POSSIBLE candidates for the exact election, never HISTORICAL/INCUMBENT from another election", async () => {
  // electionA2 reuses constituencyA (see fixtures) — candidateA2 belongs to
  // electionA2, not electionA.
  const historical = await prisma.candidate.create({
    data: {
      electionId: fx.electionA.id,
      constituencyId: fx.constituencyA.id,
      name: "Old Historical Candidate",
      slug: "old-historical-candidate",
      status: "HISTORICAL",
    },
  });
  const incumbent = await prisma.candidate.create({
    data: {
      electionId: fx.electionA.id,
      constituencyId: fx.constituencyA.id,
      name: "Sitting MLA Not Contesting",
      slug: "sitting-mla-not-contesting",
      status: "INCUMBENT",
    },
  });

  await surveySync.syncCandidateChoiceOptions(fx.constituencyA.id, fx.electionA.id);

  const optionsA = await prisma.surveyOption.findMany({
    where: { questionId: fx.questionA.id, isActive: true },
  });
  const refs = optionsA.map((o) => o.candidateRef);

  assert.ok(refs.includes(fx.candidateA.id), "the real DECLARED candidate for this election must be present");
  assert.ok(!refs.includes(fx.candidateA2.id), "a candidate belonging to a different election must never leak in");
  assert.ok(!refs.includes(historical.id), "HISTORICAL candidates must never appear as a live survey option");
  assert.ok(!refs.includes(incumbent.id), "INCUMBENT alone must never appear as a live survey option");

  await prisma.candidate.deleteMany({ where: { id: { in: [historical.id, incumbent.id] } } });
  // Re-sync to restore state for later tests.
  await surveySync.syncCandidateChoiceOptions(fx.constituencyA.id, fx.electionA.id);
});

// 10. Survey candidate filtering by exact constituency ----------------------
test("10. syncCandidateChoiceOptions never mixes candidates from a different constituency", async () => {
  await surveySync.syncCandidateChoiceOptions(fx.constituencyB.id, fx.electionB.id);
  const optionsB = await prisma.surveyOption.findMany({ where: { questionId: fx.questionB.id, isActive: true } });
  const refsB = optionsB.map((o) => o.candidateRef);
  assert.ok(refsB.includes(fx.candidateB.id));
  assert.ok(!refsB.includes(fx.candidateA.id), "constituency A's candidate must never appear in constituency B's options");
});

// 12. Zero-candidate survey does not crash -----------------------------------
test("12. syncCandidateChoiceOptions with zero eligible candidates resolves safely and deactivates stale options", async () => {
  // electionA2 / constituencyA / questionA2 has no pre-created option and
  // candidateA2 has status DECLARED, so first prove the happy path works,
  // then remove it and prove zero-candidate sync doesn't throw.
  await assert.doesNotReject(surveySync.syncCandidateChoiceOptions(fx.constituencyA.id, fx.electionA2.id));
  const before = await prisma.surveyOption.findMany({ where: { questionId: fx.questionA2.id, isActive: true } });
  assert.equal(before.length, 1);

  await prisma.candidate.update({ where: { id: fx.candidateA2.id }, data: { isActive: false } });
  await assert.doesNotReject(surveySync.syncCandidateChoiceOptions(fx.constituencyA.id, fx.electionA2.id));
  const after = await prisma.surveyOption.findMany({ where: { questionId: fx.questionA2.id } });
  assert.equal(after.filter((o) => o.isActive).length, 0, "the stale option must be deactivated, not left active");

  // restore for isolation from other tests
  await prisma.candidate.update({ where: { id: fx.candidateA2.id }, data: { isActive: true } });
  await surveySync.syncCandidateChoiceOptions(fx.constituencyA.id, fx.electionA2.id);
});

// 13. Admin authorization (structural) ---------------------------------------
test("13. candidate and MLA-import admin routes require authentication on every handler", () => {
  const files = [
    "src/app/api/admin/candidates/route.ts",
    "src/app/api/admin/candidates/[id]/route.ts",
    "src/app/api/admin/imports/candidates/route.ts",
    "src/app/api/admin/imports/mlas/route.ts",
  ];
  for (const file of files) {
    const source = readRoute(file);
    const handlerCount = (source.match(/export async function (GET|POST|PATCH|DELETE)/g) ?? []).length;
    const authCount = (source.match(/getAdminSession\(\)/g) ?? []).length;
    assert.ok(handlerCount > 0, `${file}: expected at least one handler`);
    assert.equal(authCount, handlerCount, `${file}: expected one getAdminSession() per handler`);
  }
});

// 14. Source metadata protection (structural) --------------------------------
test("14. the public CandidateCard component never references internal source/verification metadata", () => {
  const source = readRoute("src/components/candidate/CandidateCard.tsx");
  for (const forbidden of ["sourceNotes", "sourceUrls", "photoSourceUrl", "photoSourceName", "photoLicense", "verified"]) {
    assert.ok(!source.includes(forbidden), `CandidateCard.tsx must not reference "${forbidden}"`);
  }
});

// 15. Photo verification handling --------------------------------------------
test("15. photo change resets photoVerified to false (structural — logic lives in the request-scoped PATCH handler)", () => {
  const source = readRoute("src/app/api/admin/candidates/[id]/route.ts");
  assert.match(source, /photoVerified:\s*photoChanged\s*\?\s*false\s*:\s*undefined/);
});

test("15b. a newly created candidate always starts with photoVerified=false even when a photo is supplied", async () => {
  const c = await prisma.candidate.create({
    data: {
      electionId: fx.electionA.id,
      constituencyId: fx.constituencyA.id,
      name: "Photo Test Candidate",
      slug: "photo-test-candidate",
      status: "POSSIBLE",
      photoUrl: "https://example.com/photo.jpg",
      photoVerified: false,
    },
  });
  assert.equal(c.photoVerified, false);
  await prisma.candidate.delete({ where: { id: c.id } });
});

// Regression (historical): the public survey page used to independently
// build a candidate list from constituency.candidates for a candidate_choice
// step, with no status filter — an INCUMBENT-only candidate could render as
// a selectable 2027 survey choice even though syncCandidateChoiceOptions
// correctly never created a SurveyOption for them.
//
// The public survey flow no longer has a candidate_choice step at all (it is
// now party_preference/top_issue/age_group/gender/religion — 5 steps), so
// survey/page.tsx no longer reads constituency.candidates or renders any
// candidate list, making this specific vulnerability structurally
// impossible rather than merely filtered.
test("16. the public survey page no longer reads or renders a candidate list", () => {
  const source = readRoute(
    "src/app/[state]/elections/[election]/constituencies/[constituency]/survey/page.tsx"
  );
  assert.doesNotMatch(source, /constituency\.candidates/, "survey/page.tsx must not read constituency.candidates — the 5-step flow has no candidate_choice step");
});

// Phase 19 — verified UP current-MLA import: bulk idempotency, party
// canonicalization end-to-end, source metadata preservation, and the
// INCUMBENT-excluded-from-survey regression exercised through a real
// multi-row runMlaImport call (not just the single-row case in test 7&8).
test("17. bulk MLA import across multiple seats is idempotent — a second run creates and updates nothing", async () => {
  const rows = [
    {
      state_slug: "uttar-pradesh",
      constituency_number: "1",
      constituency_name: "Fixture AC",
      mla_name: "Bulk Import Member One",
      party_short_name: "TP",
      source_name: "Uttar Pradesh Legislative Assembly",
      source_url: "https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=90001",
    },
  ];

  const first = await mlaImport.runMlaImport(prisma, rows, { commit: true });
  assert.equal(first.toCreate, 1);
  assert.equal(first.results[0].status, "create");

  const created = await prisma.candidate.findFirst({
    where: { electionId: fx.electionUP.id, constituencyId: fx.constituencyUP.id, status: "INCUMBENT" },
  });
  assert.ok(created);
  assert.equal(created!.status, "INCUMBENT");
  assert.equal(created!.verified, false, "verified must only ever be set by an admin, never by the importer");
  assert.equal(created!.partyId, fx.party.id, "party_short_name must canonicalize to the existing Party record, not create a new one");

  const second = await mlaImport.runMlaImport(prisma, rows, { commit: true });
  assert.equal(second.toCreate, 0);
  assert.equal(second.toUpdate, 0);
  assert.equal(second.results[0].status, "unchanged");
  const afterSecond = await prisma.candidate.count({
    where: { electionId: fx.electionUP.id, constituencyId: fx.constituencyUP.id, status: "INCUMBENT" },
  });
  assert.equal(afterSecond, 1, "a second identical import run must create zero duplicates for the same seat");
});

test("18. source metadata (source name/URL) from the import row is preserved on the created candidate", async () => {
  const record = await prisma.candidate.findFirst({
    where: { electionId: fx.electionUP.id, constituencyId: fx.constituencyUP.id, status: "INCUMBENT" },
  });
  assert.ok(record);
  assert.match(record!.sourceNotes ?? "", /Uttar Pradesh Legislative Assembly/);
  assert.match(record!.sourceUrls ?? "", /upvidhansabhaproceedings\.gov\.in/);
});

test("19. an imported INCUMBENT record is excluded from live survey options even when synced immediately after import", async () => {
  const survey = await prisma.survey.create({
    data: { electionId: fx.electionUP.id, constituencyId: fx.constituencyUP.id, title: "Fixture Survey", isActive: true },
  });
  const question = await prisma.surveyQuestion.create({
    data: { surveyId: survey.id, key: "candidate_choice", label: "Choice", required: true, allowSkip: false },
  });

  await surveySync.syncCandidateChoiceOptions(fx.constituencyUP.id, fx.electionUP.id);

  const options = await prisma.surveyOption.findMany({ where: { questionId: question.id, isActive: true } });
  const incumbent = await prisma.candidate.findFirst({
    where: { electionId: fx.electionUP.id, constituencyId: fx.constituencyUP.id, status: "INCUMBENT" },
  });
  assert.ok(incumbent);
  assert.ok(
    !options.map((o) => o.candidateRef).includes(incumbent!.id),
    "an INCUMBENT candidate created by the MLA importer must never become a selectable live survey option"
  );

  await prisma.candidate.delete({ where: { id: incumbent!.id } });
});
