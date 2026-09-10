import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import en from "../src/lib/i18n/locales/en";
import hi from "../src/lib/i18n/locales/hi";
import {
  aggregatePublicAnalytics,
  evaluateResultsVisibility,
  protectPublicCells,
  type PublicAnalyticsInput,
  type PublicAnalyticsResult,
  type PublicDemographicCountInput,
} from "../src/lib/public-analytics-core";
import { MINIMUM_ANALYTICS_CELL_SIZE } from "../src/lib/enums";

const repoRoot = path.resolve(__dirname, "..");
const readSource = (file: string) => readFileSync(path.join(repoRoot, file), "utf8");

const partyOptions: PublicAnalyticsInput["partyOptions"] = [
  { id: "p-bjp", key: "bjp", label: "BJP option", order: 2, isActive: true, partyId: "bjp", party: { id: "bjp", name: "Bharatiya Janata Party", shortName: "BJP", colorHex: "#ff7a21", displayOrder: 0, isActive: true } },
  { id: "p-sp", key: "sp", label: "SP option", order: 1, isActive: true, partyId: "sp", party: { id: "sp", name: "Samajwadi Party", shortName: "SP", colorHex: "#c8102e", displayOrder: 1, isActive: true } },
  { id: "p-other", key: "other", label: "Other", order: 9, isActive: true, partyId: "other-party", party: { id: "other-party", name: "Other / Independent", shortName: "Other", colorHex: "#6b7280", displayOrder: 9, isActive: true } },
  { id: "p-undecided", key: "undecided", label: "Undecided", order: 10, isActive: true, partyId: "undecided-party", party: { id: "undecided-party", name: "Undecided", shortName: "Undecided", colorHex: "#9ca3af", displayOrder: 10, isActive: true } },
];

const candidateOptions: PublicAnalyticsInput["candidateOptions"] = [
  { id: "c-bjp-a", key: "bjp-a", label: "BJP Candidate A", order: 0, isActive: true, partyId: "bjp", candidateRef: "bjp-a" },
  { id: "c-bjp-b", key: "bjp-b", label: "BJP Candidate B", order: 1, isActive: true, partyId: "bjp", candidateRef: "bjp-b" },
  { id: "c-sp-x", key: "sp-x", label: "SP Candidate X", order: 2, isActive: true, partyId: "sp", candidateRef: "sp-x" },
  { id: "c-other", key: "other", label: "Other Candidate", order: 999, isActive: true, partyId: null, candidateRef: null },
];

const candidates: PublicAnalyticsInput["candidates"] = [
  { id: "bjp-a", name: "BJP Candidate A", electionId: "election", constituencyId: "constituency", partyId: "bjp", status: "DECLARED", isActive: true },
  { id: "bjp-b", name: "BJP Candidate B", electionId: "election", constituencyId: "constituency", partyId: "bjp", status: "LIKELY", isActive: true },
  { id: "sp-x", name: "SP Candidate X", electionId: "election", constituencyId: "constituency", partyId: "sp", status: "POSSIBLE", isActive: true },
];

interface ResponseSpec {
  id: string;
  status?: string;
  party?: string;
  candidate?: string;
}

function specs(count: number, party = "p-bjp", candidate = "c-bjp-a", prefix = "r", status = "VALID"): ResponseSpec[] {
  return Array.from({ length: count }, (_, index) => ({ id: `${prefix}-${index}`, status, party, candidate }));
}

function input(
  records: ResponseSpec[],
  overrides: Partial<PublicAnalyticsInput> = {}
): PublicAnalyticsInput {
  return {
    electionId: "election",
    constituencyId: "constituency",
    minRequired: MINIMUM_ANALYTICS_CELL_SIZE,
    responses: records.map((record) => ({ id: record.id, status: record.status ?? "VALID" })),
    preferenceAnswers: records.flatMap((record) => [
      ...(record.party ? [{ responseId: record.id, questionKey: "party_preference" as const, optionId: record.party }] : []),
      ...(record.candidate ? [{ responseId: record.id, questionKey: "candidate_choice" as const, optionId: record.candidate }] : []),
    ]),
    partyOptions,
    candidateOptions,
    candidates,
    demographicCounts: [],
    demographicOptions: [],
    ...overrides,
  };
}

function availableBuckets(result: PublicAnalyticsResult["partyPreference"]) {
  assert.equal(result.state, "available");
  return result.state === "available" ? result.buckets : [];
}

function candidateGroup(result: PublicAnalyticsResult, key: string) {
  const group = result.candidatePreferenceByParty.find((candidate) => candidate.party.key === key);
  assert.ok(group, `missing party group ${key}`);
  return group;
}

