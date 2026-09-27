"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Users, ArrowRight, ChevronDown } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { getDistrictDisplayName } from "@/lib/district-hindi";
import { getConstituencyDisplayName } from "@/lib/constituency-hindi";

interface DistrictItem {
  slug: string;
  name: string;
}

interface ConstituencyItem {
  slug: string;
  name: string;
  districtSlug: string;
}

interface StateSelectorRowProps {
  stateSlug: string;
  electionSlug: string;
  districts: DistrictItem[];
  constituencies: ConstituencyItem[];
}

export function StateSelectorRow({
  stateSlug,
  electionSlug,
  districts,
  constituencies,
}: StateSelectorRowProps) {
  const router = useRouter();
  const { locale } = useLocale();

  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedConstituency, setSelectedConstituency] = useState<string>("");

  const filteredConstituencies = selectedDistrict
    ? constituencies.filter((c) => c.districtSlug === selectedDistrict)
    : constituencies;

  const handleDistrictChange = (slug: string) => {
    setSelectedDistrict(slug);
    setSelectedConstituency("");
  };

  const handleViewSurvey = () => {
    if (selectedConstituency) {
      router.push(`/${stateSlug}/elections/${electionSlug}/constituencies/${selectedConstituency}/survey`);
    } else if (selectedDistrict) {
      router.push(`/${stateSlug}/elections/${electionSlug}/districts/${selectedDistrict}`);
    } else if (districts.length > 0) {
      // If nothing selected, scroll down to district explorer
      const el = document.getElementById("district-explorer");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div id="survey-selector" className="w-full pt-1 pb-4">
      {/* Desktop Layout */}
      <div className="hidden sm:flex items-center gap-3">
        {/* District Selector Pill */}
        <div className="relative flex-1 max-w-[280px]">
          <div className="w-full bg-white border border-slate-200/90 rounded-xl px-4 py-2.5 flex items-center justify-between shadow-xs hover:border-slate-300 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <MapPin size={18} className="text-slate-700 shrink-0" />
              <span className="text-sm sm:text-base font-semibold text-slate-800 truncate">
                {selectedDistrict
                  ? getDistrictDisplayName(
                      selectedDistrict,
                      districts.find((d) => d.slug === selectedDistrict)?.name || selectedDistrict,
                      locale
                    )
                  : locale === "hi"
                  ? "जिला चुनें"
                  : "Select District"}
              </span>
            </div>
            <ChevronDown size={18} className="text-slate-500 shrink-0 ml-2" />
          </div>
          <select
            value={selectedDistrict}
            onChange={(e) => handleDistrictChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-base"
            aria-label={locale === "hi" ? "जिला चुनें" : "Select District"}
          >
            <option value="">{locale === "hi" ? "जिला चुनें" : "Select District"}</option>
            {districts.map((d) => (
              <option key={d.slug} value={d.slug}>
                {getDistrictDisplayName(d.slug, d.name, locale)}
              </option>
            ))}
          </select>
        </div>

        {/* Constituency Selector Pill */}
        <div className="relative flex-1 max-w-[280px]">
          <div className="w-full bg-white border border-slate-200/90 rounded-xl px-4 py-2.5 flex items-center justify-between shadow-xs hover:border-slate-300 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <Users size={18} className="text-slate-700 shrink-0" />
              <span className="text-sm sm:text-base font-semibold text-slate-800 truncate">
                {selectedConstituency
                  ? getConstituencyDisplayName(
                      selectedConstituency,
                      constituencies.find((c) => c.slug === selectedConstituency)?.name || selectedConstituency,
                      locale
                    )
                  : locale === "hi"
                  ? "विधानसभा चुनें"
                  : "Select Constituency"}
              </span>
            </div>
            <ChevronDown size={18} className="text-slate-500 shrink-0 ml-2" />
          </div>
          <select
            value={selectedConstituency}
            onChange={(e) => setSelectedConstituency(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-base"
            aria-label={locale === "hi" ? "विधानसभा चुनें" : "Select Constituency"}
          >
            <option value="">{locale === "hi" ? "विधानसभा चुनें" : "Select Constituency"}</option>
            {filteredConstituencies.map((c) => (
              <option key={c.slug} value={c.slug}>
                {getConstituencyDisplayName(c.slug, c.name, locale)}
              </option>
            ))}
          </select>
        </div>

        {/* Action Button */}
        <button
          onClick={handleViewSurvey}
          className="inline-flex items-center justify-center gap-2 bg-[#ff5722] hover:bg-[#f4511e] active:scale-[0.98] text-white font-bold text-sm sm:text-base px-6 py-2.5 sm:py-3 rounded-xl shadow-xs transition-all hover:shadow-md cursor-pointer"
        >
          <span>{locale === "hi" ? "सर्वे देखें" : "View Survey"}</span>
          <ArrowRight size={18} />
        </button>
      </div>

      {/* Mobile Layout: Full-width stacked */}
      <div className="sm:hidden flex flex-col gap-2.5">
        {/* District Selector */}
        <div className="relative w-full">
          <div className="w-full bg-white border border-slate-200/90 rounded-xl px-4 py-3 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <MapPin size={18} className="text-slate-700 shrink-0" />
              <span className="text-base font-semibold text-slate-800 truncate">
                {selectedDistrict
                  ? getDistrictDisplayName(
                      selectedDistrict,
                      districts.find((d) => d.slug === selectedDistrict)?.name || selectedDistrict,
                      locale
                    )
                  : locale === "hi"
                  ? "जिला चुनें"
                  : "Select District"}
              </span>
            </div>
            <ChevronDown size={18} className="text-slate-500 shrink-0 ml-2" />
          </div>
          <select
            value={selectedDistrict}
            onChange={(e) => handleDistrictChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-base"
            aria-label={locale === "hi" ? "जिला चुनें" : "Select District"}
          >
            <option value="">{locale === "hi" ? "जिला चुनें" : "Select District"}</option>
            {districts.map((d) => (
              <option key={d.slug} value={d.slug}>
                {getDistrictDisplayName(d.slug, d.name, locale)}
              </option>
            ))}
          </select>
        </div>

        {/* Constituency Selector */}
        <div className="relative w-full">
          <div className="w-full bg-white border border-slate-200/90 rounded-xl px-4 py-3 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <Users size={18} className="text-slate-700 shrink-0" />
              <span className="text-base font-semibold text-slate-800 truncate">
                {selectedConstituency
                  ? getConstituencyDisplayName(
                      selectedConstituency,
                      constituencies.find((c) => c.slug === selectedConstituency)?.name || selectedConstituency,
                      locale
                    )
                  : locale === "hi"
                  ? "विधानसभा चुनें"
                  : "Select Constituency"}
              </span>
            </div>
            <ChevronDown size={18} className="text-slate-500 shrink-0 ml-2" />
          </div>
          <select
            value={selectedConstituency}
            onChange={(e) => setSelectedConstituency(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-base"
            aria-label={locale === "hi" ? "विधानसभा चुनें" : "Select Constituency"}
          >
            <option value="">{locale === "hi" ? "विधानसभा चुनें" : "Select Constituency"}</option>
            {filteredConstituencies.map((c) => (
              <option key={c.slug} value={c.slug}>
                {getConstituencyDisplayName(c.slug, c.name, locale)}
              </option>
            ))}
          </select>
        </div>

        {/* Action Button */}
        <button
          onClick={handleViewSurvey}
          className="w-full inline-flex items-center justify-center gap-2 bg-[#ff5722] hover:bg-[#f4511e] active:scale-[0.98] text-white font-bold text-base py-3.5 rounded-xl shadow-xs transition-all hover:shadow-md cursor-pointer"
        >
          <span>{locale === "hi" ? "सर्वे देखें" : "View Survey"}</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
