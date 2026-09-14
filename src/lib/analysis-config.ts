// Central switchboard for which Analysis dashboard modules are exposed.
//
// Every value below is `true` today — the entire Analysis page is free, and
// nothing in this codebase checks payment/entitlement state anywhere. This
// file exists purely so that a LATER premium tier can gate specific advanced
// modules by flipping a value here (once a real paywall/entitlement system
// is built) without touching the aggregation functions in state-analysis.ts
// or any chart component. Do not wire this to a paywall, do not add "locked"
// UI, and do not add "Upgrade" CTAs — this is architecture only.
export const ANALYSIS_CONFIG = {
  // Core free modules.
  currentVoteShare: true,
  voteTrend: true,
  keyIssues: true,
  partyIssueAnalysis: true,
  demographicAnalysis: true,

  // Advanced modules — computed and shown exactly like the modules above
  // today, but flagged separately so a future premium tier can gate just
  // these (deeper trend/momentum, cross-tabs, intersections) independently.
  advancedMomentum: true,
  issuePartyMatrix: true,
  issueByDemographic: true,
  intersectionAnalysis: true,
  advancedInsights: true,

  // Caste/social-category is its own dimension (same underlying
  // `social_category` survey question every state already collects) —
  // flagged separately so it can be gated independently of age/gender/
  // religion later without touching the aggregation code.
  castePartyAnalysis: true,
  casteIssueAnalysis: true,
  advancedDemographicAnalysis: true,
} as const;

export type AnalysisModuleKey = keyof typeof ANALYSIS_CONFIG;

export function isAnalysisModuleEnabled(key: AnalysisModuleKey): boolean {
  return ANALYSIS_CONFIG[key];
}