test("1. zero valid responses returns no public party results", () => {
  assert.equal(aggregatePublicAnalytics(input([])).partyPreference.state, "unavailable");
});

test("2. 29 valid responses suppress party results", () => {
  assert.equal(aggregatePublicAnalytics(input(specs(29))).partyPreference.state, "suppressed");
});

test("3. 30 valid responses allow party results", () => {
  assert.equal(aggregatePublicAnalytics(input(specs(30))).partyPreference.state, "available");
});

test("4. 31 valid responses allow party results", () => {
  assert.equal(aggregatePublicAnalytics(input(specs(31))).partyPreference.state, "available");
});

test("5. pending responses are excluded", () => {
  const result = aggregatePublicAnalytics(input([...specs(30), ...specs(5, "p-sp", "c-sp-x", "pending", "PENDING")]));
  assert.equal(result.validResponseCount, 30);
  assert.ok(!availableBuckets(result.partyPreference).some((bucket) => bucket.key === "sp"));
});

test("6. rejected responses are excluded", () => {
  const result = aggregatePublicAnalytics(input([...specs(30), ...specs(5, "p-sp", "c-sp-x", "rejected", "REJECTED")]));
  assert.equal(result.validResponseCount, 30);
  assert.ok(!availableBuckets(result.partyPreference).some((bucket) => bucket.key === "sp"));
});

test("7. party percentages use valid party answers as denominator", () => {
  const records = [...specs(30), ...specs(30, "p-sp", "c-sp-x", "sp"), { id: "missing", status: "VALID" }];
  const buckets = availableBuckets(aggregatePublicAnalytics(input(records)).partyPreference);
  const bjpBucket = buckets.find((bucket) => bucket.key === "bjp");
  assert.equal(bjpBucket?.state === "available" ? bjpBucket.percentage : undefined, 50);
});

test("8. party counts match valid answer records", () => {
  const bucket = availableBuckets(aggregatePublicAnalytics(input([...specs(30), ...specs(30, "p-sp", "c-sp-x", "sp")])).partyPreference)
    .find((candidate) => candidate.key === "sp");
  assert.equal(bucket?.state === "available" && bucket.count, 30);
});

test("9. party ordering follows configured Party.displayOrder", () => {
  const buckets = availableBuckets(aggregatePublicAnalytics(input([...specs(30), ...specs(30, "p-sp", "c-sp-x", "sp")])).partyPreference);
  assert.deepEqual(buckets.map((bucket) => bucket.key), ["bjp", "sp"]);
});

test("10. party metadata comes from Party records", () => {
  const bucket = availableBuckets(aggregatePublicAnalytics(input(specs(30))).partyPreference)[0];
  assert.equal(bucket.label, "Bharatiya Janata Party");
  assert.equal(bucket.colorHex, "#ff7a21");
  assert.equal(bucket.partyId, "bjp");
});

test("11. BJP respondents produce only a BJP candidate cohort", () => {
  const group = candidateGroup(aggregatePublicAnalytics(input(specs(30))), "bjp");
  assert.equal(group.distribution.state, "available");
  if (group.distribution.state === "available") assert.deepEqual(group.distribution.buckets.map((bucket) => bucket.key), ["bjp-a"]);
});

test("12. SP respondents produce only an SP candidate cohort", () => {
  const group = candidateGroup(aggregatePublicAnalytics(input(specs(30, "p-sp", "c-sp-x"))), "sp");
  assert.equal(group.distribution.state, "available");
  if (group.distribution.state === "available") assert.deepEqual(group.distribution.buckets.map((bucket) => bucket.key), ["sp-x"]);
});

test("13. a BJP candidate never appears in the SP cohort", () => {
  const group = candidateGroup(aggregatePublicAnalytics(input(specs(30, "p-sp", "c-bjp-a"))), "sp");
  assert.equal(group.distribution.state, "available");
  if (group.distribution.state === "available") assert.ok(!group.distribution.buckets.some((bucket) => bucket.key === "bjp-a"));
});

for (const [number, field, value] of [
  [14, "constituencyId", "other-constituency"],
  [15, "electionId", "other-election"],
  [16, "partyId", "sp"],
] as const) {
  test(`${number}. a candidate with the wrong ${field} is excluded`, () => {
    const altered = candidates.map((candidate) => candidate.id === "bjp-a" ? { ...candidate, [field]: value } : candidate);
    const group = candidateGroup(aggregatePublicAnalytics(input(specs(30), { candidates: altered })), "bjp");
    assert.ok(group.distribution.state !== "available" || !group.distribution.buckets.some((bucket) => bucket.key === "bjp-a"));
  });
}

