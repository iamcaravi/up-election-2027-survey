import { test } from "node:test";
import assert from "node:assert/strict";
import { buildScopedAnalysis, type Dataset, type OptionMeta, type QuestionKey, type ResolvedScope, type ResponseRecord, type ScopeParams } from "../src/lib/scoped-survey";
import {
  analysisExtras,
  buildContext,
  compareAreas,
  crossAnalysis,
  isAllStatesScope,
  issueDeepDive,
  loadAnalysisContext,
  periodComparison,
  reportableFindings,
  resolveAnalysisScope,
  resolvePeriods,
  timeSeries,
} from "../src/lib/analysis-engine";
import { askData } from "../src/lib/analysis-ask";
import { readAnalysisParams, readReportModules, analysisQuery } from "../src/lib/analysis-params";
import { analysisModules } from "../src/lib/analysis-modules";

// Small in-memory fixture (test-only) — exercises the Analysis engine without
// a database. Two districts, three constituencies, 40 responses over 20 days.

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse("2026-09-30T12:00:00+05:30");

const OPTIONS: Record<QuestionKey, [string, string][]> = {
  party_preference: [["bjp", "BJP"], ["sp", "SP"], ["inc", "INC"]],
  mla_satisfaction: [["satisfied", "हाँ"], ["somewhat_satisfied", "कुछ"], ["dissatisfied", "नहीं"], ["undecided", "कह नहीं सकते"]],
  top_issue: [["rojgar", "रोजगार"], ["mahangai", "महंगाई"], ["sadak", "सड़क"]],
  age_group: [["18-24", "18–24"], ["25-34", "25–34"], ["35-44", "35–44"]],
  gender: [["male", "पुरुष"], ["female", "महिला"]],
  social_category: [["general", "सामान्य"], ["obc", "ओबीसी"]],
  religion: [["hindu", "हिंदू"], ["muslim", "मुस्लिम"]],
};

function fixture(): Dataset {
  const meta = Object.fromEntries(
    Object.entries(OPTIONS).map(([q, opts]) => [q, new Map<string, OptionMeta>(opts.map(([key, label], i) => [key, { key, label, order: i }]))])
  ) as Dataset["meta"];
  const records: ResponseRecord[] = [];
  for (let i = 0; i < 40; i++) {
    const c = i % 3 === 0 ? "c3" : i % 2 === 0 ? "c1" : "c2";
    records.push({
      createdAt: NOW - (i % 20) * DAY,
      stateId: "S",
      districtId: c === "c3" ? "d2" : "d1",
      constituencyId: c,
      answers: {
        party_preference: [i % 4 === 0 ? "sp" : "bjp"],
        top_issue: i % 2 ? ["rojgar", "sadak"] : ["mahangai"],
        // The MLA question only exists for the last 10 days.
        ...(i % 20 < 10 ? { mla_satisfaction: [i % 3 ? "satisfied" : "dissatisfied"] } : {}),
        age_group: [i % 3 === 0 ? "18-24" : "25-34"],
        gender: [i % 5 === 0 ? "female" : "male"],
        social_category: [i % 2 ? "obc" : "general"],
      },
    });
  }
  return {
    records,
    meta,
    activeSurveyConstituencies: new Set(["c1", "c2", "c3"]),
    stateNames: new Map([["S", "उत्तर प्रदेश"]]),
    districtNames: new Map([["d1", "गोंडा"], ["d2", "लखनऊ"]]),
    constituencyInfo: new Map([
      ["c1", { name: "कर्नलगंज", districtId: "d1", number: 298 }],
      ["c2", { name: "गोंडा", districtId: "d1", number: 301 }],
      ["c3", { name: "मलिहाबाद", districtId: "d2", number: 168 }],
    ]),
    totalStates: 1,
    totalConstituencies: 3,
    totalDistricts: 2,
    areaNames: {
      districts: [
        { id: "d1", slug: "gonda", name: "Gonda" },
        { id: "d2", slug: "lucknow", name: "Lucknow" },
      ],
      constituencies: [
        { id: "c1", slug: "colonelganj", name: "Colonelganj" },
        { id: "c2", slug: "gonda", name: "Gonda" },
        { id: "c3", slug: "malihabad", name: "Malihabad" },
      ],
    },
  };
}

