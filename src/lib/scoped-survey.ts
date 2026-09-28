import "server-only";

import { prisma } from "./prisma";
import { getSiteSetting } from "./data";
import { ELIGIBLE_RESPONSE_STATUS, MLA_SATISFACTION_OPTIONS } from "./enums";
import { REAL_DATA_SOURCE, SYNTHETIC_DATA_MODE_KEY, SYNTHETIC_DATA_SOURCE } from "./synthetic-data";
import { displayStateName } from "./utils";
import { getDistrictDisplayName } from "./district-hindi";
import { getConstituencyDisplayName } from "./constituency-hindi";
import hi from "./i18n/locales/hi";
import en from "./i18n/locales/en";

// ─────────────────────────────────────────────────────────────────────────────
// ONE scope system for the public Result and Analysis pages (and their
// exports). A scope is State → District → Assembly constituency, addressed by
// DB slugs in the URL (?state=&district=&constituency=). Every number below is
// computed from real, eligible (VALID) survey responses of the site's active
// data source — nothing is estimated, projected or predicted.
//
// Data strategy: the whole state's eligible responses are fetched ONCE (the
// dataset is small), then filtered in memory. That single fetch gives the
// selected scope, its parent scopes (for comparison) and its child units (for
// geographic breakdowns) without extra round-trips. Queries are serialized on
// purpose — parallel Prisma queries caused request-context failures on the
// Cloudflare Worker runtime (see public-statewide-results.ts).
// ─────────────────────────────────────────────────────────────────────────────

export type Locale = "hi" | "en";
export type ScopeLevel = "none" | "state" | "district" | "constituency";

export interface ScopeParams {
  state?: string;
  district?: string;
  constituency?: string;
}

export interface ScopeOption {
  slug: string;
  label: string;
  number?: number;
}

export interface ResolvedScope {
  level: ScopeLevel;
  /** Canonical params for the resolved scope (invalid/mismatched slugs dropped). */
  params: ScopeParams;
  state: { id: string; slug: string; name: string } | null;
  election: { id: string; slug: string; year: number; name: string } | null;
  district: { id: string; slug: string; name: string } | null;
  constituency: {
    id: string;
    slug: string;
    name: string;
    number: number;
    reservedStatus: string;
    currentMlaName: string | null;
    currentMlaParty: string | null;
  } | null;
  options: { states: ScopeOption[]; districts: ScopeOption[]; constituencies: ScopeOption[] };
}

/** Minimum respondents in a demographic group before a cross-tab row is drawn. */
export const MIN_GROUP_N = 5;

const QUESTION_KEYS = ["party_preference", "mla_satisfaction", "top_issue", "age_group", "gender", "social_category", "religion"] as const;
type QuestionKey = (typeof QUESTION_KEYS)[number];
export const DEMOGRAPHIC_KEYS = ["gender", "age_group", "social_category", "religion"] as const;
export type DemographicKey = (typeof DEMOGRAPHIC_KEYS)[number];

function dict(locale: Locale) {
  return (locale === "hi" ? hi : en).surveyQuestions.options as Record<string, string | undefined>;
}

// ── Scope resolution ────────────────────────────────────────────────────────

export async function resolveScope(input: ScopeParams, locale: Locale): Promise<ResolvedScope> {
  const states = await prisma.state.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  const stateOptions = states.map((s) => ({ slug: s.slug, label: displayStateName(s.name, s.slug, locale) }));
  const empty: ResolvedScope = {
    level: "none",
    params: {},
    state: null,
    election: null,
    district: null,
    constituency: null,
    options: { states: stateOptions, districts: [], constituencies: [] },
  };

  const state = input.state ? states.find((s) => s.slug === input.state) : undefined;
  if (!state) return empty;

  const election = await prisma.election.findFirst({
    where: { stateId: state.id, isActive: true },
    orderBy: { year: "desc" },
  });
  const districts = await prisma.district.findMany({ where: { stateId: state.id }, orderBy: { name: "asc" } });
  const districtOptions = districts.map((d) => ({ slug: d.slug, label: getDistrictDisplayName(d.slug, d.name, locale) }));

  let district = input.district ? districts.find((d) => d.slug === input.district) : undefined;
  // A constituency link without a district (or with the wrong one) still
  // resolves: the district is inferred from the constituency itself.
  if (input.constituency) {
    const c = await prisma.constituency.findUnique({
      where: { stateId_slug: { stateId: state.id, slug: input.constituency } },
      select: { districtId: true },
    });
    if (c && (!district || district.id !== c.districtId)) district = districts.find((d) => d.id === c.districtId);
  }

  const base: ResolvedScope = {
    level: "state",
    params: { state: state.slug },
    state: { id: state.id, slug: state.slug, name: displayStateName(state.name, state.slug, locale) },
    election: election ? { id: election.id, slug: election.slug, year: election.year, name: election.name } : null,
    district: null,
    constituency: null,
    options: { states: stateOptions, districts: districtOptions, constituencies: [] },
  };
  if (!district) return base;

  const constituencies = await prisma.constituency.findMany({
    where: { districtId: district.id },
    orderBy: { number: "asc" },
  });
  base.level = "district";
  base.params.district = district.slug;
  base.district = { id: district.id, slug: district.slug, name: getDistrictDisplayName(district.slug, district.name, locale) };
  base.options.constituencies = constituencies.map((c) => ({
    slug: c.slug,
    number: c.number,
    label: getConstituencyDisplayName(c.slug, c.name, locale),
  }));

  const constituency = input.constituency ? constituencies.find((c) => c.slug === input.constituency) : undefined;
  if (!constituency) return base;
  base.level = "constituency";
  base.params.constituency = constituency.slug;
  base.constituency = {
    id: constituency.id,
    slug: constituency.slug,
    name: getConstituencyDisplayName(constituency.slug, constituency.name, locale),
    number: constituency.number,
    reservedStatus: constituency.reservedStatus,
    currentMlaName: constituency.currentMlaName,
    currentMlaParty: constituency.currentMlaParty,
  };
  return base;
}

