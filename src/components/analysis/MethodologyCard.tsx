"use client";

import { ChevronDown } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { MethodItem } from "@/components/results/ResultsDashboardParts";
import { formatNumber } from "@/lib/utils";
import type { PublicStatewideResultsDto } from "@/lib/public-statewide-results";

// Section P — a compact, honest methodology summary. Every value here comes
// straight off the same statewide sample object every other section already
// uses; nothing is recomputed or estimated. Collapsible so it doesn't
// dominate the bottom of the dashboard — the one-line summary is always
// visible, the full breakdown opens on demand.
export function MethodologyCard({ statewide }: { statewide: PublicStatewideResultsDto }) {
  const { t, locale } = useLocale();
  const dateFormatter = new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <section className="rounded-2xl border border-border bg-surface-2 p-5 sm:p-6">
      <h2 className="font-display text-lg font-bold">{t.results.methodologyTitle}</h2>
      <p className="mt-2 text-sm text-muted">
        {t.analysisHub.methodologyResponseNote.replace("{count}", formatNumber(statewide.sample.validResponseCount))}
      </p>
      <details className="group mt-3">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 text-xs font-semibold text-accent">
          {t.analysisHub.methodologyDetailsToggle}
          <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
        </summary>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <MethodItem label={t.surveyFlow.totalResponsesLabel} value={formatNumber(statewide.sample.validResponseCount)} />
          <MethodItem
            label={t.results.constituenciesSurveyed}
            value={`${formatNumber(statewide.respondingConstituencyCount)} / ${formatNumber(statewide.totalConstituencies)}`}
          />
          <MethodItem
            label={t.results.privacyThreshold}
            value={t.results.privacyThresholdValue.replace("{minimum}", formatNumber(statewide.sample.minCellSize))}
          />
          <MethodItem
            label={t.results.lastUpdated}
            value={statewide.sample.lastResponseAt ? dateFormatter.format(new Date(statewide.sample.lastResponseAt)) : t.results.notConfigured}
          />
        </dl>
        <p className="mt-4 text-xs leading-5 text-muted">{t.analysisHub.issueMultiSelectNote}</p>
        {statewide.isSynthetic && <p className="mt-2 text-xs leading-5 text-muted">{t.results.syntheticNotice}</p>}
      </details>
      <p className="mt-4 border-t border-border pt-4 text-xs leading-5 text-muted">{t.results.notElectionResult}</p>
      <p className="mt-2 text-xs leading-5 text-muted">{t.analysisHub.methodologySelfSelectedNote}</p>
    </section>
  );
}
