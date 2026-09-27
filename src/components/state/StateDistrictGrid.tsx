"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ArrowRight, Landmark } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { formatNumber } from "@/lib/utils";
import { getDistrictDisplayName, UP_DISTRICT_HINDI_NAMES } from "@/lib/district-hindi";
import { matchesCrossLanguage } from "@/lib/search-normalization";

interface DistrictItem {
  slug: string;
  name: string;
  constituencyCount: number;
  responseCount: number;
}

interface StateDistrictGridProps {
  stateName: string;
  stateSlug: string;
  electionSlug: string;
  districts: DistrictItem[];
}

// Top priority reference districts for Uttar Pradesh
const UP_PRIORITY_SLUGS = [
  "agra",
  "aligarh",
  "azamgarh",
  "bareilly",
  "basti",
  "deoria",
  "etah",
  "farrukhabad",
  "fatehpur",
  "ghaziabad",
];

export function StateDistrictGrid({
  stateName,
  stateSlug,
  electionSlug,
  districts,
}: StateDistrictGridProps) {
  const { locale } = useLocale();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAll, setShowAll] = useState(false);

  // Map districts to localized name and sort
  const localizedDistricts = useMemo(() => {
    const list = districts.map((d) => ({
      ...d,
      displayName: getDistrictDisplayName(d.slug, d.name, locale),
    }));

    if (stateSlug === "uttar-pradesh") {
      return [...list].sort((a, b) => {
        const idxA = UP_PRIORITY_SLUGS.indexOf(a.slug);
        const idxB = UP_PRIORITY_SLUGS.indexOf(b.slug);
        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
        if (idxA !== -1) return -1;
        if (idxB !== -1) return 1;
        return a.displayName.localeCompare(b.displayName, locale === "hi" ? "hi" : "en");
      });
    }

    return list;
  }, [districts, locale, stateSlug]);

  // Filter districts based on search term (works cross-language: Hindi & Roman)
  const filteredDistricts = useMemo(() => {
    const q = searchTerm.trim();
    if (!q) return localizedDistricts;
    return localizedDistricts.filter((d) =>
      matchesCrossLanguage(
        {
          name: d.name,
          slug: d.slug,
          nameHi: UP_DISTRICT_HINDI_NAMES[d.slug.toLowerCase()] ?? d.displayName,
          nameEn: d.name,
        },
        q
      )
    );
  }, [localizedDistricts, searchTerm]);

  // If not searching, display top 10 on desktop / top 4 on mobile unless showAll is true
  const displayedDistricts = useMemo(() => {
    if (searchTerm.trim() || showAll) {
      return filteredDistricts;
    }
    // Return top 10
    return filteredDistricts.slice(0, 10);
  }, [filteredDistricts, searchTerm, showAll]);


  return (
    <div id="district-explorer" className="w-full scroll-mt-16 pt-4 pb-6">
      {/* Header Bar - Desktop Layout */}
      <div className="hidden sm:flex items-end justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {locale === "hi" ? `${stateName} के जिले` : `Districts of ${stateName}`}
          </h2>
          <p className="text-sm sm:text-base text-slate-500 mt-1">
            {locale === "hi"
              ? "किसी जिले पर क्लिक करके वहाँ की विधानसभा क्षेत्रों का सर्वे देखें।"
              : `Click any district to explore its constituencies and survey responses.`}
          </p>
        </div>

        {/* Right Controls: Search Input + All Districts Button */}
        <div className="flex items-center gap-2.5">
          <div className="relative w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={locale === "hi" ? "जिले का नाम खोजें..." : "Search district..."}
              className="w-full bg-white border border-slate-200/90 rounded-xl pl-3.5 pr-9 py-2.5 text-sm sm:text-base text-slate-800 placeholder-slate-400 shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
            />
            <Search
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          <button
            onClick={() => setShowAll((prev) => !prev)}
            className="shrink-0 bg-white hover:bg-slate-50 border border-slate-200/90 text-blue-600 hover:text-blue-700 font-semibold text-sm sm:text-base px-4 py-2.5 rounded-xl shadow-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>
              {showAll
                ? locale === "hi"
                  ? "कम जिले देखें"
                  : "Show Less"
                : locale === "hi"
                ? "सभी जिले देखें"
                : "View All"}
            </span>
            <ArrowRight size={16} className={showAll ? "-rotate-90 transition-transform" : "transition-transform"} />
          </button>
        </div>
      </div>

      {/* Header Bar - Mobile Layout */}
      <div className="sm:hidden flex flex-col gap-2.5 mb-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            {locale === "hi" ? `${stateName} के जिले` : `Districts of ${stateName}`}
          </h2>
          <button
            onClick={() => setShowAll((prev) => !prev)}
            className="bg-white border border-slate-200 text-blue-600 font-semibold text-xs sm:text-sm px-3 py-1.5 rounded-lg shadow-xs inline-flex items-center gap-1 cursor-pointer"
          >
            <span>
              {showAll
                ? locale === "hi"
                  ? "कम जिले"
                  : "Less"
                : locale === "hi"
                ? "सभी जिले देखें"
                : "View All"}
            </span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="relative w-full">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={locale === "hi" ? "जिले का नाम खोजें..." : "Search district..."}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* District Cards Grid */}
      {displayedDistricts.length === 0 ? (
        <div className="w-full py-10 text-center bg-white rounded-2xl border border-slate-100 shadow-xs">
          <p className="text-sm sm:text-base font-medium text-slate-500">
            {locale === "hi"
              ? `"${searchTerm}" से संबंधित कोई जिला नहीं मिला।`
              : `No districts found matching "${searchTerm}".`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3">
          {displayedDistricts.map((district, idx) => (
            <Link
              key={district.slug}
              href={`/${stateSlug}/elections/${electionSlug}/districts/${district.slug}`}
              className={`group min-w-0 bg-white rounded-xl border border-slate-100/90 shadow-xs hover:shadow-md hover:border-blue-200 transition-all p-2.5 sm:p-3 flex items-center justify-between gap-2 cursor-pointer ${
                !showAll && !searchTerm.trim() && idx >= 4 ? "hidden sm:flex" : "flex"
              }`}
            >
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                {/* Neutral administrative-unit icon */}
                <div aria-hidden="true" className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-500 shrink-0 group-hover:bg-blue-50 group-hover:border-blue-200 group-hover:text-blue-600 transition-colors">
                  <Landmark size={18} strokeWidth={1.75} className="transition-colors" />
                </div>
                {/* District Name & Count */}
                <div className="min-w-0">
                  <p className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-blue-600 transition-colors truncate leading-tight">
                    {district.displayName}
                  </p>
                  <p className="text-xs sm:text-[13px] text-slate-500 font-medium mt-0.5 truncate">
                    {formatNumber(district.constituencyCount)}{" "}
                    <span className="hidden sm:inline">
                      {locale === "hi" ? "विधानसभा क्षेत्र" : "Constituencies"}
                    </span>
                    <span className="sm:hidden">
                      {locale === "hi" ? "क्षेत्र" : "Seats"}
                    </span>
                  </p>
                </div>
              </div>

              {/* Circular arrow icon */}
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-50 border border-slate-200/60 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white group-hover:border-transparent transition-all shrink-0">
                <ArrowRight size={13} className="sm:w-3.5 sm:h-3.5" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
