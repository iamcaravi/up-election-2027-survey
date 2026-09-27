import { UP_DISTRICT_HINDI_NAMES } from "./district-hindi";
import { UP_CONSTITUENCY_HINDI_NAMES } from "./constituency-hindi";

// Reverse map: Hindi district name -> English slug
const HINDI_TO_DISTRICT_SLUG: Record<string, string> = {};
for (const [slug, hindiName] of Object.entries(UP_DISTRICT_HINDI_NAMES)) {
  HINDI_TO_DISTRICT_SLUG[hindiName.trim()] = slug;
}

// Reverse map: Hindi constituency name -> English slug
const HINDI_TO_CONSTITUENCY_SLUG: Record<string, string> = {};
for (const [slug, hindiName] of Object.entries(UP_CONSTITUENCY_HINDI_NAMES)) {
  HINDI_TO_CONSTITUENCY_SLUG[hindiName.trim()] = slug;
}

// Common state aliases
const STATE_ALIASES: Record<string, string[]> = {
  "uttar-pradesh": ["uttar pradesh", "up", "उत्तर प्रदेश", "उत्तरप्रदेश", "युपी", "यूपी"],
  "punjab": ["punjab", "पंजाब"],
  "gujarat": ["gujarat", "गुजरात"],
  "uttarakhand": ["uttarakhand", "उत्तराखंड"],
  "goa": ["goa", "गोवा"],
  "manipur": ["manipur", "मणिपुर"],
  "himachal-pradesh": ["himachal pradesh", "हिमाचल प्रदेश", "हिमाचल"],
};

// District aliases and alternate names
const DISTRICT_ALIASES: Record<string, string[]> = {
  "kheri": ["lakhimpur", "lakhimpur kheri", "लखीमपुर", "लखीमपुर खीरी", "खीरी"],
  "prayagraj": ["allahabad", "ilhabad", "इलाहाबाद", "प्रयागराज"],
  "ayodhya": ["faizabad", "फैजाबाद", "अयोध्या"],
  "varanasi": ["banaras", "kashi", "बनारस", "काशी", "वाराणसी"],
  "sant-ravidas-nagar": ["bhadohi", "भदोही", "संत रविदास नगर"],
  "bhadohi": ["sant ravidas nagar", "संत रविदास नगर", "भदोही"],
  "amroha": ["jyotiba phule nagar", "ज्योतिबा फुले नगर", "अमरोहा"],
  "hathras": ["mahamaya nagar", "महामाया नगर", "हाथरस"],
  "kasganj": ["kashiram nagar", "कांशीराम नगर", "कासगंज"],
  "sambhal": ["bhim nagar", "भीम नगर", "संभल"],
  "hapur": ["panchsheel nagar", "पंचशील नगर", "हापुड़"],
  "shamli": ["prabuddh nagar", "प्रबुद्ध नगर", "शामली"],
  "kanpur-nagar": ["kanpur", "कानपुर", "कानपुर नगर"],
  "kanpur-dehat": ["kanpur dehat", "dehat", "कानपुर देहात"],
  "gautam-buddha-nagar": ["noida", "greater noida", "नोएडा", "ग्रेटर नोएडा", "गौतम बुद्ध नगर", "gautam budh nagar"],
};

// Constituency aliases
const CONSTITUENCY_ALIASES: Record<string, string[]> = {
  "colonelganj": ["karnalganj", "karnailganj", "करनैलगंज", "कर्नलगंज", "colonelganj", "colonel ganj"],
  "allahabad-north": ["prayagraj north", "प्रयागराज उत्तर", "इलाहाबाद उत्तर"],
  "allahabad-south": ["prayagraj south", "प्रयागराज दक्षिण", "इलाहाबाद दक्षिण"],
  "allahabad-west": ["prayagraj west", "प्रयागराज पश्चिम", "इलाहाबाद पश्चिम"],
};

/**
 * Normalizes a search query string:
 * - trims leading/trailing whitespace
 * - collapses consecutive spaces
 * - converts to lowercase
 * - normalizes unicode (NFC)
 */
export function normalizeSearch(query: string): string {
  if (!query) return "";
  return query
    .trim()
    .toLowerCase()
    .normalize("NFC")
    .replace(/\s+/g, " ");
}

/**
 * Given a raw search term, returns all search term variations including:
 * - normalized term
 * - English romanized equivalents if input was Hindi
 * - Hindi script equivalents if input was English/Romanized
 * - slug versions (hyphenated)
 */
