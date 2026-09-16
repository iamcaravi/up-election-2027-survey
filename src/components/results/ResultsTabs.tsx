"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { PublicResultsView } from "./PublicResultsView";
import { StatewideResultsView } from "./StatewideResultsView";
import { SurveyTrustStrip } from "@/components/survey/SurveyTrustStrip";
import type { PublicSurveyResultsDto } from "@/lib/public-survey-results";
import type { PublicStatewideResultsDto } from "@/lib/public-statewide-results";

type Scope = "constituency" | "statewide";

export function ResultsTabs({
  constituencyResults,
  statewideResults,
  surveyHref,
}: {
  constituencyResults: PublicSurveyResultsDto;
  statewideResults: PublicStatewideResultsDto | null;
  surveyHref: string;
}) {
  const { locale, t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // The scope toggle is reflected in ?view=state so that "Share this
  // result" (DisclaimerShareBar, which shares window.location.href) always
  // captures whichever scope is actually on screen — sharing from "पूरा
  // उत्तर प्रदेश" must never hand out the plain constituency URL.
  const [tab, setTab] = useState<Scope>(searchParams.get("view") === "state" && statewideResults ? "statewide" : "constituency");

  useEffect(() => {
    if (searchParams.get("view") === "state" && statewideResults) setTab("statewide");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectTab(next: Scope) {
    setTab(next);
    const params = new URLSearchParams(searchParams.toString());
    if (next === "statewide") params.set("view", "state");
    else params.delete("view");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const numberFormatter = new Intl.NumberFormat(locale === "hi" ? "hi-IN" : "en-IN");
  const dateTimeFormatter = new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const activeValidResponseCount =
    tab === "constituency" ? constituencyResults.sample.validResponseCount : statewideResults?.sample.validResponseCount ?? null;
  const activeLastResponseAt =
    tab === "constituency" ? constituencyResults.sample.lastResponseAt : statewideResults?.sample.lastResponseAt ?? null;
  const activeHasResults =
    tab === "constituency"
      ? constituencyResults.visibility.state === "visible" && activeValidResponseCount !== 0
      : Boolean(statewideResults && statewideResults.sample.validResponseCount > 0);
  const activeIsSynthetic = tab === "constituency" ? constituencyResults.isSynthetic : Boolean(statewideResults?.isSynthetic);
  const stateWideTabLabel = t.surveyFlow.stateWideTab.replace("{state}", statewideResults?.state.name ?? "");

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div
          role="tablist"
          aria-label={`${t.surveyFlow.myConstituencyTab} / ${stateWideTabLabel}`}
          className="inline-flex rounded-full border border-border bg-surface-2 p-1"
        >
          <ScopeTabButton active={tab === "constituency"} onClick={() => selectTab("constituency")}>
            {t.surveyFlow.myConstituencyTab}
          </ScopeTabButton>
          <ScopeTabButton active={tab === "statewide"} onClick={() => selectTab("statewide")} disabled={!statewideResults}>
            {stateWideTabLabel}
          </ScopeTabButton>
        </div>
        {activeIsSynthetic && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-800">{t.results.demoBadge}</span>
        )}
      </div>

      {/* The constituency result page shows only its one primary result view —
          no in-page "Summary / Party / Issues / Detailed Analysis" scroll-nav
          (those section ids still exist inside PublicResultsView/
          StatewideResultsView for anchor links elsewhere, e.g. the footer's
          "View methodology" link — this only removes the pointless
          always-first-tab nav bar, not the sections themselves). */}
      {activeHasResults && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 text-xs text-muted sm:justify-end sm:gap-4">
          <span className="text-xs text-muted">
            {t.results.lastUpdated}: {activeLastResponseAt ? dateTimeFormatter.format(new Date(activeLastResponseAt)) : "—"}
          </span>
          <span className="flex items-center gap-1.5 font-bold text-ink sm:ml-4">
            <Users size={14} className="shrink-0" /> {t.results.totalResponsesCard} {numberFormatter.format(activeValidResponseCount ?? 0)}
          </span>
        </div>
      )}

      {tab === "constituency" ? (
        <PublicResultsView data={constituencyResults} surveyHref={surveyHref} />
      ) : statewideResults ? (
        <StatewideResultsView data={statewideResults} />
      ) : null}

      <SurveyTrustStrip />
    </div>
  );
}

function ScopeTabButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 disabled:cursor-not-allowed disabled:opacity-50",
        active ? "bg-ink text-white shadow-[var(--shadow-card)]" : "text-muted hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
