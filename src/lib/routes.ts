// Route helpers for the state/election-aware URL structure:
//   /[state]/elections/[election]/districts
//   /[state]/elections/[election]/districts/[district]
//   /[state]/elections/[election]/constituencies/[constituency]
//   /[state]/elections/[election]/constituencies/[constituency]/survey
//   /[state]/elections/[election]/constituencies/[constituency]/results
//
// Kept centralized so no component hard-codes a state/election slug.

export function statePath(stateSlug: string) {
  return `/${stateSlug}`;
}

export function electionPath(stateSlug: string, electionSlug: string) {
  return `/${stateSlug}/elections/${electionSlug}`;
}

export function districtsPath(stateSlug: string, electionSlug: string) {
  return `${electionPath(stateSlug, electionSlug)}/districts`;
}

export function districtPath(stateSlug: string, electionSlug: string, districtSlug: string) {
  return `${districtsPath(stateSlug, electionSlug)}/${districtSlug}`;
}

export function constituencyPath(stateSlug: string, electionSlug: string, constituencySlug: string) {
  return `${electionPath(stateSlug, electionSlug)}/constituencies/${constituencySlug}`;
}

/**
 * State-level Analysis. Kept for existing callers; now points at the ONE
 * canonical, scope-driven Analysis page (see analysisScopePath). The election
 * slug is no longer part of the URL — the page resolves the state's active
 * election itself.
 */
export function analysisPath(stateSlug: string, electionSlug?: string) {
  void electionSlug; // accepted for existing callers; not part of the canonical URL
  return analysisScopePath({ state: stateSlug });
}

// ── Canonical Result / Analysis (one implementation each, scope in the query) ──
export interface ResultScope {
  state?: string;
  district?: string;
  constituency?: string;
}

function scopeSearch(scope: ResultScope) {
  const q = new URLSearchParams();
  if (scope.state) q.set("state", scope.state);
  if (scope.district) q.set("district", scope.district);
  if (scope.constituency) q.set("constituency", scope.constituency);
  const s = q.toString();
  return s ? `?${s}` : "";
}

/** The single public Result page for State / District / Assembly scope. */
export function resultsPath(scope: ResultScope = {}) {
  return `/results${scopeSearch(scope)}`;
}

/** The single public Analysis page for State / District / Assembly scope. */
export function analysisScopePath(scope: ResultScope = {}) {
  return `/analysis${scopeSearch(scope)}`;
}

// The Results journey is a standalone flow independent of the State/Election
// hierarchy above — Results → pick a state → that state's aggregate result
// overview → pick a constituency → the canonical per-constituency result
// page (still constituencyPath + "/results", reused as-is, never duplicated).
export function resultsLandingPath() {
  return "/results";
}

export function stateResultsPath(stateSlug: string) {
  return resultsPath({ state: stateSlug });
}

// Analysis is likewise a standalone flow — Analysis → pick a state → that
// state's analysis dashboard (analysisPath above). This landing page is the
// state-agnostic entry point, mirroring resultsLandingPath.
export function analysisLandingPath() {
  return "/analysis";
}

// One state card's destination from the Analysis landing page — a thin
// redirect (src/app/analysis/[state]/page.tsx) that resolves the state's
// current active election server-side and forwards to analysisPath, so the
// landing page's cards don't need an election slug up front.
export function analysisLandingStatePath(stateSlug: string) {
  return analysisScopePath({ state: stateSlug });
}