export function getSearchTerms(query: string): string[] {
  const norm = normalizeSearch(query);
  if (!norm) return [];

  const terms = new Set<string>();
  terms.add(norm);

  // If contains hyphens, add spaced version and vice versa
  if (norm.includes("-")) {
    terms.add(norm.replace(/-/g, " "));
  } else if (norm.includes(" ")) {
    terms.add(norm.replace(/\s+/g, "-"));
  }

  // Check state aliases
  for (const [slug, aliases] of Object.entries(STATE_ALIASES)) {
    if (slug === norm || aliases.some((a) => a.toLowerCase() === norm || a.toLowerCase().includes(norm))) {
      terms.add(slug);
      for (const a of aliases) terms.add(a.toLowerCase());
    }
  }

  // Check District Aliases
  for (const [slug, aliases] of Object.entries(DISTRICT_ALIASES)) {
    if (slug === norm || slug.includes(norm) || aliases.some((a) => a.toLowerCase() === norm || a.toLowerCase().includes(norm) || norm.includes(a.toLowerCase()))) {
      terms.add(slug);
      terms.add(slug.replace(/-/g, " "));
      for (const a of aliases) terms.add(a.toLowerCase());
    }
  }

  // Check Constituency Aliases
  for (const [slug, aliases] of Object.entries(CONSTITUENCY_ALIASES)) {
    if (slug === norm || slug.includes(norm) || aliases.some((a) => a.toLowerCase() === norm || a.toLowerCase().includes(norm) || norm.includes(a.toLowerCase()))) {
      terms.add(slug);
      terms.add(slug.replace(/-/g, " "));
      for (const a of aliases) terms.add(a.toLowerCase());
    }
  }

  // Check UP District Hindi -> English slug
  for (const [hindi, slug] of Object.entries(HINDI_TO_DISTRICT_SLUG)) {
    if (hindi === norm || hindi.includes(norm) || norm.includes(hindi)) {
      terms.add(slug);
      terms.add(slug.replace(/-/g, " "));
      terms.add(hindi);
    }
  }

  // Check UP District English slug -> Hindi name
  for (const [slug, hindi] of Object.entries(UP_DISTRICT_HINDI_NAMES)) {
    const slugSpaced = slug.replace(/-/g, " ");
    if (
      slug === norm ||
      slugSpaced === norm ||
      slug.includes(norm) ||
      slugSpaced.includes(norm) ||
      norm.includes(slug) ||
      norm.includes(slugSpaced)
    ) {
      terms.add(hindi);
      terms.add(slug);
      terms.add(slugSpaced);
    }
  }

  // Check UP Constituency Hindi -> English slug
  for (const [hindi, slug] of Object.entries(HINDI_TO_CONSTITUENCY_SLUG)) {
    if (hindi === norm || hindi.includes(norm) || norm.includes(hindi)) {
      terms.add(slug);
      terms.add(slug.replace(/-/g, " "));
      terms.add(hindi);
    }
  }

  // Check UP Constituency English slug -> Hindi name
  for (const [slug, hindi] of Object.entries(UP_CONSTITUENCY_HINDI_NAMES)) {
    const slugSpaced = slug.replace(/-/g, " ");
    if (
      slug === norm ||
      slugSpaced === norm ||
      slug.includes(norm) ||
      slugSpaced.includes(norm) ||
      norm.includes(slug) ||
      norm.includes(slugSpaced)
    ) {
      terms.add(hindi);
      terms.add(slug);
      terms.add(slugSpaced);
    }
  }

  return Array.from(terms);
}

/**
 * Checks whether an item matches a search query across:
 * - name
 * - slug
 * - hindiName
 * - englishName
 * - number
 * - aliases
 */
export function matchesCrossLanguage(
  item: {
    name?: string | null;
    slug?: string | null;
    nameHi?: string | null;
    nameEn?: string | null;
    number?: number | string | null;
    districtName?: string | null;
    stateName?: string | null;
  },
  query: string
): boolean {
  const normQuery = normalizeSearch(query);
  if (!normQuery) return true;

  const searchTerms = getSearchTerms(normQuery);
  if (!searchTerms.length) return true;

  const candidateStrings: string[] = [];

  if (item.name) {
    candidateStrings.push(item.name.toLowerCase());
  }
  if (item.slug) {
    const sLower = item.slug.toLowerCase();
    candidateStrings.push(sLower);
    candidateStrings.push(sLower.replace(/-/g, " "));
    // Add district Hindi name if slug matches
    const districtHindi = UP_DISTRICT_HINDI_NAMES[sLower];
    if (districtHindi) candidateStrings.push(districtHindi.toLowerCase());
    // Add constituency Hindi name if slug matches
    const constHindi = UP_CONSTITUENCY_HINDI_NAMES[sLower];
    if (constHindi) candidateStrings.push(constHindi.toLowerCase());
    // Add aliases if present
    const distAliases = DISTRICT_ALIASES[sLower];
    if (distAliases) {
      for (const a of distAliases) candidateStrings.push(a.toLowerCase());
    }
    const constAliases = CONSTITUENCY_ALIASES[sLower];
    if (constAliases) {
      for (const a of constAliases) candidateStrings.push(a.toLowerCase());
    }
  }
  if (item.nameHi) {
    candidateStrings.push(item.nameHi.toLowerCase());
  }
  if (item.nameEn) {
    candidateStrings.push(item.nameEn.toLowerCase());
  }
  if (item.number !== undefined && item.number !== null) {
    candidateStrings.push(String(item.number));
    candidateStrings.push(`#${item.number}`);
  }
  if (item.districtName) {
    const dLower = item.districtName.toLowerCase();
    candidateStrings.push(dLower);
    const dSlug = dLower.replace(/\s+/g, "-");
    const dHindi = UP_DISTRICT_HINDI_NAMES[dSlug];
    if (dHindi) candidateStrings.push(dHindi.toLowerCase());
  }
  if (item.stateName) {
    candidateStrings.push(item.stateName.toLowerCase());
  }

  for (const term of searchTerms) {
    for (const cand of candidateStrings) {
      if (cand.includes(term)) return true;
    }
  }

  return false;
}