export function scopeQuery(params: ScopeParams): string {
  const q = new URLSearchParams();
  if (params.state) q.set("state", params.state);
  if (params.district) q.set("district", params.district);
  if (params.constituency) q.set("constituency", params.constituency);
  const s = q.toString();
  return s ? `?${s}` : "";
}

export function sameScope(a: ScopeParams, b: ScopeParams) {
  return (a.state ?? "") === (b.state ?? "") && (a.district ?? "") === (b.district ?? "") && (a.constituency ?? "") === (b.constituency ?? "");
}

// ── Dataset ─────────────────────────────────────────────────────────────────

interface OptionMeta {
  key: string;
  label: string;
  order: number;
  color?: string | null;
  logoUrl?: string | null;
}

interface ResponseRecord {
  createdAt: number;
  constituencyId: string;
  districtId: string;
  answers: Partial<Record<QuestionKey, string[]>>;
}

interface Dataset {
  records: ResponseRecord[];
  meta: Record<QuestionKey, Map<string, OptionMeta>>;
  activeSurveyConstituencies: Set<string>;
  districtNames: Map<string, string>;
  constituencyInfo: Map<string, { name: string; districtId: string; number: number }>;
  totalConstituencies: number;
  totalDistricts: number;
}

// Older survey versions stored MLA-opinion answers under different option
// keys. They are folded into the four current options so no respondent is
// dropped (and percentages always add up): "very_satisfied" → "हाँ, बहुत खुश
// हैं", "very_dissatisfied"/"unsatisfied" → "नहीं, खुश नहीं हैं", "cant_say" →
// "कह नहीं सकते".
const MLA_KEY_ALIASES: Record<string, string> = {
  very_satisfied: "satisfied",
  very_dissatisfied: "dissatisfied",
  unsatisfied: "dissatisfied",
  cant_say: "undecided",
};

function partyLabel(slug: string, shortName: string, locale: Locale) {
  if (locale === "hi") {
    if (slug === "other") return "अन्य";
    if (slug === "undecided") return "अनिर्णीत";
  }
  return shortName;
}

async function loadStateDataset(scope: ResolvedScope, locale: Locale): Promise<Dataset | null> {
  if (!scope.state || !scope.election) return null;
  const isSynthetic = await getSiteSetting<boolean>(SYNTHETIC_DATA_MODE_KEY, false);
  const dataSource = isSynthetic ? SYNTHETIC_DATA_SOURCE : REAL_DATA_SOURCE;

  const responses = await prisma.surveyResponse.findMany({
    where: {
      status: ELIGIBLE_RESPONSE_STATUS,
      dataSource,
      survey: { electionId: scope.election.id },
      constituency: { stateId: scope.state.id },
    },
    select: {
      createdAt: true,
      constituencyId: true,
      constituency: { select: { districtId: true } },
      answers: {
        where: { optionId: { not: null }, question: { key: { in: [...QUESTION_KEYS] } } },
        select: {
          question: { select: { key: true } },
          option: {
            select: {
              key: true,
              label: true,
              order: true,
              party: { select: { slug: true, shortName: true, colorHex: true, logoUrl: true, displayOrder: true } },
            },
          },
        },
      },
    },
  });
  const districts = await prisma.district.findMany({ where: { stateId: scope.state.id }, select: { id: true, slug: true, name: true } });
  const constituencies = await prisma.constituency.findMany({
    where: { stateId: scope.state.id },
    select: { id: true, slug: true, name: true, number: true, districtId: true },
  });
  const activeSurveys = await prisma.survey.findMany({
    where: { electionId: scope.election.id, status: "ACTIVE", isActive: true, constituencyId: { not: null } },
    select: { constituencyId: true },
  });

  const options = dict(locale);
  const meta = Object.fromEntries(QUESTION_KEYS.map((k) => [k, new Map<string, OptionMeta>()])) as Dataset["meta"];
  const records: ResponseRecord[] = responses.map((r) => {
    const answers: ResponseRecord["answers"] = {};
    for (const a of r.answers) {
      if (!a.option) continue;
      const q = a.question.key as QuestionKey;
      const key = q === "mla_satisfaction" ? MLA_KEY_ALIASES[a.option.key] ?? a.option.key : a.option.key;
      const list = (answers[q] ??= []);
      if (!list.includes(key)) list.push(key);
      if (!meta[q].has(key)) {
        const p = a.option.party;
        meta[q].set(key, {
          key,
          label: p ? partyLabel(p.slug, p.shortName, locale) : options[a.option.key] ?? a.option.label,
          order: p ? p.displayOrder : a.option.order,
          color: p?.colorHex ?? null,
          logoUrl: p?.logoUrl ?? null,
        });
      }
    }
    return { createdAt: r.createdAt.getTime(), constituencyId: r.constituencyId, districtId: r.constituency.districtId, answers };
  });

  return {
    records,
    meta,
    activeSurveyConstituencies: new Set(activeSurveys.map((s) => s.constituencyId!).filter(Boolean)),
    districtNames: new Map(districts.map((d) => [d.id, getDistrictDisplayName(d.slug, d.name, locale)])),
    constituencyInfo: new Map(
      constituencies.map((c) => [c.id, { name: getConstituencyDisplayName(c.slug, c.name, locale), districtId: c.districtId, number: c.number }])
    ),
    totalConstituencies: constituencies.length,
    totalDistricts: districts.length,
  };
}

