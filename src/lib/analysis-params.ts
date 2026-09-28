import type { AnalysisFilters, ScopeParams } from "./scoped-survey";

// One parser for the canonical Analysis URL, shared by the page, the printable
// report and the XLSX export so all three always describe the same scope.

type Raw = Record<string, string | string[] | undefined> | URLSearchParams;

function get(raw: Raw, key: string) {
  const v = raw instanceof URLSearchParams ? raw.get(key) ?? undefined : raw[key];
  return (Array.isArray(v) ? v[0] : v) || undefined;
}

export const PERIODS = ["all", "30d", "7d"] as const;

export function readAnalysisParams(raw: Raw): { scope: ScopeParams; filters: AnalysisFilters } {
  const period = get(raw, "period");
  const segment = get(raw, "segment");
  return {
    scope: { state: get(raw, "state"), district: get(raw, "district"), constituency: get(raw, "constituency") },
    filters: {
      period: period && (PERIODS as readonly string[]).includes(period) ? period : "all",
      segment: segment && /^[a-z_]+:[a-z0-9_+-]+$/i.test(segment) ? segment : "all",
    },
  };
}

export function analysisQuery(scope: ScopeParams, filters?: Partial<AnalysisFilters>) {
  const q = new URLSearchParams();
  if (scope.state) q.set("state", scope.state);
  if (scope.district) q.set("district", scope.district);
  if (scope.constituency) q.set("constituency", scope.constituency);
  if (filters?.segment && filters.segment !== "all") q.set("segment", filters.segment);
  if (filters?.period && filters.period !== "all") q.set("period", filters.period);
  const s = q.toString();
  return s ? `?${s}` : "";
}
