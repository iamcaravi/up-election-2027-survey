import type { Locale } from "./i18n/LocaleProvider";

type OptionDictionary = Record<string, string | undefined>;

// Fixes a real mixed-language bug: issue/demographic SurveyOption rows only
// ever have ONE stored `label` (see prisma/schema.prisma's SurveyOption —
// no `nameHindi` column exists for non-party options, unlike Party which
// has a real nameEnglish/nameHindi pair). Seeded issue/demographic labels
// happen to be Hindi text with no English counterpart in the DB at all, so
// the existing `locale === "hi" && bucket.nameHindi ? bucket.nameHindi :
// bucket.label` pattern silently shows Hindi text even in English mode for
// those buckets (nameHindi is always null for them, so it always falls
// through to the raw — Hindi — `label`).
//
// The survey INPUT form already solves this correctly for the exact same
// option keys via the `t.surveyQuestions.options` dictionary (see
// SurveyExperience.tsx's `localize()`). This reuses that SAME dictionary —
// no new translations invented, no DB schema/data change — as the first
// choice for any bucket whose `key` matches a known option key; falls back
// to the existing label/nameHindi behavior untouched for anything that
// doesn't (party slugs, "other", "undecided", etc., which are not in this
// dictionary and already resolve correctly via their own nameHindi field).
export function resolveOptionLabel(
  key: string,
  fallback: { label: string; nameHindi?: string | null },
  locale: Locale,
  optionDictionary: OptionDictionary
): string {
  const dictLabel = optionDictionary[key];
  if (dictLabel) return dictLabel;
  return locale === "hi" && fallback.nameHindi ? fallback.nameHindi : fallback.label;
}
