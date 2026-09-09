// Enum-like string unions. Fields are stored as plain strings in the DB
// (portable across SQLite/Postgres) and validated here at the app boundary.

export const CANDIDATE_STATUSES = [
  "DECLARED",
  "LIKELY",
  "POSSIBLE",
  "INCUMBENT",
  "HISTORICAL",
  "OTHER",
] as const;
export type CandidateStatus = (typeof CANDIDATE_STATUSES)[number];

export const CANDIDATE_STATUS_LABELS: Record<CandidateStatus, string> = {
  DECLARED: "Declared Candidate",
  LIKELY: "Likely Candidate",
  POSSIBLE: "Potential Contender",
  INCUMBENT: "Sitting MLA",
  HISTORICAL: "Historical Candidate",
  OTHER: "Other",
};

// The default set of statuses eligible to appear as a live 2027
// "candidate_choice" survey option (see syncCandidateChoiceOptions).
// INCUMBENT deliberately excluded: being the current sitting MLA never by
// itself means they are contesting in 2027. HISTORICAL/OTHER excluded too —
// a live survey must never surface a stale or out-of-scope record.
export const SURVEY_ELIGIBLE_CANDIDATE_STATUSES: readonly CandidateStatus[] = [
  "DECLARED",
  "LIKELY",
  "POSSIBLE",
] as const;

export const CONFIDENCE_SCORES = ["HIGH", "MEDIUM", "LOW"] as const;
export type ConfidenceScore = (typeof CONFIDENCE_SCORES)[number];

export const RESERVED_STATUSES = ["None", "SC", "ST"] as const;
export type ReservedStatus = (typeof RESERVED_STATUSES)[number];

export const RESPONSE_STATUSES = ["VALID", "FLAGGED", "REJECTED"] as const;
export type ResponseStatus = (typeof RESPONSE_STATUSES)[number];

export const IMAGE_REVIEW_STATUSES = [
  "PENDING",
  "VERIFIED",
  "REJECTED",
  "REPLACE",
] as const;
export type ImageReviewStatus = (typeof IMAGE_REVIEW_STATUSES)[number];

export const ADMIN_ROLES = ["ADMIN", "EDITOR", "MODERATOR"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const AGE_GROUPS = [
  { key: "18-24", label: "18–24" },
  { key: "25-34", label: "25–34" },
  { key: "35-44", label: "35–44" },
  { key: "45-54", label: "45–54" },
  { key: "55-64", label: "55–64" },
  { key: "65+", label: "65+" },
] as const;

export const GENDERS = [
  { key: "male", label: "Male" },
  { key: "female", label: "Female" },
  { key: "other", label: "Other" },
] as const;

export const SOCIAL_CATEGORIES = [
  { key: "general", label: "General" },
  { key: "obc", label: "OBC" },
  { key: "sc", label: "SC" },
  { key: "st", label: "ST" },
] as const;

export const RELIGIONS = [
  { key: "hindu", label: "Hindu" },
  { key: "muslim", label: "Muslim" },
  { key: "sikh", label: "Sikh" },
  { key: "christian", label: "Christian" },
  { key: "buddhist", label: "Buddhist" },
  { key: "jain", label: "Jain" },
  { key: "other", label: "Other" },
] as const;

export const DEFAULT_ISSUES = [
  { key: "rojgar", label: "रोजगार" },
  { key: "mahangai", label: "महंगाई" },
  { key: "sadak", label: "सड़क" },
  { key: "bijli", label: "बिजली" },
  { key: "pani", label: "पानी" },
  { key: "shiksha", label: "शिक्षा" },
  { key: "swasthya", label: "स्वास्थ्य" },
  { key: "kanoon_vyavastha", label: "कानून-व्यवस्था" },
  { key: "krishi", label: "कृषि" },
  { key: "parivahan", label: "परिवहन" },
  { key: "jal_nikasi", label: "जल निकासी" },
  { key: "other", label: "अन्य" },
] as const;

export const DEFAULT_PARTIES: Array<{
  name: string;
  shortName: string;
  slug: string;
  colorHex: string;
}> = [
  { name: "Bharatiya Janata Party", shortName: "BJP", slug: "bjp", colorHex: "#FF7A21" },
  { name: "Samajwadi Party", shortName: "SP", slug: "sp", colorHex: "#C8102E" },
  { name: "Indian National Congress", shortName: "Congress", slug: "congress", colorHex: "#00A0E3" },
  { name: "Bahujan Samaj Party", shortName: "BSP", slug: "bsp", colorHex: "#22409A" },
  { name: "Rashtriya Lok Dal", shortName: "RLD", slug: "rld", colorHex: "#2E7D32" },
  { name: "Suheldev Bharatiya Samaj Party", shortName: "SBSP", slug: "sbsp", colorHex: "#7B3F00" },
  { name: "Apna Dal (Soneylal)", shortName: "Apna Dal", slug: "apna-dal", colorHex: "#FFC107" },
  { name: "Nishad Party", shortName: "Nishad Party", slug: "nishad-party", colorHex: "#1565C0" },
  { name: "Other / Independent", shortName: "Other", slug: "other", colorHex: "#6B7280" },
  { name: "Undecided", shortName: "Undecided", slug: "undecided", colorHex: "#9CA3AF" },
];

export const MIN_ANALYTICS_GROUP_SIZE_DEFAULT = 30;
