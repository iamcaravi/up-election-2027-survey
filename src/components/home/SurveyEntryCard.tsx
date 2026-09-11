"use client";

import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
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
  onSelect,
}: {
  label: string;
  placeholder: string;
  value: T | null;
  items: T[];
  disabled?: boolean;
  getLabel: (item: T) => string;
  onSelect: (item: T) => void;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const queryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noOptionsLabel = t.heroSurvey.noOptions;
  const closeOptionsLabel = t.heroSurvey.closeOptions;

  // Items change when the parent field above this one is reselected (e.g. a
  // new state reloads the district list) — clear any leftover filter so it
  // doesn't silently hide the freshly-loaded list.
  useEffect(() => {
    setQuery("");
  }, [items]);

  // Type-to-filter: typing while the control is focused narrows the list to
  // items whose label starts with what's been typed so far (e.g. "g" then
  // "go" then "gon"), like a native <select>'s typeahead but filtering the
  // visible list instead of just jumping to the first match. The buffer
  // resets after a short pause so a later, unrelated keypress starts fresh.
  function queueQueryReset() {
    if (queryTimeoutRef.current) clearTimeout(queryTimeoutRef.current);
    queryTimeoutRef.current = setTimeout(() => setQuery(""), 1200);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
      return;
    }
    if (e.key === "Backspace") {
      setQuery((prev) => prev.slice(0, -1));
      queueQueryReset();
      return;
    }
    if (e.key.length === 1 && /[a-zA-Z0-9ऀ-ॿ]/.test(e.key)) {
      e.preventDefault();
      setOpen(true);
      setQuery((prev) => prev + e.key);
      queueQueryReset();
    }
  }

  const filteredItems = query.trim()
    ? items.filter((item) => getLabel(item).toLowerCase().startsWith(query.trim().toLowerCase()))
    : items;

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        aria-label={label}
        className="flex h-10 w-full min-w-[9rem] items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-[#101A3A]/15 bg-white px-4 text-center text-sm font-semibold text-[#101A3A] shadow-md transition-colors hover:border-[#101A3A]/25 hover:bg-[#F3F4F7] disabled:cursor-not-allowed sm:min-w-[10.5rem] sm:text-base lg:h-12 lg:min-w-[12rem] lg:gap-2 lg:px-5"
      >
        <span className="max-w-[9rem] truncate sm:max-w-[10.5rem] lg:max-w-[12rem]">{value ? getLabel(value) : placeholder}</span>
        <ChevronDown size={14} className={`h-3.5 w-3.5 shrink-0 text-[#101A3A]/70 transition-transform sm:h-4 sm:w-4 lg:h-[17px] lg:w-[17px] ${open ? "rotate-180" : ""}`} />
      </button>
      {open && !disabled && (
        <>
          <button
            type="button"
            aria-label={closeOptionsLabel}
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => {
              setOpen(false);
              setQuery("");
            }}
          />
          <div className="absolute bottom-full left-0 right-0 z-20 mb-2 max-h-64 min-w-[13rem] overflow-y-auto rounded-xl border border-[#101A3A]/15 bg-white shadow-xl">
            {filteredItems.length === 0 && <p className="px-4 py-3 text-sm text-[#101A3A]/60">{noOptionsLabel}</p>}
            {filteredItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelect(item);
                  setOpen(false);
                  setQuery("");
                }}
                className="block w-full border-b border-[#101A3A]/10 px-4 py-2.5 text-left text-sm font-medium text-[#101A3A] last:border-b-0 hover:bg-[#101A3A]/5"
              >
                {getLabel(item)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function SurveyEntryCard({ states, heading }: SurveyEntryCardProps) {
  const router = useRouter();
  const { locale, t } = useLocale();

  const [selectedState, setSelectedState] = useState<SurveyEntryState | null>(states[0] ?? null);
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

  const handleSurveyStart = () => {
    if (!selectedState || !selectedConstituency) return;
    const election = selectedState.elections[0];
    if (!election) return;
    router.push(
      `/${selectedState.slug}/elections/${election.slug}/constituencies/${selectedConstituency.slug}/survey`
    );
  };

  return (
    <motion.div
      data-hero-card
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      className="z-20 flex flex-col items-center gap-2"
    >
      {(!heading || heading.visible) && (
        <div className="rounded-2xl bg-white px-4 py-2 shadow-md sm:px-5 sm:py-2.5">
          <p
            data-hero-text="surveyHeading"
            className="text-center text-[10px] font-bold text-[#101A3A] sm:text-xs lg:text-sm"
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
          onSelect={setSelectedState}
        />
        <FieldSelect
          label={t.heroSurvey.selectDistrict}
          placeholder={loadingDistricts ? t.common.loading : t.heroSurvey.selectDistrict}
          value={selectedDistrict}
          items={districts}
          disabled={!selectedState || loadingDistricts}
          getLabel={(d) => d.name}
          onSelect={setSelectedDistrict}
        />
        <FieldSelect
          label={t.heroSurvey.selectConstituency}
          placeholder={loadingConstituencies ? t.common.loading : t.heroSurvey.selectConstituency}
          value={selectedConstituency}
          items={constituencies}
          disabled={!selectedDistrict || loadingConstituencies}
          getLabel={(c) => `${c.number}. ${c.name}`}
          onSelect={setSelectedConstituency}
        />

        <motion.button
          whileHover={canSubmit ? { scale: 1.02 } : undefined}
          whileTap={canSubmit ? { scale: 0.98 } : undefined}
          onClick={handleSurveyStart}
          disabled={!canSubmit}
          className="flex h-10 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-orange-600 px-5 text-xs font-bold text-white shadow-lg transition-colors hover:bg-orange-700 disabled:cursor-not-allowed sm:text-sm lg:h-12 lg:gap-2 lg:px-7"
        >
          {t.heroSurvey.participate} <ArrowRight size={14} className="sm:h-4 sm:w-4 lg:h-[17px] lg:w-[17px]" />
        </motion.button>
      </div>
    </motion.div>
  );
}
