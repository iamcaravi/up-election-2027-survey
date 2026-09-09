import "server-only";
import type { PrismaClient, Constituency } from "@prisma/client";

export interface ImportRowResolution {
  constituency: Constituency | null;
  errors: string[];
}

// Resolves a CSV import row's constituency, scoped to its declared state.
// state_slug is required, never defaulted — this is a multi-state platform,
// and AC numbers are only unique within a state, so silently assuming
// Uttar Pradesh would risk importing a candidate against the wrong state's
// constituency once a second state's data exists.
export async function resolveImportConstituency(
  prisma: PrismaClient,
  row: { state_slug?: string; constituency_number?: string; constituency_name?: string },
  constituencyNumber: number
): Promise<ImportRowResolution> {
  const errors: string[] = [];
  const stateSlug = row.state_slug?.trim();

  if (!stateSlug) {
    errors.push("state_slug is required (e.g. state_slug=uttar-pradesh) — it is never assumed.");
    return { constituency: null, errors };
  }

  if (Number.isNaN(constituencyNumber)) {
    return { constituency: null, errors };
  }

  const state = await prisma.state.findUnique({ where: { slug: stateSlug } });
  if (!state) {
    errors.push(`Unknown state_slug "${stateSlug}"`);
    return { constituency: null, errors };
  }

  const constituency = await prisma.constituency.findUnique({
    where: { stateId_number: { stateId: state.id, number: constituencyNumber } },
  });
  if (!constituency) {
    errors.push(`No constituency with number ${constituencyNumber} in ${state.name}`);
    return { constituency: null, errors };
  }
  if (row.constituency_name && constituency.name.toLowerCase() !== row.constituency_name.toLowerCase()) {
    errors.push(
      `constituency_name "${row.constituency_name}" does not match AC#${constituencyNumber} ("${constituency.name}")`
    );
  }

  return { constituency, errors };
}