test("17. an INCUMBENT cannot appear in candidate results", () => {
  const altered = candidates.map((candidate) => candidate.id === "bjp-a" ? { ...candidate, status: "INCUMBENT" } : candidate);
  const group = candidateGroup(aggregatePublicAnalytics(input(specs(30), { candidates: altered })), "bjp");
  assert.ok(group.distribution.state !== "available" || !group.distribution.buckets.some((bucket) => bucket.key === "bjp-a"));
});

test("18. Other party has no candidate distribution", () => {
  assert.deepEqual(candidateGroup(aggregatePublicAnalytics(input(specs(30, "p-other", ""))), "other").distribution, {
    state: "unavailable", reason: "not_applicable", minRequired: 30,
  });
});

test("19. Undecided has no candidate distribution", () => {
  assert.deepEqual(candidateGroup(aggregatePublicAnalytics(input(specs(30, "p-undecided", ""))), "undecided").distribution, {
    state: "unavailable", reason: "not_applicable", minRequired: 30,
  });
});

test("20. missing candidate answers are not converted into Other Candidate", () => {
  const records = [...specs(30), ...specs(30, "p-bjp", "", "missing")];
  const group = candidateGroup(aggregatePublicAnalytics(input(records)), "bjp");
  assert.equal(group.distribution.state, "available");
  if (group.distribution.state === "available") {
    assert.ok(!group.distribution.buckets.some((bucket) => bucket.key === "other"));
    const bucket = group.distribution.buckets.find((candidate) => candidate.key === "bjp-a");
    assert.equal(bucket?.state === "available" && bucket.percentage, 50);
  }
});

test("21. explicit synthetic Other Candidate is counted", () => {
  const records = [...specs(30), ...specs(30, "p-bjp", "c-other", "other")];
  const group = candidateGroup(aggregatePublicAnalytics(input(records)), "bjp");
  assert.equal(group.distribution.state, "available");
  if (group.distribution.state === "available") assert.equal(group.distribution.buckets.find((bucket) => bucket.key === "other")?.state, "available");
});

test("22. candidate bucket 29 is suppressed", () => {
  const records = [...specs(30), ...specs(29, "p-bjp", "c-bjp-b", "b")];
  const group = candidateGroup(aggregatePublicAnalytics(input(records)), "bjp");
  assert.equal(group.distribution.state, "available");
  if (group.distribution.state === "available") assert.equal(group.distribution.buckets.find((bucket) => bucket.key === "bjp-b")?.state, "suppressed");
});

test("23. candidate bucket 30 may display", () => {
  const records = [...specs(30), ...specs(30, "p-bjp", "c-bjp-b", "b")];
  const group = candidateGroup(aggregatePublicAnalytics(input(records)), "bjp");
  assert.equal(group.distribution.state, "available");
  if (group.distribution.state === "available") assert.equal(group.distribution.buckets.find((bucket) => bucket.key === "bjp-b")?.state, "available");
});

test("24. a large party cohort does not override small candidate-cell suppression", () => {
  const records = [...specs(100), ...specs(29, "p-bjp", "c-bjp-b", "small")];
  const group = candidateGroup(aggregatePublicAnalytics(input(records)), "bjp");
  if (group.distribution.state === "available") assert.equal(group.distribution.buckets.find((bucket) => bucket.key === "bjp-b")?.state, "suppressed");
});

test("25. suppressed candidate counts are absent from serialization", () => {
  const result = aggregatePublicAnalytics(input([...specs(30), ...specs(29, "p-bjp", "c-bjp-b", "small")]));
  assert.ok(!JSON.stringify(result).includes('"count":29'));
});

test("26. secondary suppression prevents reconstruction from one hidden cell", () => {
  const cells = protectPublicCells([
    { key: "a", label: "A", displayOrder: 0, count: 40 },
    { key: "b", label: "B", displayOrder: 1, count: 29 },
  ], 69, 30);
  assert.equal(cells.filter((cell) => cell.state === "suppressed").length, 2);
});

function demographicResult(questionKey: PublicDemographicCountInput["questionKey"], low: number, high: number) {
  const options = [
    { id: `${questionKey}-low`, key: "low", label: "Low", order: 0, isActive: true, questionKey },
    { id: `${questionKey}-high`, key: "high", label: "High", order: 1, isActive: true, questionKey },
  ];
  return aggregatePublicAnalytics(input(specs(Math.max(30, low + high)), {
    demographicOptions: options,
    demographicCounts: [
      { questionKey, optionId: options[0].id, count: low },
      { questionKey, optionId: options[1].id, count: high },
    ],
  })).demographics[questionKey];
}

for (const [number, key] of [[27, "gender"], [29, "age_group"], [30, "social_category"], [31, "religion"], [32, "top_issue"]] as const) {
  test(`${number}. ${key} bucket 29 is suppressed`, () => {
    const distribution = demographicResult(key, 29, 30);
    assert.equal(distribution.state, "available");
    if (distribution.state === "available") assert.equal(distribution.buckets.find((bucket) => bucket.key === "low")?.state, "suppressed");
  });
}

