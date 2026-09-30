"use client";

import { motion } from "framer-motion";
import { ArrowRight, Building2, ChevronDown, MapPin, Search, Users } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { displayStateName } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { getDistrictDisplayName, UP_DISTRICT_HINDI_NAMES } from "@/lib/district-hindi";
import { getConstituencyDisplayName } from "@/lib/constituency-hindi";
import { matchesCrossLanguage, getSearchTerms as getSearchTermsNormalized } from "@/lib/search-normalization";

export interface SurveyEntryState {
  id: string;
  slug: string;
  name: string;
  elections: Array<{ slug: string; id: string }>;
  _count?: { districts: number };
}

interface DistrictItem {
  id: string;
  slug: string;
  name: string;
  constituencyCount: number;
}

interface ConstituencyItem {
  id: string;
  slug: string;
  number: number;
  name: string;
}

export interface SurveyEntryHeading {
  text: string;
  fontSize: { desktop: number; tablet: number; mobile: number };
  fontWeight: number;
  color: string;
  lineHeight: number;
  letterSpacing: number;
  textAlign: "left" | "center" | "right";
  visible: boolean;
}

interface SurveyEntryCardProps {
  states: SurveyEntryState[];
  heading?: SurveyEntryHeading;
  initialDistricts?: DistrictItem[];
}