const STATE_SCOPE: ResolvedScope = {
  level: "state",
  params: { state: "uttar-pradesh" },
  state: { id: "S", slug: "uttar-pradesh", name: "उत्तर प्रदेश" },
  election: { id: "E", slug: "up-2027", year: 2027, name: "UP 2027" },
  district: null,
  constituency: null,
  options: { states: [], districts: [], constituencies: [] },
};
const CONSTITUENCY_SCOPE: ResolvedScope = {
  ...STATE_SCOPE,
  level: "constituency",
  district: { id: "d1", slug: "gonda", name: "गोंडा" },
  constituency: { id: "c1", slug: "colonelganj", name: "कर्नलगंज", number: 298, reservedStatus: "None", currentMlaName: null, currentMlaParty: null },
};
const ALL = { segment: "all", period: "all" };
const ctxFor = (scope = STATE_SCOPE) => buildContext(fixture(), scope, "hi", ALL, false, NOW);

const FORBIDDEN = [/जीतेग/, /जीत पक्की/, /विजेता/, /कौन जीतेगा/, /\bwinner\b/i, /will win/i, /winning probability/i, /forecast shows/i];

test("cross-analysis: row percentages, N per row, invalid combinations rejected", () => {
  const ctx = ctxFor();
  const r = crossAnalysis(ctx, "gender", "party_preference");
  assert.ok(!("error" in r));
  if ("error" in r) return;
  const male = r.rows.find((x) => x.key === "male")!;
  assert.equal(male.n, 32);
  assert.equal(Math.round(male.cells.reduce((s, c) => s + c.pct, 0)), 100);
  assert.equal(r.multiB, false);
  assert.deepEqual(crossAnalysis(ctx, "gender", "gender"), { error: "same_dimension" });
  // No sub-areas below a constituency.
  assert.deepEqual(crossAnalysis(ctxFor(CONSTITUENCY_SCOPE), "area", "party_preference"), { error: "area_unavailable" });
  const issues = crossAnalysis(ctx, "age_group", "top_issue");
  assert.ok(!("error" in issues) && issues.multiB);
});

test("issue intelligence: overall share and breakdown bases come from the data", () => {
  const d = issueDeepDive(ctxFor(), "rojgar")!;
  assert.equal(d.overall.answered, 40);
  assert.equal(d.overall.count, 20);
  assert.equal(d.overall.pct, 50);
  const area = d.breakdowns.find((b) => b.dim === "area")!;
  assert.equal(area.unit, "district");
  assert.equal(area.rows.reduce((s, r) => s + r.n, 0), 40);
  assert.equal(issueDeepDive(ctxFor(), "no_such_issue"), null);
});

test("completeness ignores questions that were not yet being asked", () => {
  const ctx = ctxFor();
  const a = buildScopedAnalysis(ctx.ds, STATE_SCOPE, "hi", ALL, false);
  const x = analysisExtras(ctx, a, null);
  // Every response answered everything that existed when it was submitted.
  assert.equal(x.kpis.complete, 40);
  assert.equal(x.kpis.completionRate, 100);
  const mla = x.quality.perQuestion.find((q) => q.key === "mla_satisfaction")!;
  assert.equal(mla.asked, 20);
  assert.equal(mla.missing, 0);
  assert.ok(mla.since);
});

test("period comparison: B − A in percentage points, insufficient periods flagged", () => {
  const ctx = ctxFor();
  const p = periodComparison(ctx, "last7")!;
  assert.equal(p.b.to, "2026-09-30");
  assert.equal(p.b.from, "2026-09-24");
  assert.equal(p.a.to, "2026-09-23");
  for (const m of p.metrics)
    for (const r of m.rows) assert.equal(r.diff, Math.round((r.b.pct - r.a.pct) * 10) / 10);
  const mla = p.metrics.find((m) => m.key === "mla")!;
  assert.equal(mla.sufficient, mla.baseA >= 5 && mla.baseB >= 5);
  assert.equal(resolvePeriods("custom", NOW, { aFrom: "2026-09-10", aTo: "2026-09-01", bFrom: "2026-09-11", bTo: "2026-09-20" }), null);
  const w = resolvePeriods("week", NOW)!; // 30 Sep 2026 is a Wednesday
  assert.deepEqual(w, { a: { from: "2026-09-21", to: "2026-09-27" }, b: { from: "2026-09-28", to: "2026-09-30" } });
});

test("time series: periods below the minimum show no percentages", () => {
  const t = timeSeries(ctxFor(), "party", "week");
  assert.ok(t.buckets.length >= 2);
  for (const b of t.buckets) if (!b.sufficient) assert.ok(b.values.every((v) => v === null));
});