function inScope(r: ResponseRecord, scope: ResolvedScope) {
  if (scope.constituency) return r.constituencyId === scope.constituency.id;
  if (scope.district) return r.districtId === scope.district.id;
  return true;
}

// ── Aggregation primitives ──────────────────────────────────────────────────

export interface DistItem {
  key: string;
  label: string;
  count: number;
  /** Percentage of `answered` (respondents who answered the question). */
  pct: number;
  color?: string | null;
  logoUrl?: string | null;
}

export interface Distribution {
  /** Respondents who answered this question — the denominator. */
  answered: number;
  items: DistItem[];
}

const pct = (count: number, total: number) => (total > 0 ? Math.round((count / total) * 1000) / 10 : 0);

function distribution(records: ResponseRecord[], q: QuestionKey, meta: Dataset["meta"], sort: "count" | "order"): Distribution {
  let answered = 0;
  const counts = new Map<string, number>();
  for (const r of records) {
    const keys = r.answers[q];
    if (!keys?.length) continue;
    answered++;
    for (const k of keys) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const items = [...counts.entries()].map(([key, count]) => {
    const m = meta[q].get(key);
    return { key, label: m?.label ?? key, count, pct: pct(count, answered), color: m?.color, logoUrl: m?.logoUrl, order: m?.order ?? 999 };
  });
  items.sort((a, b) => (sort === "count" ? b.count - a.count || a.order - b.order : a.order - b.order));
  return { answered, items: items.map((i) => ({ key: i.key, label: i.label, count: i.count, pct: i.pct, color: i.color, logoUrl: i.logoUrl })) };
}

function mlaDistribution(records: ResponseRecord[], locale: Locale): Distribution {
  let answered = 0;
  const counts = new Map<string, number>();
  for (const r of records) {
    const k = r.answers.mla_satisfaction?.[0];
    if (!k) continue;
    answered++;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const labelsHi: Record<string, string> = {
    satisfied: "हाँ, बहुत खुश हैं",
    somewhat_satisfied: "कुछ हद तक खुश हैं",
    dissatisfied: "नहीं, खुश नहीं हैं",
    undecided: "कह नहीं सकते",
  };
  const items = MLA_SATISFACTION_OPTIONS.map((o) => ({
    key: o.key,
    label: locale === "hi" ? labelsHi[o.key] : o.labelEn,
    count: counts.get(o.key) ?? 0,
    pct: pct(counts.get(o.key) ?? 0, answered),
    color: o.colorHex,
  }));
  return { answered, items };
}

// ── Result summary (concise) ────────────────────────────────────────────────

export interface ScopeSummary {
  total: number;
  today: number;
  last7Days: number;
  surveyActive: boolean;
  /** Constituencies in scope / with ≥1 valid response. */
  constituenciesInScope: number;
  respondingConstituencies: number;
  firstResponseAt: string | null;
  lastResponseAt: string | null;
  party: Distribution;
  mla: Distribution;
  issues: Distribution;
  isSynthetic: boolean;
}

function startOfTodayIST(now: number) {
  const IST = 5.5 * 60 * 60 * 1000;
  const DAY = 24 * 60 * 60 * 1000;
  return Math.floor((now + IST) / DAY) * DAY - IST;
}

function summarize(records: ResponseRecord[], ds: Dataset, scope: ResolvedScope, locale: Locale, isSynthetic: boolean): ScopeSummary {
  const now = Date.now();
  const todayStart = startOfTodayIST(now);
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const scopeConstituencies = [...ds.constituencyInfo.entries()].filter(([id, c]) =>
    scope.constituency ? id === scope.constituency.id : scope.district ? c.districtId === scope.district.id : true
  );
  const responding = new Set(records.map((r) => r.constituencyId));
  const times = records.map((r) => r.createdAt);
  return {
    total: records.length,
    today: records.filter((r) => r.createdAt >= todayStart).length,
    last7Days: records.filter((r) => r.createdAt >= weekAgo).length,
    surveyActive: scopeConstituencies.some(([id]) => ds.activeSurveyConstituencies.has(id)),
    constituenciesInScope: scopeConstituencies.length,
    respondingConstituencies: responding.size,
    firstResponseAt: times.length ? new Date(Math.min(...times)).toISOString() : null,
    lastResponseAt: times.length ? new Date(Math.max(...times)).toISOString() : null,
    party: distribution(records, "party_preference", ds.meta, "count"),
    mla: mlaDistribution(records, locale),
    issues: distribution(records, "top_issue", ds.meta, "count"),
    isSynthetic,
  };
}

export async function getScopedResults(scope: ResolvedScope, locale: Locale): Promise<ScopeSummary | null> {
  const ds = await loadStateDataset(scope, locale);
  if (!ds) return null;
  const isSynthetic = await getSiteSetting<boolean>(SYNTHETIC_DATA_MODE_KEY, false);
  return summarize(ds.records.filter((r) => inScope(r, scope)), ds, scope, locale, isSynthetic);
}

// ── Analysis (deep) ─────────────────────────────────────────────────────────

export interface AnalysisFilters {
  /** "all" or "<demographicKey>:<optionKey>" */
  segment: string;
  /** "all" | "30d" | "7d" */
  period: string;
}

export interface CrossTabRow {
  key: string;
  label: string;
  /** Respondents in this group who answered the target question. */
  n: number;
  sufficient: boolean;
  cells: { key: string; label: string; count: number; pct: number; color?: string | null }[];
}

export interface CrossTab {
  columns: { key: string; label: string; color?: string | null }[];
  rows: CrossTabRow[];
  /** At least two groups meet MIN_GROUP_N. */
  meaningful: boolean;
}

export interface TrendPoint {
  label: string;
  count: number;
}

export interface GeoRow {
  key: string;
  label: string;
  n: number;
  topParty: { label: string; pct: number } | null;
  topIssue: { label: string; pct: number } | null;
  satisfiedPct: number | null;
}

export interface LevelComparison {
  key: string;
  label: string;
  level: "state" | "district" | "constituency";
  n: number;
  party: DistItem[];
  topIssues: DistItem[];
}

export interface Finding {
  icon: "party" | "mla" | "issue" | "demographic" | "geo" | "compare";
  title: string;
  text: string;
}

export interface ScopeAnalysis extends ScopeSummary {
  filters: AnalysisFilters;
  segmentOptions: { value: string; label: string }[];
  trend: { granularity: "day" | "week" | "month"; points: TrendPoint[] } | null;
  issueCategories: DistItem[] | null;
  issueCategoryAnswered: number;
  demographics: Record<DemographicKey, Distribution>;
  crossAgeParty: CrossTab;
  crossGenderParty: CrossTab;
  crossCategoryParty: CrossTab;
  crossAgeIssue: CrossTab;
  crossGenderIssue: CrossTab;
  crossPartyMla: CrossTab;
  geo: { unit: "district" | "constituency"; rows: GeoRow[]; totalUnits: number } | null;
  comparison: LevelComparison[];
  quality: { key: string; label: string; answered: number; pct: number }[];
  profileComplete: { count: number; pct: number };
  issueTrend: { buckets: string[]; series: { key: string; label: string; color: string; values: (number | null)[] }[] } | null;
  findings: Finding[];
  insights: string[];
}

const ISSUE_COLORS = ["#ea580c", "#10b981", "#3b82f6", "#a855f7", "#f43f5e", "#f59e0b"];

// Same grouping the State Detail page already uses for "voter priorities"
// (src/app/[state]/page.tsx) — reused, not a new interpretation.
const ISSUE_CATEGORIES: { key: string; hi: string; en: string; issues: string[] }[] = [
  { key: "economy", hi: "रोजगार और आर्थिक विकास", en: "Employment & Growth", issues: ["rojgar", "mahangai"] },
  { key: "education", hi: "शिक्षा", en: "Education", issues: ["shiksha"] },
  { key: "infra", hi: "सड़क और आधारभूत संरचना", en: "Roads & Infrastructure", issues: ["sadak", "bijli", "pani", "jal_nikasi", "parivahan"] },
  { key: "health", hi: "स्वास्थ्य सुविधाएं", en: "Healthcare", issues: ["swasthya"] },
  { key: "law", hi: "कानून व्यवस्था", en: "Law & Order", issues: ["kanoon_vyavastha"] },
  { key: "agri", hi: "कृषि और किसान", en: "Agriculture & Farmers", issues: ["krishi"] },
  { key: "other", hi: "अन्य", en: "Other", issues: ["other"] },
];

function crossTab(
  records: ResponseRecord[],
  groupQ: QuestionKey,
  targetQ: QuestionKey,
  ds: Dataset,
  locale: Locale,
  opts: { topColumns?: number } = {}
): CrossTab {
  const target = targetQ === "mla_satisfaction" ? mlaDistribution(records, locale) : distribution(records, targetQ, ds.meta, "count");
  const columns = (opts.topColumns ? target.items.filter((i) => i.count > 0).slice(0, opts.topColumns) : target.items).map((i) => ({
    key: i.key,
    label: i.label,
    color: i.color,
  }));
  const groupDist = distribution(records, groupQ, ds.meta, "order");
  const rows: CrossTabRow[] = groupDist.items
    .filter((g) => g.key !== "prefer_not_to_say")
    .map((g) => {
      const inGroup = records.filter((r) => r.answers[groupQ]?.includes(g.key) && r.answers[targetQ]?.length);
      const n = inGroup.length;
      return {
        key: g.key,
        label: g.label,
        n,
        sufficient: n >= MIN_GROUP_N,
        cells: columns.map((c) => {
          const count = inGroup.filter((r) => r.answers[targetQ]!.includes(c.key)).length;
          return { key: c.key, label: c.label, count, pct: pct(count, n), color: c.color };
        }),
      };
    })
    .filter((r) => r.n > 0);
  return { columns, rows, meaningful: rows.filter((r) => r.sufficient).length >= 2 };
}

function bucketKey(t: number, g: "day" | "week" | "month") {
  const d = new Date(t + 5.5 * 60 * 60 * 1000); // IST calendar
  if (g === "month") return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  if (g === "week") {
    const day = (d.getUTCDay() + 6) % 7; // Monday start
    const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day));
    return monday.toISOString().slice(0, 10);
  }
  return d.toISOString().slice(0, 10);
}

