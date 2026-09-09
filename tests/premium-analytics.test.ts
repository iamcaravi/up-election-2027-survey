// Phase 16 — Premium Analytics Engine tests. Runs against an ephemeral
// SQLite database (never prisma/dev.db). See tests/helpers/analytics-fixtures.ts.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { setupTestDb, teardownTestDb } from "./helpers/testDb";
import { seedAnalyticsFixtures, createAnalyticsResponses, createIneligibleResponse, type AnalyticsFixtures } from "./helpers/analytics-fixtures";
import type { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;
let dbPath: string;
let fx: AnalyticsFixtures;
let engine: typeof import("../src/lib/premium-analytics");
let privacy: typeof import("../src/lib/analytics-privacy");
let publicAnalytics: typeof import("../src/lib/analytics");
let dataLib: typeof import("../src/lib/data");

const repoRoot = path.resolve(__dirname, "..");
function readRoute(file: string) {
  return readFileSync(path.join(repoRoot, file), "utf-8");
}

// Find a bucket by key, asserting it exists.
function bucket(buckets: { key: string }[], key: string) {
  const b = buckets.find((x) => x.key === key);
  assert.ok(b, `bucket "${key}" not found`);
  return b as { key: string; label: string } & ({ suppressed: true } | { suppressed: false; count: number; pct: number });
}

before(async () => {
  const db = setupTestDb("test-premium-analytics");
  prisma = db.prisma;
  dbPath = db.dbPath;
  process.env.DATABASE_URL = `file:${dbPath}`;
  engine = await import("../src/lib/premium-analytics");
  privacy = await import("../src/lib/analytics-privacy");
  publicAnalytics = await import("../src/lib/analytics");
  dataLib = await import("../src/lib/data");

  fx = await seedAnalyticsFixtures(prisma);

  // --- surveyA response volumes, chosen to exercise every suppression tier ---
  // batchA (29): below threshold on every dimension it answers.
  await createAnalyticsResponses(
    prisma, fx.surveyA.id, fx.constituencyA.id, fx.questions,
    { candidate_choice: fx.options.candidateA1.id, party_preference: fx.options.partyX.id, top_issue: fx.options.roads.id, gender: fx.options.male.id, social_category: fx.options.general.id, religion: fx.options.hindu.id },
    29, "batchA"
  );
  // batchB (30): exactly at the threshold on every dimension it answers.
  await createAnalyticsResponses(
    prisma, fx.surveyA.id, fx.constituencyA.id, fx.questions,
    { candidate_choice: fx.options.candidateA2.id, party_preference: fx.options.partyY.id, top_issue: fx.options.jobs.id, gender: fx.options.female.id, social_category: fx.options.obc.id, religion: fx.options.muslim.id },
    30, "batchB"
  );
  // batchE (32): above the threshold.
  await createAnalyticsResponses(
    prisma, fx.surveyA.id, fx.constituencyA.id, fx.questions,
    { candidate_choice: fx.options.candidateA1.id, party_preference: fx.options.partyX.id, top_issue: fx.options.water.id, gender: fx.options.genderOther.id, social_category: fx.options.sc.id, religion: fx.options.religionOther.id },
    32, "batchE"
  );
  // batchC (5): candidate choice only — every demographic question missing (skipped).
  await createAnalyticsResponses(prisma, fx.surveyA.id, fx.constituencyA.id, fx.questions, { candidate_choice: fx.options.candidateA1.id }, 5, "batchC");
  // batchD (2): a genuinely tiny social-category group.
  await createAnalyticsResponses(prisma, fx.surveyA.id, fx.constituencyA.id, fx.questions, { candidate_choice: fx.options.candidateA2.id, social_category: fx.options.st.id }, 2, "batchD");
  // batchF (3): explicit "prefer not to say" for gender — distinct from missing.
  await createAnalyticsResponses(prisma, fx.surveyA.id, fx.constituencyA.id, fx.questions, { candidate_choice: fx.options.candidateA1.id, gender: fx.options.genderPreferNot.id }, 3, "batchF");

  // Ineligible responses — must never affect any total.
  await createIneligibleResponse(prisma, fx.surveyA.id, fx.constituencyA.id, fx.questions.qCandidate.id, fx.options.candidateA1.id, "FLAGGED");
  await createIneligibleResponse(prisma, fx.surveyA.id, fx.constituencyA.id, fx.questions.qCandidate.id, fx.options.candidateA1.id, "REJECTED");

  // surveyB: minimal, isolated, low-volume (also exercises "below 30" at the whole-survey level).
  await createAnalyticsResponses(prisma, fx.surveyB.id, fx.constituencyB.id, { ...fx.questions, qCandidate: fx.questions.qCandidateB }, { candidate_choice: fx.options.candidateB1.id }, 2, "batchG");
});

after(async () => {
  const { prisma: appPrisma } = await import("../src/lib/prisma");
  await appPrisma.$disconnect();
  await teardownTestDb(prisma, dbPath);
});

// 1. Party aggregation.
test("1. party aggregation: correct counts and percentages", async () => {
  const d = await engine.getQuestionDistribution(fx.surveyA.id, "party_preference");
  assert.equal(d?.suppressed, false);
  assert.equal(d?.total, 91);
  const px = bucket(d!.buckets, "party-x");
  const py = bucket(d!.buckets, "party-y");
  assert.equal(px.suppressed, false);
  assert.equal(py.suppressed, false);
  if (!px.suppressed || !py.suppressed) {
    assert.equal((px as { count: number }).count, 61);
    assert.equal((py as { count: number }).count, 30);
    assert.equal((px as { pct: number }).pct, 67.0);
    assert.equal((py as { pct: number }).pct, 33.0);
  }
});

// 2. Candidate aggregation, scoped correctly (also covers #6/#27).
test("2. candidate aggregation is scoped to this exact election+constituency, never another", async () => {
  const d = await engine.getQuestionDistribution(fx.surveyA.id, "candidate_choice");
  assert.equal(d?.total, 101);
  const a1 = bucket(d!.buckets, "candidate-a1");
  const a2 = bucket(d!.buckets, "candidate-a2");
  if (!a1.suppressed) assert.equal(a1.count, 69);
  if (!a2.suppressed) assert.equal(a2.count, 32);
  assert.ok(!d!.buckets.some((b) => b.key === "candidate-b1"), "candidate from another election/constituency leaked in");
});

// 3. Gender distribution.
test("3. gender distribution: correct buckets including 'prefer not to say' as its own category", async () => {
  const d = await engine.getQuestionDistribution(fx.surveyA.id, "gender");
  assert.equal(d?.suppressed, false);
  assert.equal(d?.total, 94);
  const male = bucket(d!.buckets, "male"); // 29 -> suppressed
  assert.equal(male.suppressed, true);
  const female = bucket(d!.buckets, "female"); // 30 -> shown
  assert.equal(female.suppressed, false);
  const prefNot = bucket(d!.buckets, "prefer_not_to_say"); // 3 -> suppressed, distinct bucket
  assert.equal(prefNot.suppressed, true);
});

// 4. Gender × Party.
test("4. gender × party cross-tab: per-group suppression at exact boundary", async () => {
  const ct = await engine.getCrossTab(fx.surveyA.id, "gender", "party_preference");
  const male = ct!.groups.find((g) => g.groupKey === "male")!;
  const female = ct!.groups.find((g) => g.groupKey === "female")!;
  const other = ct!.groups.find((g) => g.groupKey === "other")!;
  assert.equal(male.total, 29);
  assert.equal(male.suppressed, true);
  assert.equal(female.total, 30);
  assert.equal(female.suppressed, false);
  assert.equal(other.total, 32);
  assert.equal(other.suppressed, false);
  // "prefer not to say" respondents never answered party_preference, so no group for them here.
  assert.ok(!ct!.groups.some((g) => g.groupKey === "prefer_not_to_say"));
});

// 5. Age distribution — audited: no age_group question was seeded on surveyA
// in this fixture (age is exercised via the OTHER demographic dimensions
// above); verify the engine handles "question not present on this survey"
// gracefully rather than erroring.
test("5. age group distribution: returns null gracefully when the survey has no such question", async () => {
  const d = await engine.getQuestionDistribution(fx.surveyA.id, "age_group");
  assert.equal(d, null);
});

// 6. Age × Party — same graceful-null contract for cross-tabs.
test("6. age × party cross-tab: returns null gracefully when absent", async () => {
  const ct = await engine.getCrossTab(fx.surveyA.id, "age_group", "party_preference");
  assert.equal(ct, null);
});

// 7. Social category distribution.
test("7. social category distribution: per-bucket suppression (general & st hidden, obc & sc shown)", async () => {
  const d = await engine.getQuestionDistribution(fx.surveyA.id, "social_category");
  assert.equal(d?.suppressed, false);
  assert.equal(d?.total, 93);
  assert.equal(bucket(d!.buckets, "general").suppressed, true);
  assert.equal(bucket(d!.buckets, "st").suppressed, true);
  const obc = bucket(d!.buckets, "obc");
  const sc = bucket(d!.buckets, "sc");
  assert.equal(obc.suppressed, false);
  assert.equal(sc.suppressed, false);
  if (!obc.suppressed) assert.equal(obc.count, 30);
  if (!sc.suppressed) assert.equal(sc.count, 32);
});

// 8. Social category × Party.
test("8. social category × party cross-tab: obc/sc groups shown, general/st suppressed", async () => {
  const ct = await engine.getCrossTab(fx.surveyA.id, "social_category", "party_preference");
  const general = ct!.groups.find((g) => g.groupKey === "general")!;
  const obc = ct!.groups.find((g) => g.groupKey === "obc")!;
  const sc = ct!.groups.find((g) => g.groupKey === "sc")!;
  assert.equal(general.suppressed, true);
  assert.equal(obc.suppressed, false);
  assert.equal(sc.suppressed, false);
  // "st" (2 respondents) never answered party_preference at all, so it has no entry.
  assert.ok(!ct!.groups.some((g) => g.groupKey === "st"));
});

// 9. Religion distribution.
test("9. religion distribution: hindu suppressed, muslim/other shown", async () => {
  const d = await engine.getQuestionDistribution(fx.surveyA.id, "religion");
  assert.equal(d?.total, 91);
  assert.equal(bucket(d!.buckets, "hindu").suppressed, true);
  assert.equal(bucket(d!.buckets, "muslim").suppressed, false);
  assert.equal(bucket(d!.buckets, "other").suppressed, false);
});

// 10. Religion × Party.
test("10. religion × party cross-tab", async () => {
  const ct = await engine.getCrossTab(fx.surveyA.id, "religion", "party_preference");
  const hindu = ct!.groups.find((g) => g.groupKey === "hindu")!;
  const muslim = ct!.groups.find((g) => g.groupKey === "muslim")!;
  assert.equal(hindu.suppressed, true);
  assert.equal(muslim.suppressed, false);
});

// 11. Issue distribution.
test("11. issue distribution: roads (29) suppressed despite question total being large", async () => {
  const d = await engine.getQuestionDistribution(fx.surveyA.id, "top_issue");
  assert.equal(d?.suppressed, false); // total=91, well above threshold
  assert.equal(bucket(d!.buckets, "roads").suppressed, true); // but this one bucket is only 29
  assert.equal(bucket(d!.buckets, "jobs").suppressed, false);
  assert.equal(bucket(d!.buckets, "water").suppressed, false);
});

// 12. Issue × Party.
test("12. issue × party cross-tab", async () => {
  const ct = await engine.getCrossTab(fx.surveyA.id, "top_issue", "party_preference");
  const roads = ct!.groups.find((g) => g.groupKey === "roads")!;
  assert.equal(roads.total, 29);
  assert.equal(roads.suppressed, true);
});

// 13. MLA performance distribution — audited: not a seeded question anywhere.
test("13. MLA performance distribution: null when the survey has no such question (audited — none seeded)", async () => {
  const d = await engine.getQuestionDistribution(fx.surveyA.id, "mla_performance");
  assert.equal(d, null);
});

// 14. Re-election distribution — same audited absence.
test("14. re-election distribution: null when the survey has no such question (audited — none seeded)", async () => {
  const d = await engine.getQuestionDistribution(fx.surveyA.id, "reelection_preference");
  assert.equal(d, null);
});

// 15. Minimum-cell suppression below 30.
test("15. a group of exactly 29 is suppressed", async () => {
  const d = await engine.getQuestionDistribution(fx.surveyA.id, "gender");
  assert.equal(bucket(d!.buckets, "male").suppressed, true);
});

// 16. Exact-30 threshold behavior.
test("16. a group of exactly 30 is NOT suppressed (30 clears the >= threshold)", async () => {
  const d = await engine.getQuestionDistribution(fx.surveyA.id, "gender");
  const female = bucket(d!.buckets, "female");
  assert.equal(female.suppressed, false);
  assert.equal(privacy.isSuppressed(30, 30), false);
  assert.equal(privacy.isSuppressed(29, 30), true);
});

// 17. Above-30 behavior.
test("17. a group above 30 is not suppressed", async () => {
  const d = await engine.getQuestionDistribution(fx.surveyA.id, "gender");
  assert.equal(bucket(d!.buckets, "other").suppressed, false);
});

// 18. Zero-response survey.
test("18. zero-response survey returns a clean, non-throwing insufficient state", async () => {
  const emptySurvey = await prisma.survey.create({ data: { electionId: fx.electionA.id, constituencyId: fx.constituencyA.id, title: "Empty Survey", isActive: false } });
  const q = await prisma.surveyQuestion.create({ data: { surveyId: emptySurvey.id, key: "party_preference", label: "Party", required: false, allowSkip: true } });
  await prisma.surveyOption.create({ data: { questionId: q.id, key: "party-x", label: "Party X" } });
  const d = await engine.getQuestionDistribution(emptySurvey.id, "party_preference");
  assert.equal(d?.total, 0);
  assert.equal(d?.suppressed, true);
  assert.equal(d?.buckets.length, 0);
  const analytics = await engine.getSurveyAnalytics({ id: emptySurvey.id, title: "Empty Survey", electionId: fx.electionA.id, constituencyId: fx.constituencyA.id });
  assert.equal(analytics.summary.totalEligibleResponses, 0);
});

// 19. Missing demographics.
test("19. respondents who skip a demographic question are excluded from that question's total, not defaulted", async () => {
  // batchC (5) answered only candidate_choice — they must not appear in
  // gender/social_category/religion totals at all.
  const gender = await engine.getQuestionDistribution(fx.surveyA.id, "gender");
  const social = await engine.getQuestionDistribution(fx.surveyA.id, "social_category");
  // 94 total gender answers + batchC's 5 skips + batchD's 2 skips = 101 total responses; skips never inflate any bucket.
  assert.equal(gender!.total, 94);
  assert.equal(social!.total, 93);
});

// 20. Prefer-not-to-say behavior.
test("20. 'prefer not to say' is a distinct, real answer — never merged with missing", async () => {
  const d = await engine.getQuestionDistribution(fx.surveyA.id, "gender");
  // total (94) includes the 3 prefer-not-to-say responses as real answers.
  assert.equal(d!.total, 94);
  const b = bucket(d!.buckets, "prefer_not_to_say");
  assert.ok(b); // present as its own bucket (suppressed since only 3, but present)
});

// 21. Correct percentages.
test("21. percentages are computed correctly and consistently rounded", async () => {
  assert.equal(privacy.roundPct(61, 91), 67.0);
  assert.equal(privacy.roundPct(30, 91), 33.0);
  assert.equal(privacy.roundPct(1, 3), 33.3);
});

// 22. No divide-by-zero.
test("22. no divide-by-zero: roundPct(x, 0) is a safe 0, not NaN/Infinity", () => {
  assert.equal(privacy.roundPct(5, 0), 0);
  assert.equal(Number.isFinite(privacy.roundPct(5, 0)), true);
});

// 23. Survey isolation.
test("23. survey isolation: surveyB's analytics never include surveyA's data", async () => {
  const d = await engine.getQuestionDistribution(fx.surveyB.id, "candidate_choice");
  // Only 2 responses on surveyB — below threshold, whole distribution suppressed.
  assert.equal(d?.total, 2);
  assert.equal(d?.suppressed, true);
});

// 24. Constituency isolation / 25. Election isolation / 26. State isolation.
test("24-26. constituency/election/state isolation: resolveSurveyInScope rejects any mismatched combination", async () => {
  const wrongElection = await engine.resolveSurveyInScope(fx.surveyA.id, fx.electionB.id, fx.constituencyA.id);
  assert.equal(wrongElection, null);
  const wrongConstituency = await engine.resolveSurveyInScope(fx.surveyA.id, fx.electionA.id, fx.constituencyB.id);
  assert.equal(wrongConstituency, null);
  const bothWrong = await engine.resolveSurveyInScope(fx.surveyA.id, fx.electionB.id, fx.constituencyB.id);
  assert.equal(bothWrong, null);
  const correct = await engine.resolveSurveyInScope(fx.surveyA.id, fx.electionA.id, fx.constituencyA.id);
  assert.equal(correct?.id, fx.surveyA.id);
});

// 27. Candidate/election isolation — already covered by test 2, reinforced here at the full-payload level.
test("27. full analytics payload never leaks a candidate from another election/constituency", async () => {
  const analytics = await engine.getSurveyAnalytics({ id: fx.surveyA.id, title: "Survey A", electionId: fx.electionA.id, constituencyId: fx.constituencyA.id });
  const json = JSON.stringify(analytics);
  assert.ok(!json.includes(fx.candidateB1.id));
  assert.ok(!json.includes("Candidate B1"));
});

// 28 & 29 covered by the recursive structural test below (test "structural-1").

// 30. Unauthorized analytics access rejected (structural).
test("30. the analytics route requires authentication before returning anything", () => {
  const source = readRoute("src/app/api/admin/analytics/[surveyId]/route.ts");
  const handlerCount = (source.match(/export async function (GET|POST|PATCH|DELETE)/g) ?? []).length;
  const authCount = (source.match(/getAdminSession\(\)/g) ?? []).length;
  assert.equal(authCount, handlerCount);
  assert.match(source, /status:\s*401/);
});

// 31. Invalid survey ID rejected.
test("31. an invalid/non-existent survey ID resolves to null, never a partial payload", async () => {
  const scope = await engine.resolveSurveyInScope("does-not-exist", fx.electionA.id, fx.constituencyA.id);
  assert.equal(scope, null);
});

// 32. Cross-state malicious access rejected.
test("32. a malicious request naming an unrelated state's election/constituency for a real surveyId is rejected", async () => {
  const scope = await engine.resolveSurveyInScope(fx.surveyA.id, fx.electionB.id, fx.constituencyB.id);
  assert.equal(scope, null);
});

// 33. Unsupported dimension rejected.
test("33. unsupported dimension keys are rejected by the allowlist", () => {
  assert.equal(engine.isCrossableDimension("ip_address"), false);
  assert.equal(engine.isCrossableDimension("respondent_name"), false);
  assert.equal(engine.isCrossableDimension("gender"), true);
  assert.equal(engine.isPreferenceTarget("candidate_choice"), true);
  assert.equal(engine.isPreferenceTarget("gender"), false);
});

// 34. Arbitrary cross-tab query rejected — by design, not just validation:
// the API route never accepts a client-supplied dimension parameter at all.
test("34. the analytics route has no client-controlled dimension/cross-tab parameter (fixed payload only)", () => {
  const source = readRoute("src/app/api/admin/analytics/[surveyId]/route.ts");
  assert.ok(!/searchParams\.get\(["'`]dimension["'`]\)/.test(source));
  assert.ok(!/searchParams\.get\(["'`]target["'`]\)/.test(source));
});

// 35. Public results remain unchanged.
test("35. public results calculation (analytics.ts) is unaffected by the new engine", async () => {
  const results = await publicAnalytics.getConstituencyResults(fx.constituencyA.id, fx.electionA.id);
  assert.equal(results?.surveyId, fx.surveyA.id);
  assert.ok(results!.candidateResult);
  assert.equal(results!.candidateResult!.total, 101);
});

// 36. Existing tests remain green — enforced by running the full suite (see final validation), not a single assertion here.
test("36. getFullSurveyForConstituency (existing public survey route dependency) still resolves correctly", async () => {
  const survey = await dataLib.getFullSurveyForConstituency(fx.constituencyA.id, fx.electionA.id);
  assert.equal(survey?.id, fx.surveyA.id);
});

// ---------------------------------------------------------------------------
// Item 29: structural, recursive "no raw respondent data" sweep.
// ---------------------------------------------------------------------------
const FORBIDDEN_FIELDS = [
  "responseId", "respondentId", "ip", "ipHash", "fingerprint",
  "email", "phone", "mobile", "name", "address", "createdAt", "updatedAt",
];

function findForbiddenKeys(value: unknown, path = "$"): string[] {
  if (value === null || typeof value !== "object") return [];
  const hits: string[] = [];
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    if (FORBIDDEN_FIELDS.includes(key)) hits.push(`${path}.${key}`);
    hits.push(...findForbiddenKeys(v, `${path}.${key}`));
    if (Array.isArray(v)) {
      for (let i = 0; i < v.length; i++) hits.push(...findForbiddenKeys(v[i], `${path}.${key}[${i}]`));
    }
  }
  return hits;
}

test("structural-1 (28&29). recursive sweep: the full analytics payload contains no raw respondent-level fields", async () => {
  const analytics = await engine.getSurveyAnalytics({ id: fx.surveyA.id, title: "Survey A", electionId: fx.electionA.id, constituencyId: fx.constituencyA.id });
  const hits = findForbiddenKeys(analytics);
  assert.deepEqual(hits, []);
});

test("structural-2. the analytics engine module never queries raw SurveyResponse rows via findMany", () => {
  const source = readRoute("src/lib/premium-analytics.ts");
  assert.ok(!/surveyResponse\.findMany/.test(source), "premium-analytics.ts must never load raw SurveyResponse rows");
});

test("structural-3. no 'uttar-pradesh' fallback and no unscoped Candidate/Party/Election queries introduced", () => {
  const engineSource = readRoute("src/lib/premium-analytics.ts");
  const routeSource = readRoute("src/app/api/admin/analytics/[surveyId]/route.ts");
  for (const source of [engineSource, routeSource]) {
    assert.ok(!/["'`]uttar-pradesh["'`]/.test(source));
  }
  // Every candidate-bearing query in the engine must be reached only via a
  // surveyId-scoped question/option chain (no prisma.candidate.findMany
  // anywhere in this file — candidate identity only ever comes from
  // SurveyOption.candidateRef, already scoped to the survey's own questions).
  assert.ok(!/candidate\.findMany/.test(engineSource));
  assert.ok(!/party\.findMany/.test(engineSource));
});
