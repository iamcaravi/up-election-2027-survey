import fs from "node:fs";
import path from "node:path";
import { prisma } from "../src/lib/prisma";
import { runMlaImport, type MlaImportRow } from "../src/lib/mla-import";

interface Resolution {
  constituencyNumber: number;
  constituencyName: string;
  originalProblem: string;
  resolvedCandidate: {
    name: string;
    partyShortName: string;
    status: "INCUMBENT";
    memberId: string;
    sourceUrl: string;
    verified: false;
  } | null;
  resolutionReason: string;
  confidence: "HIGH" | "MEDIUM" | "UNRESOLVED";
  sourceUrls: string[];
}

async function counts() {
  const [
    states,
    elections,
    districts,
    constituencies,
    surveys,
    surveyQuestions,
    surveyOptions,
    candidates,
    surveyResponses,
  ] = await Promise.all([
    prisma.state.count(),
    prisma.election.count(),
    prisma.district.count(),
    prisma.constituency.count(),
    prisma.survey.count(),
    prisma.surveyQuestion.count(),
    prisma.surveyOption.count(),
    prisma.candidate.count(),
    prisma.surveyResponse.count(),
  ]);
  return { states, elections, districts, constituencies, surveys, surveyQuestions, surveyOptions, candidates, surveyResponses };
}

async function candidateSnapshot() {
  return prisma.candidate.findMany({
    orderBy: { id: "asc" },
    select: {
      id: true,
      electionId: true,
      constituencyId: true,
      partyId: true,
      status: true,
      name: true,
      nameHindi: true,
      sourceNotes: true,
      sourceUrls: true,
      verified: true,
    },
  });
}

function markdownTable(rows: string[][]) {
  const escape = (value: string) => value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
  const header = `| ${rows[0].map(escape).join(" | ")} |`;
  const divider = `| ${rows[0].map(() => "---").join(" | ")} |`;
  return [header, divider, ...rows.slice(1).map((row) => `| ${row.map(escape).join(" | ")} |`)].join("\n");
}