function bucketLabel(key: string, g: "day" | "week" | "month", locale: Locale) {
  const loc = locale === "hi" ? "hi-IN" : "en-IN";
  if (g === "month") {
    const [y, m] = key.split("-").map(Number);
    return new Intl.DateTimeFormat(loc, { month: "short", year: "2-digit", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 1)));
  }
  const [y, m, d] = key.split("-").map(Number);
  return new Intl.DateTimeFormat(loc, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
}

function granularityFor(records: ResponseRecord[]): "day" | "week" | "month" {
  const times = records.map((r) => r.createdAt);
  const span = (Math.max(...times) - Math.min(...times)) / (24 * 60 * 60 * 1000);
  return span <= 45 ? "day" : span <= 180 ? "week" : "month";
}

function trendOf(records: ResponseRecord[], locale: Locale): ScopeAnalysis["trend"] {
  if (records.length === 0) return null;
  const g = granularityFor(records);
  const counts = new Map<string, number>();
  for (const r of records) counts.set(bucketKey(r.createdAt, g), (counts.get(bucketKey(r.createdAt, g)) ?? 0) + 1);
  if (counts.size < 2) return null;
  // Fill empty days/weeks between first and last so the line is honest.
  const keys = [...counts.keys()].sort();
  const all: string[] = [];
  if (g === "month") {
    let [y, m] = keys[0].split("-").map(Number);
    const [ly, lm] = keys[keys.length - 1].split("-").map(Number);
    while (y < ly || (y === ly && m <= lm)) {
      all.push(`${y}-${String(m).padStart(2, "0")}`);
      m++;
      if (m > 12) {
        m = 1;
        y++;
      }
    }
  } else {
    const step = g === "week" ? 7 : 1;
    const start = Date.parse(`${keys[0]}T00:00:00Z`);
    const end = Date.parse(`${keys[keys.length - 1]}T00:00:00Z`);
    for (let t = start; t <= end; t += step * 24 * 60 * 60 * 1000) all.push(new Date(t).toISOString().slice(0, 10));
  }
  return { granularity: g, points: all.map((k) => ({ label: bucketLabel(k, g, locale), count: counts.get(k) ?? 0 })) };
}

