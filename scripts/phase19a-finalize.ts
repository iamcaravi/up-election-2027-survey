import fs from "node:fs";
import path from "node:path";
import { prisma } from "../src/lib/prisma";
import { runMlaImport, type MlaImportRow } from "../src/lib/mla-import";

const PARTY_NAME = "Jansatta Dal Loktantrik Party";
const PARTY_SHORT_NAME = "Jansatta Dal Loktantrik Party";
const PARTY_SLUG = "jansatta-dal-loktantrik-party";

interface Resolution {
  constituencyNumber: number;
  constituencyName: string;
  confidence: "HIGH" | "MEDIUM" | "UNRESOLVED";
  resolvedCandidate: {
    name: string;
    partyShortName: string;
    status: "INCUMBENT";
    sourceUrl: string;
    verified: false;
  } | null;
}

async function safetyCounts() {
  const [states, elections, districts, constituencies, surveys, surveyQuestions, surveyOptions, candidates, surveyResponses, parties] =
    await Promise.all([
      prisma.state.count(),
      prisma.election.count(),
      prisma.district.count(),
      prisma.constituency.count(),
      prisma.survey.count(),
      prisma.surveyQuestion.count(),
      prisma.surveyOption.count(),
      prisma.candidate.count(),
      prisma.surveyResponse.count(),
      prisma.party.count(),
    ]);
  return { states, elections, districts, constituencies, surveys, surveyQuestions, surveyOptions, candidates, surveyResponses, parties };
}

async function candidateSnapshot(ids?: string[]) {
  return prisma.candidate.findMany({
    where: ids ? { id: { in: ids } } : undefined,
    orderBy: { id: "asc" },
    select: {
      id: true,
      name: true,
      electionId: true,
      constituencyId: true,
      partyId: true,
      status: true,
      sourceNotes: true,
      sourceUrls: true,
      verified: true,
    },
  });
}

