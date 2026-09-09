// Phase 15 — Survey Administration: invariant tests for admin survey
// CRUD, election/constituency validation, candidate option scoping, and
// public-route regression checks. Runs against an ephemeral SQLite
// database (never prisma/dev.db). See tests/helpers/fixtures.ts.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { setupTestDb, teardownTestDb } from "./helpers/testDb";
import { seedFixtures, createResponses } from "./helpers/fixtures";
import type { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;
let dbPath: string;
let fx: Awaited<ReturnType<typeof seedFixtures>>;
let guards: typeof import("../src/lib/admin-guards");
let surveyTemplate: typeof import("../src/lib/survey-template");
let surveySync: typeof import("../src/lib/survey-sync");
let dataLib: typeof import("../src/lib/data");
let analyticsLib: typeof import("../src/lib/analytics");

const repoRoot = path.resolve(__dirname, "..");
function readRoute(file: string) {
  return readFileSync(path.join(repoRoot, file), "utf-8");
}

before(async () => {
  const db = setupTestDb("test-survey-admin");
  prisma = db.prisma;
  dbPath = db.dbPath;
  // Must be set before any dynamic import touching the src/lib/prisma
  // singleton, or it binds to whatever DATABASE_URL this process inherited.
  process.env.DATABASE_URL = `file:${dbPath}`;
  guards = await import("../src/lib/admin-guards");
  surveyTemplate = await import("../src/lib/survey-template");
  surveySync = await import("../src/lib/survey-sync");
  dataLib = await import("../src/lib/data");
  analyticsLib = await import("../src/lib/analytics");
  fx = await seedFixtures(prisma);
});

after(async () => {
  const { prisma: appPrisma } = await import("../src/lib/prisma");
  await appPrisma.$disconnect();
  await teardownTestDb(prisma, dbPath);
});

test("1&2. survey list and creation both require authentication (structural)", () => {
  const listCreate = readRoute("src/app/api/admin/surveys/route.ts");
  const detail = readRoute("src/app/api/admin/surveys/[id]/route.ts");
  for (const [file, source] of [["route.ts", listCreate], ["[id]/route.ts", detail]] as const) {
    const handlerCount = (source.match(/export async function (GET|POST|PATCH|DELETE)/g) ?? []).length;
    const authCount = (source.match(/getAdminSession\(\)/g) ?? []).length;
    assert.equal(authCount, handlerCount, `surveys/${file}: expected one getAdminSession() per handler`);
  }
});

test("3. survey list rejects a missing state scope (structural — required, not defaulted)", () => {
  const source = readRoute("src/app/api/admin/surveys/route.ts");
  assert.match(source, /Missing required \?stateId=/);
  assert.ok(!/stateId\s*=\s*req\.nextUrl\.searchParams\.get\([^)]+\)\s*\?\?/.test(source));
});

test("4. survey creation rejects an invalid (non-existent) election", async () => {
  const blocker = await guards.assertElectionConstituencyMembership(prisma, "does-not-exist", fx.constituencyA.id);
  assert.ok(blocker);
  assert.match(blocker!.error, /not found/);
});

test("5. election from another state is rejected", async () => {
  const blocker = await guards.assertElectionConstituencyMembership(prisma, fx.electionA.id, fx.constituencyB.id);
  assert.ok(blocker);
});

test("6. district from another state is rejected (constituency creation path)", async () => {
  const blocker = await guards.assertDistrictInState(prisma, fx.stateB.id, fx.districtA.id);
  assert.ok(blocker);
});

test("7. constituency from another state is rejected", async () => {
  const blocker = await guards.assertElectionConstituencySameState(prisma, fx.electionB.id, fx.constituencyA.id);
  assert.ok(blocker);
  assert.match(blocker!.error, /different state/);
});

test("8. a constituency's district must match its own recorded district (no cross-district substitution)", async () => {
  // constituencyA genuinely belongs to districtA — verify that positively,
  // and verify the same guard rejects the wrong (districtB) pairing that a
  // malicious/buggy client could otherwise submit alongside constituencyA's state.
  const ok = await guards.assertDistrictInState(prisma, fx.constituencyA.stateId, fx.districtA.id);
  assert.equal(ok, null);
  const blocker = await guards.assertDistrictInState(prisma, fx.constituencyA.stateId, fx.districtB.id);
  assert.ok(blocker);
});

test("9. missing ElectionConstituency mapping is rejected", async () => {
  const blocker = await guards.assertElectionConstituencyMembership(prisma, fx.electionA.id, fx.constituencyAUnlinked.id);
  assert.ok(blocker);
  assert.match(blocker!.error, /not an active part/);
});

test("10. inactive ElectionConstituency mapping is rejected", async () => {
  const blocker = await guards.assertElectionConstituencyMembership(prisma, fx.electionA.id, fx.constituencyADisabled.id);
  assert.ok(blocker);
  assert.match(blocker!.error, /not an active part/);
});

test("11. survey cannot mix election and constituency from different states", async () => {
  const blocker = await guards.assertElectionConstituencyMembership(prisma, fx.electionA2.id, fx.constituencyB.id);
  assert.ok(blocker);
});

