import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession, logAudit } from "@/lib/auth";
import { csvToObjects } from "@/lib/csv";
import { slugify } from "@/lib/slugify";
import { syncCandidateChoiceOptions } from "@/lib/survey-sync";
import { getActiveElectionForConstituency } from "@/lib/data";
import { resolveImportConstituency } from "@/lib/candidate-import";
import { CANDIDATE_STATUSES, CONFIDENCE_SCORES } from "@/lib/enums";

const bodySchema = z.object({ csv: z.string().min(1), commit: z.boolean().default(false) });

interface RowResult {
  row: number;
  data: Record<string, string>;
  errors: string[];
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const records = csvToObjects(parsed.data.csv);
  if (records.length === 0) {
    return NextResponse.json({ error: "CSV has no data rows." }, { status: 400 });
  }
  if (records.length > 1000) {
    return NextResponse.json({ error: "CSV too large (max 1000 rows per import)." }, { status: 400 });
  }

  const parties = await prisma.party.findMany();
  const partyByShortName = new Map(parties.map((p) => [p.shortName.toLowerCase(), p]));

  const results: RowResult[] = [];
  // Track (constituencyId, electionId) pairs, not just constituencyId — a
  // bare Set<constituencyId> would lose which election each row's candidate
  // actually belonged to, and syncCandidateChoiceOptions must never guess.
  const affectedPairs = new Map<string, { constituencyId: string; electionId: string }>();

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    const errors: string[] = [];

    const constituencyNumber = Number(r.constituency_number);
    if (!r.constituency_number || Number.isNaN(constituencyNumber)) {
      errors.push("constituency_number is required and must be a number");
    }
    if (!r.candidate_name) errors.push("candidate_name is required");
    if (!r.candidate_status || !CANDIDATE_STATUSES.includes(r.candidate_status as (typeof CANDIDATE_STATUSES)[number])) {
      errors.push(`candidate_status must be one of ${CANDIDATE_STATUSES.join(", ")}`);
    }
    if (r.confidence_score && !CONFIDENCE_SCORES.includes(r.confidence_score as (typeof CONFIDENCE_SCORES)[number])) {
      errors.push(`confidence_score must be one of ${CONFIDENCE_SCORES.join(", ")}`);
    }

    const resolution = await resolveImportConstituency(prisma, r, constituencyNumber);
    errors.push(...resolution.errors);
    const constituency = resolution.constituency;

    let party = null;
    if (r.party) {
      party = partyByShortName.get(r.party.toLowerCase()) ?? null;
      if (!party) errors.push(`Unknown party "${r.party}" — must match an existing party short name`);
    }

    if (r.photo_url) {
      try {
        new URL(r.photo_url);
      } catch {
        errors.push("photo_url is not a valid URL");
      }
    }

    results.push({ row: i + 2, data: r, errors });

    if (errors.length === 0 && parsed.data.commit && constituency) {
      const election = await getActiveElectionForConstituency(constituency.id);
      if (!election) {
        errors.push(`Constituency AC#${constituencyNumber} has no active election`);
        continue;
      }

      let slug = slugify(r.candidate_name);
      const existing = await prisma.candidate.findFirst({ where: { electionId: election.id, constituencyId: constituency.id, slug } });
      if (existing) slug = `${slug}-${i}`;

      const sourceUrls = r.source_urls
        ? r.source_urls.split("|").map((u) => u.trim()).filter(Boolean)
        : [];

      const candidate = await prisma.candidate.create({
        data: {
          electionId: election.id,
          constituencyId: constituency.id,
          name: r.candidate_name,
          slug,
          partyId: party?.id,
          status: r.candidate_status,
          confidenceScore: r.confidence_score || "LOW",
          sourceNotes: r.source_notes || undefined,
          sourceUrls: sourceUrls.length ? JSON.stringify(sourceUrls) : undefined,
          photoUrl: r.photo_url || undefined,
          photoSourceUrl: r.photo_source_url || undefined,
          photoSourceName: r.photo_source_name || undefined,
          photoLicense: r.photo_license || undefined,
          photoRetrievedAt: r.photo_url ? new Date() : undefined,
        },
      });

      if (r.photo_url) {
        await prisma.imageSource.create({
          data: {
            candidateId: candidate.id,
            imageUrl: r.photo_url,
            sourceUrl: r.photo_source_url || r.photo_url,
            sourceName: r.photo_source_name || "CSV import",
            license: r.photo_license || undefined,
            status: "PENDING",
          },
        });
      }

      affectedPairs.set(`${constituency.id}:${election.id}`, { constituencyId: constituency.id, electionId: election.id });
    }
  }

  const errorCount = results.filter((r) => r.errors.length > 0).length;

  if (parsed.data.commit) {
    for (const { constituencyId, electionId } of affectedPairs.values()) {
      await syncCandidateChoiceOptions(constituencyId, electionId);
    }
    await logAudit({
      adminUserId: session.sub,
      action: "CSV_IMPORT",
      entityType: "Candidate",
      metadata: { totalRows: records.length, imported: records.length - errorCount, errors: errorCount },
    });
  }

  return NextResponse.json({
    totalRows: records.length,
    validRows: records.length - errorCount,
    errorRows: errorCount,
    imported: parsed.data.commit,
    results,
  });
}
