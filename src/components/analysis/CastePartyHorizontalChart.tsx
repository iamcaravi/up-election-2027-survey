"use client";

import { useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { resolveOptionLabel } from "@/lib/option-labels";
import { ISSUE_COLORS, InlineState } from "@/components/results/ResultsDashboardParts";
import type { DemographicGroupPartyRow } from "@/lib/state-analysis";

type ViewMode = "percentage" | "count";

// Horizontal stacked-bar presentation of the same data DemographicPartyChart
// renders as vertical grouped bars for Age/Gender/Religion — this component
// is intentionally NOT a variant of that one (a stacked bar and a grouped
// bar are different enough visual grammars that forcing one component to
// draw both makes the props unreadable), but it reads the exact same
// DemographicGroupPartyRow[] shape, the exact same privacy rule (a whole
// row is hidden — never partially shown — when its sample size is below the
// platform's threshold), and the exact same "within each group separately"
// disclaimer text already used elsewhere on this page. Segment WIDTH is
// always `party.percentage` as computed server-side — never renormalized to
// fill 100%, so a group whose visible parties sum to less than 100% (some
// cells suppressed, or respondents split across more options) shows an
// honest partial bar rather than a stretched one. The %/count toggle only
// changes which already-computed number is printed on each segment; it
// never changes a segment's width, so switching modes can't be mistaken for
// different underlying data.
export function CastePartyHorizontalChart({ rows }: { rows: DemographicGroupPartyRow[] }) {
  const { t, locale } = useLocale();
  const [viewMode, setViewMode] = useState<ViewMode>("percentage");

  const usable = rows.filter((r) => !r.lowData && r.sampleSize > 0);
  if (usable.length === 0) {
    return <InlineState>{t.results.noBreakdownResponses}</InlineState>;
  }

  const partyMeta = usable[0].parties.map((p, index) => ({
    key: p.key,
    label: p.label,
    nameHindi: p.nameHindi,
    color: p.colorHex ?? ISSUE_COLORS[index % ISSUE_COLORS.length],
  }));

  const groupName = (r: DemographicGroupPartyRow) => resolveOptionLabel(r.groupKey, { label: r.groupLabel }, locale, t.surveyQuestions.options);

  const lowDataGroups = rows.filter((r) => r.lowData).map(groupName);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* One compact legend for the whole chart instead of repeating party
            names on every row. */}
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {partyMeta.map((p) => (
            <li key={p.key} className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: p.color }} />
              {locale === "hi" && p.nameHindi ? p.nameHindi : p.label}
            </li>
          ))}
        </ul>
        <div className="inline-flex shrink-0 rounded-full border border-border bg-surface p-0.5 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => setViewMode("percentage")}
            aria-pressed={viewMode === "percentage"}
            className={`rounded-full px-2.5 py-1 transition-colors ${
              viewMode === "percentage" ? "bg-ink text-white" : "text-muted hover:text-ink"
            }`}
          >
            {t.analysisHub.percentShareLabel}
          </button>
          <button
            type="button"
            onClick={() => setViewMode("count")}
            aria-pressed={viewMode === "count"}
            className={`rounded-full px-2.5 py-1 transition-colors ${viewMode === "count" ? "bg-ink text-white" : "text-muted hover:text-ink"}`}
          >
            {t.analysisHub.responseCountLabel}
          </button>
        </div>
      </div>

      <ul className="mt-4 space-y-3">
        {usable.map((row) => {
          // Only parties with a real (>0) share get a visible segment — a
          // zero-width segment would just be a stray rounded-corner sliver.
          const segments = row.parties.filter((p) => p.percentage > 0);
          return (
            <li key={row.groupKey} className="min-w-0">
              <p className="mb-1 truncate text-sm font-bold text-ink">{groupName(row)}</p>
              <div className="flex h-8 w-full overflow-hidden rounded-md bg-surface-2">
                {segments.map((p, index) => {
                  const meta = partyMeta.find((m) => m.key === p.key);
                  const color = meta?.color ?? ISSUE_COLORS[0];
                  const name = locale === "hi" && meta?.nameHindi ? meta.nameHindi : meta?.label ?? p.key;
                  const displayValue = viewMode === "percentage" ? `${p.percentage}%` : String(p.count);
                  // Below ~6% width there isn't reliably enough room for
                  // even a 2-character label without it overflowing its own
                  // segment — hide the inline label rather than let text
                  // spill into the neighboring color. A segment under ~20%
                  // is wide enough at desktop/tablet widths but not at
                  // 320–375px (the same % share is fewer actual pixels in a
                  // narrower bar, and a 5-character "16.7%" needs more room
                  // than it sounds like), so those additionally hide below
                  // `sm:`.
                  const showLabel = p.percentage >= 6;
                  const hideOnNarrowScreens = p.percentage < 20;
                  return (
                    <div
                      key={p.key}
                      role="img"
                      aria-label={`${name} ${p.percentage}%`}
                      className={`flex h-full min-w-0 items-center justify-center overflow-hidden ${index === 0 ? "rounded-l-md" : ""} ${
                        index === segments.length - 1 ? "rounded-r-md" : ""
                      }`}
                      style={{ width: `${p.percentage}%`, background: color }}
                    >
                      {showLabel && (
                        <span className={`truncate px-1 text-xs font-bold text-white ${hideOnNarrowScreens ? "hidden sm:inline" : ""}`}>
                          {displayValue}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-[11px] text-muted">{t.analysisHub.withinGroupNote}</p>
      {lowDataGroups.length > 0 && (
        <p className="mt-3 text-xs text-muted">
          {t.analysisHub.lowDataGroupsNote}: {lowDataGroups.join(", ")}
        </p>
      )}
    </div>
  );
}