export function FieldSelect<T extends { id: string }>({
  label,
  placeholder,
  value,
  items,
  disabled,
  getLabel,
  getSearchTerms,
  matchesSearch,
  onSelect,
  icon,
  iconClass,
  errorMessage,
  onRetry,
}: {
  label: string;
  placeholder: string;
  value: T | null;
  items: T[];
  disabled?: boolean;
  getLabel: (item: T) => string;
  getSearchTerms?: (item: T) => string[];
  matchesSearch?: (item: T, query: string) => boolean;
  onSelect: (item: T) => void;
  icon: ReactNode;
  iconClass: string;
  /** Set when the options failed to load — shown instead of "no options". */
  errorMessage?: string;
  onRetry?: () => void;
}) {
  const { t, locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const noOptionsLabel = t.heroSurvey.noOptions;
  const closeOptionsLabel = t.heroSurvey.closeOptions;
  const searchPlaceholder = t.heroSurvey.searchPlaceholder || (locale === "hi" ? "खोजें..." : "Search...");

  // Autofocus search input when dropdown opens
  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => searchInputRef.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, [open]);

  // Items change when the parent field above this one is reselected
  useEffect(() => {
    setQuery("");
    setHighlightedIndex(-1);
  }, [items]);

  // Case-insensitive substring matching against label and cross-language search terms
  const normalizedQuery = query.trim().toLowerCase();
  const filteredItems = normalizedQuery
    ? items.filter((item) => {
        if (matchesSearch && matchesSearch(item, normalizedQuery)) return true;
        const label = getLabel(item).toLowerCase();
        if (label.includes(normalizedQuery)) return true;
        if (getSearchTerms) {
          const terms = getSearchTerms(item);
          if (terms.some((term) => term.toLowerCase().includes(normalizedQuery))) return true;
        }
        // Fallback cross-language query expansion
        const queryTerms = getSearchTermsNormalized(normalizedQuery);
        for (const qt of queryTerms) {
          if (label.includes(qt)) return true;
          if (getSearchTerms) {
            const terms = getSearchTerms(item);
            if (terms.some((t) => t.toLowerCase().includes(qt))) return true;
          }
        }
        return false;
      })
    : items;

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [query]);

  function closeDropdown() {
    setOpen(false);
    setQuery("");
    setHighlightedIndex(-1);
  }

  function selectItem(item: T) {
    onSelect(item);
    closeDropdown();
  }

  // Escape/Arrow keys/Enter — shared by the desktop trigger button (where
  // typed characters also drive the type-ahead buffer below) and the
  // mobile search input (where typed characters are handled natively via
  // onChange instead). Returns true once it has handled the key.
  function handleNavKeys(e: React.KeyboardEvent): boolean {
    if (disabled) return false;
    if (e.key === "Escape") {
      closeDropdown();
      return true;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlightedIndex((i) => Math.min(filteredItems.length - 1, i + 1));
      return true;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      setHighlightedIndex((i) => Math.max(0, i - 1));
      return true;
    }
    if (e.key === "Enter") {
      if (!open) return false;
      e.preventDefault();
      const item = filteredItems[highlightedIndex >= 0 ? highlightedIndex : 0];
      if (item) selectItem(item);
      return true;
    }
    return false;
  }

  function handleTriggerKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (handleNavKeys(e) || disabled) return;
    if (e.key === "Backspace") {
      setQuery((prev) => prev.slice(0, -1));
      return;
    }
    if (e.key.length === 1 && /[a-zA-Z0-9ऀ-ॿ]/.test(e.key)) {
      e.preventDefault();
      setOpen(true);
      setQuery((prev) => prev + e.key);
    }
  }

  return (
    <div className="relative w-full lg:w-auto">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleTriggerKeyDown}
        aria-label={label}
        className="flex h-11 w-full items-center justify-between gap-2 whitespace-nowrap rounded-xl border border-slate-200/90 bg-white px-3.5 text-sm font-semibold text-slate-800 shadow-xs transition-all hover:border-slate-300 hover:shadow-sm disabled:cursor-not-allowed disabled:border-slate-100 disabled:text-slate-400 sm:text-base lg:h-12 lg:w-auto lg:min-w-[11.5rem]"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${disabled ? "bg-slate-100 text-slate-400" : iconClass}`}>
            {icon}
          </span>
          <span className="truncate text-left max-w-[200px] sm:max-w-none">{value ? getLabel(value) : placeholder}</span>
        </div>
        <ChevronDown size={15} className={`shrink-0 transition-transform ${disabled ? "text-slate-300" : "text-slate-500"} ${open ? "rotate-180" : ""}`} />
      </button>
      {open && !disabled && (
        <>
          <button
            type="button"
            aria-label={closeOptionsLabel}
            className="fixed inset-0 z-30 cursor-default"
            onClick={closeDropdown}
          />
          {/* Opens DOWNWARD (top-full) by default — mobile, where this card
              now sits high up the page (overlapping the hero poster), so an
              upward-opening (bottom-full) panel used to render underneath
              the sticky site header (SiteHeader.tsx is z-40) and either got
              visually hidden there or swallowed the tap before it reached
              an option. sm: restores the original upward-opening desktop/
              tablet behavior unchanged, where the card sits near the
              bottom of the hero banner and opening upward avoids the
              viewport's bottom edge instead. z-50 keeps the panel above
              that same sticky header (z-40) in either direction. */}
          <div className="absolute left-0 right-0 top-full z-50 mt-2 min-w-[13rem] sm:min-w-[15rem] overflow-hidden rounded-xl border border-[#101A3A]/15 bg-white shadow-xl sm:bottom-full sm:top-auto sm:mb-2 sm:mt-0">
            <div className="border-b border-[#101A3A]/10 p-2 sticky top-0 bg-white z-10">
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  inputMode="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleNavKeys}
                  placeholder={searchPlaceholder}
                  aria-label={label}
                  className="h-9 w-full rounded-lg border border-[#101A3A]/15 bg-white pl-8 pr-3 text-xs sm:text-sm text-[#101A3A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#101A3A]/20"
                />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {errorMessage && items.length === 0 ? (
                <div role="alert" className="px-4 py-3">
                  <p className="text-sm font-medium text-red-700">{errorMessage}</p>
                  {onRetry && (
                    <button
                      type="button"
                      onClick={() => {
                        closeDropdown();
                        onRetry();
                      }}
                      className="mt-2 text-sm font-bold text-[#101A3A] underline underline-offset-2"
                    >
                      {t.common.retry}
                    </button>
                  )}
                </div>
              ) : (
                filteredItems.length === 0 && <p className="px-4 py-3 text-sm text-[#101A3A]/60">{noOptionsLabel}</p>
              )}
              {filteredItems.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onClick={() => selectItem(item)}
                  className={`block w-full border-b border-[#101A3A]/10 px-4 py-2.5 text-left text-sm font-medium text-[#101A3A] last:border-b-0 hover:bg-[#101A3A]/5 ${
                    highlightedIndex === idx ? "bg-[#101A3A]/5" : ""
                  }`}
                >
                  {getLabel(item)}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const EMPTY_DISTRICTS: DistrictItem[] = [];

export function SurveyEntryCard({ states, heading, initialDistricts }: SurveyEntryCardProps) {
  const preloadedDistricts = initialDistricts ?? EMPTY_DISTRICTS;
  const router = useRouter();
  const { locale, t } = useLocale();

  // Defaults to Uttar Pradesh for the initial UP-focused launch promotion
  // (explicit product decision — not "whichever state sorts first", which
  // is exactly what the previous no-default behavior was guarding
  // against). Looked up by slug rather than assumed to be states[0], so it
  // never silently locks onto the wrong entry if UP isn't present (falls
  // back to unselected) or isn't first in whatever order the caller
  // passes. The visitor can still change it via the selector below like
  // any other field, and district/constituency stay unselected until they
  // choose one — only the state itself is preselected.
  const initialState = states.find((s) => s.slug === "uttar-pradesh") ?? null;
  const [selectedState, setSelectedState] = useState<SurveyEntryState | null>(() => initialState);
  // UP is the default launch state. Hydrate its district list with the same
  // server-rendered data used to build the homepage so the first interaction
  // does not wait for a client-side DB round trip.
  const [districts, setDistricts] = useState<DistrictItem[]>(() =>
    initialState?.slug === "uttar-pradesh" ? preloadedDistricts : []
  );
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictItem | null>(null);
  const [constituencies, setConstituencies] = useState<ConstituencyItem[]>([]);
  const [selectedConstituency, setSelectedConstituency] = useState<ConstituencyItem | null>(null);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingConstituencies, setLoadingConstituencies] = useState(false);
  const [districtsError, setDistrictsError] = useState(false);
  const [constituenciesError, setConstituenciesError] = useState(false);
  const [districtsReload, setDistrictsReload] = useState(0);
  const [constituenciesReload, setConstituenciesReload] = useState(0);
  const [startingSurvey, setStartingSurvey] = useState(false);

  useEffect(() => {
    setSelectedDistrict(null);
    setConstituencies([]);
    setSelectedConstituency(null);
    setDistrictsError(false);
    if (!selectedState) {
      setDistricts([]);
      setLoadingDistricts(false);
      return;
    }

    // Avoid a duplicate request for the default UP state: its districts were
    // already rendered into the homepage payload.
    if (selectedState.slug === "uttar-pradesh" && preloadedDistricts.length > 0) {
      setDistricts(preloadedDistricts);
      setLoadingDistricts(false);
      return;
    }

    // A failed request is an error state, never an empty list: "no districts"
    // and "could not load districts" must look different to the visitor.
    let cancelled = false;
    setDistricts([]);
    setLoadingDistricts(true);
    fetch(`/api/districts?state=${selectedState.slug}`)
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok || !Array.isArray(data)) {
          throw new Error(`districts request failed: HTTP ${res.status} ${data?.code ?? ""}`.trim());
        }
        return data as DistrictItem[];
      })
      .then((data) => {
        if (!cancelled) setDistricts(data);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("[survey-selector] district list failed to load:", error);
        setDistrictsError(true);
      })
      .finally(() => {
        if (!cancelled) setLoadingDistricts(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedState, preloadedDistricts, districtsReload]);

  useEffect(() => {
    setSelectedConstituency(null);
    setConstituencies([]);
    setConstituenciesError(false);
    if (!selectedState || !selectedDistrict) {
      setLoadingConstituencies(false);
      return;
    }
    let cancelled = false;
    setLoadingConstituencies(true);
    fetch(`/api/districts/${selectedDistrict.slug}?state=${selectedState.slug}`)
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok || !Array.isArray(data?.constituencies)) {
          throw new Error(`constituencies request failed: HTTP ${res.status} ${data?.code ?? ""}`.trim());
        }
        return data.constituencies as ConstituencyItem[];
      })
      .then((data) => {
        if (!cancelled) setConstituencies(data);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("[survey-selector] constituency list failed to load:", error);
        setConstituenciesError(true);
      })
      .finally(() => {
        if (!cancelled) setLoadingConstituencies(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedState, selectedDistrict, constituenciesReload]);

  const canSubmit = Boolean(selectedState && selectedConstituency);

  const getSurveyHref = () => {
    if (!selectedState || !selectedConstituency) return null;
    const election = selectedState.elections[0];
    if (!election) return null;
    return `/${selectedState.slug}/elections/${election.slug}/constituencies/${selectedConstituency.slug}/survey`;
  };

  // Prefetch the survey route as soon as a constituency is selected. The
  // survey page performs several server-side database reads, so prefetching
  // removes that wait from the user's click on "Participate in Survey".
  useEffect(() => {
    const href = getSurveyHref();
    if (href) router.prefetch(href);
  }, [selectedState, selectedConstituency, router]);

  const handleSurveyStart = () => {
    const href = getSurveyHref();
    if (!href || startingSurvey) return;
    setStartingSurvey(true);
    // A full navigation is intentionally used for this final transition:
    // the destination is server-rendered and may need several DB reads.
    // This avoids a slow/uncertain client-router transition after the visitor
    // has already made the three selections.
    window.location.assign(href);
  };

  return (
    <motion.div
      data-hero-card
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      className="z-20 flex flex-col items-center gap-2"
    >
      {(!heading || heading.visible) && (
        <div className="rounded-full border border-[#101A3A]/10 bg-white px-4 py-2 shadow-[0_1px_2px_rgba(16,26,58,0.06),0_6px_16px_-6px_rgba(16,26,58,0.18)] sm:px-5 sm:py-2.5">
          <p
            data-hero-text="surveyHeading"
            className="text-center text-xs font-bold text-[#101A3A] sm:text-sm lg:text-base"
            style={{
              fontWeight: heading?.fontWeight,
              lineHeight: heading?.lineHeight,
              letterSpacing: heading?.letterSpacing,
            }}
          >
            {t.heroSurvey.heading}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2 lg:gap-2.5">
        <FieldSelect
          label={t.heroSurvey.selectState}
          placeholder={t.heroSurvey.selectState}
          value={selectedState}
          items={states}
          getLabel={(s) => displayStateName(s.name, s.slug, locale)}
          getSearchTerms={(s) => [
            s.name,
            s.slug,
            displayStateName(s.name, s.slug, "hi"),
            displayStateName(s.name, s.slug, "en"),
            "uttar pradesh",
            "up",
            "उत्तर प्रदेश",
            "यूपी",
          ]}
          matchesSearch={(s, q) =>
            matchesCrossLanguage(
              {
                name: s.name,
                slug: s.slug,
                nameHi: displayStateName(s.name, s.slug, "hi"),
                nameEn: displayStateName(s.name, s.slug, "en"),
              },
              q
            )
          }
          onSelect={setSelectedState}
          icon={<MapPin size={13} strokeWidth={2.5} />}
          iconClass="bg-blue-100 text-blue-700"
        />
        <FieldSelect
          label={t.heroSurvey.selectDistrict}
          placeholder={loadingDistricts ? t.common.loading : districtsError ? t.heroSurvey.loadFailedShort : t.heroSurvey.selectDistrict}
          value={selectedDistrict}
          items={districts}
          disabled={!selectedState || loadingDistricts}
          getLabel={(d) => getDistrictDisplayName(d.slug, d.name, locale)}
          getSearchTerms={(d) => [
            d.name,
            d.slug,
            d.slug.replace(/-/g, " "),
            UP_DISTRICT_HINDI_NAMES[d.slug] ?? "",
            getDistrictDisplayName(d.slug, d.name, "hi"),
            getDistrictDisplayName(d.slug, d.name, "en"),
          ]}
          matchesSearch={(d, q) =>
            matchesCrossLanguage(
              {
                name: d.name,
                slug: d.slug,
                nameHi: UP_DISTRICT_HINDI_NAMES[d.slug] ?? getDistrictDisplayName(d.slug, d.name, "hi"),
                nameEn: d.name,
              },
              q
            )
          }
          onSelect={setSelectedDistrict}
          errorMessage={districtsError ? t.heroSurvey.districtsLoadFailed : undefined}
          onRetry={() => setDistrictsReload((n) => n + 1)}
          icon={<Building2 size={13} strokeWidth={2.5} />}
          iconClass="bg-emerald-100 text-emerald-700"
        />
        <FieldSelect
          label={t.heroSurvey.selectConstituency}
          placeholder={loadingConstituencies ? t.common.loading : constituenciesError ? t.heroSurvey.loadFailedShort : t.heroSurvey.selectConstituency}
          value={selectedConstituency}
          items={constituencies}
          disabled={!selectedDistrict || loadingConstituencies}
          getLabel={(c) => `${c.number}. ${getConstituencyDisplayName(c.slug, c.name, locale)}`}
          getSearchTerms={(c) => [
            c.name,
            c.slug,
            c.slug.replace(/-/g, " "),
            String(c.number),
            `${c.number}. ${c.name}`,
            `${c.number} ${c.name}`,
            getConstituencyDisplayName(c.slug, c.name, "hi"),
            `${c.number}. ${getConstituencyDisplayName(c.slug, c.name, "hi")}`,
            `${c.number} ${getConstituencyDisplayName(c.slug, c.name, "hi")}`,
          ]}
          matchesSearch={(c, q) =>
            matchesCrossLanguage(
              {
                name: c.name,
                slug: c.slug,
                number: c.number,
                nameHi: getConstituencyDisplayName(c.slug, c.name, "hi"),
                nameEn: c.name,
              },
              q
            )
          }
          onSelect={setSelectedConstituency}
          errorMessage={constituenciesError ? t.heroSurvey.constituenciesLoadFailed : undefined}
          onRetry={() => setConstituenciesReload((n) => n + 1)}
          icon={<Users size={13} strokeWidth={2.5} />}
          iconClass="bg-rose-100 text-rose-700"
        />

        <motion.button
          whileHover={canSubmit ? { scale: 1.02 } : undefined}
          whileTap={canSubmit ? { scale: 0.98 } : undefined}
          onClick={handleSurveyStart}
          disabled={!canSubmit || startingSurvey}
          className="flex h-11 min-w-[9rem] shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-orange-600 px-5 text-xs font-bold text-white shadow-[0_8px_20px_-6px_rgba(234,88,12,0.5)] transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none sm:text-sm lg:h-12 lg:gap-2 lg:px-7"
        >
          {startingSurvey ? t.common.loading : t.heroSurvey.participate} <ArrowRight size={14} className="sm:h-4 sm:w-4 lg:h-[17px] lg:w-[17px]" />
        </motion.button>
      </div>
    </motion.div>
  );
}
