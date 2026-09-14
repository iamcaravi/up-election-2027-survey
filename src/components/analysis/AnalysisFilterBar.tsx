"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { displayStateName } from "@/lib/utils";
import { analysisLandingStatePath, constituencyPath } from "@/lib/routes";

export interface AnalysisFilterState {
  slug: string;
  /** Raw (English, as stored) state name — resolved per the live locale
   *  inside this component, not baked in server-side, so the dropdown keeps
   *  up with the HI/EN toggle instead of freezing at whichever locale the
   *  page happened to render in. */
  name: string;
}

export interface AnalysisFilterConstituency {
  slug: string;
  name: string;
}

const SELECT_CLASSNAME =
  "h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/30";

// State/Constituency/Election filter row for the state Analysis dashboard.
// State and Constituency are real navigation controls (not client-side
// re-filtering of already-rendered data): changing State goes to that
// state's own analysis dashboard (via the /analysis/[state] redirect, which
// resolves ITS current election — never assumes the same election slug
// across states), and changing Constituency goes straight to that
// constituency's existing canonical results page — there is no second,
// duplicate per-constituency analysis view to keep in sync. Election has
// nothing to switch between (one active election per state in this data
// model), so it's shown as real, read-only context instead of a fake control.
export function AnalysisFilterBar({
  currentStateSlug,
  currentElectionSlug,
  states,
  constituencies,
  electionName,
}: {
  currentStateSlug: string;
  currentElectionSlug: string;
  states: AnalysisFilterState[];
  constituencies: AnalysisFilterConstituency[];
  electionName: string;
}) {
  const { t, locale } = useLocale();
  const router = useRouter();

  return (
    <div className="card-surface grid gap-4 rounded-2xl p-5 sm:grid-cols-3 sm:p-6">
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-foreground">{t.analysisHub.filterState}</span>
        <select
          value={currentStateSlug}
          onChange={(e) => router.push(analysisLandingStatePath(e.target.value))}
          className={SELECT_CLASSNAME}
        >
          {states.map((s) => (
            <option key={s.slug} value={s.slug}>
              {displayStateName(s.name, s.slug, locale)}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-foreground">{t.analysisHub.filterConstituency}</span>
        <select
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) router.push(`${e.target.value}/results`);
          }}
          className={SELECT_CLASSNAME}
        >
          <option value="">{t.analysisHub.allConstituenciesOption}</option>
          {constituencies.map((c) => (
            <option key={c.slug} value={constituencyPath(currentStateSlug, currentElectionSlug, c.slug)}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-foreground">{t.analysisHub.filterElection}</span>
        <div className={`${SELECT_CLASSNAME} flex items-center text-muted`}>{electionName}</div>
      </label>
    </div>
  );
}
