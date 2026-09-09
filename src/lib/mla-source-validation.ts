// Validation layer for importing CURRENT MLA data from the official UP
// Vidhan Sabha member listing. The source page cannot be trusted to list
// exactly one current member per seat — it mixes in by-election
// predecessors, deceased members, and occasional data-entry errors (a
// constituency number of 0, mismatched names). This module classifies each
// scraped row against our own canonical constituency/party tables and
// NEVER guesses: anything ambiguous is reported as needing manual review
// rather than imported.

export interface SourceRow {
  memberId: string;
  name: string;
  constituencyNumber: number;
  constituencyName: string;
  partyRaw: string;
}

export interface CanonicalConstituency {
  id: string;
  number: number;
  name: string;
}

export interface CanonicalParty {
  id: string;
  shortName: string;
}

export type ClassificationStatus =
  | "OK"
  | "DUP_SEAT"
  | "UNRESOLVED_CONSTITUENCY"
  | "UNRESOLVED_PARTY"
  | "NEEDS_REVIEW";

export interface Classified {
  row: SourceRow;
  constituency: CanonicalConstituency | null;
  partyShortName: string | null;
  status: ClassificationStatus;
  reason?: string;
}

// Official-source party name -> canonical Party.shortName. Deliberately an
// explicit allowlist: an unmapped party is reported (UNRESOLVED_PARTY)
// rather than fuzzy-matched or auto-created.
export const PARTY_NAME_MAP: Record<string, string> = {
  "Bharatiya Janta Party": "BJP",
  "Samajwadi Party": "SP",
  "Indian National Congress": "Congress",
  "Bahujan Samaj Party": "BSP",
  "Rashtriya Lok Dal": "RLD",
  "Suheldev Bhartiya Samaj Party": "SBSP",
  "Apna Dal (Sonelal)": "Apna Dal",
  "Nirbal Indian Shoshit Hamara Aam Dal": "Nishad Party",
};

export function resolvePartyShortName(partyRaw: string): string | null {
  return PARTY_NAME_MAP[partyRaw] ?? null;
}

/**
 * Mechanical name normalization only (case, punctuation, hyphen/space
 * equivalence, "Cantonment"/"Cantt" abbreviation) — never a spelling or
 * transliteration guess. Two names that still differ after this are
 * treated as a genuine mismatch, not corrected.
 */
export function normalizeConstituencyName(s: string): string {
  return s
    .toLowerCase()
    .replace(/cantonment/g, "cantt")
    .replace(/[.\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function constituencyNamesMatch(a: string, b: string): boolean {
  return normalizeConstituencyName(a) === normalizeConstituencyName(b);
}

export interface ManualResolution {
  keepMemberId: string;
  note: string;
}

export interface ClassifyOptions {
  // Keyed by constituency number (as string) — for a contested seat where
  // the correct current member has already been established through
  // out-of-band evidence (e.g. an official member-profile page showing
  // "Dead: Yes" for the excluded person), name which memberId to keep.
  // Every other row for that seat is still reported, marked excluded.
  manualResolutions?: Record<string, ManualResolution>;
}

export function classifyMlaSourceRows(
  rows: SourceRow[],
  constituencies: CanonicalConstituency[],
  options: ClassifyOptions = {}
): Classified[] {
  const constByNumber = new Map<number, CanonicalConstituency>();
  constituencies.forEach((c) => constByNumber.set(c.number, c));
  const manualResolutions = options.manualResolutions ?? {};

  function resolveZeroNumber(row: SourceRow): CanonicalConstituency | null {
    const matches = constituencies.filter((c) => constituencyNamesMatch(c.name, row.constituencyName));
    return matches.length === 1 ? matches[0] : null;
  }

  const byNumber = new Map<number, SourceRow[]>();
  rows.forEach((r) => {
    const arr = byNumber.get(r.constituencyNumber) ?? [];
    arr.push(r);
    byNumber.set(r.constituencyNumber, arr);
  });

  const classified: Classified[] = [];

  for (const [numKey, group] of byNumber.entries()) {
    const isZero = numKey === 0;

    if (isZero) {
      for (const row of group) {
        const constituency = resolveZeroNumber(row);
        const partyShortName = resolvePartyShortName(row.partyRaw);
        if (!constituency) {
          classified.push({
            row,
            constituency: null,
            partyShortName,
            status: "UNRESOLVED_CONSTITUENCY",
            reason: `Source constituency number is 0 (data-entry error); name "${row.constituencyName}" does not uniquely match a canonical constituency`,
          });
        } else {
          classified.push({
            row,
            constituency,
            partyShortName,
            status: "NEEDS_REVIEW",
            reason: `Source listed constituency number as 0; resolved by name to #${constituency.number} ${constituency.name} — needs manual confirmation before import`,
          });
        }
      }
      continue;
    }

    if (group.length === 1) {
      const row = group[0];
      const constituency = constByNumber.get(numKey) ?? null;
      const partyShortName = resolvePartyShortName(row.partyRaw);
      if (!constituency) {
        classified.push({ row, constituency: null, partyShortName, status: "UNRESOLVED_CONSTITUENCY", reason: `No canonical constituency with number ${numKey}` });
      } else if (!constituencyNamesMatch(constituency.name, row.constituencyName)) {
        classified.push({ row, constituency, partyShortName, status: "NEEDS_REVIEW", reason: `Name mismatch: source="${row.constituencyName}" canonical="${constituency.name}"` });
      } else if (!partyShortName) {
        classified.push({ row, constituency, partyShortName: null, status: "UNRESOLVED_PARTY", reason: `Unmapped party "${row.partyRaw}"` });
      } else {
        classified.push({ row, constituency, partyShortName, status: "OK" });
      }
      continue;
    }

    // Contested seat (>1 row for this constituency number).
    const resolution = manualResolutions[String(numKey)];
    if (resolution) {
      for (const row of group) {
        const constituency = constByNumber.get(numKey) ?? null;
        const partyShortName = resolvePartyShortName(row.partyRaw);
        if (row.memberId === resolution.keepMemberId) {
          const ok = constituency && partyShortName && constituencyNamesMatch(constituency.name, row.constituencyName);
          classified.push({ row, constituency, partyShortName, status: ok ? "OK" : "NEEDS_REVIEW", reason: resolution.note });
        } else {
          classified.push({ row, constituency, partyShortName, status: "NEEDS_REVIEW", reason: `Excluded — ${resolution.note}` });
        }
      }
      continue;
    }
    for (const row of group) {
      const constituency = constByNumber.get(numKey) ?? null;
      const partyShortName = resolvePartyShortName(row.partyRaw);
      classified.push({
        row,
        constituency,
        partyShortName,
        status: "DUP_SEAT",
        reason: `${group.length} rows map to constituency number ${numKey} (${constituency?.name ?? "unknown"}); cannot determine which is the current sitting MLA without further verification`,
      });
    }
  }

  return classified;
}

export interface CoverageReport {
  totalConstituencies: number;
  matched: number;
  missing: number;
  missingNumbers: number[];
}

export function computeCoverage(
  classified: Classified[],
  constituencies: CanonicalConstituency[]
): CoverageReport {
  const matchedNumbers = new Set(
    classified.filter((c) => c.status === "OK").map((c) => c.constituency!.number)
  );
  const allNumbers = constituencies.map((c) => c.number);
  const missingNumbers = allNumbers.filter((n) => !matchedNumbers.has(n)).sort((a, b) => a - b);
  return {
    totalConstituencies: constituencies.length,
    matched: matchedNumbers.size,
    missing: missingNumbers.length,
    missingNumbers,
  };
}