function issueTrendOf(records: ResponseRecord[], topIssues: DistItem[], locale: Locale): ScopeAnalysis["issueTrend"] {
  const withIssue = records.filter((r) => r.answers.top_issue?.length);
  if (withIssue.length === 0 || topIssues.length === 0) return null;
  const g = granularityFor(withIssue);
  const buckets = new Map<string, ResponseRecord[]>();
  for (const r of withIssue) {
    const k = bucketKey(r.createdAt, g);
    (buckets.get(k) ?? buckets.set(k, []).get(k)!).push(r);
  }
  // Only buckets with enough respondents to make a share meaningful.
  const keys = [...buckets.keys()].sort().filter((k) => buckets.get(k)!.length >= MIN_GROUP_N);
  if (keys.length < 2) return null;
  return {
    buckets: keys.map((k) => bucketLabel(k, g, locale)),
    series: topIssues.slice(0, 5).map((issue, i) => ({
      key: issue.key,
      label: issue.label,
      color: ISSUE_COLORS[i % ISSUE_COLORS.length],
      values: keys.map((k) => {
        const rs = buckets.get(k)!;
        return pct(rs.filter((r) => r.answers.top_issue!.includes(issue.key)).length, rs.length);
      }),
    })),
  };
}

function applyFilters(records: ResponseRecord[], f: AnalysisFilters) {
  let out = records;
  if (f.period === "7d" || f.period === "30d") {
    const since = Date.now() - (f.period === "7d" ? 7 : 30) * 24 * 60 * 60 * 1000;
    out = out.filter((r) => r.createdAt >= since);
  }
  if (f.segment !== "all") {
    const [q, key] = f.segment.split(":");
    if ((DEMOGRAPHIC_KEYS as readonly string[]).includes(q) && key) out = out.filter((r) => r.answers[q as DemographicKey]?.includes(key));
  }
  return out;
}

