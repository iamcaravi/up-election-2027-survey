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
