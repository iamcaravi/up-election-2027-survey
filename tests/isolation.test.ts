// Multi-state / multi-election data isolation invariants.
// Runs against an ephemeral SQLite database (never prisma/dev.db) seeded
// with two states that deliberately share slugs/numbers, to prove lookups
// never cross-contaminate. See tests/helpers/fixtures.ts.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { setupTestDb, teardownTestDb } from "./helpers/testDb";
import { seedFixtures, createResponses } from "./helpers/fixtures";
import type { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;
let dbPath: string;
let fx: Awaited<ReturnType<typeof seedFixtures>>;
let dataLib: typeof import("../src/lib/data");
let analyticsLib: typeof import("../src/lib/analytics");
let surveySyncLib: typeof import("../src/lib/survey-sync");
let candidateImportLib: typeof import("../src/lib/candidate-import");

before(async () => {
  const db = setupTestDb("test-isolation");
  prisma = db.prisma;
  dbPath = db.dbPath;
  process.env.DATABASE_URL = `file:${dbPath}`;
  process.env.SESSION_SECRET ??= "test-secret-not-for-prod";

  // Dynamic import so these modules' singleton PrismaClient (src/lib/prisma.ts)
  // is constructed only after DATABASE_URL points at the test database.
  dataLib = await import("../src/lib/data");
  analyticsLib = await import("../src/lib/analytics");
  surveySyncLib = await import("../src/lib/survey-sync");
  candidateImportLib = await import("../src/lib/candidate-import");

  fx = await seedFixtures(prisma);
});

after(async () => {
  // src/lib/prisma.ts's singleton is a second connection to the same file
  // (used internally by dataLib/analyticsLib) — it must be closed too or
  // Windows keeps the file locked and deletion fails.
  const { prisma: appPrisma } = await import("../src/lib/prisma");
  await appPrisma.$disconnect();
  await teardownTestDb(prisma, dbPath);
});

test("1. state isolation: same election slug in two states resolves independently", async () => {
  const resultA = await dataLib.getStateAndElection("test-state-alpha", "test-election-2030");
  const resultB = await dataLib.getStateAndElection("test-state-beta", "test-election-2030");
  assert.equal(resultA?.election?.id, fx.electionA.id);
  assert.equal(resultB?.election?.id, fx.electionB.id);
  assert.notEqual(resultA?.election?.id, resultB?.election?.id);
});

test("2. election/state isolation: election belonging to another state is not returned", async () => {
  // electionB has stateId = stateB, but we ask for it under stateA's slug.
  const result = await dataLib.getStateAndElection("test-state-alpha", "test-election-2030");
  assert.equal(result?.election?.stateId, fx.stateA.id);
  assert.notEqual(result?.election?.stateId, fx.stateB.id);
});

test("3. district isolation: same district slug in two states resolves to the correct state's district", async () => {
  const districtA = await dataLib.getDistrictBySlug("test-state-alpha", "district-one", fx.electionA.id);
  const districtB = await dataLib.getDistrictBySlug("test-state-beta", "district-one", fx.electionB.id);
  assert.equal(districtA?.id, fx.districtA.id);
  assert.equal(districtB?.id, fx.districtB.id);
  assert.notEqual(districtA?.id, districtB?.id);
  // Each district's constituency list must only contain its own state's constituency.
  assert.ok(districtA!.constituencies.some((c) => c.id === fx.constituencyA.id));
  assert.ok(!districtA!.constituencies.some((c) => c.id === fx.constituencyB.id));
});

test("4. constituency/district isolation: identical (number, slug) in two states never collide", async () => {
  const cA = await dataLib.getConstituencyBySlug("test-state-alpha", "central", "test-election-2030");
  const cB = await dataLib.getConstituencyBySlug("test-state-beta", "central", "test-election-2030");
  assert.equal(cA?.id, fx.constituencyA.id);
  assert.equal(cB?.id, fx.constituencyB.id);
  // Candidates must not leak across states despite the identical slug/number.
  assert.ok(cA!.candidates.some((c) => c.id === fx.candidateA.id));
  assert.ok(!cA!.candidates.some((c) => c.id === fx.candidateB.id));
  assert.ok(cB!.candidates.some((c) => c.id === fx.candidateB.id));
  assert.ok(!cB!.candidates.some((c) => c.id === fx.candidateA.id));
});

test("5. ElectionConstituency validation: unlinked constituency 404s on the election-scoped page, and is excluded from the district listing", async () => {
  const direct = await dataLib.getConstituencyBySlug("test-state-alpha", "unlinked", "test-election-2030");
  assert.equal(direct, null);

  const district = await dataLib.getDistrictBySlug("test-state-alpha", "district-one", fx.electionA.id);
  assert.ok(!district!.constituencies.some((c) => c.id === fx.constituencyAUnlinked.id));
  assert.ok(district!.constituencies.some((c) => c.id === fx.constituencyA.id));
});

test("5b. ElectionConstituency duplicates are impossible (unique constraint)", async () => {
  await assert.rejects(() =>
    prisma.electionConstituency.create({
      data: { electionId: fx.electionA.id, constituencyId: fx.constituencyA.id },
    })
  );
});

test("6. candidate election/constituency validation: resolves the correct election even with colliding slugs", async () => {
  // constituencyA is linked to two elections (electionA, year 2030, and
  // electionA2, year 2035) — the most recent must win, and it must never
  // resolve to stateB's election despite the colliding slug/number.
  const electionForA = await dataLib.getActiveElectionForConstituency(fx.constituencyA.id);
  const electionForB = await dataLib.getActiveElectionForConstituency(fx.constituencyB.id);
  assert.equal(electionForA?.id, fx.electionA2.id);
  assert.equal(electionForB?.id, fx.electionB.id);
  assert.notEqual(electionForA?.stateId, fx.stateB.id);
});

test("7. survey/results aggregation isolation: results for one election never include another election's responses", async () => {
  await createResponses(prisma, fx.surveyA.id, fx.constituencyA.id, fx.questionA.id, fx.optionA.id, 5);
  await createResponses(prisma, fx.surveyB.id, fx.constituencyB.id, fx.questionB.id, fx.optionB.id, 3);

  const resultsA = await analyticsLib.getConstituencyResults(fx.constituencyA.id, fx.electionA.id);
  assert.equal(resultsA?.candidateResult?.total, 5);

  // Same constituency id under the WRONG election must find no matching survey.
  const wrongScope = await analyticsLib.getConstituencyResults(fx.constituencyA.id, fx.electionB.id);
  assert.equal(wrongScope, null);
});

test("8. minimum sample suppression: below-threshold results are marked insufficient, at-threshold are not", async () => {
  const results = await analyticsLib.getConstituencyResults(fx.constituencyA.id, fx.electionA.id);
  // 5 responses seeded above, default minimum is 30.
  assert.equal(results?.candidateResult?.sufficientSample, false);

  await createResponses(prisma, fx.surveyA.id, fx.constituencyA.id, fx.questionA.id, fx.optionA.id, 25);
  const topped = await analyticsLib.getConstituencyResults(fx.constituencyA.id, fx.electionA.id);
  assert.equal(topped?.candidateResult?.total, 30);
  assert.equal(topped?.candidateResult?.sufficientSample, true);
});

test("9. legacy 'uttar-pradesh' default-slug fallback resolves independently of the other test states", async () => {
  const { districts } = await dataLib.getDistricts("uttar-pradesh");
  assert.equal(districts.length, 1);
  assert.equal(districts[0].id, fx.districtUP.id);
});

test("10. syncCandidateChoiceOptions never mixes candidates across two elections sharing the same constituency", async () => {
  // constituencyA contests both electionA and electionA2 — sync each
  // election's survey and verify neither pulls in the other's candidate.
  await surveySyncLib.syncCandidateChoiceOptions(fx.constituencyA.id, fx.electionA.id);
  await surveySyncLib.syncCandidateChoiceOptions(fx.constituencyA.id, fx.electionA2.id);

  const optionsA = await prisma.surveyOption.findMany({ where: { questionId: fx.questionA.id } });
  const optionsA2 = await prisma.surveyOption.findMany({ where: { questionId: fx.questionA2.id } });

  assert.ok(optionsA.some((o) => o.candidateRef === fx.candidateA.id));
  assert.ok(!optionsA.some((o) => o.candidateRef === fx.candidateA2.id));

  assert.ok(optionsA2.some((o) => o.candidateRef === fx.candidateA2.id));
  assert.ok(!optionsA2.some((o) => o.candidateRef === fx.candidateA.id));
});

test("12. CSV candidate import: missing state_slug fails validation instead of assuming Uttar Pradesh", async () => {
  const result = await candidateImportLib.resolveImportConstituency(
    prisma,
    { constituency_number: String(fx.constituencyA.number) }, // no state_slug
    fx.constituencyA.number
  );
  assert.equal(result.constituency, null);
  assert.ok(result.errors.some((e) => e.includes("state_slug is required")));
});

test("12b. CSV candidate import: valid state_slug resolves the correct state's constituency", async () => {
  const result = await candidateImportLib.resolveImportConstituency(
    prisma,
    { state_slug: "test-state-alpha", constituency_number: String(fx.constituencyA.number) },
    fx.constituencyA.number
  );
  assert.equal(result.errors.length, 0);
  assert.equal(result.constituency?.id, fx.constituencyA.id);

  // Same number, different (correct) state — must resolve to B, not A,
  // proving state_slug actually disambiguates the collision.
  const resultB = await candidateImportLib.resolveImportConstituency(
    prisma,
    { state_slug: "test-state-beta", constituency_number: String(fx.constituencyB.number) },
    fx.constituencyB.number
  );
  assert.equal(resultB.errors.length, 0);
  assert.equal(resultB.constituency?.id, fx.constituencyB.id);
});

test("11. statewide top-issues aggregation is scoped to a single election, not global", async () => {
  const issueQuestionA = await prisma.surveyQuestion.create({
    data: { surveyId: fx.surveyA.id, key: "top_issue", label: "Issue", required: false, allowSkip: true },
  });
  const issueOptionA = await prisma.surveyOption.create({
    data: { questionId: issueQuestionA.id, key: "roads", label: "Roads" },
  });
  const issueQuestionB = await prisma.surveyQuestion.create({
    data: { surveyId: fx.surveyB.id, key: "top_issue", label: "Issue", required: false, allowSkip: true },
  });
  const issueOptionB = await prisma.surveyOption.create({
    data: { questionId: issueQuestionB.id, key: "jobs", label: "Jobs" },
  });

  await createResponses(prisma, fx.surveyA.id, fx.constituencyA.id, issueQuestionA.id, issueOptionA.id, 3);
  await createResponses(prisma, fx.surveyB.id, fx.constituencyB.id, issueQuestionB.id, issueOptionB.id, 3);

  const issuesA = await analyticsLib.getStatewideTopIssues(fx.electionA.id, 10);
  assert.equal(issuesA.total, 3);
  assert.ok(issuesA.issues.some((i) => i.key === "roads"));
  assert.ok(!issuesA.issues.some((i) => i.key === "jobs"));
});
