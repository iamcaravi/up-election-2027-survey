"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { LinkButton } from "@/components/ui/Button";
import { constituencyPath } from "@/lib/routes";

interface StateOption {
  slug: string;
  name: string;
  electionSlug: string | null;
}

interface DistrictOption {
  slug: string;
  name: string;
}

interface ConstituencyOption {
  slug: string;
  name: string;
}

const SELECT_CLASSNAME =
  "h-12 w-full rounded-xl border border-border bg-surface px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/30 disabled:cursor-not-allowed disabled:opacity-50";

// The three levels load progressively (not from one preloaded dataset like
// the Results dashboard's district/constituency select) — selecting a state
// fetches only that state's districts, selecting a district fetches only
// that district's constituencies. This keeps the page from ever loading
// every state's full constituency list up front just to populate one dropdown.
export function FindConstituencyFlow({ states }: { states: StateOption[] }) {
  const { t } = useLocale();

  const [stateSlug, setStateSlug] = useState("");
  const [districtSlug, setDistrictSlug] = useState("");
  const [constituencySlug, setConstituencySlug] = useState("");

  const [districts, setDistricts] = useState<DistrictOption[]>([]);
  const [constituencies, setConstituencies] = useState<ConstituencyOption[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingConstituencies, setLoadingConstituencies] = useState(false);

  useEffect(() => {
    if (!stateSlug) {
      setDistricts([]);
      return;
    }
    let cancelled = false;
    setLoadingDistricts(true);
    fetch(`/api/districts?state=${encodeURIComponent(stateSlug)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: { slug: string; name: string }[]) => {
        if (!cancelled) setDistricts(data.map((d) => ({ slug: d.slug, name: d.name })));
      })
      .finally(() => {
        if (!cancelled) setLoadingDistricts(false);
      });
    return () => {
      cancelled = true;
    };
  }, [stateSlug]);

  useEffect(() => {
    if (!stateSlug || !districtSlug) {
      setConstituencies([]);
      return;
    }
    let cancelled = false;
    setLoadingConstituencies(true);
    fetch(`/api/districts/${encodeURIComponent(districtSlug)}?state=${encodeURIComponent(stateSlug)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { constituencies: { slug: string; name: string }[] } | null) => {
        if (!cancelled) setConstituencies(data ? data.constituencies.map((c) => ({ slug: c.slug, name: c.name })) : []);
      })
      .finally(() => {
        if (!cancelled) setLoadingConstituencies(false);
      });
    return () => {
      cancelled = true;
    };
  }, [stateSlug, districtSlug]);

  const selectedState = states.find((s) => s.slug === stateSlug) ?? null;
  const electionSlug = selectedState?.electionSlug ?? null;

  function handleStateChange(next: string) {
    setStateSlug(next);
    setDistrictSlug("");
    setConstituencySlug("");
  }

  function handleDistrictChange(next: string) {
    setDistrictSlug(next);
    setConstituencySlug("");
  }

  const canShowActions = Boolean(stateSlug && districtSlug && constituencySlug && electionSlug);
  const basePath = canShowActions ? constituencyPath(stateSlug, electionSlug!, constituencySlug) : null;

  return (
    <div className="card-surface rounded-2xl p-5 sm:p-6">
      <div className="grid gap-5 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-accent">{t.findConstituency.step1}</span>
          <span className="mb-1.5 block text-sm font-semibold text-foreground">{t.findConstituency.stateLabel}</span>
          <select
            value={stateSlug}
            onChange={(e) => handleStateChange(e.target.value)}
            className={SELECT_CLASSNAME}
          >
            <option value="">{t.findConstituency.selectStatePlaceholder}</option>
            {states.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-accent">{t.findConstituency.step2}</span>
          <span className="mb-1.5 block text-sm font-semibold text-foreground">{t.resultsHub.districtLabel}</span>
          <select
            value={districtSlug}
            disabled={!stateSlug}
            onChange={(e) => handleDistrictChange(e.target.value)}
            className={SELECT_CLASSNAME}
          >
            <option value="">
              {!stateSlug
                ? t.findConstituency.selectDistrictDisabledPlaceholder
                : loadingDistricts
                  ? t.findConstituency.loadingDistricts
                  : t.findConstituency.selectDistrictPlaceholder}
            </option>
            {districts.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-accent">{t.findConstituency.step3}</span>
          <span className="mb-1.5 block text-sm font-semibold text-foreground">{t.resultsHub.constituencyLabel}</span>
          <select
            value={constituencySlug}
            disabled={!districtSlug}
            onChange={(e) => setConstituencySlug(e.target.value)}
            className={SELECT_CLASSNAME}
          >
            <option value="">
              {!districtSlug
                ? t.findConstituency.selectConstituencyDisabledPlaceholder
                : loadingConstituencies
                  ? t.findConstituency.loadingConstituencies
                  : t.resultsHub.selectConstituencyPlaceholder}
            </option>
            {constituencies.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {canShowActions && basePath && (
        <div className="mt-6 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row">
          <LinkButton href={`${basePath}/survey`} size="lg" variant="cta" className="flex-1">
            {t.constituency.takeSurvey}
          </LinkButton>
          <LinkButton href={`${basePath}/results`} size="lg" variant="outline" className="flex-1">
            {t.constituency.viewResults}
          </LinkButton>
        </div>
      )}
    </div>
  );
}
