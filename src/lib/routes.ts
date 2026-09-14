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

/** The state-wide "चुनाव विश्लेषण" analytics landing page — not a constituency/candidate page. */
export function analysisPath(stateSlug: string, electionSlug: string) {
  return `${electionPath(stateSlug, electionSlug)}/analysis`;
}

// The Results journey is a standalone flow independent of the State/Election
// hierarchy above — Results → pick a state → that state's aggregate result
// overview → pick a constituency → the canonical per-constituency result
// page (still constituencyPath + "/results", reused as-is, never duplicated).
export function resultsLandingPath() {
  return "/results";
}

export function stateResultsPath(stateSlug: string) {
  return `/results/${stateSlug}`;
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
  return `/analysis/${stateSlug}`;
}
