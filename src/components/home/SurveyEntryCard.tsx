"use client";

import { motion } from "framer-motion";
import { ArrowRight, Building2, ChevronDown, MapPin, Users } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { displayStateName } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/LocaleProvider";

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
}

function FieldSelect<T extends { id: string }>({
  label,
  placeholder,
  value,
  items,
  disabled,
  getLabel,
  getSearchTerms,
  onSelect,
  icon,
  iconClass,
}: {
  label: string;
  placeholder: string;
  value: T | null;
  items: T[];
  disabled?: boolean;
  getLabel: (item: T) => string;
  getSearchTerms?: (item: T) => string[];
  onSelect: (item: T) => void;
  icon: ReactNode;
  iconClass: string;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isMobile, setIsMobile] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const noOptionsLabel = t.heroSurvey.noOptions;
  const closeOptionsLabel = t.heroSurvey.closeOptions;
  const searchPlaceholder = t.heroSurvey.searchPlaceholder;

  // Below `sm:` (640px, this codebase's own mobile/tablet cutoff — see
  // Hero.tsx) the dropdown gets a real, visible search <input> instead of
  // relying on the desktop trigger-button's invisible keydown-buffer typing
  // below, since a <button> never opens the on-screen keyboard and mobile
  // browsers don't fire physical keydown events without one. Desktop's
  // existing click-then-type flow is untouched.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639.98px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Items change when the parent field above this one is reselected (e.g. a
  // new state reloads the district list) — clear any leftover filter so it
  // doesn't silently hide the freshly-loaded list.
  useEffect(() => {
    setQuery("");
    setHighlightedIndex(-1);
  }, [items]);

  // Case-insensitive substring matching against label and any extra search
  // terms (English/Hindi aliases, district slugs, constituency numbers)
  const normalizedQuery = query.trim().toLowerCase();
  const filteredItems = normalizedQuery
    ? items.filter((item) => {
        const label = getLabel(item).toLowerCase();
        if (label.includes(normalizedQuery)) return true;
        if (getSearchTerms) {
          const terms = getSearchTerms(item);
          return terms.some((term) => term.toLowerCase().includes(normalizedQuery));
        }
        return false;
      })
    : items;

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [query]);

  // Autofocus the mobile search input once the dropdown (and the input
  // inside it) has actually mounted, so the on-screen keyboard opens
  // immediately without a second tap. requestAnimationFrame waits one
  // paint past the `open` flip so the ref is guaranteed to be attached
  // first — this only ever runs once per open/close (deps are booleans),
  // so it can't loop or repeatedly steal focus back from the user.
  useEffect(() => {
    if (!open || !isMobile) return;
    const raf = requestAnimationFrame(() => searchInputRef.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, [open, isMobile]);

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
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleTriggerKeyDown}
        aria-label={label}
        className="flex h-11 w-full min-w-[9.5rem] items-center justify-center gap-2 whitespace-nowrap rounded-full border border-[#101A3A]/12 bg-white px-3.5 text-center text-sm font-semibold text-[#101A3A] shadow-[0_1px_2px_rgba(16,26,58,0.06),0_6px_16px_-6px_rgba(16,26,58,0.18)] transition-all hover:border-[#101A3A]/20 hover:shadow-[0_1px_2px_rgba(16,26,58,0.08),0_10px_20px_-6px_rgba(16,26,58,0.22)] disabled:cursor-not-allowed disabled:border-[#101A3A]/8 disabled:text-[#101A3A]/40 disabled:shadow-[0_1px_2px_rgba(16,26,58,0.04)] disabled:hover:border-[#101A3A]/8 sm:min-w-[11rem] sm:text-base lg:h-12 lg:min-w-[12.5rem] lg:px-4"
      >
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${disabled ? "bg-[#101A3A]/5 text-[#101A3A]/30" : iconClass}`}>
          {icon}
        </span>
        <span className="max-w-[7.5rem] truncate text-left sm:max-w-[9rem] lg:max-w-[10rem]">{value ? getLabel(value) : placeholder}</span>
        <ChevronDown size={14} className={`h-3.5 w-3.5 shrink-0 transition-transform sm:h-4 sm:w-4 ${disabled ? "text-[#101A3A]/30" : "text-[#101A3A]/50"} ${open ? "rotate-180" : ""}`} />
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
          <div className="absolute left-0 right-0 top-full z-50 mt-2 min-w-[13rem] overflow-hidden rounded-xl border border-[#101A3A]/15 bg-white shadow-xl sm:bottom-full sm:top-auto sm:mb-2 sm:mt-0">
            {isMobile && (
              <div className="border-b border-[#101A3A]/10 p-2">
                <input
                  ref={searchInputRef}
                  type="text"
                  inputMode="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleNavKeys}
                  placeholder={searchPlaceholder}
                  aria-label={label}
                  className="h-9 w-full rounded-lg border border-[#101A3A]/15 bg-white px-3 text-sm text-[#101A3A] focus:outline-none focus:ring-2 focus:ring-[#101A3A]/20"
                />
              </div>
            )}
            <div className="max-h-64 overflow-y-auto">
              {filteredItems.length === 0 && <p className="px-4 py-3 text-sm text-[#101A3A]/60">{noOptionsLabel}</p>}
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

export function SurveyEntryCard({ states, heading }: SurveyEntryCardProps) {
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
  const [selectedState, setSelectedState] = useState<SurveyEntryState | null>(
    () => states.find((s) => s.slug === "uttar-pradesh") ?? null
  );
  const [districts, setDistricts] = useState<DistrictItem[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictItem | null>(null);
  const [constituencies, setConstituencies] = useState<ConstituencyItem[]>([]);
  const [selectedConstituency, setSelectedConstituency] = useState<ConstituencyItem | null>(null);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingConstituencies, setLoadingConstituencies] = useState(false);

  useEffect(() => {
    setSelectedDistrict(null);
    setConstituencies([]);
    setSelectedConstituency(null);
    setDistricts([]);
    if (!selectedState) return;
    setLoadingDistricts(true);
    fetch(`/api/districts?state=${selectedState.slug}`)
      .then((r) => r.json())
      .then((data) => setDistricts(Array.isArray(data) ? data : []))
      .finally(() => setLoadingDistricts(false));
  }, [selectedState]);

  useEffect(() => {
    setSelectedConstituency(null);
    setConstituencies([]);
    if (!selectedState || !selectedDistrict) return;
    setLoadingConstituencies(true);
    fetch(`/api/districts/${selectedDistrict.slug}?state=${selectedState.slug}`)
      .then((r) => r.json())
      .then((data) => setConstituencies(Array.isArray(data?.constituencies) ? data.constituencies : []))
      .finally(() => setLoadingConstituencies(false));
  }, [selectedState, selectedDistrict]);

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
    if (href) router.push(href);
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
          onSelect={setSelectedState}
          icon={<MapPin size={13} strokeWidth={2.5} />}
          iconClass="bg-blue-100 text-blue-700"
        />
        <FieldSelect
          label={t.heroSurvey.selectDistrict}
          placeholder={loadingDistricts ? t.common.loading : t.heroSurvey.selectDistrict}
          value={selectedDistrict}
          items={districts}
          disabled={!selectedState || loadingDistricts}
          getLabel={(d) => d.name}
          getSearchTerms={(d) => [d.name, d.slug]}
          onSelect={setSelectedDistrict}
          icon={<Building2 size={13} strokeWidth={2.5} />}
          iconClass="bg-emerald-100 text-emerald-700"
        />
        <FieldSelect
          label={t.heroSurvey.selectConstituency}
          placeholder={loadingConstituencies ? t.common.loading : t.heroSurvey.selectConstituency}
          value={selectedConstituency}
          items={constituencies}
          disabled={!selectedDistrict || loadingConstituencies}
          getLabel={(c) => `${c.number}. ${c.name}`}
          getSearchTerms={(c) => [
            c.name,
            c.slug,
            String(c.number),
            `${c.number}. ${c.name}`,
            `${c.number} ${c.name}`,
          ]}
          onSelect={setSelectedConstituency}
          icon={<Users size={13} strokeWidth={2.5} />}
          iconClass="bg-rose-100 text-rose-700"
        />

        <motion.button
          whileHover={canSubmit ? { scale: 1.02 } : undefined}
          whileTap={canSubmit ? { scale: 0.98 } : undefined}
          onClick={handleSurveyStart}
          disabled={!canSubmit}
          className="flex h-11 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-orange-600 px-5 text-xs font-bold text-white shadow-[0_8px_20px_-6px_rgba(234,88,12,0.5)] transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none sm:text-sm lg:h-12 lg:gap-2 lg:px-7"
        >
          {t.heroSurvey.participate} <ArrowRight size={14} className="sm:h-4 sm:w-4 lg:h-[17px] lg:w-[17px]" />
        </motion.button>
      </div>
    </motion.div>
  );
}