async function main() {
  if (process.argv.includes("--commit")) {
    throw new Error("Phase 19A is review-only. This script deliberately has no commit mode.");
  }

  const workspace = path.resolve(__dirname, "..");
  const resolutions: Resolution[] = JSON.parse(
    fs.readFileSync(path.join(workspace, "data", "up", "current-mlas-phase19a-resolutions.json"), "utf8"),
  );
  const existingDataset = JSON.parse(
    fs.readFileSync(path.join(workspace, "data", "up", "current-mlas.json"), "utf8"),
  ) as unknown[];
  const proposed = resolutions.filter(
    (resolution): resolution is Resolution & { resolvedCandidate: NonNullable<Resolution["resolvedCandidate"]> } =>
      resolution.confidence === "HIGH" && resolution.resolvedCandidate !== null,
  );
  const unresolved = resolutions.filter((resolution) => resolution.confidence !== "HIGH");

  if (existingDataset.length !== 353) throw new Error(`Protected dataset must contain 353 rows, got ${existingDataset.length}`);
  if (resolutions.length !== 50 || proposed.length !== 49 || unresolved.length !== 1) {
    throw new Error(`Expected 50 resolutions split 47/3, got ${resolutions.length} split ${proposed.length}/${unresolved.length}`);
  }

  const rows: MlaImportRow[] = proposed.map((resolution) => ({
    state_slug: "uttar-pradesh",
    constituency_number: String(resolution.constituencyNumber),
    constituency_name: resolution.constituencyName,
    mla_name: resolution.resolvedCandidate.name,
    party_short_name: resolution.resolvedCandidate.partyShortName,
    source_name: "Uttar Pradesh Legislative Assembly",
    source_url: resolution.resolvedCandidate.sourceUrl,
  }));

  const beforeCounts = await counts();
  const beforeCandidates = await candidateSnapshot();
  if (beforeCandidates.length !== 353) throw new Error(`Expected 353 protected Candidate rows, got ${beforeCandidates.length}`);

  const summary = await runMlaImport(prisma, rows, { commit: false });

  const afterCounts = await counts();
  const afterCandidates = await candidateSnapshot();
  const protectedUnchanged = JSON.stringify(beforeCandidates) === JSON.stringify(afterCandidates);
  const databaseUnchanged = JSON.stringify(beforeCounts) === JSON.stringify(afterCounts);

  const incumbentIds = new Set(
    (await prisma.candidate.findMany({ where: { status: "INCUMBENT" }, select: { id: true } })).map((candidate) => candidate.id),
  );
  const incumbentSurveyOptions = (
    await prisma.surveyOption.findMany({ where: { candidateRef: { not: null } }, select: { candidateRef: true } })
  ).filter((option) => option.candidateRef && incumbentIds.has(option.candidateRef)).length;

  if (!protectedUnchanged || !databaseUnchanged) throw new Error("A dry run changed protected database state");
  if (summary.committed || summary.toCreate !== 49 || summary.toUpdate !== 0 || summary.needsReview !== 0) {
    throw new Error(`Unexpected importer result: ${JSON.stringify(summary)}`);
  }
  if (incumbentSurveyOptions !== 0) throw new Error(`${incumbentSurveyOptions} incumbent candidates are selectable survey options`);

  const proposedTable = markdownTable([
    ["AC", "Constituency", "MLA", "Party", "Status", "Confidence", "Evidence", "Official profile"],
    ...proposed.map((resolution) => [
      String(resolution.constituencyNumber),
      resolution.constituencyName,
      resolution.resolvedCandidate.name,
      resolution.resolvedCandidate.partyShortName,
      resolution.resolvedCandidate.status,
      resolution.confidence,
      resolution.resolutionReason,
      `[member ${resolution.resolvedCandidate.memberId}](${resolution.resolvedCandidate.sourceUrl})`,
    ]),
  ]);
  const unresolvedTable = markdownTable([
    ["AC", "Constituency", "Confidence", "Exact reason", "Official evidence"],
    ...unresolved.map((resolution) => [
      String(resolution.constituencyNumber),
      resolution.constituencyName,
      resolution.confidence,
      resolution.resolutionReason,
      resolution.sourceUrls.slice(0, -2).map((url, index) => `[profile ${index + 1}](${url})`).join(", "),
    ]),
  ]);

  const report = `# PHASE 19A DRY RUN

Generated: ${new Date().toISOString()}

Database writes: **none** (\`runMlaImport(..., { commit: false })\`)

## Summary

- Previously imported: 353
- Newly resolvable at HIGH confidence: ${proposed.length}
- Still unresolved: ${unresolved.length}
- Total potential coverage after an approved import: ${353 + proposed.length} / 403
- Importer result: ${summary.toCreate} create, ${summary.toUpdate} update, ${summary.unchanged} unchanged, ${summary.needsReview} needs review
- Protected 353 Candidate mappings unchanged during dry run: ${protectedUnchanged}
- All database counts unchanged during dry run: ${databaseUnchanged}
- Existing INCUMBENT-linked SurveyOption rows: ${incumbentSurveyOptions}

## Database safety counts (before and after are identical)

\`\`\`json
${JSON.stringify(beforeCounts, null, 2)}
\`\`\`

## Proposed HIGH-confidence records

${proposedTable}

## Unresolved records

${unresolvedTable}

## Scope and safety notes

- The protected 353-row dataset was not modified.
- The Candidate table and every non-candidate table were unchanged.
- No Party or Constituency record was created or edited.
- Every proposed record is \`INCUMBENT\` and \`verified: false\`; no 2027 candidacy is inferred.
- The source listing's wrong numbers for Bilaspur, the Meerut trio, Fatehpur/Fatehpur Sikri, Katra/Katra Bazar, and Dadraul are treated as source-side errors. The canonical master numbering agrees with the ECI mapping and must not be changed.
- Chhanbey/Rinki Kol is already within the protected 353 and was not re-imported or changed.
- This report is the required stop point. A database import needs separate explicit approval.
`;

  const reportPath = path.join(workspace, "reports", "phase19a-dry-run.md");
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, report);

  console.log("=== PHASE 19A DRY RUN ===");
  console.log(JSON.stringify({
    previouslyImported: 353,
    newlyResolvable: proposed.length,
    stillUnresolved: unresolved.length,
    totalPotentialCoverage: `${353 + proposed.length} / 403`,
    importer: {
      toCreate: summary.toCreate,
      toUpdate: summary.toUpdate,
      unchanged: summary.unchanged,
      needsReview: summary.needsReview,
      committed: summary.committed,
    },
    protectedCandidatesUnchanged: protectedUnchanged,
    databaseCountsUnchanged: databaseUnchanged,
    incumbentSurveyOptions,
    reportPath,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
