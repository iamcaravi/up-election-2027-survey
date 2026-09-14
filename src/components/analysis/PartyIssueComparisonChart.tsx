"use client";

import { useMemo } from "react";
import { DemographicPartyChart } from "./DemographicPartyChart";
import type { DemographicGroupPartyRow, IssuePartyMatrixRow, PartySegmentMeta } from "@/lib/state-analysis";

// Section H — "Party x Issue Comparison": the same top-issues x parties data
// as the heatmap (Section I), reshaped once into the exact
// DemographicGroupPartyRow[] shape DemographicPartyChart already expects
// (issues stand in for "groups") so this section adds zero new grouped-bar
// chart logic — it's the same reusable component used for Age x Party and
// Gender x Party, just fed a different row set.
export function PartyIssueComparisonChart({ rows, segments }: { rows: IssuePartyMatrixRow[]; segments: PartySegmentMeta[] }) {
  const demographicRows: DemographicGroupPartyRow[] = useMemo(
    () =>
      rows.map((row) => {
        const sampleCounts = row.cells.map((c) => c.count);
        // A row is only shown when EVERY party's cell for this issue clears
        // the privacy/sample threshold — a partially-suppressed row would
        // otherwise have to render a suppressed cell as a misleading "0%"
        // bar, since this chart (unlike the heatmap) has no per-bar
        // suppressed state to render instead.
        return {
          groupKey: row.issueKey,
          groupLabel: row.issueLabel,
          sampleSize: Math.max(0, ...sampleCounts),
          lowData: row.cells.some((c) => c.lowData),
          parties: row.cells.map((cell) => {
            const segment = segments.find((s) => s.key === cell.partyKey);
            return {
              key: cell.partyKey,
              label: segment?.label ?? cell.partyKey,
              nameHindi: segment?.nameHindi ?? null,
              colorHex: segment?.colorHex ?? null,
              percentage: cell.percentage,
              count: cell.count,
            };
          }),
        };
      }),
    [rows, segments]
  );

  return <DemographicPartyChart rows={demographicRows} />;
}
