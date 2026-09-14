"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { BarChart3, Users2 } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { formatNumber } from "@/lib/utils";
import { IssuesDonutChart } from "@/components/results/ResultsDashboardParts";
import { RankedIssueList } from "./RankedIssueList";
import type { CompositionCell, PartyTopIssues } from "@/lib/state-analysis";
import type { PublicDistribution } from "@/lib/public-analytics-core";

const SELECT_CLASSNAME =
  "h-10 rounded-xl border border-border bg-surface px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ink/30";

// Compact composition bars — "of BJP's supporters, X% are women" — the
// inverse question from the Age/Gender/Religion/Caste x Party sections
// further down the page (which ask "of women, X% support BJP"). Each cell's
// own count already cleared (or failed) the privacy threshold server-side; a
// failing cell renders as an honest "suppressed" row instead of a number.
function CompositionList({ cells, suppressedLabel }: { cells: CompositionCell[]; suppressedLabel: string }) {
  if (cells.length === 0) return null;
  const maxPct = Math.max(1, ...cells.filter((c) => !c.lowData).map((c) => c.percentage));
  return (
    <ul className="space-y-1.5">
      {cells.map((cell) => (
        <li key={cell.key} className="flex min-w-0 items-center gap-2 text-xs">
          <span className="w-20 shrink-0 truncate text-foreground sm:w-24">{cell.label}</span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
            {!cell.lowData && <span className="block h-full rounded-full bg-accent" style={{ width: `${(cell.percentage / maxPct) * 100}%` }} />}
          </span>
          <span className="w-14 shrink-0 text-right font-bold tabular-nums text-ink">{cell.lowData ? suppressedLabel : `${cell.percentage}%`}</span>
        </li>
      ))}
    </ul>
  );
}

type Mode = "prompt" | "party" | "overall";

