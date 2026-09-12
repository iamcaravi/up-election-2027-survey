"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { PublicResultsView } from "./PublicResultsView";
import { StatewideResultsView } from "./StatewideResultsView";
import type { PublicSurveyResultsDto } from "@/lib/public-survey-results";
import type { PublicStatewideResultsDto } from "@/lib/public-statewide-results";

export function ResultsTabs({
  constituencyResults,
  statewideResults,
  surveyHref,
}: {
  constituencyResults: PublicSurveyResultsDto;
  statewideResults: PublicStatewideResultsDto | null;
  surveyHref: string;
}) {
  const { t } = useLocale();
  const [tab, setTab] = useState<"constituency" | "statewide">("constituency");

  return (
    <div>
      <div
        role="tablist"
        aria-label={`${t.surveyFlow.myConstituencyTab} / ${t.surveyFlow.stateWideTab}`}
        className="mb-8 inline-flex rounded-full border border-border bg-surface-2 p-1"
      >
        <TabButton active={tab === "constituency"} onClick={() => setTab("constituency")}>
          {t.surveyFlow.myConstituencyTab}
        </TabButton>
        <TabButton active={tab === "statewide"} onClick={() => setTab("statewide")} disabled={!statewideResults}>
          {t.surveyFlow.stateWideTab}
        </TabButton>
      </div>

      {tab === "constituency" ? (
        <PublicResultsView data={constituencyResults} surveyHref={surveyHref} />
      ) : statewideResults ? (
        <StatewideResultsView data={statewideResults} />
      ) : null}
    </div>
  );
}

function TabButton({
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
