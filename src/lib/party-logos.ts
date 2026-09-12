// Maps a Party row (shortName/slug, admin-editable) to one of the fixed set
// of party logo PNGs under public/images/parties/. Not every party seeded or
// added by an admin has a matching logo asset — callers must handle `null`
// (render an initials/abbreviation placeholder instead of an <img>).

const LOGO_FILE_BY_KEY: Record<string, string> = {
  bjp: "BJP.png",
  sp: "SP.png",
  inc: "INC.png",
  congress: "INC.png",
  bsp: "BSP.png",
  aap: "AAP.png",
  rld: "RLD.png",
  sbsp: "SBSP.png",
  asp: "ASP.png",
  ncp: "NCP.png",
  jsp: "JSP.png",
  oth: "OTH.png",
  other: "OTH.png",
  // DEFAULT_PARTIES (src/lib/enums.ts) seeds these two with their full
  // names as both `shortName` and `slug` (no short "ASP"/"JSP" code), so
  // the lookup above never matched and always fell through to the
  // initials/placeholder fallback even though the real logo files exist.
  "apna-dal": "ASP.png",
  "jansatta-dal-loktantrik-party": "JSP.png",
};

export function getPartyLogoUrl(shortName: string, slug: string): string | null {
  const key = LOGO_FILE_BY_KEY[shortName.trim().toLowerCase()] ?? LOGO_FILE_BY_KEY[slug.trim().toLowerCase()];
  return key ? `/images/parties/${key}` : null;
}

// Hindi full names for the parties seeded/known today (src/lib/enums.ts
// DEFAULT_PARTIES). A party an admin adds later without a mapping here
// simply falls back to whatever `name`/`shortName` is stored on its row.
const PARTY_HINDI_NAME_BY_SLUG: Record<string, string> = {
  bjp: "भारतीय जनता पार्टी",
  sp: "समाजवादी पार्टी",
  congress: "भारतीय राष्ट्रीय कांग्रेस",
  bsp: "बहुजन समाज पार्टी",
  aap: "आम आदमी पार्टी",
  rld: "राष्ट्रीय लोक दल",
  sbsp: "सुहेलदेव भारतीय समाज पार्टी",
  asp: "अपना दल (एस)",
  ncp: "राष्ट्रवादी कांग्रेस पार्टी",
  jsp: "जनता समाजवादी पार्टी",
  "apna-dal": "अपना दल (सोनेलाल)",
  "nishad-party": "निषाद पार्टी",
  "jansatta-dal-loktantrik-party": "जनसत्ता दल लोकतांत्रिक पार्टी",
  other: "अन्य",
  undecided: "अनिर्णीत",
};

export function getPartyDisplayName(slug: string, fallbackName: string): string {
  return PARTY_HINDI_NAME_BY_SLUG[slug.trim().toLowerCase()] ?? fallbackName;
}

// Fixed visual ordering for the party-selection cards (BJP, SP, INC, BSP,
// AAP, RLD, SBSP, ASP, NCP, JSP, OTH — matching the reference design), keyed
// by slug rather than hard-coded party data. A named party in the database
// that isn't in this list (e.g. a regional party an admin has added, or a
// legacy seed row like Apna Dal/Nishad Party/JDLP) sorts after all of these
// but still before the catch-all "Other"/"Undecided" options, which always
// stay last — nothing is invented or dropped, this only controls
// presentation order.
const PARTY_DISPLAY_PRIORITY: readonly string[] = [
  "bjp",
  "sp",
  "inc",
  "congress",
  "bsp",
  "aap",
  "rld",
  "sbsp",
  "asp",
  "ncp",
  "jsp",
];
const UNMATCHED_PRIORITY = PARTY_DISPLAY_PRIORITY.length;
const CATCH_ALL_PRIORITY: Record<string, number> = {
  oth: UNMATCHED_PRIORITY + 1,
  other: UNMATCHED_PRIORITY + 1,
  undecided: UNMATCHED_PRIORITY + 2,
};

export function getPartyDisplayPriority(slug: string): number {
  const key = slug.trim().toLowerCase();
  const index = PARTY_DISPLAY_PRIORITY.indexOf(key);
  if (index !== -1) return index;
  return CATCH_ALL_PRIORITY[key] ?? UNMATCHED_PRIORITY;
}
