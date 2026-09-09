import fs from "fs";
import path from "path";

interface Classified {
  row: { memberId: string; name: string; constituencyNumber: number; constituencyName: string; partyRaw: string };
  constituency: { id: string; number: number; name: string; slug: string; state: { slug: string } } | null;
  partyShortName: string | null;
  status: "OK" | "DUP_SEAT" | "UNRESOLVED_CONSTITUENCY" | "UNRESOLVED_PARTY" | "NEEDS_REVIEW";
  reason?: string;
}

const classified: Classified[] = JSON.parse(
  fs.readFileSync(
    "C:/Users/MANOJM~1/AppData/Local/Temp/claude/C--Users-Manoj-Mishra-Desktop-Survey/df631008-bedd-47cf-a165-2dbf09b2650e/scratchpad/classified.json",
    "utf8"
  )
);

// Strip a single leading honorific token to match the platform's existing
// naming convention (plain names, no titles — e.g. "Yogi Adityanath", not
// "Shri Yogi Adityanath"), never inventing or altering the substantive name.
const HONORIFICS = ["shri", "shrimati", "smt", "dr", "prof", "er", "engineer", "kuwar"];
function cleanName(raw: string): string {
  let s = raw.replace(/\s+/g, " ").trim();
  const tokens = s.split(" ");
  if (tokens.length > 1 && HONORIFICS.includes(tokens[0].toLowerCase().replace(/\./g, ""))) {
    s = tokens.slice(1).join(" ");
  }
  return s.replace(/\s+/g, " ").trim();
}

const SOURCE_NAME = "Uttar Pradesh Legislative Assembly";
const SOURCE_LISTING_URL = "https://www.upvidhansabhaproceedings.gov.in/en/member-s-information";

const importRows = classified
  .filter((c) => c.status === "OK")
  .map((c) => ({
    name: cleanName(c.row.name),
    nameHindi: null as string | null,
    constituencyNumber: c.constituency!.number,
    constituencyName: c.constituency!.name,
    stateSlug: c.constituency!.state.slug,
    partyShortName: c.partyShortName,
    status: "INCUMBENT" as const,
    sourceName: SOURCE_NAME,
    sourceUrl: `https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=${c.row.memberId}`,
    memberProfileUrl: `https://www.upvidhansabhaproceedings.gov.in/web/guest/member?memberId=${c.row.memberId}`,
    verified: true,
    _sourceListingName: c.row.constituencyName,
    _memberId: c.row.memberId,
  }));

const needsReview = classified
  .filter((c) => c.status !== "OK")
  .map((c) => ({
    memberId: c.row.memberId,
    name: c.row.name,
    constituencyNumberOnSource: c.row.constituencyNumber,
    constituencyNameOnSource: c.row.constituencyName,
    partyRaw: c.row.partyRaw,
    resolvedConstituency: c.constituency ? `${c.constituency.number}-${c.constituency.name}` : null,
    status: c.status,
    reason: c.reason,
  }));

const outDir = path.join(__dirname, "..", "data", "up");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "current-mlas.json"), JSON.stringify(importRows, null, 2));
fs.writeFileSync(path.join(outDir, "current-mlas-needs-review.json"), JSON.stringify(needsReview, null, 2));

console.log("Importable rows:", importRows.length);
console.log("Needs-review rows:", needsReview.length);

// Duplicate-seat sanity check within the importable set itself.
const seatCounts = new Map<number, number>();
importRows.forEach((r) => seatCounts.set(r.constituencyNumber, (seatCounts.get(r.constituencyNumber) ?? 0) + 1));
const dupInImportable = [...seatCounts.entries()].filter(([, n]) => n > 1);
console.log("Duplicate seats within importable set (should be 0):", dupInImportable.length);
if (dupInImportable.length > 0) {
  console.error("FATAL: duplicate seats leaked into importable set:", dupInImportable);
  process.exit(1);
}
