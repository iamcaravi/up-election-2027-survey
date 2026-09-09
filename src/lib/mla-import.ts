import "server-only";
import type { PrismaClient } from "@prisma/client";
import { resolveImportConstituency } from "./candidate-import";
import { getActiveElectionForConstituency } from "./data";
import { slugify } from "./slugify";

// Dedicated importer for CURRENT SITTING MLAs — deliberately separate from
// the generic candidate CSV importer (src/app/api/admin/imports/candidates)
// because its identity/idempotency rule is different and stricter: a seat
// has at most one sitting MLA, so re-running this import must UPDATE that
// one record rather than ever appending a duplicate. The generic importer
// intentionally has no such constraint (a seat can gain many DECLARED/
// LIKELY/POSSIBLE candidates over time), so its behavior is left untouched.
//
// Every imported record is forced to status "INCUMBENT" — this importer
// must never be able to create/promote a DECLARED 2027 candidate, and
// `verified` is always left false: an automated import is not the same as
// an admin having checked the record.

export interface MlaImportRow {
  state_slug?: string;
  constituency_number?: string;
  constituency_name?: string;
  mla_name?: string;
  mla_name_hindi?: string;
  party_short_name?: string;
  source_name?: string;
  source_url?: string;
}

export type MlaImportRowStatus = "create" | "update" | "unchanged" | "needs_review";

export interface MlaImportRowResult {
  row: number;
  status: MlaImportRowStatus;
  constituencyNumber: number | null;
  constituencyName: string | null;
  mlaName: string | null;
  errors: string[];
  changes?: Record<string, { from: unknown; to: unknown }>;
}

export interface MlaImportSummary {
  totalRows: number;
  toCreate: number;
  toUpdate: number;
  unchanged: number;
  needsReview: number;
  committed: boolean;
  results: MlaImportRowResult[];
}

export async function runMlaImport(
  prisma: PrismaClient,
  rows: MlaImportRow[],
  opts: { commit: boolean }
): Promise<MlaImportSummary> {
  const parties = await prisma.party.findMany();
  const partyByShortName = new Map(parties.map((p) => [p.shortName.toLowerCase(), p]));

  const results: MlaImportRowResult[] = [];
  const affectedElections = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const row = i + 2; // matches CSV row numbering convention used elsewhere (header = row 1)
    const errors: string[] = [];
    const constituencyNumber = Number(r.constituency_number);

    if (!r.mla_name?.trim()) errors.push("mla_name is required");
    if (!r.source_name?.trim()) errors.push("source_name is required — every imported record must carry source provenance");
    if (!r.source_url?.trim()) errors.push("source_url is required — every imported record must carry source provenance");
    if (r.source_url) {
      try {
        new URL(r.source_url);
      } catch {
        errors.push("source_url is not a valid URL");
      }
    }

    const resolution = await resolveImportConstituency(prisma, r, constituencyNumber);
    errors.push(...resolution.errors);
    const constituency = resolution.constituency;

    let party = null;
    if (r.party_short_name) {
      party = partyByShortName.get(r.party_short_name.toLowerCase()) ?? null;
      if (!party) errors.push(`Unknown party_short_name "${r.party_short_name}" — must match an existing party short name exactly`);
    }

    if (errors.length > 0 || !constituency) {
      results.push({
        row,
        status: "needs_review",
        constituencyNumber: Number.isNaN(constituencyNumber) ? null : constituencyNumber,
        constituencyName: constituency?.name ?? null,
        mlaName: r.mla_name ?? null,
        errors,
      });
      continue;
    }

    const election = await getActiveElectionForConstituency(constituency.id);
    if (!election) {
      results.push({
        row,
        status: "needs_review",
        constituencyNumber,
        constituencyName: constituency.name,
        mlaName: r.mla_name ?? null,
        errors: [`Constituency AC#${constituencyNumber} has no active election`],
      });
      continue;
    }

    // Idempotency key: (electionId, constituencyId, status=INCUMBENT) — a
    // seat has at most one sitting MLA. Matching by name would silently
    // create duplicates on OCR/spelling drift between import runs; matching
    // by seat is the actually-stable real-world identity here.
    const existing = await prisma.candidate.findFirst({
      where: { electionId: election.id, constituencyId: constituency.id, status: "INCUMBENT" },
    });

    const desired = {
      name: r.mla_name!.trim(),
      nameHindi: r.mla_name_hindi?.trim() || null,
      partyId: party?.id ?? null,
      sourceNotes: `Imported from ${r.source_name!.trim()} (current sitting MLA register).`,
      sourceUrls: JSON.stringify([r.source_url!.trim()]),
    };

    if (!existing) {
      results.push({
        row,
        status: "create",
        constituencyNumber,
        constituencyName: constituency.name,
        mlaName: desired.name,
        errors: [],
      });
      if (opts.commit) {
        let slug = slugify(desired.name);
        const slugClash = await prisma.candidate.findFirst({
          where: { electionId: election.id, constituencyId: constituency.id, slug },
        });
        if (slugClash) slug = `${slug}-incumbent`;

        await prisma.candidate.create({
          data: {
            electionId: election.id,
            constituencyId: constituency.id,
            name: desired.name,
            nameHindi: desired.nameHindi,
            slug,
            partyId: desired.partyId,
            status: "INCUMBENT",
            confidenceScore: "HIGH",
            currentOffice: "Sitting MLA",
            sourceNotes: desired.sourceNotes,
            sourceUrls: desired.sourceUrls,
            verified: false,
          },
        });
        affectedElections.add(`${constituency.id}:${election.id}`);
      }
    } else {
      const changes: Record<string, { from: unknown; to: unknown }> = {};
      if (existing.name !== desired.name) changes.name = { from: existing.name, to: desired.name };
      if ((existing.nameHindi ?? null) !== desired.nameHindi) changes.nameHindi = { from: existing.nameHindi, to: desired.nameHindi };
      if ((existing.partyId ?? null) !== desired.partyId) changes.partyId = { from: existing.partyId, to: desired.partyId };

      if (Object.keys(changes).length === 0) {
        results.push({
          row,
          status: "unchanged",
          constituencyNumber,
          constituencyName: constituency.name,
          mlaName: existing.name,
          errors: [],
        });
      } else {
        results.push({
          row,
          status: "update",
          constituencyNumber,
          constituencyName: constituency.name,
          mlaName: desired.name,
          errors: [],
          changes,
        });
        if (opts.commit) {
          await prisma.candidate.update({
            where: { id: existing.id },
            data: {
              name: desired.name,
              nameHindi: desired.nameHindi,
              partyId: desired.partyId,
              sourceNotes: desired.sourceNotes,
              sourceUrls: desired.sourceUrls,
            },
          });
        }
      }
    }
  }

  return {
    totalRows: rows.length,
    toCreate: results.filter((r) => r.status === "create").length,
    toUpdate: results.filter((r) => r.status === "update").length,
    unchanged: results.filter((r) => r.status === "unchanged").length,
    needsReview: results.filter((r) => r.status === "needs_review").length,
    committed: opts.commit,
    results,
  };
}
