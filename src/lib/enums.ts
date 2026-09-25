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
export const ELIGIBLE_RESPONSE_STATUS = "VALID" as const;

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

// The three canonical global parties every state's survey always includes,
// regardless of that state's featured-party configuration (see
// prisma/data/state-seeds.ts and src/lib/survey-template-data.ts). Per-state
// featured party lists (BJP, state-specific regional parties, etc.) live in
// prisma/data/state-seeds.ts, not here — Party is no longer a single fixed
// global list, it's state-curated via StateParty.
export const CANONICAL_SPECIAL_PARTIES: Array<{
  nameEnglish: string;
  nameHindi: string;
  shortName: string;
  slug: string;
  colorHex: string;
}> = [
  { nameEnglish: "Other / Independent", nameHindi: "अन्य", shortName: "Other", slug: "other", colorHex: "#6B7280" },
  { nameEnglish: "None of the Above", nameHindi: "इनमें से कोई नहीं", shortName: "NOTA", slug: "nota", colorHex: "#4B5563" },
  { nameEnglish: "Undecided", nameHindi: "अनिर्णीत", shortName: "Undecided", slug: "undecided", colorHex: "#9CA3AF" },
];

export const MINIMUM_ANALYTICS_CELL_SIZE = 1;
export const MIN_ANALYTICS_GROUP_SIZE_DEFAULT = MINIMUM_ANALYTICS_CELL_SIZE;

export const MLA_SATISFACTION_OPTIONS = [
  {
    key: "very_satisfied",
    label: "बहुत संतुष्ट",
    labelEn: "Very Satisfied",
    sublabel: "कार्य अत्यंत संतोषजनक हैं",
    sublabelEn: "Work is highly satisfactory",
    colorHex: "#16a34a",
  },
  {
    key: "somewhat_satisfied",
    label: "कुछ हद तक संतुष्ट",
    labelEn: "Somewhat Satisfied",
    sublabel: "कुछ अच्छे कार्य हुए हैं, लेकिन और बेहतर हो सकते हैं",
    sublabelEn: "Some good work done, but could be better",
    colorHex: "#65a30d",
  },
  {
    key: "neutral",
    label: "न तो संतुष्ट, न असंतुष्ट",
    labelEn: "Neither Satisfied nor Dissatisfied",
    sublabel: "कार्य सामान्य हैं, कोई विशेष बदलाव नहीं दिखता",
    sublabelEn: "Work is average, no noticeable change",
    colorHex: "#eab308",
  },
  {
    key: "somewhat_dissatisfied",
    label: "कुछ हद तक असंतुष्ट",
    labelEn: "Somewhat Dissatisfied",
    sublabel: "उम्मीद के अनुसार कार्य नहीं हुए",
    sublabelEn: "Work has not met expectations",
    colorHex: "#ea580c",
  },
  {
    key: "very_dissatisfied",
    label: "पूरी तरह असंतुष्ट",
    labelEn: "Completely Dissatisfied",
    sublabel: "कार्य बिल्कुल संतोषजनक नहीं हैं",
    sublabelEn: "Work is not satisfactory",
    colorHex: "#dc2626",
  },
] as const;

export type MlaSatisfactionKey = (typeof MLA_SATISFACTION_OPTIONS)[number]["key"];