function geoOf(records: ResponseRecord[], ds: Dataset, scope: ResolvedScope, locale: Locale): ScopeAnalysis["geo"] {
  if (scope.level === "constituency" || scope.level === "none") return null;
  const unit = scope.level === "state" ? "district" : "constituency";
  const groups = new Map<string, ResponseRecord[]>();
  for (const r of records) {
    const k = unit === "district" ? r.districtId : r.constituencyId;
    (groups.get(k) ?? groups.set(k, []).get(k)!).push(r);
  }
  const totalUnits =
    unit === "district" ? ds.totalDistricts : [...ds.constituencyInfo.values()].filter((c) => c.districtId === scope.district!.id).length;
  const rows: GeoRow[] = [...groups.entries()].map(([k, rs]) => {
    const party = distribution(rs, "party_preference", ds.meta, "count");
    const issues = distribution(rs, "top_issue", ds.meta, "count");
    const mla = mlaDistribution(rs, locale);
    return {
      key: k,
      label: unit === "district" ? ds.districtNames.get(k) ?? k : ds.constituencyInfo.get(k)?.name ?? k,
      n: rs.length,
      topParty: party.items[0] ? { label: party.items[0].label, pct: party.items[0].pct } : null,
      topIssue: issues.items[0] ? { label: issues.items[0].label, pct: issues.items[0].pct } : null,
      satisfiedPct: mla.answered ? pct(mla.items.filter((i) => i.key === "satisfied" || i.key === "somewhat_satisfied").reduce((s, i) => s + i.count, 0), mla.answered) : null,
    };
  });
  rows.sort((a, b) => b.n - a.n || a.label.localeCompare(b.label));
  return rows.length ? { unit, rows, totalUnits } : null;
}

function comparisonOf(all: ResponseRecord[], ds: Dataset, scope: ResolvedScope): LevelComparison[] {
  if (!scope.state || scope.level === "state" || scope.level === "none") return [];
  const levels: LevelComparison[] = [];
  const add = (level: LevelComparison["level"], key: string, label: string, rs: ResponseRecord[]) => {
    if (rs.length === 0) return;
    levels.push({
      key,
      label,
      level,
      n: rs.length,
      party: distribution(rs, "party_preference", ds.meta, "count").items.slice(0, 5),
      topIssues: distribution(rs, "top_issue", ds.meta, "count").items.slice(0, 3),
    });
  };
  if (scope.constituency) add("constituency", scope.constituency.slug, scope.constituency.name, all.filter((r) => r.constituencyId === scope.constituency!.id));
  if (scope.district) add("district", scope.district.slug, scope.district.name, all.filter((r) => r.districtId === scope.district!.id));
  add("state", scope.state.slug, scope.state.name, all);
  return levels.length >= 2 ? levels : [];
}

function fmtPct(n: number) {
  return `${Math.round(n)}%`;
}

