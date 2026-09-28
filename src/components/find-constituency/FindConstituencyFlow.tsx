"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown, Info, Loader2, MapPin } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { constituencyPath } from "@/lib/routes";
import { cn, displayStateName } from "@/lib/utils";
import { getDistrictDisplayName } from "@/lib/district-hindi";
import { getConstituencyDisplayName } from "@/lib/constituency-hindi";

// THE canonical "विधानसभा क्षेत्र खोजें" flow: State → District → Assembly
// constituency → the existing constituency page. Each level loads only its
// own options from the existing district APIs. The current selection is
// mirrored into the URL (router.replace) so a refresh — or coming Back from
// the constituency page — restores exactly what was chosen.

interface StateOption {
  slug: string;
  name: string;
  electionSlug: string | null;
}

interface Option {
  slug: string;
  name: string;
  number?: number;
}

const NAVY = "text-[#0b1b3a]";

export function FindConstituencyFlow({
  states,
  initial,
}: {
  states: StateOption[];
  initial: { state?: string; district?: string; constituency?: string };
}) {
  const { locale } = useLocale();
  const hi = locale === "hi";
  const router = useRouter();

  const validInitialState = states.some((s) => s.slug === initial.state) ? initial.state! : "";
  const [stateSlug, setStateSlug] = useState(validInitialState);
  const [districtSlug, setDistrictSlug] = useState(validInitialState ? initial.district ?? "" : "");
  const [constituencySlug, setConstituencySlug] = useState(validInitialState && initial.district ? initial.constituency ?? "" : "");

  const [districts, setDistricts] = useState<Option[]>([]);
  const [constituencies, setConstituencies] = useState<Option[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingConstituencies, setLoadingConstituencies] = useState(false);
  const [districtError, setDistrictError] = useState(false);
  const [constituencyError, setConstituencyError] = useState(false);

  // Districts for the selected state (stale responses are ignored).
  useEffect(() => {
    setDistricts([]);
    setDistrictError(false);
    if (!stateSlug) return;
    let cancelled = false;
    setLoadingDistricts(true);
    fetch(`/api/districts?state=${encodeURIComponent(stateSlug)}`)
      .then((res) => {
        if (!res.ok) throw new Error("districts");
        return res.json();
      })
      .then((data: { slug: string; name: string }[]) => {
        if (cancelled) return;
        setDistricts(data.map((d) => ({ slug: d.slug, name: d.name })));
      })
      .catch(() => !cancelled && setDistrictError(true))
      .finally(() => !cancelled && setLoadingDistricts(false));
    return () => {
      cancelled = true;
    };
  }, [stateSlug]);

  // A district carried in from the URL must belong to the chosen state; if it
  // doesn't, it is cleared together with the constituency under it.
  useEffect(() => {
    if (loadingDistricts || districts.length === 0 || !districtSlug) return;
    if (!districts.some((d) => d.slug === districtSlug)) {
      setDistrictSlug("");
      setConstituencySlug("");
    }
  }, [districts, districtSlug, loadingDistricts]);

  // Constituencies for the selected district.
  useEffect(() => {
    setConstituencies([]);
    setConstituencyError(false);
    // Only for a district confirmed to belong to the chosen state (avoids a
    // doomed request for a stale/mismatched district carried in the URL).
    if (!stateSlug || !districtSlug || !districts.some((d) => d.slug === districtSlug)) return;
    let cancelled = false;
    setLoadingConstituencies(true);
    fetch(`/api/districts/${encodeURIComponent(districtSlug)}?state=${encodeURIComponent(stateSlug)}`)
      .then((res) => {
        if (!res.ok) throw new Error("constituencies");
        return res.json();
      })
      .then((data: { constituencies: { slug: string; name: string; number: number }[] }) => {
        if (cancelled) return;
        setConstituencies(data.constituencies.map((c) => ({ slug: c.slug, name: c.name, number: c.number })));
        setConstituencySlug((cur) => (cur && !data.constituencies.some((c) => c.slug === cur) ? "" : cur));
      })
      .catch(() => !cancelled && setConstituencyError(true))
      .finally(() => !cancelled && setLoadingConstituencies(false));
    return () => {
      cancelled = true;
    };
  }, [stateSlug, districtSlug, districts]);

  // Keep the URL in step with the selection (no new history entries).
  useEffect(() => {
    const q = new URLSearchParams();
    if (stateSlug) q.set("state", stateSlug);
    if (districtSlug) q.set("district", districtSlug);
    if (districtSlug && constituencySlug) q.set("constituency", constituencySlug);
    const next = q.toString() ? `/find-constituency?${q}` : "/find-constituency";
    if (next !== `${window.location.pathname}${window.location.search}`) router.replace(next, { scroll: false });
  }, [stateSlug, districtSlug, constituencySlug, router]);

  const electionSlug = states.find((s) => s.slug === stateSlug)?.electionSlug ?? null;
  const ready = Boolean(stateSlug && districtSlug && constituencySlug && electionSlug && constituencies.some((c) => c.slug === constituencySlug));
  const href = ready ? constituencyPath(stateSlug, electionSlug!, constituencySlug) : null;

  const selectBase =
    "h-[60px] w-full cursor-pointer appearance-none rounded-[13px] border border-[#dde3ea] bg-white pl-5 pr-12 text-[17px] font-medium shadow-[0_1px_2px_rgba(11,27,58,0.04)] transition-colors focus:border-[#1267e8] focus:outline-none focus:ring-2 focus:ring-[#1267e8]/20 disabled:cursor-not-allowed disabled:border-[#e6ebf1] disabled:bg-[#f5f7fa] disabled:text-[#a3adbb]";

  return (
    <section
      aria-labelledby="finder-card-title"
      className="rounded-[20px] border border-[#e0e8f2] bg-white px-4 py-6 shadow-[0_10px_30px_-18px_rgba(18,103,232,0.25)] sm:px-8 sm:py-8 lg:px-10"
    >
      <div className="flex items-center gap-4 sm:gap-5">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#eaf2ff] text-[#1267e8] sm:h-[62px] sm:w-[62px]" aria-hidden="true">
          <MapPin className="h-6 w-6 fill-[#1267e8] text-white" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <h2 id="finder-card-title" className={cn("font-display text-[22px] font-black leading-tight tracking-tight sm:text-[28px]", NAVY)}>
            {hi ? "विधानसभा क्षेत्र चुनें" : "Choose your constituency"}
          </h2>
          <p className="mt-1 text-sm text-[#5b6b82] sm:text-[16px]">
            {hi ? "नीचे दिए गए विकल्पों से अपना क्षेत्र चुनें।" : "Pick your area from the options below."}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:mt-7 md:grid-cols-3 md:gap-9">
        <Step n="01" label={hi ? "राज्य" : "State"} htmlFor="finder-state">
          <SelectBox loading={false}>
            <select
              id="finder-state"
              value={stateSlug}
              onChange={(e) => {
                setStateSlug(e.target.value);
                setDistrictSlug("");
                setConstituencySlug("");
              }}
              className={cn(selectBase, NAVY)}
            >
              <option value="">{hi ? "राज्य चुनें" : "Select state"}</option>
              {states.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {displayStateName(s.name, s.slug, locale)}
                </option>
              ))}
            </select>
          </SelectBox>
        </Step>

        <Step
          n="02"
          label={hi ? "जिला" : "District"}
          htmlFor="finder-district"
          error={districtError ? (hi ? "जिले लोड नहीं हो सके। कृपया राज्य फिर से चुनें।" : "Districts could not be loaded. Please re-select the state.") : null}
        >
          <SelectBox loading={loadingDistricts}>
            <select
              id="finder-district"
              value={districtSlug}
              disabled={!stateSlug || loadingDistricts || districtError}
              onChange={(e) => {
                setDistrictSlug(e.target.value);
                setConstituencySlug("");
              }}
              className={cn(selectBase, NAVY)}
            >
              <option value="">
                {!stateSlug
                  ? hi ? "पहले एक राज्य चुनें" : "Select a state first"
                  : loadingDistricts
                    ? hi ? "जिले लोड हो रहे हैं…" : "Loading districts…"
                    : hi ? "जिला चुनें" : "Select district"}
              </option>
              {districts.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {getDistrictDisplayName(d.slug, d.name, locale)}
                </option>
              ))}
            </select>
          </SelectBox>
        </Step>

        <Step
          n="03"
          label={hi ? "विधानसभा क्षेत्र" : "Constituency"}
          htmlFor="finder-constituency"
          error={constituencyError ? (hi ? "विधानसभा क्षेत्र लोड नहीं हो सके। कृपया जिला फिर से चुनें।" : "Constituencies could not be loaded. Please re-select the district.") : null}
        >
          <SelectBox loading={loadingConstituencies}>
            <select
              id="finder-constituency"
              value={constituencySlug}
              disabled={!districtSlug || loadingConstituencies || constituencyError}
              onChange={(e) => setConstituencySlug(e.target.value)}
              className={cn(selectBase, NAVY)}
            >
              <option value="">
                {!districtSlug
                  ? hi ? "पहले एक जिला चुनें" : "Select a district first"
                  : loadingConstituencies
                    ? hi ? "विधानसभा क्षेत्र लोड हो रहे हैं…" : "Loading constituencies…"
                    : hi ? "विधानसभा क्षेत्र चुनें" : "Select constituency"}
              </option>
              {constituencies.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {getConstituencyDisplayName(c.slug, c.name, locale)}
                  {c.number ? ` (${c.number})` : ""}
                </option>
              ))}
            </select>
          </SelectBox>
        </Step>
      </div>

      {href ? (
        <Link
          href={href}
          className="mt-7 flex h-[60px] w-full items-center justify-center gap-2.5 rounded-[13px] bg-[#ff7a2f] text-lg font-bold text-white shadow-[0_8px_18px_-10px_rgba(255,122,47,0.8)] transition-colors hover:bg-[#f26a1b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a2f]/50 focus-visible:ring-offset-2 sm:mt-8"
        >
          {hi ? "क्षेत्र खोलें" : "Open constituency"}
          <ArrowRight size={20} aria-hidden="true" />
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className="mt-7 flex h-[60px] w-full cursor-not-allowed items-center justify-center gap-2.5 rounded-[13px] bg-[#ffab7d] text-lg font-bold text-white sm:mt-8"
        >
          {hi ? "क्षेत्र खोलें" : "Open constituency"}
          <ArrowRight size={20} aria-hidden="true" />
        </button>
      )}

      <p className="mt-5 flex items-start justify-center gap-2 text-center text-sm text-[#5b6b82] sm:items-center sm:text-[15px]">
        <Info size={18} className="mt-0.5 shrink-0 text-[#1267e8] sm:mt-0" aria-hidden="true" />
        {hi ? "आप सीधे अपने विधानसभा क्षेत्र का सर्वेक्षण और परिणाम देख सकते हैं।" : "You can go straight to your constituency's survey and results."}
      </p>
    </section>
  );
}

function Step({
  n,
  label,
  htmlFor,
  error,
  children,
}: {
  n: string;
  label: string;
  htmlFor: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={htmlFor} className="mb-3 flex items-center gap-3.5">
        <span className="flex h-9 min-w-[46px] items-center justify-center rounded-full bg-[#eaf2ff] px-3 text-base font-bold text-[#1267e8]" aria-hidden="true">
          {n}
        </span>
        <span className={cn("text-[17px] font-bold", NAVY)}>{label}</span>
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

function SelectBox({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      {loading ? (
        <Loader2 size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-[#1267e8]" aria-hidden="true" />
      ) : (
        <ChevronDown size={20} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#0b1b3a] [select:disabled~&]:text-[#b4bdc9]" aria-hidden="true" />
      )}
    </div>
  );
}
