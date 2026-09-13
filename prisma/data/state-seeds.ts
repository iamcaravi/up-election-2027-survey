// One entry per state the platform ships with real, sourced data for.
// Adding a new state to the platform means adding one entry here (+ a
// constituencies JSON file, sourced the same way as the others) — no
// frontend/component code changes required. `parties` is that state's
// featured-party list (max 5, enforced by the admin API too) — a national
// party (BJP/INC/AAP/BSP) is simply repeated across states with the same
// `slug`/`shortName`, which seedState() upserts once and reuses; a
// state-only party (e.g. Shiromani Akali Dal) only ever appears in its own
// state's entry. "Other"/"NOTA"/"Undecided" are NOT listed per-state — they
// are global canonical parties every state's survey gets automatically (see
// CANONICAL_SPECIAL_PARTIES in src/lib/enums.ts).
//
// logoUrl is `null` wherever public/images/parties/ has no matching asset —
// never a fabricated or guessed logo (see src/lib/party-logos.ts).

import upConstituencies from "./constituencies.json";
import punjabConstituencies from "./punjab-constituencies.json";
import uttarakhandConstituencies from "./uttarakhand-constituencies.json";
import goaConstituencies from "./goa-constituencies.json";
import manipurConstituencies from "./manipur-constituencies.json";
import himachalPradeshConstituencies from "./himachal-pradesh-constituencies.json";
import gujaratConstituencies from "./gujarat-constituencies.json";

export interface StatePartySeed {
  slug: string;
  nameEnglish: string;
  nameHindi: string;
  shortName: string;
  colorHex: string;
  logoUrl: string | null;
}

export interface ConstituencyFile {
  source: string;
  sourceUrl: string;
  retrievedAt: string;
  note: string;
  constituencies: Array<[number, string, string, string]>;
}

export interface StateSeedConfig {
  name: string;
  slug: string;
  code: string;
  shortName?: string;
  electionName: string;
  electionSlug: string;
  year: number;
  electionDescription: string;
  constituencyFile: ConstituencyFile;
  /** This state's featured parties (max 5) — order is the survey display order. */
  parties: StatePartySeed[];
}

// Shared national parties — same Party row reused across every state that
// features them (upserted once by slug in seedState()).
const BJP: StatePartySeed = { slug: "bjp", nameEnglish: "Bharatiya Janata Party", nameHindi: "भारतीय जनता पार्टी", shortName: "BJP", colorHex: "#FF7A21", logoUrl: "/images/parties/BJP.png" };
const CONGRESS: StatePartySeed = { slug: "congress", nameEnglish: "Indian National Congress", nameHindi: "भारतीय राष्ट्रीय कांग्रेस", shortName: "Congress", colorHex: "#00A0E3", logoUrl: "/images/parties/INC.png" };
const AAP: StatePartySeed = { slug: "aap", nameEnglish: "Aam Aadmi Party", nameHindi: "आम आदमी पार्टी", shortName: "AAP", colorHex: "#0068C9", logoUrl: "/images/parties/AAP.png" };
const BSP: StatePartySeed = { slug: "bsp", nameEnglish: "Bahujan Samaj Party", nameHindi: "बहुजन समाज पार्टी", shortName: "BSP", colorHex: "#22409A", logoUrl: "/images/parties/BSP.png" };

