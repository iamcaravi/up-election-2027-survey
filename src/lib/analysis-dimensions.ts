// Client-safe definitions shared by the Analysis engine (server) and the
// interactive Analysis modules (browser): the allow-listed dimensions, presets
// and the JSON shapes returned by /api/analysis/module and /api/analysis/ask.
// No server imports here.

export const DIMENSIONS = ["age_group", "gender", "social_category", "religion", "party_preference", "mla_satisfaction", "top_issue", "area"] as const;
export type Dimension = (typeof DIMENSIONS)[number];

export const DIMENSION_LABELS: Record<Dimension, { hi: string; en: string }> = {
  age_group: { hi: "आयु वर्ग", en: "Age group" },
  gender: { hi: "लिंग", en: "Gender" },
  social_category: { hi: "सामाजिक श्रेणी", en: "Social category" },
  religion: { hi: "धर्म", en: "Religion" },
  party_preference: { hi: "पार्टी समर्थन", en: "Party support" },
  mla_satisfaction: { hi: "विधायक पर राय", en: "MLA opinion" },
  top_issue: { hi: "मुख्य मुद्दा", en: "Main issue" },
  area: { hi: "क्षेत्र", en: "Area" },
};

export function isDimension(v: string | null | undefined): v is Dimension {
  return !!v && (DIMENSIONS as readonly string[]).includes(v);
}

export type AreaUnit = "state" | "district" | "constituency";

export const AREA_UNIT_LABELS: Record<AreaUnit, { hi: string; en: string; hiPlural: string; enPlural: string; hiOblique: string }> = {
  state: { hi: "राज्य", en: "State", hiPlural: "राज्यों", enPlural: "states", hiOblique: "राज्य" },
  district: { hi: "जिला", en: "District", hiPlural: "जिलों", enPlural: "districts", hiOblique: "जिले" },
  constituency: { hi: "विधानसभा क्षेत्र", en: "Constituency", hiPlural: "विधानसभा क्षेत्रों", enPlural: "constituencies", hiOblique: "विधानसभा क्षेत्र" },
};

/** Ready-made combinations (the six the page always had, plus a few more). */
export const CROSS_PRESETS: { a: Dimension; b: Dimension }[] = [
  { a: "age_group", b: "party_preference" },
  { a: "gender", b: "party_preference" },
  { a: "social_category", b: "party_preference" },
  { a: "age_group", b: "top_issue" },
  { a: "gender", b: "top_issue" },
  { a: "party_preference", b: "mla_satisfaction" },
  { a: "religion", b: "party_preference" },
  { a: "top_issue", b: "party_preference" },
  { a: "area", b: "party_preference" },
];

export const TIME_METRICS = ["party", "mla", "issues"] as const;
export type TimeMetric = (typeof TIME_METRICS)[number];
export const GRANULARITIES = ["auto", "day", "week", "month"] as const;
export type Granularity = (typeof GRANULARITIES)[number];

export const PERIOD_PRESETS = ["last7", "week", "month", "custom"] as const;
export type PeriodPreset = (typeof PERIOD_PRESETS)[number];

export const COMPARE_METRIC_LABELS: Record<MetricCompare["key"], { hi: string; en: string }> = {
  party: { hi: "पार्टी समर्थन", en: "Party support" },
  mla: { hi: "विधायक पर राय", en: "MLA opinion" },
  issues: { hi: "मुख्य मुद्दे", en: "Main issues" },
  gender: { hi: "लिंग", en: "Gender" },
  age_group: { hi: "आयु वर्ग", en: "Age group" },
};

// ── API result shapes ────────────────────────────────────────────────────────

export interface Column {
  key: string;
  label: string;
  color?: string | null;
}

export interface CrossRow {
  key: string;
  label: string;
  n: number;
  sufficient: boolean;
  cells: { key: string; count: number; pct: number }[];
}

export interface CrossResult {
  a: Dimension;
  b: Dimension;
  columns: Column[];
  rows: CrossRow[];
  /** At least two groups meet the minimum group size. */
  meaningful: boolean;
  /** Group dimension is multi-select (a respondent can appear in several rows). */
  multiA: boolean;
  /** Target dimension is multi-select (row percentages can add up to more than 100%). */
  multiB: boolean;
  /** Target options not drawn as their own column (only the top ones are shown). */
  hiddenColumns: number;
  unit: AreaUnit | null;
}

export interface GroupShare {
  key: string;
  label: string;
  /** Respondents in the group who answered the issues question. */
  n: number;
  /** Of those, respondents who selected the issue. */
  count: number;
  pct: number;
  sufficient: boolean;
}

export interface IssueDeepDive {
  issue: { key: string; label: string };
  overall: { count: number; answered: number; pct: number; rank: number; totalIssues: number };
  breakdowns: { dim: Dimension; unit: AreaUnit | null; rows: GroupShare[]; meaningful: boolean }[];
}

export interface TimeSeriesResult {
  metric: TimeMetric;
  granularity: Exclude<Granularity, "auto">;
  columns: Column[];
  buckets: { key: string; label: string; n: number; sufficient: boolean; values: (number | null)[] }[];
  /** At least two periods meet the minimum size. */
  enough: boolean;
  /** Only the most recent periods are returned when there are very many. */
  truncated: boolean;
}

export interface CompareRow {
  key: string;
  label: string;
  color?: string | null;
  a: { count: number; pct: number };
  b: { count: number; pct: number };
  /** Percentage-point difference (direction documented on the owning comparison). */
  diff: number;
}

export interface MetricCompare {
  key: "party" | "mla" | "issues" | "gender" | "age_group";
  baseA: number;
  baseB: number;
  /** Both sides have at least the minimum number of answers for this question. */
  sufficient: boolean;
  rows: CompareRow[];
}

export interface PeriodSide {
  from: string;
  to: string;
  n: number;
}

export interface PeriodComparisonResult {
  preset: PeriodPreset;
  /** A = earlier/reference period, B = later period; diff = B − A. */
  a: PeriodSide;
  b: PeriodSide;
  enough: boolean;
  metrics: MetricCompare[];
}

export interface AreaOption {
  ref: string;
  label: string;
  n: number;
  group?: string;
}

export interface CompareOptions {
  levels: { level: AreaUnit; options: AreaOption[] }[];
}

export interface AreaComparisonResult {
  /** diff = A − B. */
  a: { ref: string; label: string; level: AreaUnit; n: number };
  b: { ref: string; label: string; level: AreaUnit; n: number };
  enough: boolean;
  metrics: MetricCompare[];
}

export interface AskAnswer {
  status: "ok" | "insufficient" | "unsupported" | "refused";
  heading: string;
  lines: string[];
  /** How the question was understood (area / group / topic / period). */
  understood: string[];
  bars?: { key: string; label: string; count: number; pct: number; color?: string | null }[];
  table?: { columns: string[]; rows: (string | number)[][] };
  basis?: string;
}