test("area comparison: A − B, unknown refs rejected", () => {
  const ctx = ctxFor();
  const r = compareAreas(ctx, "district:d1", "district:d2");
  assert.ok(!("error" in r));
  if ("error" in r) return;
  assert.equal(r.a.n + r.b.n, 40);
  for (const m of r.metrics) for (const row of m.rows) assert.equal(row.diff, Math.round((row.a.pct - row.b.pct) * 10) / 10);
  assert.deepEqual(compareAreas(ctx, "district:d1", "district:d1"), { error: "same_area" });
  assert.deepEqual(compareAreas(ctx, "district:zzz", "district:d1"), { error: "invalid" });
  assert.deepEqual(compareAreas(ctx, "'; drop", "district:d1"), { error: "invalid" });
});

test("ask the data: answers from the dataset, declines forecasts and voting advice", () => {
  const ctx = ctxFor();
  for (const q of ["कौन सी पार्टी जीतेगी?", "BJP kitni seat jeetegi", "किसको वोट दूं?", "Who will win in Gonda?", "exit poll kya kehta hai"]) assert.equal(askData(ctx, q).status, "refused", q);
  assert.equal(askData(ctx, "मौसम कैसा है?").status, "unsupported");

  const issue = askData(ctx, "गोंडा में सबसे बड़ा मुद्दा क्या है?");
  assert.equal(issue.status, "ok");
  assert.ok(issue.understood.some((u) => u.includes("गोंडा") && u.includes("जिला")), "plain name resolves to the district");
  assert.ok(issue.bars?.length);

  const cmp = askData(ctx, "कर्नलगंज और गोंडा विधानसभा क्षेत्र की तुलना करें");
  assert.equal(cmp.status, "ok");
  assert.ok(cmp.understood.filter((u) => u.includes("विधानसभा क्षेत्र")).length === 2);

  const age = askData(ctx, "25–34 आयु वर्ग में पार्टी समर्थन कैसा है?");
  assert.equal(age.status, "ok");
  assert.ok(age.understood.some((u) => u.includes("25–34")));

  // "st" must not match inside English words like "last".
  assert.ok(!askData(ctx, "last week issues").understood.some((u) => u.includes("एसटी")));

  for (const a of [issue, cmp, age]) for (const re of FORBIDDEN) assert.ok(!re.test([a.heading, ...a.lines].join(" ")), re.source);
});

test("generated profile and findings describe the data only", () => {
  const ctx = ctxFor();
  const a = buildScopedAnalysis(ctx.ds, STATE_SCOPE, "hi", ALL, false);
  const x = analysisExtras(ctx, a, null);
  const text = [...x.profile.summary, ...x.advanced.flatMap((f) => [f.title, f.text]), x.quality.sample.message].join(" ");
  for (const re of FORBIDDEN) assert.ok(!re.test(text), re.source);
  assert.match(x.quality.sample.message, /प्रतिनिधि नहीं/);
});

test("analysis URL: custom range, report modules, free modules", () => {
  const p = readAnalysisParams(new URLSearchParams("state=uttar-pradesh&period=custom&from=2026-09-20&to=2026-09-27"));
  assert.deepEqual(p.filters, { period: "custom", segment: "all", from: "2026-09-20", to: "2026-09-27" });
  assert.equal(analysisQuery(p.scope, p.filters), "?state=uttar-pradesh&period=custom&from=2026-09-20&to=2026-09-27");
  // Reversed or malformed ranges fall back to all time.
  assert.equal(readAnalysisParams(new URLSearchParams("period=custom&from=2026-09-27&to=2026-09-20")).filters.period, "all");
  assert.equal(readAnalysisParams(new URLSearchParams("period=custom&from=2026-02-30&to=2026-03-01")).filters.period, "all");
  assert.deepEqual(readReportModules(new URLSearchParams("modules=party,bogus,issues")), ["party", "issues"]);
  assert.equal(readReportModules(new URLSearchParams("")).length, 11);
  assert.ok(Object.values(analysisModules).every(Boolean), "every Analysis module is free and enabled");
});

// ── Regression: scope resolution (blocker 1) ─────────────────────────────────
// A fake resolver with resolveScope's semantics (unknown slugs dropped, a
// constituency implies its district) so the shared Analysis resolver can be
// tested without a database.

const GEO: Record<string, Record<string, string[]>> = {
  "uttar-pradesh": { gonda: ["colonelganj", "gonda"] },
  punjab: { fazilka: ["jalalabad"] },
};

