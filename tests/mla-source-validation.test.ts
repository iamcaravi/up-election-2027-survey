// Phase 19 — validation layer for importing verified CURRENT UP MLA data
// from the official source. These are pure unit tests (no DB) against
// src/lib/mla-source-validation.ts: constituency-number-first matching,
// mechanical name normalization, party canonicalization, duplicate-seat
// detection, and 403-constituency coverage reporting.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  classifyMlaSourceRows,
  computeCoverage,
  constituencyNamesMatch,
  resolvePartyShortName,
  type CanonicalConstituency,
  type SourceRow,
} from "../src/lib/mla-source-validation";

const CONSTITUENCIES: CanonicalConstituency[] = [
  { id: "c1", number: 1, name: "Behat" },
  { id: "c2", number: 2, name: "Nakur" },
  { id: "c87", number: 87, name: "Agra Cantt." },
  { id: "c216", number: 216, name: "Kanpur Cantonment" },
  { id: "c227", number: 227, name: "Mehroni" },
];

function row(overrides: Partial<SourceRow>): SourceRow {
  return {
    memberId: "1",
    name: "Shri Test Member",
    constituencyNumber: 1,
    constituencyName: "Behat",
    partyRaw: "Bharatiya Janta Party",
    ...overrides,
  };
}

// 1. 403-style coverage calculation ------------------------------------------
test("phase19-1. coverage report counts matched vs missing constituencies honestly, never forcing full coverage", () => {
  const rows: SourceRow[] = [row({ memberId: "1", constituencyNumber: 1, constituencyName: "Behat" })];
  const classified = classifyMlaSourceRows(rows, CONSTITUENCIES);
  const coverage = computeCoverage(classified, CONSTITUENCIES);
  assert.equal(coverage.totalConstituencies, 5);
  assert.equal(coverage.matched, 1);
  assert.equal(coverage.missing, 4);
  assert.deepEqual(coverage.missingNumbers, [2, 87, 216, 227]);
});

// 2. Exact constituency-number-first matching --------------------------------
test("phase19-2. matching is by constituency number first — a row is resolved to its number's seat even if listed among differently-named rows", () => {
  const rows: SourceRow[] = [
    row({ memberId: "1", constituencyNumber: 2, constituencyName: "Nakur" }),
    row({ memberId: "2", constituencyNumber: 999, constituencyName: "Nakur" }), // wrong/unknown number, same name
  ];
  const classified = classifyMlaSourceRows(rows, CONSTITUENCIES);
  const byMemberId = new Map(classified.map((c) => [c.row.memberId, c]));
  assert.equal(byMemberId.get("1")!.status, "OK");
  assert.equal(byMemberId.get("1")!.constituency!.id, "c2");
  assert.equal(byMemberId.get("2")!.status, "UNRESOLVED_CONSTITUENCY", "an unknown number must never fall back to a name-only match");
});

// 3. Name normalization (mechanical only, never a spelling guess) -----------
test("phase19-3. name normalization tolerates punctuation/hyphen/Cantt-Cantonment formatting but not real spelling differences", () => {
  assert.ok(constituencyNamesMatch("Agra Cantonment", "Agra Cantt."));
  assert.ok(constituencyNamesMatch("Kanpur Cantt", "Kanpur Cantonment"));
  assert.ok(constituencyNamesMatch("Bilgram Mallanwan", "Bilgram-Mallanwan"));
  assert.ok(constituencyNamesMatch("Sri Nagar", "Srinagar") === false, "space-only difference is intentionally NOT treated as equivalent — mechanical normalization only");
  assert.ok(!constituencyNamesMatch("Fatehpur", "Fatehpur Sikri"), "a genuinely different constituency name must never be treated as a match");
});

test("phase19-3b. a resolvable number match with an unnormalizable name difference is NEEDS_REVIEW, not silently accepted", () => {
  const rows: SourceRow[] = [row({ memberId: "1", constituencyNumber: 1, constituencyName: "Behat Nagar" })];
  const classified = classifyMlaSourceRows(rows, CONSTITUENCIES);
  assert.equal(classified[0].status, "NEEDS_REVIEW");
  assert.match(classified[0].reason ?? "", /Name mismatch/);
});

// 4. Party canonicalization ---------------------------------------------------
test("phase19-4. known official party names canonicalize to existing short names; unknown party is never guessed or auto-created", () => {
  assert.equal(resolvePartyShortName("Bharatiya Janta Party"), "BJP");
  assert.equal(resolvePartyShortName("Apna Dal (Sonelal)"), "Apna Dal");
  assert.equal(resolvePartyShortName("Nirbal Indian Shoshit Hamara Aam Dal"), "Nishad Party");
  assert.equal(resolvePartyShortName("Some Brand New Party"), null);
});