test("12&13. candidate options are scoped to election+constituency; a candidate from another election cannot enter survey options", async () => {
  // Build a real survey via the same template used by admin creation, then
  // sync candidate options exactly as the POST /api/admin/surveys route does.
  const survey = await prisma.survey.create({
    data: { electionId: fx.electionA.id, constituencyId: fx.constituencyA.id, title: "Test Survey Alpha", isActive: true },
  });
  // electionA/constituencyA already has an active survey in the fixture
  // (fx.surveyA) — disable it first so this new one doesn't violate the
  // one-active-survey-per-pair rule the admin API also enforces.
  await prisma.survey.update({ where: { id: fx.surveyA.id }, data: { isActive: false } });

  await surveyTemplate.createDefaultSurveyQuestions(prisma, survey.id);
  await surveySync.syncCandidateChoiceOptions(fx.constituencyA.id, fx.electionA.id);

  const question = await prisma.surveyQuestion.findFirst({ where: { surveyId: survey.id, key: "candidate_choice" } });
  const options = await prisma.surveyOption.findMany({ where: { questionId: question!.id } });

  assert.ok(options.some((o) => o.candidateRef === fx.candidateA.id));
  // candidateA2 belongs to electionA2 (a different election, same
  // constituency) and must never appear in electionA's survey options.
  assert.ok(!options.some((o) => o.candidateRef === fx.candidateA2.id));
  // candidateB belongs to a different state/constituency entirely.
  assert.ok(!options.some((o) => o.candidateRef === fx.candidateB.id));

  await prisma.survey.update({ where: { id: fx.surveyA.id }, data: { isActive: true } });
});

test("14. survey edit cannot change election/constituency (schema-level immutability)", () => {
  const source = readRoute("src/app/api/admin/surveys/[id]/route.ts");
  const updateSchemaBlock = source.slice(source.indexOf("const updateSchema"), source.indexOf("});") + 3);
  assert.ok(!/electionId/.test(updateSchemaBlock), "updateSchema must not accept electionId");
  assert.ok(!/constituencyId/.test(updateSchemaBlock), "updateSchema must not accept constituencyId");
});

test("15. survey with responses cannot be hard-deleted", async () => {
  const blockerWithResponses = await guards.getSurveyDeletionBlockers(prisma, fx.surveyA.id);
  assert.ok(blockerWithResponses === null); // no responses yet at this point in the suite

  await createResponses(prisma, fx.surveyA.id, fx.constituencyA.id, fx.questionA.id, fx.optionA.id, 1);
  const blocker = await guards.getSurveyDeletionBlockers(prisma, fx.surveyA.id);
  assert.ok(blocker);
  assert.match(blocker!.error, /responses must never be destroyed/);
});

test("16. disabling a survey does not delete its responses", async () => {
  const before = await prisma.surveyResponse.count({ where: { surveyId: fx.surveyA.id } });
  assert.ok(before > 0); // seeded by the previous test

  await prisma.survey.update({ where: { id: fx.surveyA.id }, data: { isActive: false } });
  const after = await prisma.surveyResponse.count({ where: { surveyId: fx.surveyA.id } });
  assert.equal(after, before);

  await prisma.survey.update({ where: { id: fx.surveyA.id }, data: { isActive: true } });
});

test("17. survey mutation routes create audit records (structural)", () => {
  const listCreate = readRoute("src/app/api/admin/surveys/route.ts");
  const detail = readRoute("src/app/api/admin/surveys/[id]/route.ts");
  assert.match(listCreate, /logAudit\(\{[\s\S]*?action:\s*"CREATE"/);
  assert.match(detail, /logAudit\(\{[\s\S]*?action:\s*"UPDATE"/);
  assert.match(detail, /logAudit\(\{[\s\S]*?action:\s*"DELETE"/);
});

test("18. existing candidate admin hierarchy remains valid", async () => {
  const election = await dataLib.getActiveElectionForConstituency(fx.constituencyA.id);
  // constituencyA is linked to both electionA and electionA2 — most recent
  // (electionA2, year 2035) must still win, same invariant as Phase 14.
  assert.equal(election?.id, fx.electionA2.id);
});

test("19. existing public survey route remains valid", async () => {
  const survey = await dataLib.getFullSurveyForConstituency(fx.constituencyA.id, fx.electionA.id);
  assert.equal(survey?.id, fx.surveyA.id);
  assert.ok(survey!.questions.some((q) => q.key === "candidate_choice"));
});

test("20. existing public results route remains valid", async () => {
  const results = await analyticsLib.getConstituencyResults(fx.constituencyA.id, fx.electionA.id);
  assert.equal(results?.surveyId, fx.surveyA.id);
  assert.ok(results!.candidateResult);
});

test("21. no Uttar Pradesh fallback introduced in the new survey routes", () => {
  const files = ["src/app/api/admin/surveys/route.ts", "src/app/api/admin/surveys/[id]/route.ts"];
  for (const file of files) {
    const source = readRoute(file);
    assert.ok(!/["'`]uttar-pradesh["'`]/.test(source), `${file} must never hard-code a default state`);
  }
});

test("22. admin survey list/detail never expose raw SurveyResponse data", () => {
  const listCreate = readRoute("src/app/api/admin/surveys/route.ts");
  const detail = readRoute("src/app/api/admin/surveys/[id]/route.ts");
  for (const [name, source] of [["route.ts", listCreate], ["[id]/route.ts", detail]] as const) {
    assert.ok(!/surveyResponse\.findMany/.test(source), `${name} must not query raw SurveyResponse rows`);
    // "responses: true" is only safe inside a `_count: { select: {...} }`
    // block (an aggregate count) — strip those blocks out first, then make
    // sure no standalone `responses: true` relation-include remains.
    const withoutCountBlocks = source.replace(/_count:\s*\{\s*select:\s*\{[^}]*\}\s*\}/g, "");
    assert.ok(!/responses:\s*true/.test(withoutCountBlocks), `${name} must not include the raw responses relation`);
    assert.match(source, /_count/, `${name} should expose only an aggregate response count`);
  }
});
