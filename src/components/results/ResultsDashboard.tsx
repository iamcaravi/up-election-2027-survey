"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { DistrictConstituencySelect, type DistrictOption, type ConstituencyOption } from "@/components/ui/DistrictConstituencySelect";
import { StatewideResultsView } from "@/components/results/StatewideResultsView";
import { PublicResultsView } from "@/components/results/PublicResultsView";
import { SurveyTrustStrip } from "@/components/survey/SurveyTrustStrip";
import { constituencyPath } from "@/lib/routes";
import type { PublicStatewideResultsDto } from "@/lib/public-statewide-results";
import type { PublicSurveyResultsDto } from "@/lib/public-survey-results";

// The state's Results dashboard: cascading District → Constituency filters
// drive which real, database-backed result set is on screen — never a
// browsable directory of every constituency (that's Find Constituency's and
// Explore Districts' job, not Results'). Selection lives in the URL
// (?district=&constituency=) so a scoped view is shareable/bookmarkable and
// survives back/forward, the same pattern ResultsTabs already uses for
// ?view=state.
export function ResultsDashboard({
  stateSlug,
  electionSlug,
  districts,
  constituencies,
  initialStatewide,
}: {
  stateSlug: string;
  electionSlug: string;
  districts: DistrictOption[];
  constituencies: ConstituencyOption[];
  initialStatewide: PublicStatewideResultsDto;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [districtSlug, setDistrictSlug] = useState(searchParams.get("district") ?? "");
  const [constituencySlug, setConstituencySlug] = useState(searchParams.get("constituency") ?? "");

  const [districtResult, setDistrictResult] = useState<PublicStatewideResultsDto | null>(null);
  const [constituencyResult, setConstituencyResult] = useState<PublicSurveyResultsDto | null>(null);
  const [loading, setLoading] = useState(false);

  function pushQuery(next: { district?: string; constituency?: string }) {
    const params = new URLSearchParams();
    if (next.district) params.set("district", next.district);
    if (next.constituency) params.set("constituency", next.constituency);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function handleDistrictChange(next: string) {
    setDistrictSlug(next);
    setConstituencySlug("");
    pushQuery({ district: next || undefined });
  }

  function handleConstituencyChange(next: string) {
    setConstituencySlug(next);
    pushQuery({ district: districtSlug || undefined, constituency: next || undefined });
  }

  useEffect(() => {
    if (!constituencySlug) {
      setConstituencyResult(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/constituencies/${encodeURIComponent(constituencySlug)}/results?state=${encodeURIComponent(stateSlug)}&election=${encodeURIComponent(electionSlug)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: PublicSurveyResultsDto | null) => {
        if (!cancelled) setConstituencyResult(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [constituencySlug, stateSlug, electionSlug]);

  useEffect(() => {
    if (!districtSlug || constituencySlug) {
      setDistrictResult(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/districts/${encodeURIComponent(districtSlug)}/results?state=${encodeURIComponent(stateSlug)}&election=${encodeURIComponent(electionSlug)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: PublicStatewideResultsDto | null) => {
        if (!cancelled) setDistrictResult(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [districtSlug, constituencySlug, stateSlug, electionSlug]);

  const selectedDistrictName = districts.find((d) => d.slug === districtSlug)?.name ?? "";
  const selectedConstituencyName = constituencies.find((c) => c.slug === constituencySlug)?.name ?? "";

  const scopeBadge = constituencySlug
    ? t.resultsHub.constituencyScopeBadge.replace("{constituency}", selectedConstituencyName)
    : districtSlug
      ? t.resultsHub.districtScopeBadge.replace("{district}", selectedDistrictName)
      : t.resultsHub.statewideScopeBadge;

  return (
    <div>
      <div className="card-surface rounded-2xl p-5 sm:p-6">
        <DistrictConstituencySelect
          districts={districts}
          constituencies={constituencies}
          districtValue={districtSlug}
          constituencyValue={constituencySlug}
          onDistrictChange={handleDistrictChange}
          onConstituencyChange={handleConstituencyChange}
          districtLabel={t.resultsHub.districtLabel}
          constituencyLabel={t.resultsHub.constituencyLabel}
          districtPlaceholder={t.resultsHub.allDistrictsPlaceholder}
          constituencyPlaceholder={t.resultsHub.selectConstituencyPlaceholder}
          constituencyDisabledPlaceholder={t.resultsHub.selectDistrictFirstPlaceholder}
        />
      </div>

      <p className="mt-6 text-xs font-bold uppercase tracking-wider text-accent">{scopeBadge}</p>

      <div className="mt-4">
        {loading ? (
          <p className="rounded-2xl border border-dashed border-border bg-surface-2 p-10 text-center text-sm text-muted">
            {t.resultsHub.loadingResults}
          </p>
        ) : constituencySlug ? (
          constituencyResult && (
            <PublicResultsView
              data={constituencyResult}
              surveyHref={`${constituencyPath(stateSlug, electionSlug, constituencySlug)}/survey`}
            />
          )
        ) : districtSlug ? (
          districtResult && <StatewideResultsView data={districtResult} />
        ) : (
          <StatewideResultsView data={initialStatewide} />
        )}
      </div>

      <div className="mt-8">
        <SurveyTrustStrip />
      </div>
    </div>
  );
}
