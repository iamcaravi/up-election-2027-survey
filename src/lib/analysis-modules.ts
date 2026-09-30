// Access configuration for the public Analysis modules.
//
// Every module is FREE and enabled today. The flags exist so that, later, an
// individual module can be switched off (or routed through an access check)
// in one place: the Analysis page only renders an enabled module, and the
// lazy module API (/api/analysis/module, /api/analysis/ask) refuses a
// disabled one. There is deliberately no paywall, plan or login logic here.

export const analysisModules = {
  areaProfile: true,
  keyFindings: true,
  responseTrend: true,
  partySupport: true,
  mlaOpinion: true,
  issueOverview: true,
  issueIntelligence: true,
  demographics: true,
  crossAnalysis: true,
  geographicComparison: true,
  compareAreas: true,
  timeComparison: true,
  periodComparison: true,
  dataQuality: true,
  askData: true,
  detailedExport: true,
} as const satisfies Record<string, boolean>;

export type AnalysisModuleKey = keyof typeof analysisModules;

export function isAnalysisModuleEnabled(key: AnalysisModuleKey): boolean {
  return analysisModules[key];
}