test("28. gender bucket 30 may display", () => {
  const distribution = demographicResult("gender", 30, 30);
  assert.equal(distribution.state, "available");
  if (distribution.state === "available") assert.ok(distribution.buckets.every((bucket) => bucket.state === "available"));
});

test("33. restricted compliance mode hides results", () => {
  assert.equal(evaluateResultsVisibility({ isActive: true, status: "ACTIVE" }, { restricted: true }).state, "hidden");
});

test("34. results are hidden before resultsHiddenUntil", () => {
  assert.equal(evaluateResultsVisibility(
    { isActive: true, status: "ACTIVE" },
    { resultsHiddenUntil: "2030-01-02T00:00:00.000Z" },
    new Date("2030-01-01T00:00:00.000Z")
  ).state, "hidden");
});

test("35. results become visible after resultsHiddenUntil", () => {
  assert.equal(evaluateResultsVisibility(
    { isActive: true, status: "ACTIVE" },
    { resultsHiddenUntil: "2030-01-02T00:00:00.000Z" },
    new Date("2030-01-03T00:00:00.000Z")
  ).state, "visible");
});

test("36. public API paths share the same compliance-enforcing loader", () => {
  for (const file of ["src/app/api/constituencies/[slug]/results/route.ts", "src/app/api/constituencies/[slug]/analytics/route.ts"]) {
    assert.match(readSource(file), /getPublicSurveyResults/);
  }
});

test("37. public API routes do not expose SurveyResponse records", () => {
  const routes = readSource("src/app/api/constituencies/[slug]/results/route.ts") + readSource("src/app/api/constituencies/[slug]/analytics/route.ts");
  assert.ok(!routes.includes("surveyResponse"));
});

test("38. public API routes do not expose SurveyAnswer records", () => {
  const routes = readSource("src/app/api/constituencies/[slug]/results/route.ts") + readSource("src/app/api/constituencies/[slug]/analytics/route.ts");
  assert.ok(!routes.includes("surveyAnswer"));
});

test("39. public DTO contains no IP or fingerprint metadata", () => {
  const serialized = JSON.stringify(aggregatePublicAnalytics(input(specs(30))));
  for (const forbidden of ["ipHash", "fingerprint", "responseId", "respondentId"]) assert.ok(!serialized.includes(forbidden));
});

test("40. suppressed buckets omit count and percentage fields", () => {
  const protectedCells = protectPublicCells([{ key: "x", label: "X", displayOrder: 0, count: 29 }], 30, 30);
  assert.equal(protectedCells[0].state, "suppressed");
  assert.ok(!("count" in protectedCells[0]));
  assert.ok(!("percentage" in protectedCells[0]));
});

test("41. URL parameters cannot lower the privacy threshold", () => {
  const routes = readSource("src/app/api/constituencies/[slug]/results/route.ts") + readSource("src/app/api/constituencies/[slug]/analytics/route.ts");
  assert.ok(!/searchParams\.get\(["'`](threshold|minCellSize|minimum)["'`]\)/.test(routes));
});

test("42. clients cannot request arbitrary hidden analytics", () => {
  const route = readSource("src/app/api/constituencies/[slug]/analytics/route.ts");
  assert.ok(!/searchParams\.get\(["'`](dimension|target)["'`]\)/.test(route));
});

test("UI zero/insufficient/party/candidate states are explicit and localized", () => {
  const source = readSource("src/components/results/PublicResultsView.tsx");
  for (const token of ["isZeroState", "isInsufficient", "partyPreference", "candidatePreferenceByParty", "candidateNotApplicable"]) {
    assert.ok(source.includes(token));
  }
  assert.ok(hi.results.zeroTitle && hi.results.insufficientTitle && hi.results.candidateAmongParty);
  assert.ok(en.results.zeroTitle && en.results.insufficientTitle && en.results.candidateAmongParty);
});

test("UI uses a party selector and never embeds illustrative production percentages", () => {
  const source = readSource("src/components/results/PublicResultsView.tsx");
  assert.match(source, /<select/);
  for (const fake of ["38.4%", "32.1%", "32,458"]) assert.ok(!source.includes(fake));
});

test("public results UI contains no election winner, final-result, or prediction claims", () => {
  const sources = [readSource("src/components/results/PublicResultsView.tsx"), hi.results.notElectionResult, en.results.notElectionResult].join("\n").toLowerCase();
  for (const forbidden of ["election winner", "who will win", "final result", "confirmed result"]) assert.ok(!sources.includes(forbidden));
});
