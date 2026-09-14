"use client";

import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Stat } from "@/components/ui/Stat";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { formatNumber } from "@/lib/utils";

export function DistrictHeroText({
  stateName,
  stateHref,
  electionName,
  electionHref,
  districtsHref,
  districtName,
  constituencyCount,
  totalResponses,
  activeSurveys,
}: {
  stateName: string;
  stateHref: string;
  electionName: string;
  electionHref: string;
  districtsHref: string;
  districtName: string;
  constituencyCount: number;
  totalResponses: number;
  activeSurveys: number;
}) {
  const { t } = useLocale();
  return (
    <>
      <Breadcrumb
        items={[
          { label: stateName, href: stateHref },
          { label: electionName, href: electionHref },
          { label: t.hierarchy.allDistricts, href: districtsHref },
          { label: districtName },
        ]}
      />
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">
        {stateName} · {t.hierarchy.districtEyebrow}
      </p>
      <h1 className="font-display text-3xl font-extrabold sm:text-5xl">{districtName}</h1>
      <div className="mt-6 flex flex-wrap gap-6">
        <Stat label={t.district.assemblySeatsUnit} value={formatNumber(constituencyCount)} />
        <Stat label={t.district.totalResponses} value={formatNumber(totalResponses)} />
        <Stat label={t.district.activeSurveys} value={formatNumber(activeSurveys)} />
      </div>
    </>
  );
}
