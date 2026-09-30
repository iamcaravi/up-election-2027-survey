import "server-only";

import { prisma } from "./prisma";
import { getCurrentMlaForConstituency } from "./current-mla";
import {
  MIN_GROUP_N,
  QUESTION_KEYS,
  applyFilters,
  bucketKey,
  bucketLabel,
  buildScopedAnalysis,
  distribution,
  granularityFor,
  inScope,
  isSyntheticDataMode,
  istDayStart,
  loadAnalysisDataset,
  mlaDistribution,
  pct,
  resolveScope,
  withDefaultScope,
  DEFAULT_SCOPE_STATE,
  type AnalysisFilters,
  type Dataset,
  type Distribution,
  type Finding,
  type Locale,
  type QuestionKey,
  type ResolvedScope,
  type ResponseRecord,
  type ScopeAnalysis,
  type ScopeParams,
} from "./scoped-survey";
import { ALL_STATES_PARAM, isIsoDate } from "./analysis-params";
import {
  AREA_UNIT_LABELS,
  type AreaComparisonResult,
  type AreaUnit,
  type Column,
  type CompareOptions,
  type CompareRow,
  type CrossResult,
  type Dimension,
  type Granularity,
  type GroupShare,
  type IssueDeepDive,
  type MetricCompare,
  type PeriodComparisonResult,
  type PeriodPreset,
  type TimeMetric,
  type TimeSeriesResult,
} from "./analysis-dimensions";

// ─────────────────────────────────────────────────────────────────────────────
// Advanced public Analysis engine.
//
// Everything here is computed from the same eligible (VALID) responses the
// existing Analysis uses (scoped-survey.ts → loadAnalysisDataset), reusing its
// aggregation primitives. Output is aggregate-only: counts, shares and
// percentage-point differences — never a respondent row, never a forecast.
// Every group-level number carries its base (N); groups below MIN_GROUP_N are
// flagged instead of drawn, and "difference" insights require MIN_COMPARE_N.
// ─────────────────────────────────────────────────────────────────────────────

const DAY = 24 * 60 * 60 * 1000;
const IST_OFFSET = 5.5 * 60 * 60 * 1000;
/** Groups smaller than this are not used for difference/relationship insights. */
export const MIN_COMPARE_N = 10;
const EXCLUDED_KEY = "prefer_not_to_say";
const CORE_KEYS = ["party_preference", "mla_satisfaction", "top_issue"] as const;
const MAX_COLUMNS = 8;
const MAX_ISSUE_COLUMNS = 6;
const MAX_BUCKETS = 60;
export const REST_COLUMN = "__rest";

type Ctx = { locale: Locale };
const T = (ctx: Ctx, hi: string, en: string) => (ctx.locale === "hi" ? hi : en);
const f1 = (n: number) => Math.round(n * 10) / 10;
const r0 = (n: number) => Math.round(n);

export function istDateKey(t: number) {
  return new Date(t + IST_OFFSET).toISOString().slice(0, 10);
}

/** Today's IST calendar date (YYYY-MM-DD) — the upper bound for date pickers. */
export function todayIst() {
  return istDateKey(Date.now());
}

