"use client";

import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
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
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-full items-center gap-1.5 whitespace-nowrap rounded-full border border-[#101A3A]/15 bg-white px-4 text-left text-xs font-semibold text-[#101A3A] shadow-md transition-colors hover:bg-[#101A3A]/5 disabled:cursor-not-allowed sm:text-sm lg:h-12 lg:gap-2 lg:px-5"
      >
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#101A3A]/60 sm:text-[11px] lg:text-xs">{label}</span>
        <span className="max-w-[9rem] truncate sm:max-w-[10.5rem] lg:max-w-[12rem]">{value ? getLabel(value) : placeholder}</span>
        <ChevronDown size={14} className={`h-3.5 w-3.5 shrink-0 text-[#101A3A]/70 transition-transform sm:h-4 sm:w-4 lg:h-[17px] lg:w-[17px] ${open ? "rotate-180" : ""}`} />
      </button>
      {open && !disabled && (
        <>
          <button
            type="button"
            aria-label="विकल्प सूची बंद करें"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute bottom-full left-0 right-0 z-20 mb-2 max-h-64 min-w-[13rem] overflow-y-auto rounded-xl border border-[#101A3A]/15 bg-white shadow-xl">
            {items.length === 0 && <p className="px-4 py-3 text-sm text-[#101A3A]/60">कोई विकल्प उपलब्ध नहीं</p>}
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelect(item);
                  setOpen(false);
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
  const { locale } = useLocale();

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
            className="text-center text-xs font-bold text-[#101A3A] sm:text-sm lg:text-base"
            style={{
              fontWeight: heading?.fontWeight,
              lineHeight: heading?.lineHeight,
              letterSpacing: heading?.letterSpacing,
            }}
          >
            अपना विधानसभा क्षेत्र चुनें और सर्वे में भाग लें।
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2 lg:gap-2.5">
        <FieldSelect
          label="राज्य"
          placeholder="राज्य चुनें"
          value={selectedState}
          items={states}
          getLabel={(s) => displayStateName(s.name, s.slug, locale)}
          onSelect={setSelectedState}
        />
        <FieldSelect
          label="जिला"
          placeholder={loadingDistricts ? "लोड हो रहा है…" : "जिला चुनें"}
          value={selectedDistrict}
          items={districts}
          disabled={!selectedState || loadingDistricts}
          getLabel={(d) => d.name}
          onSelect={setSelectedDistrict}
        />
        <FieldSelect
          label="विधानसभा क्षेत्र"
          placeholder={loadingConstituencies ? "लोड हो रहा है…" : "विधानसभा क्षेत्र चुनें"}
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
          सर्वे में भाग लें <ArrowRight size={14} className="sm:h-4 sm:w-4 lg:h-[17px] lg:w-[17px]" />
        </motion.button>
      </div>
    </motion.div>
  );
}