export const STATE_SEEDS: StateSeedConfig[] = [
  {
    name: "Uttar Pradesh",
    slug: "uttar-pradesh",
    code: "UP",
    shortName: "UP",
    electionName: "Uttar Pradesh Assembly Election 2027",
    electionSlug: "assembly-2027",
    year: 2027,
    electionDescription: "Voluntary public-opinion survey ahead of the 2027 UP Assembly election. Not an official election result.",
    constituencyFile: upConstituencies as ConstituencyFile,
    parties: [
      BJP,
      { slug: "sp", nameEnglish: "Samajwadi Party", nameHindi: "समाजवादी पार्टी", shortName: "SP", colorHex: "#C8102E", logoUrl: "/images/parties/SP.png" },
      CONGRESS,
      BSP,
      { slug: "rld", nameEnglish: "Rashtriya Lok Dal", nameHindi: "राष्ट्रीय लोक दल", shortName: "RLD", colorHex: "#2E7D32", logoUrl: "/images/parties/RLD.png" },
    ],
  },
  {
    name: "Punjab",
    slug: "punjab",
    code: "PB",
    shortName: "Punjab",
    electionName: "Punjab Assembly Election 2027",
    electionSlug: "assembly-2027",
    year: 2027,
    electionDescription: "Voluntary public-opinion survey ahead of the 2027 Punjab Assembly election. Not an official election result.",
    constituencyFile: punjabConstituencies as ConstituencyFile,
    parties: [
      AAP,
      CONGRESS,
      BJP,
      { slug: "sad", nameEnglish: "Shiromani Akali Dal", nameHindi: "शिरोमणि अकाली दल", shortName: "SAD", colorHex: "#0057A8", logoUrl: null },
    ],
  },
  {
    name: "Uttarakhand",
    slug: "uttarakhand",
    code: "UK",
    shortName: "Uttarakhand",
    electionName: "Uttarakhand Assembly Election 2027",
    electionSlug: "assembly-2027",
    year: 2027,
    electionDescription: "Voluntary public-opinion survey ahead of the 2027 Uttarakhand Assembly election. Not an official election result.",
    constituencyFile: uttarakhandConstituencies as ConstituencyFile,
    parties: [BJP, CONGRESS, AAP, BSP],
  },
  {
    name: "Goa",
    slug: "goa",
    code: "GA",
    shortName: "Goa",
    electionName: "Goa Assembly Election 2027",
    electionSlug: "assembly-2027",
    year: 2027,
    electionDescription: "Voluntary public-opinion survey ahead of the 2027 Goa Assembly election. Not an official election result.",
    constituencyFile: goaConstituencies as ConstituencyFile,
    parties: [
      BJP,
      CONGRESS,
      AAP,
      { slug: "mgp", nameEnglish: "Maharashtrawadi Gomantak Party", nameHindi: "महाराष्ट्रवादी गोमंतक पार्टी", shortName: "MGP", colorHex: "#2E7D32", logoUrl: null },
    ],
  },
  {
    name: "Manipur",
    slug: "manipur",
    code: "MN",
    shortName: "Manipur",
    electionName: "Manipur Assembly Election 2027",
    electionSlug: "assembly-2027",
    year: 2027,
    electionDescription: "Voluntary public-opinion survey ahead of the 2027 Manipur Assembly election. Not an official election result.",
    constituencyFile: manipurConstituencies as ConstituencyFile,
    parties: [
      BJP,
      CONGRESS,
      { slug: "npf", nameEnglish: "Naga People's Front", nameHindi: "नागा पीपुल्स फ्रंट", shortName: "NPF", colorHex: "#006837", logoUrl: null },
      { slug: "npp", nameEnglish: "National People's Party", nameHindi: "नेशनल पीपुल्स पार्टी", shortName: "NPP", colorHex: "#EC1C6D", logoUrl: null },
    ],
  },
  {
    name: "Himachal Pradesh",
    slug: "himachal-pradesh",
    code: "HP",
    shortName: "Himachal Pradesh",
    electionName: "Himachal Pradesh Assembly Election 2027",
    electionSlug: "assembly-2027",
    year: 2027,
    electionDescription: "Voluntary public-opinion survey ahead of the 2027 Himachal Pradesh Assembly election. Not an official election result.",
    constituencyFile: himachalPradeshConstituencies as ConstituencyFile,
    // Only 3 main parties — realistically a two-and-a-half-party state, no padding to 5.
    parties: [BJP, CONGRESS, AAP],
  },
  {
    name: "Gujarat",
    slug: "gujarat",
    code: "GJ",
    shortName: "Gujarat",
    electionName: "Gujarat Assembly Election 2027",
    electionSlug: "assembly-2027",
    year: 2027,
    electionDescription: "Voluntary public-opinion survey ahead of the 2027 Gujarat Assembly election. Not an official election result.",
    constituencyFile: gujaratConstituencies as ConstituencyFile,
    // Only 3 main parties — BJP/Congress/AAP, no padding to 5.
    parties: [BJP, CONGRESS, AAP],
  },
];