function addDays(date: string, n: number) {
  return new Date(Date.parse(`${date}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);
}

export function formatIstDate(t: number | string, locale: Locale, withYear = true) {
  const d = typeof t === "string" ? (isIsoDate(t) ? new Date(istDayStart(t)) : new Date(t)) : new Date(t);
  return new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "Asia/Kolkata",
  }).format(d);
}

// ── Scope ────────────────────────────────────────────────────────────────────

/**
 * Analysis-specific scope resolution, shared by the page and every direct
 * endpoint (module API, ask, export, report):
 *   - `?state=all` is the ONLY way to get the combined all-states view
 *     (level "none", canonical params { state: "all" });
 *   - no state, an unknown state, or a district/constituency without a valid
 *     state falls back to the default state (Uttar Pradesh), keeping the
 *     district/constituency when it belongs to it;
 *   - an unknown district/constituency under a valid state keeps that state.
 * An unresolvable request therefore never silently becomes "all states".
 * `resolve` is injectable for tests.
 */
export async function resolveAnalysisScope(
  requested: ScopeParams,
  locale: Locale,
  resolve: (params: ScopeParams, locale: Locale) => Promise<ResolvedScope> = resolveScope
): Promise<ResolvedScope> {
  if (requested.state === ALL_STATES_PARAM) {
    const none = await resolve({}, locale);
    return { ...none, params: { state: ALL_STATES_PARAM } };
  }
  const scope = await resolve(withDefaultScope(requested), locale);
  if (scope.level !== "none") return scope;
  return resolve({ state: DEFAULT_SCOPE_STATE, district: requested.district, constituency: requested.constituency }, locale);
}

/** Combined all-states data only for the explicit `?state=all` request. */
export function isAllStatesScope(scope: ResolvedScope) {
  return scope.level === "none" && scope.params.state === ALL_STATES_PARAM;
}

export function areaUnitOf(scope: ResolvedScope): AreaUnit | null {
  if (scope.level === "none") return "state";
  if (scope.level === "state") return "district";
  if (scope.level === "district") return "constituency";
  return null;
}

function areaKey(r: ResponseRecord, unit: AreaUnit) {
  return unit === "state" ? r.stateId : unit === "district" ? r.districtId : r.constituencyId;
}

function areaLabel(ds: Dataset, unit: AreaUnit, id: string) {
  return (unit === "state" ? ds.stateNames.get(id) : unit === "district" ? ds.districtNames.get(id) : ds.constituencyInfo.get(id)?.name) ?? id;
}

// ── Context ──────────────────────────────────────────────────────────────────

export interface AnalysisContext {
  ds: Dataset;
  scope: ResolvedScope;
  locale: Locale;
  filters: AnalysisFilters;
  isSynthetic: boolean;
  now: number;
  /** Everything loaded (the state, or every state) with the filters applied. */
  stateAll: ResponseRecord[];
  /** The selected scope with the filters applied. */
  records: ResponseRecord[];
  /** The selected scope with only the respondent-group filter — time modules choose their own window. */
  scopeAnyTime: ResponseRecord[];
  /**
   * When each question started being answered (earliest answer in the loaded
   * data). Questions added to the survey later (e.g. MLA opinion) are not held
   * against responses submitted before they were being asked.
   */
  since: Partial<Record<QuestionKey, number>>;
}

function questionSince(ds: Dataset): Partial<Record<QuestionKey, number>> {
  const out: Partial<Record<QuestionKey, number>> = {};
  for (const r of ds.records)
    for (const k of QUESTION_KEYS) if (r.answers[k]?.length && (out[k] === undefined || r.createdAt < out[k]!)) out[k] = r.createdAt;
  return out;
}

export function buildContext(ds: Dataset, scope: ResolvedScope, locale: Locale, filters: AnalysisFilters, isSynthetic: boolean, now = Date.now()): AnalysisContext {
  const stateAll = applyFilters(ds.records, filters);
  return {
    ds,
    scope,
    locale,
    filters,
    isSynthetic,
    now,
    stateAll,
    records: stateAll.filter((r) => inScope(r, scope)),
    scopeAnyTime: applyFilters(ds.records, { segment: filters.segment, period: "all" }).filter((r) => inScope(r, scope)),
    since: questionSince(ds),
  };
}

export async function loadAnalysisContext(scope: ResolvedScope, locale: Locale, filters: AnalysisFilters): Promise<AnalysisContext | null> {
  // Defence in depth: an unresolved scope (e.g. the default state itself is
  // missing) yields "no data", never the combined all-states dataset.
  if (scope.level === "none" && !isAllStatesScope(scope)) return null;
  const ds = await loadAnalysisDataset(scope, locale);
  if (!ds) return null;
  return buildContext(ds, scope, locale, filters, await isSyntheticDataMode());
}

// ── Dimensions ───────────────────────────────────────────────────────────────

interface DimItem {
  key: string;
  label: string;
  color?: string | null;
  count: number;
}

interface DimSpec {
  dim: Dimension;
  multi: boolean;
  items: DimItem[];
  keysOf: (r: ResponseRecord) => string[];
}

function answerKeys(r: ResponseRecord, q: QuestionKey): string[] {
  const ks = r.answers[q];
  return ks ? ks.filter((k) => k !== EXCLUDED_KEY) : [];
}

function dimSpec(ctx: AnalysisContext, dim: Dimension, records: ResponseRecord[], role: "group" | "target"): DimSpec | null {
  if (dim === "area") {
    const unit = areaUnitOf(ctx.scope);
    if (!unit) return null;
    const counts = new Map<string, number>();
    for (const r of records) counts.set(areaKey(r, unit), (counts.get(areaKey(r, unit)) ?? 0) + 1);
    const items = [...counts.entries()]
      .map(([key, count]) => ({ key, label: areaLabel(ctx.ds, unit, key), count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
    return { dim, multi: false, items, keysOf: (r) => [areaKey(r, unit)] };
  }
  const q = dim as QuestionKey;
  const byCount = q === "top_issue" || (role === "target" && q === "party_preference");
  const dist = q === "mla_satisfaction" ? mlaDistribution(records, ctx.locale) : distribution(records, q, ctx.ds.meta, byCount ? "count" : "order");
  return {
    dim,
    multi: q === "top_issue",
    items: dist.items.filter((i) => i.key !== EXCLUDED_KEY).map((i) => ({ key: i.key, label: i.label, color: i.color ?? null, count: i.count })),
    keysOf: (r) => answerKeys(r, q),
  };
}

// ── Cross-analysis engine ────────────────────────────────────────────────────

export type CrossError = "same_dimension" | "area_unavailable";

/** Any group dimension × any target dimension, as row percentages with N per row. */
export function crossAnalysis(ctx: AnalysisContext, a: Dimension, b: Dimension, records = ctx.records): CrossResult | { error: CrossError } {
  if (a === b) return { error: "same_dimension" };
  const A = dimSpec(ctx, a, records, "group");
  const B = dimSpec(ctx, b, records, "target");
  if (!A || !B) return { error: "area_unavailable" };

  const candidates = b === "mla_satisfaction" ? B.items : B.items.filter((i) => i.count > 0);
  const shown = candidates.slice(0, b === "top_issue" ? MAX_ISSUE_COLUMNS : MAX_COLUMNS);
  const hidden = candidates.length - shown.length;
  const withRest = hidden > 0 && !B.multi;
  const columns: Column[] = shown.map((i) => ({ key: i.key, label: i.label, color: i.color ?? null }));
  if (withRest) columns.push({ key: REST_COLUMN, label: T(ctx, "शेष (संयुक्त)", "Rest (combined)"), color: "#94a3b8" });
  const shownKeys = new Set(shown.map((i) => i.key));

  const acc = new Map<string, { n: number; cells: Map<string, number> }>();
  for (const r of records) {
    const targets = B.keysOf(r);
    if (!targets.length) continue;
    for (const g of new Set(A.keysOf(r))) {
      const e = acc.get(g) ?? acc.set(g, { n: 0, cells: new Map() }).get(g)!;
      e.n++;
      let rest = false;
      for (const t of new Set(targets)) {
        if (shownKeys.has(t)) e.cells.set(t, (e.cells.get(t) ?? 0) + 1);
        else rest = true;
      }
      if (rest && withRest) e.cells.set(REST_COLUMN, (e.cells.get(REST_COLUMN) ?? 0) + 1);
    }
  }

  const rows = A.items
    .filter((g) => acc.has(g.key))
    .map((g) => {
      const e = acc.get(g.key)!;
      return {
        key: g.key,
        label: g.label,
        n: e.n,
        sufficient: e.n >= MIN_GROUP_N,
        cells: columns.map((c) => ({ key: c.key, count: e.cells.get(c.key) ?? 0, pct: pct(e.cells.get(c.key) ?? 0, e.n) })),
      };
    });
  if (a === "area" || a === "top_issue") rows.sort((x, y) => y.n - x.n || x.label.localeCompare(y.label));
  return {
    a,
    b,
    columns,
    rows,
    meaningful: rows.filter((r) => r.sufficient).length >= 2,
    multiA: A.multi,
    multiB: B.multi,
    hiddenColumns: hidden,
    unit: a === "area" || b === "area" ? areaUnitOf(ctx.scope) : null,
  };
}

// ── Issue intelligence ───────────────────────────────────────────────────────

const ISSUE_BREAKDOWNS: Dimension[] = ["age_group", "gender", "social_category", "religion", "area", "party_preference"];

export function issueDeepDive(ctx: AnalysisContext, issueKey: string): IssueDeepDive | null {
  const all = distribution(ctx.records, "top_issue", ctx.ds.meta, "count");
  const idx = all.items.findIndex((i) => i.key === issueKey);
  if (idx < 0) return null;
  const answered = ctx.records.filter((r) => answerKeys(r, "top_issue").length);
  const chose = (r: ResponseRecord) => r.answers.top_issue!.includes(issueKey);

  const breakdowns = ISSUE_BREAKDOWNS.flatMap((dim) => {
    const spec = dimSpec(ctx, dim, answered, "group");
    if (!spec) return [];
    const acc = new Map<string, { n: number; count: number }>();
    for (const r of answered) {
      const hit = chose(r);
      for (const g of new Set(spec.keysOf(r))) {
        const e = acc.get(g) ?? acc.set(g, { n: 0, count: 0 }).get(g)!;
        e.n++;
        if (hit) e.count++;
      }
    }
    const rows: GroupShare[] = spec.items
      .filter((g) => acc.has(g.key))
      .map((g) => {
        const e = acc.get(g.key)!;
        return { key: g.key, label: g.label, n: e.n, count: e.count, pct: pct(e.count, e.n), sufficient: e.n >= MIN_GROUP_N };
      });
    if (dim === "area") rows.sort((x, y) => y.n - x.n || x.label.localeCompare(y.label));
    return [{ dim, unit: dim === "area" ? areaUnitOf(ctx.scope) : null, rows, meaningful: rows.filter((r) => r.sufficient).length >= 2 }];
  });

  const item = all.items[idx];
  return {
    issue: { key: item.key, label: item.label },
    overall: { count: item.count, answered: all.answered, pct: item.pct, rank: idx + 1, totalIssues: all.items.length },
    breakdowns,
  };
}

// ── Time: change over time ───────────────────────────────────────────────────

const METRIC_QUESTION: Record<TimeMetric, QuestionKey> = { party: "party_preference", mla: "mla_satisfaction", issues: "top_issue" };

function allBucketKeys(first: string, last: string, g: "day" | "week" | "month") {
  const out: string[] = [];
  if (g === "month") {
    let [y, m] = first.split("-").map(Number);
    const [ly, lm] = last.split("-").map(Number);
    while (y < ly || (y === ly && m <= lm)) {
      out.push(`${y}-${String(m).padStart(2, "0")}`);
      m++;
      if (m > 12) {
        m = 1;
        y++;
      }
    }
    return out;
  }
  const step = (g === "week" ? 7 : 1) * DAY;
  for (let t = Date.parse(`${first}T00:00:00Z`); t <= Date.parse(`${last}T00:00:00Z`); t += step) out.push(new Date(t).toISOString().slice(0, 10));
  return out;
}

export function timeSeries(ctx: AnalysisContext, metric: TimeMetric, granularity: Granularity, range?: { from: string; to: string }): TimeSeriesResult {
  const q = METRIC_QUESTION[metric];
  let recs = ctx.scopeAnyTime;
  if (range) {
    const start = istDayStart(range.from);
    const end = istDayStart(range.to) + DAY;
    recs = recs.filter((r) => r.createdAt >= start && r.createdAt < end);
  }
  recs = recs.filter((r) => answerKeys(r, q).length);
  if (!recs.length) return { metric, granularity: granularity === "auto" ? "day" : granularity, columns: [], buckets: [], enough: false, truncated: false };

  const g = granularity === "auto" ? granularityFor(recs) : granularity;
  const dist = q === "mla_satisfaction" ? mlaDistribution(recs, ctx.locale) : distribution(recs, q, ctx.ds.meta, "count");
  const columns: Column[] = (q === "mla_satisfaction" ? dist.items : dist.items.filter((i) => i.count > 0).slice(0, 6)).map((i) => ({ key: i.key, label: i.label, color: i.color ?? null }));

  const groups = new Map<string, ResponseRecord[]>();
  for (const r of recs) {
    const k = bucketKey(r.createdAt, g);
    (groups.get(k) ?? groups.set(k, []).get(k)!).push(r);
  }
  const sorted = [...groups.keys()].sort();
  let keys = allBucketKeys(sorted[0], sorted[sorted.length - 1], g);
  const truncated = keys.length > MAX_BUCKETS;
  if (truncated) keys = keys.slice(-MAX_BUCKETS);

  const buckets = keys.map((k) => {
    const rs = groups.get(k) ?? [];
    const sufficient = rs.length >= MIN_GROUP_N;
    return {
      key: k,
      label: bucketLabel(k, g, ctx.locale),
      n: rs.length,
      sufficient,
      values: columns.map((c) => (sufficient ? pct(rs.filter((r) => r.answers[q]!.includes(c.key)).length, rs.length) : null)),
    };
  });
  return { metric, granularity: g, columns, buckets, enough: buckets.filter((b) => b.sufficient).length >= 2, truncated };
}

// ── Comparisons (period vs period, area vs area) ─────────────────────────────

function compareDist(a: Distribution, b: Distribution, dir: "b-a" | "a-b", limit?: number): CompareRow[] {
  const keys = new Map<string, { label: string; color?: string | null; total: number; order: number }>();
  [a, b].forEach((d) =>
    d.items.forEach((i, idx) => {
      if (i.key === EXCLUDED_KEY) return;
      const e = keys.get(i.key);
      if (e) e.total += i.count;
      else keys.set(i.key, { label: i.label, color: i.color, total: i.count, order: idx });
    })
  );
  const rows = [...keys.entries()]
    .filter(([key, m]) => m.total > 0 || key in MLA_ORDER)
    .sort((x, y) => y[1].total - x[1].total)
    .slice(0, limit ?? Infinity)
    .map(([key, m]): CompareRow => {
      const x = a.items.find((i) => i.key === key);
      const y = b.items.find((i) => i.key === key);
      const ax = { count: x?.count ?? 0, pct: x?.pct ?? 0 };
      const bx = { count: y?.count ?? 0, pct: y?.pct ?? 0 };
      return { key, label: m.label, color: m.color ?? null, a: ax, b: bx, diff: f1(dir === "b-a" ? bx.pct - ax.pct : ax.pct - bx.pct) };
    });
  return rows;
}

const MLA_ORDER: Record<string, number> = { satisfied: 0, somewhat_satisfied: 1, dissatisfied: 2, undecided: 3 };

function metricCompares(ctx: AnalysisContext, A: ResponseRecord[], B: ResponseRecord[], dir: "b-a" | "a-b"): MetricCompare[] {
  const m = ctx.ds.meta;
  const out: MetricCompare[] = [];
  const push = (key: MetricCompare["key"], da: Distribution, db: Distribution, limit?: number, keepOrder = false) => {
    if (!da.answered && !db.answered) return;
    const rows = compareDist(da, db, dir, limit);
    if (keepOrder) rows.sort((x, y) => (MLA_ORDER[x.key] ?? 9) - (MLA_ORDER[y.key] ?? 9) || x.label.localeCompare(y.label));
    out.push({ key, baseA: da.answered, baseB: db.answered, sufficient: da.answered >= MIN_GROUP_N && db.answered >= MIN_GROUP_N, rows });
  };
  push("party", distribution(A, "party_preference", m, "count"), distribution(B, "party_preference", m, "count"), 8);
  push("mla", mlaDistribution(A, ctx.locale), mlaDistribution(B, ctx.locale), undefined, true);
  push("issues", distribution(A, "top_issue", m, "count"), distribution(B, "top_issue", m, "count"), 8);
  push("gender", distribution(A, "gender", m, "order"), distribution(B, "gender", m, "order"));
  push("age_group", distribution(A, "age_group", m, "order"), distribution(B, "age_group", m, "order"));
  return out;
}

export function resolvePeriods(preset: PeriodPreset, now: number, custom?: { aFrom?: string; aTo?: string; bFrom?: string; bTo?: string }) {
  const today = istDateKey(now);
  if (preset === "last7") return { a: { from: addDays(today, -13), to: addDays(today, -7) }, b: { from: addDays(today, -6), to: today } };
  if (preset === "week") {
    const dow = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7;
    const monday = addDays(today, -dow);
    return { a: { from: addDays(monday, -7), to: addDays(monday, -1) }, b: { from: monday, to: today } };
  }
  if (preset === "month") {
    const [y, m] = today.split("-").map(Number);
    const first = `${y}-${String(m).padStart(2, "0")}-01`;
    const prevFirst = m === 1 ? `${y - 1}-12-01` : `${y}-${String(m - 1).padStart(2, "0")}-01`;
    return { a: { from: prevFirst, to: addDays(first, -1) }, b: { from: first, to: today } };
  }
  const c = custom ?? {};
  if (![c.aFrom, c.aTo, c.bFrom, c.bTo].every(isIsoDate) || c.aFrom! > c.aTo! || c.bFrom! > c.bTo!) return null;
  return { a: { from: c.aFrom!, to: c.aTo! }, b: { from: c.bFrom!, to: c.bTo! } };
}

export function periodComparison(ctx: AnalysisContext, preset: PeriodPreset, custom?: Parameters<typeof resolvePeriods>[2]): PeriodComparisonResult | null {
  const p = resolvePeriods(preset, ctx.now, custom);
  if (!p) return null;
  const within = (w: { from: string; to: string }) => {
    const start = istDayStart(w.from);
    const end = istDayStart(w.to) + DAY;
    return ctx.scopeAnyTime.filter((r) => r.createdAt >= start && r.createdAt < end);
  };
  const A = within(p.a);
  const B = within(p.b);
  const enough = A.length >= MIN_GROUP_N && B.length >= MIN_GROUP_N;
  return { preset, a: { ...p.a, n: A.length }, b: { ...p.b, n: B.length }, enough, metrics: enough ? metricCompares(ctx, A, B, "b-a") : [] };
}

export function compareOptions(ctx: AnalysisContext): CompareOptions {
  const levels: AreaUnit[] = ctx.scope.level === "none" ? ["state"] : ["district", "constituency"];
  return {
    levels: levels.map((level) => {
      const counts = new Map<string, number>();
      for (const r of ctx.stateAll) counts.set(areaKey(r, level), (counts.get(areaKey(r, level)) ?? 0) + 1);
      const options = [...counts.entries()]
        .map(([id, n]) => ({
          ref: `${level}:${id}`,
          label: areaLabel(ctx.ds, level, id),
          n,
          group: level === "constituency" ? ctx.ds.districtNames.get(ctx.ds.constituencyInfo.get(id)?.districtId ?? "") : undefined,
        }))
        .sort((x, y) => (x.group ?? "").localeCompare(y.group ?? "") || x.label.localeCompare(y.label));
      return { level, options };
    }),
  };
}

export function parseAreaRef(ref: string | null | undefined): { level: AreaUnit; id: string } | null {
  const m = /^(state|district|constituency):([A-Za-z0-9_-]{1,64})$/.exec(ref ?? "");
  return m ? { level: m[1] as AreaUnit, id: m[2] } : null;
}

export function compareAreas(ctx: AnalysisContext, refA: string, refB: string): AreaComparisonResult | { error: "invalid" | "same_area" } {
  const a = parseAreaRef(refA);
  const b = parseAreaRef(refB);
  if (!a || !b) return { error: "invalid" };
  if (a.level === b.level && a.id === b.id) return { error: "same_area" };
  const known = (x: { level: AreaUnit; id: string }) =>
    x.level === "state" ? ctx.ds.stateNames.has(x.id) : x.level === "district" ? ctx.ds.districtNames.has(x.id) : ctx.ds.constituencyInfo.has(x.id);
  if (!known(a) || !known(b)) return { error: "invalid" };
  const A = ctx.stateAll.filter((r) => areaKey(r, a.level) === a.id);
  const B = ctx.stateAll.filter((r) => areaKey(r, b.level) === b.id);
  const enough = A.length >= MIN_GROUP_N && B.length >= MIN_GROUP_N;
  return {
    a: { ref: refA, label: areaLabel(ctx.ds, a.level, a.id), level: a.level, n: A.length },
    b: { ref: refB, label: areaLabel(ctx.ds, b.level, b.id), level: b.level, n: B.length },
    enough,
    metrics: enough ? metricCompares(ctx, A, B, "a-b") : [],
  };
}

// ── MLA stance (positive / negative / neutral) ───────────────────────────────

export function mlaStance(d: Distribution) {
  const c = (k: string) => d.items.find((i) => i.key === k)?.count ?? 0;
  const pos = c("satisfied") + c("somewhat_satisfied");
  const neg = c("dissatisfied");
  const neu = c("undecided");
  return { answered: d.answered, pos: pct(pos, d.answered), neg: pct(neg, d.answered), neu: pct(neu, d.answered), posCount: pos, negCount: neg, neuCount: neu };
}

// ── KPIs ─────────────────────────────────────────────────────────────────────

export interface AnalysisKpis {
  total: number;
  today: number;
  last7Days: number;
  complete: number;
  completionRate: number;
  firstResponseAt: string | null;
  lastResponseAt: string | null;
  days: number;
  surveyActive: boolean;
  coverage: { label: string; sub: string; covered: number; total: number };
  areas: { label: string; sub: string; covered: number; total: number };
}

/** Asked when this response was submitted (the question had started being answered). */
function wasAsked(ctx: AnalysisContext, r: ResponseRecord, k: QuestionKey) {
  const since = ctx.since[k];
  return since !== undefined && r.createdAt >= since;
}

/** Answered every main question that was being asked when it was submitted. */
function isComplete(ctx: AnalysisContext, r: ResponseRecord) {
  return CORE_KEYS.every((k) => !wasAsked(ctx, r, k) || answerKeys(r, k).length > 0);
}

/** First-answer date of a question when it was added after the survey began (else null). */
export function questionStart(ctx: AnalysisContext, k: QuestionKey): string | null {
  const first = Math.min(...Object.values(ctx.since).filter((t): t is number => t !== undefined));
  const t = ctx.since[k];
  return t !== undefined && t - first > DAY ? new Date(t).toISOString() : null;
}

function daySpan(first: string | null, last: string | null) {
  if (!first || !last) return 0;
  return Math.round((Date.parse(`${istDateKey(Date.parse(last))}T00:00:00Z`) - Date.parse(`${istDateKey(Date.parse(first))}T00:00:00Z`)) / DAY) + 1;
}

export function analysisKpis(ctx: AnalysisContext, a: ScopeAnalysis): AnalysisKpis {
  const { scope, ds } = ctx;
  const complete = ctx.records.filter((r) => isComplete(ctx, r)).length;
  const distinct = (rs: ResponseRecord[], unit: AreaUnit) => new Set(rs.map((r) => areaKey(r, unit))).size;
  const coverage =
    scope.level === "none"
      ? { label: T(ctx, "राज्य कवरेज", "State coverage"), sub: T(ctx, "राज्यों में प्रतिक्रियाएं", "States with responses"), covered: distinct(ctx.stateAll, "state"), total: ds.totalStates }
      : {
          label: T(ctx, "जिला कवरेज", "District coverage"),
          sub: scope.level === "state" ? T(ctx, "जिलों में प्रतिक्रियाएं", "Districts with responses") : T(ctx, `${scope.state?.name} के जिलों में`, `Districts of ${scope.state?.name}`),
          covered: distinct(ctx.stateAll, "district"),
          total: ds.totalDistricts,
        };
  let areas: AnalysisKpis["areas"];
  if (scope.level === "constituency" && scope.district) {
    const districtId = scope.district.id;
    const inDistrict = [...ds.constituencyInfo.values()].filter((c) => c.districtId === districtId).length;
    areas = {
      label: T(ctx, "विधानसभा क्षेत्रों में", "Constituencies"),
      sub: T(ctx, `${scope.district.name} जिले के`, `In ${scope.district.name} district`),
      covered: distinct(ctx.stateAll.filter((r) => r.districtId === districtId), "constituency"),
      total: inDistrict,
    };
  } else {
    areas = {
      label: T(ctx, "विधानसभा क्षेत्रों में", "Constituencies"),
      sub: scope.level === "district" ? T(ctx, `${scope.district?.name} जिले में`, `In ${scope.district?.name} district`) : T(ctx, "प्रतिक्रियाएं प्राप्त", "With responses"),
      covered: a.respondingConstituencies,
      total: a.constituenciesInScope,
    };
  }
  return {
    total: a.total,
    today: a.today,
    last7Days: a.last7Days,
    complete,
    completionRate: pct(complete, a.total),
    firstResponseAt: a.firstResponseAt,
    lastResponseAt: a.lastResponseAt,
    days: daySpan(a.firstResponseAt, a.lastResponseAt),
    surveyActive: a.surveyActive,
    coverage,
    areas,
  };
}

// ── Area profile ─────────────────────────────────────────────────────────────

export interface ProfileFact {
  key: string;
  label: string;
  value: string;
  detail: string;
}

export interface AreaProfile {
  title: string;
  summary: string[];
  facts: ProfileFact[];
  context: { label: string; value: string }[];
  gender: Distribution;
  category: Distribution;
}

/** "a, b और c" / "a, b and c". */
function joinList(ctx: Ctx, items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} ${T(ctx, "और", "and")} ${items[items.length - 1]}`;
}

function topOf(d: Distribution) {
  const items = d.items.filter((i) => i.key !== EXCLUDED_KEY && i.count > 0).sort((x, y) => y.count - x.count);
  if (!items.length) return null;
  const tied = items.filter((i) => i.count === items[0].count);
  return { item: items[0], tied };
}

export function areaProfile(ctx: AnalysisContext, a: ScopeAnalysis, kpis: AnalysisKpis): AreaProfile {
  const { scope } = ctx;
  const hi = ctx.locale === "hi";
  const title =
    scope.level === "constituency"
      ? T(ctx, "विधानसभा क्षेत्र प्रोफ़ाइल", "Constituency profile")
      : scope.level === "district"
        ? T(ctx, "जिला प्रोफ़ाइल", "District profile")
        : scope.level === "state"
          ? T(ctx, "राज्य प्रोफ़ाइल", "State profile")
          : T(ctx, "समग्र प्रोफ़ाइल", "Overall profile");
  const place = scope.constituency?.name ?? scope.district?.name ?? scope.state?.name ?? T(ctx, "सभी राज्य", "All states");
  const filtered = ctx.filters.segment !== "all" || ctx.filters.period !== "all";
  const summary: string[] = [];
  const period = kpis.firstResponseAt ? `${formatIstDate(kpis.firstResponseAt, ctx.locale)} – ${formatIstDate(kpis.lastResponseAt!, ctx.locale)}` : "";

  summary.push(
    hi
      ? `${place}${filtered ? " (चयनित फ़िल्टर)" : ""} में अब तक कुल ${a.total.toLocaleString("en-IN")} मान्य सर्वे प्रतिक्रियाएं प्राप्त हुई हैं${period ? ` (${period})` : ""}।`
      : `${place}${filtered ? " (selected filters)" : ""} has ${a.total.toLocaleString("en-IN")} valid survey responses so far${period ? ` (${period})` : ""}.`
  );
  const tooFew = (what: { hi: string; en: string }, n: number) =>
    summary.push(T(ctx, `${what.hi} के अभी केवल ${n} उत्तर हैं — प्रतिशत के लिए पर्याप्त नहीं।`, `Only ${n} answers on ${what.en} so far — too few for percentages.`));
  const issue = topOf(a.issues);
  if (issue && a.issues.answered < MIN_GROUP_N) tooFew({ hi: "मुद्दों", en: "issues" }, a.issues.answered);
  else if (issue)
    summary.push(
      issue.tied.length > 1
        ? T(ctx, `सबसे अधिक चुने गए मुद्दे ${joinList(ctx, issue.tied.map((i) => i.label))} रहे (प्रत्येक ${r0(issue.item.pct)}%)।`, `The most selected issues were ${joinList(ctx, issue.tied.map((i) => i.label))} (${r0(issue.item.pct)}% each).`)
        : T(ctx, `सबसे अधिक चुना गया मुद्दा ${issue.item.label} रहा (${r0(issue.item.pct)}%)।`, `The most selected issue was ${issue.item.label} (${r0(issue.item.pct)}%).`)
    );
  const party = topOf(a.party);
  if (party && a.party.answered < MIN_GROUP_N) tooFew({ hi: "पार्टी समर्थन", en: "party support" }, a.party.answered);
  else if (party)
    summary.push(
      party.tied.length > 1
        ? T(ctx, `पार्टी समर्थन के प्रश्न में ${joinList(ctx, party.tied.map((i) => i.label))} को बराबर (${r0(party.item.pct)}%) उत्तरदाताओं ने चुना।`, `On party support, ${joinList(ctx, party.tied.map((i) => i.label))} were chosen by equal shares (${r0(party.item.pct)}%).`)
        : T(ctx, `पार्टी समर्थन के प्रश्न में ${party.item.label} को सबसे अधिक उत्तरदाताओं (${r0(party.item.pct)}%) ने चुना।`, `On party support, ${party.item.label} was chosen by the most respondents (${r0(party.item.pct)}%).`)
    );
  const stance = mlaStance(a.mla);
  if (stance.answered >= MIN_GROUP_N)
    summary.push(
      T(
        ctx,
        `${scope.level === "constituency" ? "वर्तमान विधायक" : "अपने क्षेत्र के वर्तमान विधायक"} के कार्यों पर ${r0(stance.pos)}% उत्तरदाताओं ने सकारात्मक, ${r0(stance.neg)}% ने नकारात्मक और ${r0(stance.neu)}% ने तटस्थ राय दी (N=${stance.answered})।`,
        `On the ${scope.level === "constituency" ? "current MLA's" : "local MLA's"} work, ${r0(stance.pos)}% of respondents were positive, ${r0(stance.neg)}% negative and ${r0(stance.neu)}% neutral (N=${stance.answered}).`
      )
    );
  else if (stance.answered) tooFew({ hi: "विधायक के कार्यों पर राय", en: "the MLA's work" }, stance.answered);

  const facts: ProfileFact[] = [
    { key: "total", label: T(ctx, "कुल प्रतिक्रियाएं", "Total responses"), value: a.total.toLocaleString("en-IN"), detail: T(ctx, "मान्य प्रतिक्रियाएं", "Valid responses") },
    { key: "period", label: T(ctx, "सर्वे अवधि", "Survey period"), value: period || "—", detail: kpis.days ? T(ctx, `${kpis.days} दिन`, `${kpis.days} days`) : "—" },
  ];
  if (party)
    facts.push({
      key: "party",
      label: T(ctx, "सबसे अधिक समर्थित पार्टी", "Most supported party"),
      value: party.tied.length > 1 ? party.tied.map((i) => i.label).join(" / ") : `${party.item.label} (${r0(party.item.pct)}%)`,
      detail: T(ctx, `${a.party.answered} में से ${party.item.count} उत्तरदाता`, `${party.item.count} of ${a.party.answered} respondents`),
    });
  if (stance.answered >= MIN_GROUP_N)
    facts.push({
      key: "mla",
      label: T(ctx, "वर्तमान विधायक पर राय", "Opinion on current MLA"),
      value: T(ctx, `${r0(stance.pos)}% सकारात्मक`, `${r0(stance.pos)}% positive`),
      detail: T(ctx, `${r0(stance.neg)}% नकारात्मक · ${r0(stance.neu)}% तटस्थ (N=${stance.answered})`, `${r0(stance.neg)}% negative · ${r0(stance.neu)}% neutral (N=${stance.answered})`),
    });
  if (issue)
    facts.push({
      key: "issue",
      label: T(ctx, "सबसे महत्वपूर्ण मुद्दा", "Top issue"),
      value: issue.tied.length > 1 ? issue.tied.map((i) => i.label).join(" / ") : `${issue.item.label} (${r0(issue.item.pct)}%)`,
      detail: T(ctx, `${a.issues.answered} में से ${issue.item.count} उत्तरदाताओं ने चुना`, `Chosen by ${issue.item.count} of ${a.issues.answered}`),
    });
  const age = topOf(a.demographics.age_group);
  if (age)
    facts.push({
      key: "age",
      label: T(ctx, "प्रमुख आयु समूह", "Largest age group"),
      value: `${age.item.label} (${r0(age.item.pct)}%)`,
      detail: T(ctx, `आयु बताने वाले ${a.demographics.age_group.answered} में से ${age.item.count}`, `${age.item.count} of ${a.demographics.age_group.answered} who shared age`),
    });
  const gender = a.demographics.gender;
  if (gender.answered)
    facts.push({
      key: "gender",
      label: T(ctx, "पुरुष / महिला", "Men / women"),
      value: ["male", "female"].map((k) => `${r0(gender.items.find((i) => i.key === k)?.pct ?? 0)}%`).join(" / "),
      detail: T(ctx, `लिंग बताने वाले ${gender.answered} उत्तरदाता`, `${gender.answered} who shared gender`),
    });
  facts.push({
    key: "complete",
    label: T(ctx, "प्रतिक्रिया पूर्णता", "Response completeness"),
    value: `${r0(kpis.completionRate)}%`,
    detail: T(ctx, "उस समय पूछे जा रहे सभी मुख्य प्रश्नों के उत्तर", "Answered every main question being asked at the time"),
  });

  const context: AreaProfile["context"] = [];
  if (scope.state) context.push({ label: T(ctx, "राज्य", "State"), value: scope.state.name });
  if (scope.district) context.push({ label: T(ctx, "जिला", "District"), value: scope.district.name });
  if (scope.constituency) {
    context.push({ label: T(ctx, "विधानसभा क्रमांक", "Constituency no."), value: String(scope.constituency.number) });
    if (scope.constituency.reservedStatus && scope.constituency.reservedStatus !== "None")
      context.push({ label: T(ctx, "आरक्षण", "Reservation"), value: scope.constituency.reservedStatus });
  }
  context.push({ label: kpis.areas.label, value: `${kpis.areas.covered}/${kpis.areas.total}` });

  return { title, summary, facts, context, gender, category: a.demographics.social_category };
}

// ── Data quality ─────────────────────────────────────────────────────────────

export type SampleLevel = "none" | "very_small" | "small" | "moderate" | "large";

export interface DataQuality {
  total: number;
  complete: number;
  incomplete: number;
  completionRate: number;
  recency: { key: string; label: string; count: number }[];
  /** Per question: of the responses submitted while it was being asked. */
  perQuestion: { key: string; label: string; asked: number; answered: number; missing: number; pct: number; since: string | null }[];
  demographicAny: { count: number; pct: number };
  demographicAll: { count: number; pct: number };
  geo: { label: string; covered: number; total: number; reliable: number } | null;
  sample: { level: SampleLevel; message: string };
}

export function sampleNote(ctx: Ctx, n: number): { level: SampleLevel; message: string } {
  if (n === 0) return { level: "none", message: T(ctx, "इस चयन के लिए अभी कोई प्रतिक्रिया उपलब्ध नहीं है।", "No responses are available for this selection yet.") };
  if (n < 30)
    return {
      level: "very_small",
      message: T(
        ctx,
        `यह विश्लेषण केवल ${n} प्रतिक्रियाओं पर आधारित है। बहुत छोटे sample के कारण प्रतिशत में बड़ा उतार-चढ़ाव संभव है; इसे व्यापक मतदाता जनसंख्या का प्रतिनिधि नहीं माना जाना चाहिए।`,
        `This analysis is based on only ${n} responses. With a very small sample, percentages can swing widely; it should not be treated as representative of the wider electorate.`
      ),
    };
  if (n < 100)
    return {
      level: "small",
      message: T(
        ctx,
        `यह विश्लेषण ${n} प्रतिक्रियाओं पर आधारित है। छोटे sample के कारण इसे व्यापक मतदाता जनसंख्या का प्रतिनिधि नहीं माना जाना चाहिए।`,
        `This analysis is based on ${n} responses. Because the sample is small, it should not be treated as representative of the wider electorate.`
      ),
    };
  return {
    level: n < 400 ? "moderate" : "large",
    message: T(
      ctx,
      `यह विश्लेषण ${n.toLocaleString("en-IN")} स्वैच्छिक ऑनलाइन प्रतिक्रियाओं पर आधारित है। यह यादृच्छिक (random) नमूना नहीं है, इसलिए इसे पूरी मतदाता जनसंख्या का प्रतिनिधि नहीं माना जाना चाहिए।`,
      `This analysis is based on ${n.toLocaleString("en-IN")} voluntary online responses. It is not a random sample, so it should not be treated as representative of all voters.`
    ),
  };
}

export function dataQuality(ctx: AnalysisContext, a: ScopeAnalysis): DataQuality {
  const recs = ctx.records;
  const complete = recs.filter((r) => isComplete(ctx, r)).length;
  const weekAgo = ctx.now - 7 * DAY;
  const monthAgo = ctx.now - 30 * DAY;
  const demoKeys = ["age_group", "gender", "social_category", "religion"] as const;
  const any = recs.filter((r) => demoKeys.some((k) => answerKeys(r, k).length)).length;
  const unit = areaUnitOf(ctx.scope);
  let geo: DataQuality["geo"] = null;
  if (a.geo && unit) {
    geo = {
      label: T(ctx, AREA_UNIT_LABELS[unit].hiPlural, AREA_UNIT_LABELS[unit].enPlural),
      covered: a.geo.rows.length,
      total: a.geo.totalUnits,
      reliable: a.geo.rows.filter((r) => r.n >= MIN_GROUP_N).length,
    };
  }
  return {
    total: recs.length,
    complete,
    incomplete: recs.length - complete,
    completionRate: pct(complete, recs.length),
    recency: [
      { key: "7d", label: T(ctx, "पिछले 7 दिन", "Last 7 days"), count: recs.filter((r) => r.createdAt >= weekAgo).length },
      { key: "30d", label: T(ctx, "8–30 दिन पहले", "8–30 days ago"), count: recs.filter((r) => r.createdAt < weekAgo && r.createdAt >= monthAgo).length },
      { key: "older", label: T(ctx, "30 दिन से पुरानी", "Older than 30 days"), count: recs.filter((r) => r.createdAt < monthAgo).length },
    ],
    perQuestion: a.quality.map((q) => {
      const k = q.key as QuestionKey;
      const asked = recs.filter((r) => wasAsked(ctx, r, k)).length;
      const answered = recs.filter((r) => wasAsked(ctx, r, k) && r.answers[k]?.length).length;
      return { key: q.key, label: q.label, asked, answered, missing: asked - answered, pct: pct(answered, asked), since: questionStart(ctx, k) };
    }),
    demographicAny: { count: any, pct: pct(any, recs.length) },
    demographicAll: a.profileComplete,
    geo,
    sample: sampleNote(ctx, recs.length),
  };
}

// ── Advanced key findings ────────────────────────────────────────────────────

/** Measurable, descriptive observations — each states its base (N). Never a forecast. */
export function advancedFindings(ctx: AnalysisContext, a: ScopeAnalysis): Finding[] {
  const out: Finding[] = [];
  const recs = ctx.records;

  // 1. Where the responses come from (geographic concentration).
  if (a.geo && a.geo.rows.length >= 2) {
    const top = a.geo.rows[0];
    const share = pct(top.n, a.total);
    out.push({
      icon: "geo",
      base: a.total,
      title: T(ctx, `सबसे अधिक प्रतिक्रियाएं ${top.label} से`, `Most responses come from ${top.label}`),
      text:
        share >= 50
          ? T(ctx, `${a.total} में से ${top.n} (${r0(share)}%) — कुल आंकड़े इस क्षेत्र से अधिक प्रभावित हैं।`, `${top.n} of ${a.total} (${r0(share)}%) — the totals are weighted toward this area.`)
          : T(ctx, `${a.total} में से ${top.n} प्रतिक्रियाएं (${r0(share)}%)`, `${top.n} of ${a.total} responses (${r0(share)}%)`),
    });
  }

  // 2. Demographic concentration of the sample.
  for (const k of ["gender", "age_group"] as const) {
    const d = a.demographics[k];
    const t = topOf(d);
    if (!t || d.answered < MIN_COMPARE_N || t.item.pct < 65) continue;
    out.push({
      icon: "demographic",
      base: d.answered,
      title: T(ctx, `उत्तरदाताओं में ${t.item.label} का हिस्सा ${r0(t.item.pct)}%`, `${t.item.label} make up ${r0(t.item.pct)}% of respondents`),
      text: T(
        ctx,
        `${k === "gender" ? "लिंग" : "आयु"} बताने वाले ${d.answered} में से ${t.item.count} — अन्य समूहों की राय कम प्रतिक्रियाओं पर आधारित है।`,
        `${t.item.count} of ${d.answered} who shared ${k === "gender" ? "gender" : "age"} — other groups rest on fewer responses.`
      ),
    });
  }

  // 3. Differences between sub-areas for the leading party and issue.
  const unit = areaUnitOf(ctx.scope);
  if (unit) {
    const groups = new Map<string, ResponseRecord[]>();
    for (const r of recs) (groups.get(areaKey(r, unit)) ?? groups.set(areaKey(r, unit), []).get(areaKey(r, unit))!).push(r);
    const areaDiff = (q: "party_preference" | "top_issue", key: string, label: string) => {
      const rows = [...groups.entries()]
        .map(([id, rs]) => {
          const d = distribution(rs, q, ctx.ds.meta, "count");
          return { id, n: d.answered, pct: d.items.find((i) => i.key === key)?.pct ?? 0 };
        })
        .filter((x) => x.n >= MIN_COMPARE_N)
        .sort((x, y) => y.pct - x.pct);
      if (rows.length < 2) return;
      const hiRow = rows[0];
      const loRow = rows[rows.length - 1];
      const gap = f1(hiRow.pct - loRow.pct);
      if (gap < 10) return;
      out.push({
        icon: "compare",
        base: Math.min(hiRow.n, loRow.n),
        title: T(ctx, `${label}: क्षेत्रों के बीच ${r0(gap)} अंकों का अंतर`, `${label}: a ${r0(gap)}-point gap between areas`),
        text: T(
          ctx,
          `${areaLabel(ctx.ds, unit, hiRow.id)} (N=${hiRow.n}) में ${r0(hiRow.pct)}%, ${areaLabel(ctx.ds, unit, loRow.id)} (N=${loRow.n}) में ${r0(loRow.pct)}%`,
          `${r0(hiRow.pct)}% in ${areaLabel(ctx.ds, unit, hiRow.id)} (N=${hiRow.n}) vs ${r0(loRow.pct)}% in ${areaLabel(ctx.ds, unit, loRow.id)} (N=${loRow.n})`
        ),
      });
    };
    const p = topOf(a.party);
    if (p) areaDiff("party_preference", p.item.key, T(ctx, `${p.item.label} का समर्थन`, `${p.item.label} support`));
    const i = topOf(a.issues);
    if (i) areaDiff("top_issue", i.item.key, T(ctx, `${i.item.label} मुद्दा`, `${i.item.label} as an issue`));
  }

  // 4. Last 7 days vs the 7 days before (survey responses only).
  if (ctx.filters.period === "all") {
    const cmp = periodComparison(ctx, "last7");
    const party = cmp?.enough ? cmp.metrics.find((m) => m.key === "party" && m.sufficient) : undefined;
    if (cmp && party && cmp.a.n >= MIN_COMPARE_N && cmp.b.n >= MIN_COMPARE_N) {
      const biggest = [...party.rows].sort((x, y) => Math.abs(y.diff) - Math.abs(x.diff))[0];
      if (biggest && Math.abs(biggest.diff) >= 5)
        out.push({
          icon: "compare",
          base: Math.min(party.baseA, party.baseB),
          title: T(ctx, `पिछले 7 दिनों की प्रतिक्रियाओं में ${biggest.label} का हिस्सा ${biggest.diff > 0 ? "अधिक" : "कम"}`, `${biggest.label}'s share ${biggest.diff > 0 ? "higher" : "lower"} in the last 7 days`),
          text: T(
            ctx,
            `पिछले 7 दिन (N=${cmp.b.n}): ${r0(biggest.b.pct)}%, उससे पहले के 7 दिन (N=${cmp.a.n}): ${r0(biggest.a.pct)}% — सर्वे प्रतिक्रियाओं में ${Math.abs(r0(biggest.diff))} अंक का बदलाव`,
            `Last 7 days (N=${cmp.b.n}): ${r0(biggest.b.pct)}%, previous 7 days (N=${cmp.a.n}): ${r0(biggest.a.pct)}% — a ${Math.abs(r0(biggest.diff))}-point change in survey responses`
          ),
        });
    }
  }

  // 5. Party ↔ issue relationship.
  const cross = crossAnalysis(ctx, "party_preference", "top_issue");
  const overallIssue = topOf(a.issues);
  if (!("error" in cross) && overallIssue) {
    const col = cross.columns.find((c) => c.key === overallIssue.item.key);
    const rows = cross.rows.filter((r) => r.n >= MIN_COMPARE_N);
    if (col && rows.length >= 2) {
      const withPct = rows.map((r) => ({ r, p: r.cells.find((c) => c.key === col.key)?.pct ?? 0 }));
      const far = withPct.sort((x, y) => Math.abs(y.p - overallIssue.item.pct) - Math.abs(x.p - overallIssue.item.pct))[0];
      if (far && Math.abs(far.p - overallIssue.item.pct) >= 15)
        out.push({
          icon: "issue",
          base: far.r.n,
          title: T(ctx, `${far.r.label} चुनने वालों में ${col.label} पर अलग प्राथमिकता`, `${far.r.label} supporters weigh ${col.label} differently`),
          text: T(
            ctx,
            `${far.r.label} चुनने वाले उत्तरदाताओं (N=${far.r.n}) में ${r0(far.p)}% ने ${col.label} चुना, जबकि सभी उत्तरदाताओं में ${r0(overallIssue.item.pct)}%`,
            `${r0(far.p)}% of respondents choosing ${far.r.label} (N=${far.r.n}) picked ${col.label}, vs ${r0(overallIssue.item.pct)}% of all respondents`
          ),
        });
    }
  }

  // 6. MLA opinion ↔ party relationship.
  const byParty = crossAnalysis(ctx, "party_preference", "mla_satisfaction");
  if (!("error" in byParty)) {
    const rows = byParty.rows
      .filter((r) => r.n >= MIN_COMPARE_N)
      .map((r) => ({ r, pos: pct(r.cells.filter((c) => c.key === "satisfied" || c.key === "somewhat_satisfied").reduce((s, c) => s + c.count, 0), r.n) }))
      .sort((x, y) => y.pos - x.pos);
    if (rows.length >= 2 && rows[0].pos - rows[rows.length - 1].pos >= 20) {
      const [top, low] = [rows[0], rows[rows.length - 1]];
      out.push({
        icon: "mla",
        base: Math.min(top.r.n, low.r.n),
        title: T(ctx, "विधायक पर राय पार्टी समर्थन के अनुसार अलग", "MLA opinion differs by party choice"),
        text: T(
          ctx,
          `सकारात्मक राय: ${top.r.label} चुनने वालों (N=${top.r.n}) में ${r0(top.pos)}%, ${low.r.label} चुनने वालों (N=${low.r.n}) में ${r0(low.pos)}%`,
          `Positive opinion: ${r0(top.pos)}% among ${top.r.label} choosers (N=${top.r.n}) vs ${r0(low.pos)}% among ${low.r.label} choosers (N=${low.r.n})`
        ),
      });
    }
  }
  return out;
}

/**
 * THE findings list that may be shown or exported (page, findings dialog, PDF,
 * Excel): a finding whose sample is below MIN_GROUP_N is never surfaced as a
 * percentage. Headline findings (party / MLA / issue / age) take the base of
 * the question they describe; advanced findings carry their own `base`. The
 * underlying aggregates are untouched — only the finding text is withheld.
 */
export function reportableFindings(a: ScopeAnalysis, advanced: Finding[] = []): Finding[] {
  const headlineBase: Partial<Record<Finding["icon"], number>> = {
    party: a.party.answered,
    mla: a.mla.answered,
    issue: a.issues.answered,
    demographic: a.demographics.age_group.answered,
  };
  const safe = (base: number | undefined) => base === undefined || base >= MIN_GROUP_N;
  return [...a.findings.filter((f) => safe(f.base ?? headlineBase[f.icon])), ...advanced.filter((f) => safe(f.base ?? a.total))];
}

// ── Current MLA card ─────────────────────────────────────────────────────────

export interface MlaCard {
  name: string;
  party: string | null;
  partyShort: string | null;
  logoUrl: string | null;
  color: string | null;
}

export async function loadMlaCard(scope: ResolvedScope, locale: Locale): Promise<MlaCard | null> {
  if (!scope.constituency) return null;
  try {
    const mla = await getCurrentMlaForConstituency(scope.constituency.id, scope.election?.id);
    if (!mla?.name) return null;
    const party = mla.partyShortName ? await prisma.party.findFirst({ where: { shortName: mla.partyShortName }, select: { nameEnglish: true, nameHindi: true, logoUrl: true, colorHex: true } }) : null;
    const partyName = locale === "hi" ? (mla.partyHindi ?? party?.nameHindi ?? mla.party) : (mla.party ?? party?.nameEnglish ?? null);
    return {
      name: locale === "hi" ? (mla.nameHindi ?? mla.name) : mla.name,
      party: partyName && mla.partyShortName && !partyName.includes(mla.partyShortName) ? `${partyName} (${mla.partyShortName})` : partyName,
      partyShort: mla.partyShortName,
      logoUrl: party?.logoUrl ?? null,
      color: party?.colorHex ?? null,
    };
  } catch (error) {
    console.error("Analysis MLA card lookup failed:", error);
    return null;
  }
}

// ── Page bundle ──────────────────────────────────────────────────────────────

export interface AnalysisExtras {
  kpis: AnalysisKpis;
  profile: AreaProfile;
  quality: DataQuality;
  advanced: Finding[];
  mla: MlaCard | null;
  /** Small previews for the deep-analysis tiles. */
  previews: { issueTop: { label: string; pct: number } | null; geoUnits: number; timeDays: number };
  /** Default cross-analysis (age × party), so the module opens without a request. */
  initialCross: CrossResult | null;
  /** When the MLA-opinion question started being asked, if later than the survey start. */
  mlaSince: string | null;
}

export function analysisExtras(ctx: AnalysisContext, a: ScopeAnalysis, mla: MlaCard | null): AnalysisExtras {
  const kpis = analysisKpis(ctx, a);
  const issue = topOf(a.issues);
  return {
    kpis,
    profile: areaProfile(ctx, a, kpis),
    quality: dataQuality(ctx, a),
    advanced: advancedFindings(ctx, a),
    mla,
    previews: {
      issueTop: issue ? { label: issue.item.label, pct: issue.item.pct } : null,
      geoUnits: a.geo?.rows.length ?? 0,
      timeDays: kpis.days,
    },
    mlaSince: questionStart(ctx, "mla_satisfaction"),
    initialCross: (() => {
      const c = crossAnalysis(ctx, "age_group", "party_preference");
      return "error" in c ? null : c;
    })(),
  };
}

export async function getAnalysisPageData(scope: ResolvedScope, locale: Locale, filters: AnalysisFilters) {
  const ctx = await loadAnalysisContext(scope, locale, filters);
  if (!ctx) return null;
  const analysis = buildScopedAnalysis(ctx.ds, scope, locale, filters, ctx.isSynthetic);
  const mla = await loadMlaCard(scope, locale);
  return { ctx, analysis, extras: analysisExtras(ctx, analysis, mla) };
}

/** Server-computed versions of the interactive modules, for the printable report and Excel export. */
export function staticModules(ctx: AnalysisContext, a: ScopeAnalysis) {
  return {
    issues: a.issues.items.slice(0, 3).map((i) => issueDeepDive(ctx, i.key)).filter((x): x is IssueDeepDive => !!x),
    time: (["party", "mla", "issues"] as const).map((m) => timeSeries(ctx, m, "auto")),
    period: periodComparison(ctx, "last7"),
  };
}
