// Party display helpers. Hindi name and logo are plain DB fields
// (Party.nameHindi / Party.logoUrl) set by seed data or the admin Parties
// page — nothing here invents a name or a logo. A party with no logo asset
// yet simply resolves to `null` and callers render an initials/abbreviation
// placeholder instead of an <img>; a party with no Hindi name yet falls back
// to its English name.

type PartyNameFields = { nameEnglish: string; nameHindi?: string | null; slug?: string | null; shortName?: string | null };
type PartyLogoFields = { logoUrl?: string | null };

export function getPartyLogoUrl(party: PartyLogoFields | null | undefined): string | null {
  return party?.logoUrl ?? null;
}

export function getPartyDisplayName(
  party: PartyNameFields | null | undefined,
  fallbackName: string,
  locale: "hi" | "en" = "hi"
): string {
  const slug = (party?.slug ?? fallbackName).toLowerCase();
  const shortName = (party?.shortName ?? "").toLowerCase();

  // Jansatta Dal Loktantrik Party: JDLP in English, जनसत्ता दल (JDLP) in Hindi
  if (slug === "jansatta-dal-loktantrik-party" || slug === "jdlp" || slug.includes("jansatta") || shortName === "jdlp" || fallbackName.toLowerCase().includes("jansatta")) {
    return locale === "hi" ? "जनसत्ता दल (JDLP)" : "JDLP";
  }

  // Canonical meta parties
  if (slug === "other" || fallbackName.toLowerCase() === "other") {
    return locale === "hi" ? "अन्य" : "Other";
  }
  if (slug === "nota" || fallbackName.toLowerCase() === "nota") {
    return locale === "hi" ? "इनमें से कोई नहीं" : "NOTA";
  }
  if (slug === "undecided" || fallbackName.toLowerCase() === "undecided") {
    return locale === "hi" ? "अनिर्णीत" : "Undecided";
  }

  if (locale === "hi") {
    return party?.nameHindi || party?.nameEnglish || fallbackName;
  }
  return party?.nameEnglish || fallbackName;
}

// Fixed visual ordering for the party-selection cards: real/featured parties
// first (by the order the admin/seed config gave them), then the catch-all
// "Other", "NOTA", and "Undecided" — always last, in that order, regardless
// of state. Keyed by slug rather than hard-coded party data so it works for
// any state's featured party list.
const CATCH_ALL_PRIORITY: Record<string, number> = {
  other: 1,
  nota: 2,
  undecided: 3,
};

export function getPartyDisplayPriority(slug: string): number {
  return CATCH_ALL_PRIORITY[slug.trim().toLowerCase()] ?? 0;
}
