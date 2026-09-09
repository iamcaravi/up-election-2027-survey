import fs from "fs";
import path from "path";
import { prisma } from "../src/lib/prisma";
import { runMlaImport, type MlaImportRow } from "../src/lib/mla-import";

async function main() {
  const dataset = JSON.parse(
    fs.readFileSync(path.join(__dirname, "..", "data", "up", "current-mlas.json"), "utf8")
  );

  const rows: MlaImportRow[] = dataset.map((d: any) => ({
    state_slug: d.stateSlug,
    constituency_number: String(d.constituencyNumber),
    constituency_name: d.constituencyName,
    mla_name: d.name,
    mla_name_hindi: d.nameHindi ?? undefined,
    party_short_name: d.partyShortName ?? undefined,
    source_name: d.sourceName,
    source_url: d.sourceUrl,
  }));

  const commit = process.argv.includes("--commit");
  const summary = await runMlaImport(prisma, rows, { commit });

  console.log("=== MLA IMPORT", commit ? "(COMMIT)" : "(DRY RUN)", "===");
  console.log("Total rows:", summary.totalRows);
  console.log("To create:", summary.toCreate);
  console.log("To update:", summary.toUpdate);
  console.log("Unchanged:", summary.unchanged);
  console.log("Needs review (importer-level):", summary.needsReview);
  console.log("Committed:", summary.committed);

  const needsReview = summary.results.filter((r) => r.status === "needs_review");
  if (needsReview.length > 0) {
    console.log("");
    console.log("=== IMPORTER-LEVEL NEEDS_REVIEW (unexpected — investigate) ===");
    needsReview.forEach((r) => console.log(JSON.stringify(r)));
  }

  fs.writeFileSync(
    "C:/Users/MANOJM~1/AppData/Local/Temp/claude/C--Users-Manoj-Mishra-Desktop-Survey/df631008-bedd-47cf-a165-2dbf09b2650e/scratchpad/import-summary.json",
    JSON.stringify(summary, null, 2)
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
