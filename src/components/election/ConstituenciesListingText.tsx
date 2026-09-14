"use client";

import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { formatNumber } from "@/lib/utils";

export function ConstituenciesListingText({
  stateName,
  stateHref,
  electionName,
  electionHref,
  constituencyCount,
}: {
  stateName: string;
  stateHref: string;
  electionName: string;
  electionHref: string;
  constituencyCount: number;
}) {
  const { t } = useLocale();
  return (
    <>
      <Breadcrumb
        items={[
          { label: stateName, href: stateHref },
          { label: electionName, href: electionHref },
          { label: t.hierarchy.allConstituencies },
        ]}
      />
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">
        {stateName} · {electionName}
      </p>
      <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{t.hierarchy.allConstituencies}</h1>
      <p className="mt-2 text-sm text-muted">
        {formatNumber(constituencyCount)} {t.hierarchy.constituenciesContesting}
      </p>
    </>
  );
}

export function NoConstituenciesNotice() {
  const { t } = useLocale();
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface-2 p-10 text-center text-sm text-muted">
      {t.hierarchy.noConstituenciesLinked}
    </div>
  );
}
