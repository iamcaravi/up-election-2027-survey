import type { AnalysisFilters, ScopeParams } from "./scoped-survey";

// One parser for the canonical Analysis URL, shared by the page, the printable
// report and the XLSX export so all three always describe the same scope.

type Raw = Record<string, string | string[] | undefined> | URLSearchParams;

function get(raw: Raw, key: string) {
  const v = raw instanceof URLSearchParams ? raw.get(key) ?? undefined : raw[key];
  return (Array.isArray(v) ? v[0] : v) || undefined;
}

export const PERIODS = ["all", "30d", "7d", "custom"] as const;

/** Explicit `?state=all` — the combined all-states Analysis (never the default). */
export const ALL_STATES_PARAM = "all";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** A real calendar date in YYYY-MM-DD form. */
export function isIsoDate(s: string | undefined): s is string {
  if (!s || !DATE_RE.test(s)) return false;
  const t = Date.parse(`${s}T00:00:00Z`);
  return !Number.isNaN(t) && new Date(t).toISOString().slice(0, 10) === s;
}

export function readAnalysisParams(raw: Raw): { scope: ScopeParams; filters: AnalysisFilters } {
  const period = get(raw, "period");
  const segment = get(raw, "segment");
  const from = get(raw, "from");
  const to = get(raw, "to");
  const custom = period === "custom" && isIsoDate(from) && isIsoDate(to) && from <= to;
  return {
    scope: { state: get(raw, "state"), district: get(raw, "district"), constituency: get(raw, "constituency") },
    filters: {
      period: custom ? "custom" : period && period !== "custom" && (PERIODS as readonly string[]).includes(period) ? period : "all",
      segment: segment && /^[a-z_]+:[a-z0-9_+-]+$/i.test(segment) ? segment : "all",
      ...(custom ? { from, to } : {}),
    },
  };
}

export function analysisQuery(scope: ScopeParams, filters?: Partial<AnalysisFilters>, extra?: Record<string, string | undefined>) {
  const q = new URLSearchParams();
  if (scope.state) q.set("state", scope.state);
  if (scope.district) q.set("district", scope.district);
  if (scope.constituency) q.set("constituency", scope.constituency);
  if (filters?.segment && filters.segment !== "all") q.set("segment", filters.segment);
  if (filters?.period && filters.period !== "all") {
    if (filters.period !== "custom") q.set("period", filters.period);
    else if (filters.from && filters.to) {
      q.set("period", "custom");
      q.set("from", filters.from);
      q.set("to", filters.to);
    }
  }
  for (const [k, v] of Object.entries(extra ?? {})) if (v) q.set(k, v);
  const s = q.toString();
  return s ? `?${s}` : "";
}

// ── Custom report ────────────────────────────────────────────────────────────

/** Sections a user can include in the printable report / Excel export. */
export const REPORT_MODULES = ["scope", "summary", "party", "mla", "issues", "demographics", "cross", "geo", "time", "quality", "insights"] as const;
export type ReportModule = (typeof REPORT_MODULES)[number];

export const REPORT_MODULE_LABELS: Record<ReportModule, { hi: string; en: string }> = {
  scope: { hi: "दायरा", en: "Scope" },
  summary: { hi: "प्रतिक्रिया सारांश", en: "Response summary" },
  party: { hi: "पार्टी समर्थन", en: "Party support" },
  mla: { hi: "विधायक पर राय", en: "MLA opinion" },
  issues: { hi: "मुद्दे", en: "Issues" },
  demographics: { hi: "जनसांख्यिकी", en: "Demographics" },
  cross: { hi: "क्रॉस विश्लेषण", en: "Cross-analysis" },
  geo: { hi: "भौगोलिक तुलना", en: "Geographic comparison" },
  time: { hi: "समय तुलना", en: "Time comparison" },
  quality: { hi: "डेटा गुणवत्ता", en: "Data quality" },
  insights: { hi: "मुख्य निष्कर्ष", en: "Key insights" },
};

/** `?modules=party,mla,…` → allow-listed modules; missing/empty → every module. */
export function readReportModules(raw: Raw): ReportModule[] {
  const v = get(raw, "modules");
  if (!v) return [...REPORT_MODULES];
  const picked = new Set(v.split(",").map((s) => s.trim()));
  const out = REPORT_MODULES.filter((m) => picked.has(m));
  return out.length ? out : [...REPORT_MODULES];
}
