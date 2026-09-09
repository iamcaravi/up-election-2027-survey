import fs from "fs";
import { classifyMlaSourceRows, computeCoverage, type SourceRow } from "../src/lib/mla-source-validation";

interface DbConstituency {
  id: string;
  number: number;
  name: string;
  slug: string;
  state: { slug: string };
}

interface DbParty {
  id: string;
  name: string;
  shortName: string;
  slug: string;
}

const raw: SourceRow[] = JSON.parse(
  fs.readFileSync(
    "C:/Users/MANOJM~1/AppData/Local/Temp/claude/C--Users-Manoj-Mishra-Desktop-Survey/df631008-bedd-47cf-a165-2dbf09b2650e/scratchpad/raw-mla-rows.json",
    "utf8"
  )
);
const consts: DbConstituency[] = JSON.parse(fs.readFileSync("scripts/.out-constituencies.json", "utf8"));
const parties: DbParty[] = JSON.parse(fs.readFileSync("scripts/.out-parties.json", "utf8"));
void parties;

// Chhanbey (395) resolved via profile-page verification: Rinki Kol (25728) is
// current (elected 2022 by-election); Rahul Prakash Kol (25525) is deceased
// ("Dead: Yes" on official profile) and must be excluded.
const classified = classifyMlaSourceRows(raw, consts, {
  manualResolutions: {
    "395": {
      keepMemberId: "25728",
      note:
        "Verified via official member profiles: Rinki Kol (25728) elected 2022 by-election; " +
        "Rahul Prakash Kol (25525) profile shows 'Dead: Yes' — excluded as deceased/former.",
    },
  },
});

const okRows = classified.filter((c) => c.status === "OK");
const needsReview = classified.filter((c) => c.status !== "OK");

console.log("=== PHASE 19 CLASSIFICATION SUMMARY ===");
console.log("Total raw rows:", raw.length);
console.log("OK (clean, single, matched, importable):", okRows.length);
console.log("NEEDS_REVIEW / DUP_SEAT / UNRESOLVED (excluded from import):", needsReview.length);

const statusCounts: Record<string, number> = {};
needsReview.forEach((c) => { statusCounts[c.status] = (statusCounts[c.status] ?? 0) + 1; });
console.log("Breakdown:", statusCounts);

const coverage = computeCoverage(classified, consts);
console.log("");
console.log("=== 403-CONSTITUENCY COVERAGE ===");
console.log(JSON.stringify(coverage, null, 1));

fs.writeFileSync(
  "C:/Users/MANOJM~1/AppData/Local/Temp/claude/C--Users-Manoj-Mishra-Desktop-Survey/df631008-bedd-47cf-a165-2dbf09b2650e/scratchpad/classified.json",
  JSON.stringify(classified, null, 1)
);
