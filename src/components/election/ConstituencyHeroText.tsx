"use client";

import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { LinkButton } from "@/components/ui/Button";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { formatNumber } from "@/lib/utils";

export function ConstituencyHeroText({
  stateName,
  stateHref,
  electionName,
  electionHref,
  districtName,
  districtHref,
  constituencyName,
  constituencyNumber,
  reservedStatus,
  currentMlaName,
  result2022WinnerName,
  result2022WinnerParty,
  responseCount,
  surveyHref,
  resultsHref,
}: {
  stateName: string;
  stateHref: string;
  electionName: string;
  electionHref: string;
  districtName: string;
  districtHref: string;
  constituencyName: string;
  constituencyNumber: number;
  reservedStatus: string;
  currentMlaName: string | null;
  result2022WinnerName: string | null;
  result2022WinnerParty: string | null;
  responseCount: number;
  surveyHref: string;
  resultsHref: string;
}) {
  const { t } = useLocale();

  return (
    <>
      <Breadcrumb
        items={[
          { label: stateName, href: stateHref },
          { label: electionName, href: electionHref },
          { label: districtName, href: districtHref },
          { label: constituencyName },
        ]}
      />
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">
        {t.hierarchy.constituencyEyebrow.replace("{number}", String(constituencyNumber))} · {districtName}, {stateName}
      </p>
      <h1 className="font-display text-3xl font-extrabold sm:text-5xl">{constituencyName}</h1>

      <div className="mt-6 flex flex-wrap gap-6">
        <InfoStat
          label={t.hierarchy.reservationLabel}
          value={reservedStatus === "None" ? t.constituency.unreserved : reservedStatus}
        />
        <InfoStat label={t.district.currentMla} value={currentMlaName ?? t.hierarchy.notOnRecord} />
        <InfoStat
          label={t.constituency.result2022}
          value={result2022WinnerName ? `${result2022WinnerName} (${result2022WinnerParty ?? "—"})` : t.candidate.notVerified}
        />
        <InfoStat label={t.stats.responses} value={formatNumber(responseCount)} />
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <LinkButton href={surveyHref} size="lg" variant="cta">
          {t.constituency.takeSurvey}
        </LinkButton>
        <LinkButton href={resultsHref} size="lg" variant="outline">
          {t.constituency.viewResults}
        </LinkButton>
      </div>
    </>
  );
}

function InfoStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-display text-lg font-bold">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
