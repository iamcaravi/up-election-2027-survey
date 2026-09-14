"use client";

import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { formatNumber } from "@/lib/utils";

export function DistrictsListingText({
  stateName,
  stateHref,
  electionName,
  electionHref,
  districtCount,
  constituencyCount,
}: {
  stateName: string;
  stateHref: string;
  electionName: string;
  electionHref: string;
  districtCount: number;
  constituencyCount: number;
}) {
  const { t } = useLocale();
  return (
    <>
      <Breadcrumb
        items={[
          { label: stateName, href: stateHref },
          { label: electionName, href: electionHref },
          { label: t.hierarchy.allDistricts },
        ]}
      />
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">{stateName}</p>
      <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{t.hierarchy.allDistricts}</h1>
      <p className="mt-2 text-sm text-muted">
        {formatNumber(districtCount)} {t.stats.districts.toLowerCase()} · {formatNumber(constituencyCount)} {t.district.assemblySeatsUnit}
      </p>
    </>
  );
}

export function DistrictCardCount({ count }: { count: number }) {
  const { t } = useLocale();
  return (
    <p className="text-xs text-muted">
      {formatNumber(count)} {t.district.assemblySeatsUnit}
    </p>
  );
}