async function fakeResolve(p: ScopeParams): Promise<ResolvedScope> {
  const empty = { state: null, election: null, district: null, constituency: null, options: { states: [], districts: [], constituencies: [] } };
  const districts = p.state ? GEO[p.state] : undefined;
  if (!p.state || !districts) return { ...empty, level: "none", params: {} };
  const state = { id: p.state, slug: p.state, name: p.state };
  let district = p.district && districts[p.district] ? p.district : undefined;
  if (p.constituency) for (const [d, cs] of Object.entries(districts)) if (cs.includes(p.constituency)) district = d;
  if (!district) return { ...empty, level: "state", params: { state: p.state }, state };
  const constituency = p.constituency && districts[district].includes(p.constituency) ? p.constituency : undefined;
  const d = { id: district, slug: district, name: district };
  if (!constituency) return { ...empty, level: "district", params: { state: p.state, district }, state, district: d };
  return {
    ...empty,
    level: "constituency",
    params: { state: p.state, district, constituency },
    state,
    district: d,
    constituency: { id: constituency, slug: constituency, name: constituency, number: 1, reservedStatus: "None", currentMlaName: null, currentMlaParty: null },
  };
}

const resolveFor = (p: ScopeParams) => resolveAnalysisScope(p, "hi", fakeResolve);

test("scope: only ?state=all is all-states; missing/invalid/partial scope never is", async () => {
  const all = await resolveFor({ state: "all" });
  assert.equal(all.level, "none");
  assert.ok(isAllStatesScope(all));

  const cases: [ScopeParams, ScopeParams][] = [
    [{}, { state: "uttar-pradesh" }], // missing state → UP
    [{ state: "nosuch" }, { state: "uttar-pradesh" }], // invalid state → UP
    [{ district: "gonda" }, { state: "uttar-pradesh", district: "gonda" }], // district without state → UP, district resolved
    [{ state: "nosuch", district: "nosuch" }, { state: "uttar-pradesh" }],
    [{ state: "punjab" }, { state: "punjab" }], // valid other state kept
    [{ state: "punjab", district: "nosuch" }, { state: "punjab" }], // invalid district keeps the state
    [{ state: "uttar-pradesh", constituency: "nosuch" }, { state: "uttar-pradesh" }], // invalid constituency keeps the state
    [{ state: "uttar-pradesh", constituency: "colonelganj" }, { state: "uttar-pradesh", district: "gonda", constituency: "colonelganj" }],
  ];
  for (const [input, expected] of cases) {
    const s = await resolveFor(input);
    assert.notEqual(s.level, "none", JSON.stringify(input));
    assert.ok(!isAllStatesScope(s), JSON.stringify(input));
    assert.deepEqual(s.params, expected, JSON.stringify(input));
  }
});

test("scope: an unresolved scope loads no data instead of the all-states dataset", async () => {
  const unresolved: ResolvedScope = { ...STATE_SCOPE, level: "none", params: {}, state: null, election: null };
  assert.equal(isAllStatesScope(unresolved), false);
  assert.equal(await loadAnalysisContext(unresolved, "hi", ALL), null);
});

// ── Regression: small-sample findings (blocker 2) ────────────────────────────

function tinyDataset(partyN: number, mlaN: number): Dataset {
  const ds = fixture();
  ds.records = Array.from({ length: partyN }, (_, i) => ({
    createdAt: NOW - i * DAY,
    stateId: "S",
    districtId: "d1",
    constituencyId: "c1",
    answers: {
      party_preference: [i % 2 ? "sp" : "bjp"],
      top_issue: ["rojgar"],
      ...(i < mlaN ? { mla_satisfaction: [i ? "dissatisfied" : "somewhat_satisfied"] } : {}),
    },
  }));
  return ds;
}

const findingsFor = (ds: Dataset) => {
  const ctx = buildContext(ds, STATE_SCOPE, "hi", ALL, false, NOW);
  const a = buildScopedAnalysis(ds, STATE_SCOPE, "hi", ALL, false);
  return { a, list: reportableFindings(a, analysisExtras(ctx, a, null).advanced) };
};

test("findings: N<5 party / MLA findings are suppressed, N>=5 findings remain", () => {
  const tiny = findingsFor(tinyDataset(4, 2));
  // The raw aggregates are still there…
  assert.equal(tiny.a.party.answered, 4);
  assert.equal(tiny.a.mla.answered, 2);
  assert.ok(tiny.a.findings.some((f) => f.icon === "mla"));
  assert.ok(tiny.a.findings.some((f) => f.icon === "party"));
  // …but no finding built on N<5 may be surfaced.
  assert.equal(tiny.list.length, 0);
  assert.ok(!tiny.a.insights.some((t) => /%/.test(t) && /\(N=[1-4]\)/.test(t)), "no N<5 percentage insight");

  const normal = findingsFor(fixture());
  assert.ok(normal.list.some((f) => f.icon === "party"), "N=40 party finding remains");
  assert.ok(normal.list.some((f) => f.icon === "mla"), "N=20 MLA finding remains");
  for (const f of normal.list) if (f.base !== undefined) assert.ok(f.base >= 5);
});