// Section G — "If a respondent supports BJP, what issues matter most to
// them?" Every party's ranking is computed server-side in getStateAnalysis
// from real party_preference + top_issue answers given by the SAME
// respondents (state-analysis.ts's computeCrosstabAnalysis) — never a
// hardcoded party→issue mapping, and the percentage denominator is that
// party's own supporter count (never total issue mentions).
//
// The initial state is neutral: no party is preselected (never defaults to
// BJP or any specific party) — the visitor either picks a party from the
// dropdown or opts into a compact overall view. `overallTopIssues` is passed
// in from the already-computed statewide distribution (Section F) so this
// "overall" toggle never recomputes or duplicates that chart — it's a
// lightweight ranked-list reuse of the same numbers.
export function KeyIssuesByParty({
  parties,
  overallTopIssues,
}: {
  parties: PartyTopIssues[];
  overallTopIssues: { key: string; label: string; percentage: number }[];
}) {
  const { t, locale } = useLocale();
  const [mode, setMode] = useState<Mode>("prompt");
  const [selectedKey, setSelectedKey] = useState("");

  const selected = parties.find((p) => p.partyKey === selectedKey) ?? null;

  const distribution: PublicDistribution | null = useMemo(() => {
    if (!selected || selected.lowData || selected.topIssues.length === 0) return null;
    return {
      state: "available",
      denominator: selected.respondentCount,
      minRequired: 1,
      buckets: selected.topIssues.map((issue, index) => ({
        key: issue.key,
        label: issue.label,
        displayOrder: index,
        state: "available",
        count: issue.count,
        percentage: issue.percentage,
      })),
    };
  }, [selected]);

  if (parties.length === 0) {
    return <p className="text-sm text-muted">{t.analysisHub.notEnoughPartyIssueData}</p>;
  }

  const selectedName = selected ? (locale === "hi" && selected.partyNameHindi ? selected.partyNameHindi : selected.partyLabel) : "";

  return (
    <div>
      <label className="block max-w-xs">
        <span className="mb-1.5 block text-xs font-semibold text-foreground">{t.analysisHub.selectPartyLabel}</span>
        <select
          value={selectedKey}
          onChange={(e) => {
            setSelectedKey(e.target.value);
            setMode(e.target.value ? "party" : "prompt");
          }}
          className={SELECT_CLASSNAME}
        >
          <option value="">{t.analysisHub.selectPartyLabel}</option>
          {parties.map((p) => (
            <option key={p.partyKey} value={p.partyKey}>
              {locale === "hi" && p.partyNameHindi ? p.partyNameHindi : p.partyLabel}
            </option>
          ))}
        </select>
      </label>

      {mode === "prompt" && (
        <div className="card-surface mt-4 rounded-2xl p-6 text-center sm:p-8">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-accent/10 text-accent">
            <BarChart3 size={20} />
          </span>
          <p className="mt-3 font-display text-base font-bold text-ink">{t.analysisHub.selectPartyPromptHeading}</p>
          <p className="mx-auto mt-1.5 max-w-md text-xs text-muted">{t.analysisHub.selectPartyPromptBody}</p>
          <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
            <span className="h-px w-8 bg-border" /> {locale === "hi" ? "या" : "OR"} <span className="h-px w-8 bg-border" />
          </div>
          <button
            type="button"
            onClick={() => setMode("overall")}
            className="mx-auto mt-4 flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-ink transition-colors hover:bg-surface-2"
          >
            <Users2 size={14} /> {t.analysisHub.viewOverallIssuesButton}
          </button>
        </div>
      )}

      {mode === "overall" && (
        <div className="card-surface mt-4 rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="font-display text-sm font-bold text-ink">{t.analysisHub.overallVoterIssuePriorities}</p>
            <button type="button" onClick={() => setMode("prompt")} className="text-xs font-semibold text-accent hover:underline">
              {t.analysisHub.changeParty}
            </button>
          </div>
          <div className="mt-3">
            <RankedIssueList issues={overallTopIssues} emptyLabel={t.analysisHub.notEnoughTakeaways} />
          </div>
        </div>
      )}

      {mode === "party" && selected && (
        <div className="card-surface mt-4 rounded-2xl p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              {selected.logoUrl ? (
                <Image src={selected.logoUrl} alt="" width={32} height={32} className="h-8 w-8 shrink-0 rounded-full object-contain" />
              ) : (
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: selected.colorHex ?? "var(--ink)" }}
                >
                  {selectedName.slice(0, 2).toUpperCase()}
                </span>
              )}
              <p className="truncate font-display text-base font-bold text-ink">{selectedName}</p>
            </div>
            <span className="text-xs font-semibold text-muted">
              {t.analysisHub.basedOnRespondents.replace("{count}", formatNumber(selected.respondentCount))}
            </span>
          </div>

          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            <div className="min-w-0">
              {distribution ? (
                <>
                  <IssuesDonutChart distribution={distribution} centerLabel={selectedName} />
                  <p className="mt-3 text-[11px] leading-relaxed text-muted">{t.analysisHub.issueMultiSelectNote}</p>
                </>
              ) : (
                <p className="text-xs text-muted">{t.analysisHub.notEnoughPartyIssueData}</p>
              )}
            </div>

            {(selected.genderComposition.length > 0 ||
              selected.ageComposition.length > 0 ||
              selected.religionComposition.length > 0 ||
              selected.casteComposition.length > 0) && (
              <div className="min-w-0 border-t border-border pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                <h4 className="font-display text-xs font-bold uppercase tracking-wide text-muted">
                  {t.analysisHub.compositionOf.replace("{party}", selectedName)}
                </h4>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {selected.genderComposition.length > 0 && (
                    <div className="min-w-0">
                      <p className="mb-2 text-xs font-semibold text-foreground">{t.analysisHub.genderCompositionLabel}</p>
                      <CompositionList cells={selected.genderComposition} suppressedLabel={t.results.suppressed} />
                    </div>
                  )}
                  {selected.ageComposition.length > 0 && (
                    <div className="min-w-0">
                      <p className="mb-2 text-xs font-semibold text-foreground">{t.analysisHub.ageCompositionLabel}</p>
                      <CompositionList cells={selected.ageComposition} suppressedLabel={t.results.suppressed} />
                    </div>
                  )}
                  {selected.religionComposition.length > 0 && (
                    <div className="min-w-0">
                      <p className="mb-2 text-xs font-semibold text-foreground">{t.analysisHub.religionCompositionLabel}</p>
                      <CompositionList cells={selected.religionComposition} suppressedLabel={t.results.suppressed} />
                    </div>
                  )}
                  {selected.casteComposition.length > 0 && (
                    <div className="min-w-0">
                      <p className="mb-2 text-xs font-semibold text-foreground">{t.analysisHub.casteCompositionLabel}</p>
                      <CompositionList cells={selected.casteComposition} suppressedLabel={t.results.suppressed} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