function findingsOf(a: Omit<ScopeAnalysis, "findings" | "insights">, locale: Locale): Finding[] {
  const hiL = locale === "hi";
  const out: Finding[] = [];
  const top = (d: Distribution) => (d.items[0] && d.items[0].count > 0 ? d.items[0] : null);
  const tie = (d: Distribution) => d.items.length > 1 && d.items[0].count === d.items[1].count;

  const p = top(a.party);
  if (p)
    out.push({
      icon: "party",
      title: tie(a.party)
        ? hiL ? `सर्वे में शीर्ष समर्थन बराबर` : "Top survey support is tied"
        : hiL ? `सर्वे में ${p.label} को सर्वाधिक समर्थन` : `${p.label} has the highest survey support`,
      text: hiL
        ? `${a.party.answered} में से ${p.count} उत्तरदाता (${fmtPct(p.pct)})`
        : `${p.count} of ${a.party.answered} respondents (${fmtPct(p.pct)})`,
    });
  const mlaSorted = [...a.mla.items].sort((x, y) => y.count - x.count);
  const m = mlaSorted[0];
  if (m && m.count > 0) {
    const tied = mlaSorted.filter((x) => x.count === m.count);
    out.push({
      icon: "mla",
      title:
        tied.length > 1
          ? hiL
            ? `विधायक के कार्य पर राय बंटी हुई: ${tied.map((x) => `“${x.label}”`).join(", ")} बराबर`
            : `MLA opinion is split: ${tied.map((x) => `“${x.label}”`).join(", ")} tied`
          : hiL
            ? `विधायक के कार्य पर सबसे आम राय: “${m.label}”`
            : `Most common MLA opinion: “${m.label}”`,
      text: hiL
        ? `${a.mla.answered} में से ${m.count} उत्तरदाता${tied.length > 1 ? " (प्रत्येक)" : ""} (${fmtPct(m.pct)})`
        : `${m.count} of ${a.mla.answered} respondents${tied.length > 1 ? " each" : ""} (${fmtPct(m.pct)})`,
    });
  }
  const i = top(a.issues);
  if (i)
    out.push({
      icon: "issue",
      title: tie(a.issues)
        ? hiL
          ? `कई मुद्दे सबसे अधिक चुने गए (${a.issues.items.filter((x) => x.count === i.count).map((x) => x.label).join(", ")})`
          : `Several issues tie as most selected (${a.issues.items.filter((x) => x.count === i.count).map((x) => x.label).join(", ")})`
        : hiL
          ? `${i.label} सबसे अधिक चुना गया मुद्दा`
          : `${i.label} is the most selected issue`,
      text: hiL
        ? `${a.issues.answered} में से ${i.count} उत्तरदाताओं ने चुना (${fmtPct(i.pct)})`
        : `Selected by ${i.count} of ${a.issues.answered} respondents (${fmtPct(i.pct)})`,
    });
  const age = [...a.demographics.age_group.items].filter((x) => x.key !== "prefer_not_to_say").sort((x, y) => y.count - x.count)[0];
  if (age && a.demographics.age_group.answered >= MIN_GROUP_N)
    out.push({
      icon: "demographic",
      title: hiL ? `${age.label} आयु वर्ग से सबसे अधिक प्रतिक्रियाएं` : `Most responses from the ${age.label} age group`,
      text: hiL
        ? `आयु बताने वाले ${a.demographics.age_group.answered} में से ${age.count} (${fmtPct(age.pct)})`
        : `${age.count} of ${a.demographics.age_group.answered} who shared their age (${fmtPct(age.pct)})`,
    });
  return out;
}

function insightsOf(a: Omit<ScopeAnalysis, "findings" | "insights">, locale: Locale): string[] {
  const hiL = locale === "hi";
  const out: string[] = [];
  // Gender × party: compare the leading party's share across the two largest groups.
  const g = a.crossGenderParty.rows.filter((r) => r.sufficient);
  if (g.length >= 2 && a.crossGenderParty.columns[0]) {
    const col = a.crossGenderParty.columns[0];
    const [x, y] = g;
    const px = x.cells.find((c) => c.key === col.key)?.pct ?? 0;
    const py = y.cells.find((c) => c.key === col.key)?.pct ?? 0;
    out.push(
      hiL
        ? `${x.label} उत्तरदाताओं (N=${x.n}) में ${col.label} का समर्थन ${fmtPct(px)} और ${y.label} उत्तरदाताओं (N=${y.n}) में ${fmtPct(py)} है।`
        : `${col.label} support is ${fmtPct(px)} among ${x.label} respondents (N=${x.n}) and ${fmtPct(py)} among ${y.label} respondents (N=${y.n}).`
    );
  }
  // Age × issue: top issue of the youngest sufficient group.
  const young = a.crossAgeIssue.rows.find((r) => r.sufficient);
  if (young) {
    const best = [...young.cells].sort((x, y) => y.count - x.count)[0];
    if (best && best.count > 0)
      out.push(
        hiL
          ? `${young.label} आयु वर्ग (N=${young.n}) में ${best.label} सबसे अधिक चुना गया मुद्दा है (${fmtPct(best.pct)})।`
          : `Among the ${young.label} age group (N=${young.n}), ${best.label} is the most selected issue (${fmtPct(best.pct)}).`
      );
  }
  // Scope vs parent comparison for the leading party.
  if (a.comparison.length >= 2 && a.comparison[0].party[0]) {
    const self = a.comparison[0];
    const parent = a.comparison[a.comparison.length - 1];
    const lead = self.party[0];
    const parentPct = parent.party.find((p) => p.key === lead.key)?.pct ?? 0;
    const diff = Math.round(lead.pct - parentPct);
    if (diff !== 0)
      out.push(
        hiL
          ? `${self.label} (N=${self.n}) में ${lead.label} का समर्थन ${fmtPct(lead.pct)} है, जो ${parent.label} (N=${parent.n}) के ${fmtPct(parentPct)} से ${Math.abs(diff)} अंक ${diff > 0 ? "अधिक" : "कम"} है।`
          : `${lead.label} support in ${self.label} (N=${self.n}) is ${fmtPct(lead.pct)}, ${Math.abs(diff)} points ${diff > 0 ? "higher" : "lower"} than ${parent.label} (N=${parent.n}) at ${fmtPct(parentPct)}.`
      );
  }
  if (a.issues.answered > 0) {
    const multi = a.issues.items.reduce((s, i) => s + i.count, 0) / a.issues.answered;
    out.push(
      hiL
        ? `मुद्दों के प्रश्न का उत्तर देने वाले उत्तरदाताओं ने औसतन ${multi.toFixed(1)} मुद्दे चुने।`
        : `Respondents who answered the issues question selected ${multi.toFixed(1)} issues on average.`
    );
  }
  return out;
}

