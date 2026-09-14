"use client";

import { useMemo, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { formatNumber } from "@/lib/utils";
import { InlineState } from "@/components/results/ResultsDashboardParts";
import { RankedIssueList } from "./RankedIssueList";
import type { IntersectionCell, IntersectionDimension } from "@/lib/state-analysis";

const SELECT_CLASSNAME =
  "h-10 rounded-xl border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ink/30";

// Section P — "Women aged 18–34 supporting BJP: top issues Jobs, Development,
// Safety." Every (dimension, group, party) combination is precomputed once
// server-side (state-analysis.ts's intersection loop), so switching the
// three dropdowns here is pure client-side lookup — no extra network round
// trip per selection. Deliberately limited to single-dimension x party
// intersections (Age x Party, Gender x Party, Religion x Party) rather than
// three-way combinations, which would multiply low-data cells far faster
// than useful ones. A combination whose intersected sample is below the
// privacy/sample threshold shows an honest low-data message instead of a
// ranked list built from too few respondents.
export function IntersectionAnalysis({ cells, hasReligion }: { cells: IntersectionCell[]; hasReligion: boolean }) {
  const { t, locale } = useLocale();
  const [dimension, setDimension] = useState<IntersectionDimension>("age_group");

  const groups = useMemo(() => {
    const seen = new Map<string, string>();
    for (const cell of cells) {
      if (cell.dimension === dimension && !seen.has(cell.groupKey)) seen.set(cell.groupKey, cell.groupLabel);
    }
    return Array.from(seen.entries()).map(([key, label]) => ({ key, label }));
  }, [cells, dimension]);

  const parties = useMemo(() => {
    const seen = new Map<string, { label: string; nameHindi: string | null }>();
    for (const cell of cells) {
      if (cell.dimension === dimension && !seen.has(cell.partyKey)) seen.set(cell.partyKey, { label: cell.partyLabel, nameHindi: cell.partyNameHindi });
    }
    return Array.from(seen.entries()).map(([key, meta]) => ({ key, ...meta }));
  }, [cells, dimension]);

  const [groupKey, setGroupKey] = useState(groups[0]?.key ?? "");
  const [partyKey, setPartyKey] = useState(parties[0]?.key ?? "");

  const activeGroupKey = groups.some((g) => g.key === groupKey) ? groupKey : groups[0]?.key ?? "";
  const activePartyKey = parties.some((p) => p.key === partyKey) ? partyKey : parties[0]?.key ?? "";

  const activeCell = cells.find(
    (c) => c.dimension === dimension && c.groupKey === activeGroupKey && c.partyKey === activePartyKey
  );

  if (cells.length === 0 || groups.length === 0 || parties.length === 0) {
    return <InlineState>{t.results.resultsSuppressed}</InlineState>;
  }

  const dimensionLabel = (d: IntersectionDimension) => (d === "age_group" ? t.results.ageGroup : d === "gender" ? t.results.gender : t.results.religion);

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-foreground">{t.analysisHub.demographicLabel}</span>
          <select
            value={dimension}
            onChange={(e) => {
              const next = e.target.value as IntersectionDimension;
              setDimension(next);
              setGroupKey("");
              setPartyKey("");
            }}
            className={SELECT_CLASSNAME}
          >
            <option value="age_group">{t.results.ageGroup}</option>
            <option value="gender">{t.results.gender}</option>
            {hasReligion && <option value="religion">{t.results.religion}</option>}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-foreground">{dimensionLabel(dimension)}</span>
          <select value={activeGroupKey} onChange={(e) => setGroupKey(e.target.value)} className={SELECT_CLASSNAME}>
            {groups.map((g) => (
              <option key={g.key} value={g.key}>
                {g.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-foreground">{t.analysisHub.selectPartyLabel}</span>
          <select value={activePartyKey} onChange={(e) => setPartyKey(e.target.value)} className={SELECT_CLASSNAME}>
            {parties.map((p) => (
              <option key={p.key} value={p.key}>
                {locale === "hi" && p.nameHindi ? p.nameHindi : p.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="card-surface mt-4 rounded-2xl p-4 sm:p-5">
        {!activeCell || activeCell.lowData ? (
          <InlineState>{t.analysisHub.intersectionLowData}</InlineState>
        ) : (
          <>
            <p className="text-xs font-semibold text-muted">
              {t.analysisHub.basedOnRespondents.replace("{count}", formatNumber(activeCell.sampleSize))}
            </p>
            <div className="mt-3">
              <RankedIssueList issues={activeCell.topIssues} emptyLabel={t.analysisHub.notEnoughPartyIssueData} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