async function main() {
  if (!process.argv.includes("--commit-approved-49")) {
    throw new Error("Refusing database writes without --commit-approved-49");
  }

  const workspace = path.resolve(__dirname, "..");
  const resolutions: Resolution[] = JSON.parse(
    fs.readFileSync(path.join(workspace, "data", "up", "current-mlas-phase19a-resolutions.json"), "utf8"),
  );
  const approved = resolutions.filter(
    (resolution): resolution is Resolution & { resolvedCandidate: NonNullable<Resolution["resolvedCandidate"]> } =>
      resolution.confidence === "HIGH" && resolution.resolvedCandidate !== null,
  );
  if (approved.length !== 49) throw new Error(`Expected 49 approved records, got ${approved.length}`);
  if (approved.some((resolution) => resolution.constituencyNumber === 354)) throw new Error("Ghosi must not be imported");

  const beforeCounts = await safetyCounts();
  if (beforeCounts.candidates !== 353 || beforeCounts.parties !== 10) {
    throw new Error(`Unexpected starting counts: ${JSON.stringify(beforeCounts)}`);
  }

  const protectedBefore = await candidateSnapshot();
  const protectedIds = protectedBefore.map((candidate) => candidate.id);
  const existingGhosi = await prisma.candidate.findMany({
    where: { constituency: { number: 354 }, status: "INCUMBENT" },
    select: { id: true, name: true },
  });
  if (existingGhosi.length > 0) throw new Error(`Unexpected Ghosi incumbent: ${JSON.stringify(existingGhosi)}`);

  const possiblePartyDuplicates = await prisma.party.findMany({
    where: { OR: [{ name: PARTY_NAME }, { shortName: PARTY_SHORT_NAME }, { slug: PARTY_SLUG }] },
  });
  let partyCreated = false;
  if (possiblePartyDuplicates.length === 0) {
    await prisma.party.create({
      data: { name: PARTY_NAME, shortName: PARTY_SHORT_NAME, slug: PARTY_SLUG },
    });
    partyCreated = true;
  } else if (
    possiblePartyDuplicates.length !== 1 ||
    possiblePartyDuplicates[0].name !== PARTY_NAME ||
    possiblePartyDuplicates[0].shortName !== PARTY_SHORT_NAME ||
    possiblePartyDuplicates[0].slug !== PARTY_SLUG
  ) {
    throw new Error(`Conflicting/duplicate party record: ${JSON.stringify(possiblePartyDuplicates)}`);
  }

  const rows: MlaImportRow[] = approved.map((resolution) => ({
    state_slug: "uttar-pradesh",
    constituency_number: String(resolution.constituencyNumber),
    constituency_name: resolution.constituencyName,
    mla_name: resolution.resolvedCandidate.name,
    party_short_name: resolution.resolvedCandidate.partyShortName,
    source_name: "Uttar Pradesh Legislative Assembly",
    source_url: resolution.resolvedCandidate.sourceUrl,
  }));

  const dryRun = await runMlaImport(prisma, rows, { commit: false });
  if (dryRun.toCreate !== 49 || dryRun.toUpdate !== 0 || dryRun.needsReview !== 0 || dryRun.committed) {
    throw new Error(`Pre-commit dry run mismatch: ${JSON.stringify(dryRun)}`);
  }

  const committed = await runMlaImport(prisma, rows, { commit: true });
  if (committed.toCreate !== 49 || committed.toUpdate !== 0 || committed.needsReview !== 0 || !committed.committed) {
    throw new Error(`Commit result mismatch: ${JSON.stringify(committed)}`);
  }

  const protectedAfter = await candidateSnapshot(protectedIds);
  if (JSON.stringify(protectedBefore) !== JSON.stringify(protectedAfter)) {
    throw new Error("One or more protected Candidate records changed");
  }

  const afterCounts = await safetyCounts();
  const expectedAfter = {
    states: 1,
    elections: 1,
    districts: 75,
    constituencies: 403,
    surveys: 403,
    surveyQuestions: 2821,
    surveyOptions: 18941,
    candidates: 402,
    surveyResponses: 0,
    parties: 11,
  };
  if (JSON.stringify(afterCounts) !== JSON.stringify(expectedAfter)) {
    throw new Error(`Unexpected post-import counts: ${JSON.stringify(afterCounts)}`);
  }

  const imported = await prisma.candidate.findMany({
    where: { id: { notIn: protectedIds } },
    select: { id: true, name: true, status: true, verified: true, sourceUrls: true, constituency: { select: { number: true } } },
  });
  if (imported.length !== 49 || imported.some((candidate) => candidate.status !== "INCUMBENT" || candidate.verified || !candidate.sourceUrls)) {
    throw new Error(`Imported Candidate safety assertion failed: ${JSON.stringify(imported)}`);
  }

  const secondRun = await runMlaImport(prisma, rows, { commit: true });
  if (secondRun.toCreate !== 0 || secondRun.toUpdate !== 0 || secondRun.unchanged !== 49 || secondRun.needsReview !== 0) {
    throw new Error(`Idempotency mismatch: ${JSON.stringify(secondRun)}`);
  }

  const importedIds = imported.map((candidate) => candidate.id);
  const importedSurveyOptions = await prisma.surveyOption.count({ where: { candidateRef: { in: importedIds } } });
  const allIncumbentIds = (
    await prisma.candidate.findMany({ where: { status: "INCUMBENT" }, select: { id: true } })
  ).map((candidate) => candidate.id);
  const allIncumbentSurveyOptions = await prisma.surveyOption.count({ where: { candidateRef: { in: allIncumbentIds } } });
  if (importedSurveyOptions !== 0 || allIncumbentSurveyOptions !== 0) {
    throw new Error(`INCUMBENT survey exclusion failed: imported=${importedSurveyOptions}, all=${allIncumbentSurveyOptions}`);
  }

  const ghosiAfter = await prisma.candidate.count({ where: { constituency: { number: 354 }, status: "INCUMBENT" } });
  if (ghosiAfter !== 0) throw new Error("A Ghosi INCUMBENT was created unexpectedly");

  console.log(JSON.stringify({
    beforeCounts,
    partyCreated,
    dryRun: { toCreate: dryRun.toCreate, toUpdate: dryRun.toUpdate, needsReview: dryRun.needsReview, committed: dryRun.committed },
    committed: { toCreate: committed.toCreate, toUpdate: committed.toUpdate, needsReview: committed.needsReview, committed: committed.committed },
    protectedCandidatesChanged: 0,
    afterCounts,
    idempotency: { toCreate: secondRun.toCreate, toUpdate: secondRun.toUpdate, unchanged: secondRun.unchanged, needsReview: secondRun.needsReview },
    importedSurveyOptions,
    allIncumbentSurveyOptions,
    ghosiIncumbents: ghosiAfter,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
