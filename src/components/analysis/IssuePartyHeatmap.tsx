"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";
import { InlineState } from "@/components/results/ResultsDashboardParts";
import type { IssuePartyMatrixRow, PartySegmentMeta } from "@/lib/state-analysis";

// Issue x Party matrix (Section I) — rows are issues, columns are party
// segments (real parties + Others), cells are "% of that party's supporters
// who picked this issue" (the same underlying per-party issue counts as Key
// Issues by Party, Section H — no separate calculation). Cell background
// intensity scales with the percentage so differences are visible at a
// glance; a cell below the privacy/sample threshold shows a muted "low data"
// state instead of a colored, seemingly-reliable number.
export function IssuePartyHeatmap({ rows, segments }: { rows: IssuePartyMatrixRow[]; segments: PartySegmentMeta[] }) {
  const { t, locale } = useLocale();

  if (rows.length === 0 || segments.length === 0) {
    return <InlineState>{t.results.resultsSuppressed}</InlineState>;
  }

  const maxPct = Math.max(1, ...rows.flatMap((r) => r.cells.filter((c) => !c.lowData).map((c) => c.percentage)));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-separate border-spacing-1 text-xs">
        <thead>
          <tr>
            <th className="p-1.5 text-left font-semibold text-muted">{t.analysisHub.issueColumnLabel}</th>
            {segments.map((s) => (
              <th key={s.key} className="p-1.5 text-center font-semibold text-ink">
                {locale === "hi" && s.nameHindi ? s.nameHindi : s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.issueKey}>
              <td className="whitespace-nowrap p-1.5 pr-3 font-semibold text-foreground">{row.issueLabel}</td>
              {row.cells.map((cell) => {
                const segment = segments.find((s) => s.key === cell.partyKey);
                const baseColor = segment?.colorHex ?? "#2563eb";
                const intensity = cell.lowData ? 0 : Math.max(0.08, cell.percentage / maxPct);
                return (
                  <td
                    key={cell.partyKey}
                    className="rounded-lg p-1.5 text-center font-bold tabular-nums"
                    style={
                      cell.lowData
                        ? { background: "var(--surface-2)", color: "var(--muted)" }
                        : { background: `${baseColor}${Math.round(intensity * 255).toString(16).padStart(2, "0")}`, color: intensity > 0.55 ? "#fff" : "var(--ink)" }
                    }
                  >
                    {cell.lowData ? t.results.suppressed : `${cell.percentage}%`}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