export async function getScopedAnalysis(scope: ResolvedScope, locale: Locale, filters: AnalysisFilters): Promise<ScopeAnalysis | null> {
  const ds = await loadStateDataset(scope, locale);
  if (!ds) return null;
  const isSynthetic = await getSiteSetting<boolean>(SYNTHETIC_DATA_MODE_KEY, false);
  const stateAll = applyFilters(ds.records, filters);
  const records = stateAll.filter((r) => inScope(r, scope));
  const base = summarize(records, ds, scope, locale, isSynthetic);

  const demographics = Object.fromEntries(
    DEMOGRAPHIC_KEYS.map((k) => [k, distribution(records, k, ds.meta, "order")])
  ) as Record<DemographicKey, Distribution>;

  // Segment filter choices come from the scope's own unfiltered answers.
  const scopeUnfiltered = ds.records.filter((r) => inScope(r, scope));
  const segmentOptions = [{ value: "all", label: locale === "hi" ? "सभी उत्तरदाता" : "All respondents" }];
  for (const k of ["gender", "age_group", "social_category"] as const) {
    for (const item of distribution(scopeUnfiltered, k, ds.meta, "order").items) {
      if (item.key === "prefer_not_to_say") continue;
      segmentOptions.push({ value: `${k}:${item.key}`, label: item.label });
    }
  }

  const issueCategoryAnswered = base.issues.answered;
  const issueCategories =
    issueCategoryAnswered > 0
      ? ISSUE_CATEGORIES.map((c) => {
          const count = records.filter((r) => r.answers.top_issue?.some((k) => c.issues.includes(k))).length;
          return { key: c.key, label: locale === "hi" ? c.hi : c.en, count, pct: pct(count, issueCategoryAnswered) };
        })
          .filter((c) => c.count > 0)
          .sort((a, b) => b.count - a.count)
      : null;

  const questionLabels: Record<QuestionKey, { hi: string; en: string }> = {
    party_preference: { hi: "पार्टी समर्थन", en: "Party preference" },
    mla_satisfaction: { hi: "विधायक के कार्य", en: "MLA performance" },
    top_issue: { hi: "मुख्य मुद्दे", en: "Main issues" },
    age_group: { hi: "आयु वर्ग", en: "Age group" },
    gender: { hi: "लिंग", en: "Gender" },
    social_category: { hi: "सामाजिक श्रेणी", en: "Social category" },
    religion: { hi: "धर्म", en: "Religion" },
  };
  const quality = QUESTION_KEYS.map((k) => {
    const answered = records.filter((r) => r.answers[k]?.length).length;
    return { key: k, label: questionLabels[k][locale], answered, pct: pct(answered, records.length) };
  });
  const profileCount = records.filter((r) => DEMOGRAPHIC_KEYS.every((k) => r.answers[k]?.length)).length;

  const partial: Omit<ScopeAnalysis, "findings" | "insights"> = {
    ...base,
    filters,
    segmentOptions,
    trend: trendOf(records, locale),
    issueCategories,
    issueCategoryAnswered,
    demographics,
    crossAgeParty: crossTab(records, "age_group", "party_preference", ds, locale),
    crossGenderParty: crossTab(records, "gender", "party_preference", ds, locale),
    crossCategoryParty: crossTab(records, "social_category", "party_preference", ds, locale),
    crossAgeIssue: crossTab(records, "age_group", "top_issue", ds, locale, { topColumns: 5 }),
    crossGenderIssue: crossTab(records, "gender", "top_issue", ds, locale, { topColumns: 5 }),
    crossPartyMla: crossTab(records, "party_preference", "mla_satisfaction", ds, locale),
    geo: geoOf(records, ds, scope, locale),
    comparison: comparisonOf(stateAll, ds, scope),
    quality,
    profileComplete: { count: profileCount, pct: pct(profileCount, records.length) },
    issueTrend: issueTrendOf(records, base.issues.items, locale),
  };
  return { ...partial, findings: findingsOf(partial, locale), insights: insightsOf(partial, locale) };
}