test("phase19-4b. an unmapped party on an otherwise-clean row is UNRESOLVED_PARTY, not imported under a guessed party", () => {
  const rows: SourceRow[] = [row({ memberId: "1", constituencyNumber: 1, constituencyName: "Behat", partyRaw: "Some Brand New Party" })];
  const classified = classifyMlaSourceRows(rows, CONSTITUENCIES);
  assert.equal(classified[0].status, "UNRESOLVED_PARTY");
  assert.equal(classified[0].partyShortName, null);
});

// 5. Resigned/former/deceased member rejection (manual out-of-band resolution)
test("phase19-5. a contested seat resolved via out-of-band evidence (e.g. a deceased predecessor) keeps only the verified current member", () => {
  const rows: SourceRow[] = [
    row({ memberId: "current", name: "Shrimati Current Member", constituencyNumber: 1, constituencyName: "Behat" }),
    row({ memberId: "deceased", name: "Shri Former Member", constituencyNumber: 1, constituencyName: "Behat" }),
  ];
  const classified = classifyMlaSourceRows(rows, CONSTITUENCIES, {
    manualResolutions: { "1": { keepMemberId: "current", note: "predecessor profile shows Dead: Yes" } },
  });
  const byMemberId = new Map(classified.map((c) => [c.row.memberId, c]));
  assert.equal(byMemberId.get("current")!.status, "OK");
  assert.equal(byMemberId.get("deceased")!.status, "NEEDS_REVIEW");
  assert.match(byMemberId.get("deceased")!.reason ?? "", /Excluded/);
});

// 6. Unresolved constituency -> needsReview -----------------------------------
test("phase19-6. a constituency number with no canonical match is UNRESOLVED_CONSTITUENCY, never silently dropped or guessed", () => {
  const rows: SourceRow[] = [row({ memberId: "1", constituencyNumber: 9999, constituencyName: "Nowhere" })];
  const classified = classifyMlaSourceRows(rows, CONSTITUENCIES);
  assert.equal(classified[0].status, "UNRESOLVED_CONSTITUENCY");
  assert.equal(classified[0].constituency, null);
});

test("phase19-6b. constituency number 0 (a known official-source data-entry glitch) is never treated as a valid seat", () => {
  const ambiguous: SourceRow[] = [row({ memberId: "1", constituencyNumber: 0, constituencyName: "Some Unlisted Place" })];
  const classifiedAmbiguous = classifyMlaSourceRows(ambiguous, CONSTITUENCIES);
  assert.equal(classifiedAmbiguous[0].status, "UNRESOLVED_CONSTITUENCY");

  const resolvableByName: SourceRow[] = [row({ memberId: "1", constituencyNumber: 0, constituencyName: "Mehroni" })];
  const classifiedResolvable = classifyMlaSourceRows(resolvableByName, CONSTITUENCIES);
  assert.equal(classifiedResolvable[0].status, "NEEDS_REVIEW", "even an unambiguous name match must still be flagged for manual confirmation when the source's own number was invalid");
  assert.equal(classifiedResolvable[0].constituency!.id, "c227");
});

// 7. Unresolved party -> needsReview (duplicate of 4b kept for direct traceability to spec item)
test("phase19-7. unresolved party never falls through as OK", () => {
  const rows: SourceRow[] = [row({ memberId: "1", constituencyNumber: 2, constituencyName: "Nakur", partyRaw: "Totally Unknown Outfit" })];
  const classified = classifyMlaSourceRows(rows, CONSTITUENCIES);
  assert.notEqual(classified[0].status, "OK");
  assert.equal(classified[0].status, "UNRESOLVED_PARTY");
});

// 8. Duplicate seat detection --------------------------------------------------
test("phase19-8. a seat with multiple current-looking rows is flagged DUP_SEAT for every row — none is silently picked as correct", () => {
  const rows: SourceRow[] = [
    row({ memberId: "a", constituencyNumber: 2, constituencyName: "Nakur" }),
    row({ memberId: "b", constituencyNumber: 2, constituencyName: "Nakur" }),
    row({ memberId: "c", constituencyNumber: 2, constituencyName: "Nakur" }),
  ];
  const classified = classifyMlaSourceRows(rows, CONSTITUENCIES);
  assert.equal(classified.length, 3);
  assert.ok(classified.every((c) => c.status === "DUP_SEAT"));
  const okCount = classified.filter((c) => c.status === "OK").length;
  assert.equal(okCount, 0, "an unresolved duplicate seat must never contribute an OK/importable row");
});

test("phase19-8b. duplicate-seat rows never leak into a coverage report as matched", () => {
  const rows: SourceRow[] = [
    row({ memberId: "a", constituencyNumber: 2, constituencyName: "Nakur" }),
    row({ memberId: "b", constituencyNumber: 2, constituencyName: "Nakur" }),
  ];
  const classified = classifyMlaSourceRows(rows, CONSTITUENCIES);
  const coverage = computeCoverage(classified, CONSTITUENCIES);
  assert.equal(coverage.matched, 0);
  assert.ok(coverage.missingNumbers.includes(2));
});
