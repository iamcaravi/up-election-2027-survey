"use client";

import { ShieldCheck } from "lucide-react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { displayStateName, formatNumber } from "@/lib/utils";
import { analysisLandingPath } from "@/lib/routes";

// Section A of the Analysis spec: a stable page title ("चुनावी विश्लेषण")
// plus the live scope (state/election) and response count as real, always
// up to date context — not hardcoded into the title itself, so this exact
// heading renders correctly for every state/election combination.
export function AnalysisStateHeading({
  stateNameRaw,
  stateSlug,
  electionName,
  validResponseCount,
  respondingConstituencyCount,
  totalConstituencies,
  historicalMonthsAvailable,
  lastUpdated,
}: {
  stateNameRaw: string;
  stateSlug: string;
  electionName?: string;
  validResponseCount?: number;
  respondingConstituencyCount?: number;
  totalConstituencies?: number;
  historicalMonthsAvailable?: number;
  lastUpdated?: string | null;
}) {
  const { t, locale } = useLocale();
  const stateName = displayStateName(stateNameRaw, stateSlug, locale);
  const dateFormatter = new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", { day: "numeric", month: "short", year: "numeric" });
  return (
    <>
      <Breadcrumb items={[{ label: t.analysisHub.eyebrow, href: analysisLandingPath() }, { label: stateName }]} />
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">{t.analysisHub.eyebrow}</p>
      <h1 className="font-display text-3xl font-extrabold sm:text-5xl">{t.analysisHub.pageTitle}</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted sm:text-base">{t.analysisHub.pageSubtitle}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted sm:text-sm">
        <span className="rounded-full border border-border bg-surface px-3 py-1 text-ink">{stateName}</span>
        {electionName && <span className="rounded-full border border-border bg-surface px-3 py-1 text-ink">{electionName}</span>}
        {typeof validResponseCount === "number" && (
          <span className="rounded-full border border-positive/25 bg-positive/10 px-3 py-1 text-positive">
            {t.analysisHub.responseCountLine.replace("{count}", formatNumber(validResponseCount))}
          </span>
        )}
      </div>

      {/* Data-quality-at-a-glance — plain facts, not a confidence score, so
          it informs without looking alarming. */}
      {(typeof respondingConstituencyCount === "number" || typeof historicalMonthsAvailable === "number" || lastUpdated) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          {typeof respondingConstituencyCount === "number" && typeof totalConstituencies === "number" && (
            <span>{t.analysisHub.constituenciesRepresentedLine.replace("{count}", formatNumber(respondingConstituencyCount)).replace("{total}", formatNumber(totalConstituencies))}</span>
          )}
          {typeof historicalMonthsAvailable === "number" && (
            <span>{t.analysisHub.historicalMonthsLine.replace("{count}", String(historicalMonthsAvailable))}</span>
          )}
          {lastUpdated && <span>{t.results.lastUpdated}: {dateFormatter.format(new Date(lastUpdated))}</span>}
        </div>
      )}

      <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted">
        <ShieldCheck size={13} className="shrink-0 text-positive" />
        {t.results.notElectionResult}
      </p>
    </>
  );
}

export function NoElectionForAnalysisNotice() {
  const { t } = useLocale();
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface-2 p-10 text-center text-sm text-muted">
      {t.analysisHub.noElectionForAnalysis}
    </div>
  );
}
