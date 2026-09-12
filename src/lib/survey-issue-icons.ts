// Maps DEFAULT_ISSUES keys (src/lib/enums.ts) to a lucide-react icon export
// name, resolved dynamically in the client (SurveyExperience.tsx) so this
// file stays framework-agnostic and importable from a server component.
const ISSUE_ICON_BY_KEY: Record<string, string> = {
  rojgar: "Briefcase",
  mahangai: "TrendingUp",
  sadak: "Route",
  bijli: "Zap",
  pani: "Droplet",
  shiksha: "GraduationCap",
  swasthya: "HeartPulse",
  kanoon_vyavastha: "Shield",
  krishi: "Wheat",
  parivahan: "Bus",
  jal_nikasi: "Waves",
  other: "MoreHorizontal",
};

export function getIssueIcon(key: string): string {
  return ISSUE_ICON_BY_KEY[key] ?? "HelpCircle";
}
