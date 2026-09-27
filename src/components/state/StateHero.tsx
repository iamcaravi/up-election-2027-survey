"use client";

import Image from "next/image";
import { Landmark, Users, CheckSquare, ArrowRight } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { formatNumber } from "@/lib/utils";
import { StateMap } from "@/components/map/StateMap";
import indiaMapData from "@/data/india-map.json";

interface StateHeroProps {
  stateName: string;
  stateSlug: string;
  electionName: string;
  electionSlug: string;
  districtCount: number;
  constituencyCount: number;
  participantCount: number;
  surveyedAreasCount: number;
}

const SLUG_TO_MAP_ID: Record<string, string> = {
  "uttar-pradesh": "up",
  "punjab": "pb",
  "uttarakhand": "ut",
  "goa": "ga",
  "manipur": "mn",
  "himachal-pradesh": "hp",
  "gujarat": "gj",
};

export function StateHero({
  stateName,
  stateSlug,
  electionName,
  districtCount,
  constituencyCount,
  participantCount,
  surveyedAreasCount,
}: StateHeroProps) {
  const { locale } = useLocale();

  const handleSelectAreaClick = () => {
    const el = document.getElementById("survey-selector");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const isUp = stateSlug === "uttar-pradesh";
  const mapId = SLUG_TO_MAP_ID[stateSlug];

  return (
    <div className="w-full">
      {/* Desktop Layout - Single White Card Matching Reference Image */}
      <div className="hidden lg:flex items-center justify-between gap-5 xl:gap-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 xl:p-6">
        {/* Left: India Locator Map */}
        <div className="w-[88px] xl:w-[94px] h-[115px] shrink-0 relative flex items-center justify-center">
          {isUp ? (
            <Image
              src="/images/maps/india-locator-up.png"
              alt="India Locator Map"
              width={92}
              height={115}
              className="w-full h-auto object-contain select-none drop-shadow-xs"
              priority
            />
          ) : (
            <svg
              viewBox={indiaMapData.viewBox}
              className="w-full h-full object-contain select-none"
              aria-label="India Locator"
            >
              {indiaMapData.locations.map((loc) => {
                const isSelected = loc.id === mapId;
                return (
                  <path
                    key={loc.id}
                    d={loc.path}
                    fill={isSelected ? "#ef4444" : "#e2e8f0"}
                    stroke={isSelected ? "#b91c1c" : "#cbd5e1"}
                    strokeWidth={isSelected ? 1.5 : 0.6}
                  />
                );
              })}
            </svg>
          )}
        </div>

        {/* Center-Left: Blue State Map */}
        <div className="w-[170px] xl:w-[185px] h-[155px] shrink-0 relative flex items-center justify-center">
          {isUp ? (
            <Image
              src="/images/maps/up-hero-blue-map.png"
              alt={`${stateName} Map`}
              width={185}
              height={155}
              className="w-full h-auto object-contain select-none drop-shadow-sm"
              priority
            />
          ) : (
            <StateMap
              slug={stateSlug}
              className="w-full h-full object-contain select-none text-blue-500 drop-shadow-sm"
              fill="#3b82f6"
            />
          )}
        </div>

        {/* Center: Title & Description */}
        <div className="flex-1 min-w-[280px] max-w-xl pl-1 xl:pl-2">
          <h1 className="text-3xl xl:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            {stateName}
          </h1>
          <p className="text-lg xl:text-xl font-bold text-blue-800 mt-1">
            {locale === "hi"
              ? isUp
                ? "विधानसभा चुनाव सर्वेक्षण 2027"
                : `${stateName} विधानसभा चुनाव सर्वेक्षण 2027`
              : `${electionName || stateName} Survey 2027`}
          </p>
          <p className="text-sm xl:text-base text-slate-600 mt-2.5 leading-relaxed">
            {locale === "hi"
              ? `${stateName} के सभी जिलों और विधानसभा क्षेत्रों के जनमत, स्थानीय मुद्दों और विकास से जुड़े मुद्दों पर लोगों की राय जानें और सर्वे में भाग लें।`
              : `Explore public opinion, local constituency issues, and development priorities across all districts of ${stateName}, and participate in the survey.`}
          </p>
          <button
            onClick={handleSelectAreaClick}
            className="mt-4 inline-flex items-center gap-2 bg-[#ff5722] hover:bg-[#f4511e] active:scale-[0.98] text-white font-semibold text-sm xl:text-base px-6 py-3 rounded-xl shadow-xs transition-all hover:shadow-md cursor-pointer"
          >
            <span>{locale === "hi" ? "अपना क्षेत्र चुनें" : "Select Your Constituency"}</span>
            <ArrowRight size={18} />
          </button>
        </div>

        {/* Right: 2x2 Stats Block with divider lines matching reference */}
        <div className="w-[280px] xl:w-[310px] shrink-0 grid grid-cols-2">
          {/* Box 1: Districts */}
          <div className="flex flex-col pr-3 pb-3 border-r border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 mb-1.5">
              <Landmark size={20} />
            </div>
            <span className="text-2xl xl:text-3xl font-black text-slate-900 tracking-tight leading-none">
              {formatNumber(districtCount)}
            </span>
            <span className="text-xs xl:text-sm text-slate-600 font-semibold mt-1">
              {locale === "hi" ? "कुल जिले" : "Districts"}
            </span>
          </div>

          {/* Box 2: Constituencies */}
          <div className="flex flex-col pl-3 pb-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 mb-1.5">
              <Users size={20} />
            </div>
            <span className="text-2xl xl:text-3xl font-black text-slate-900 tracking-tight leading-none">
              {formatNumber(constituencyCount)}
            </span>
            <span className="text-xs xl:text-sm text-slate-600 font-semibold mt-1 truncate">
              {locale === "hi" ? "कुल विधानसभा क्षेत्र" : "Constituencies"}
            </span>
          </div>

          {/* Box 3: Participants */}
          <div className="flex flex-col pr-3 pt-3 border-r border-t border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-1.5">
              <Users size={20} />
            </div>
            <span className="text-2xl xl:text-3xl font-black text-slate-900 tracking-tight leading-none">
              {formatNumber(participantCount)}
            </span>
            <span className="text-xs xl:text-sm text-slate-600 font-semibold mt-1">
              {locale === "hi" ? "कुल प्रतिभागी" : "Participants"}
            </span>
          </div>

          {/* Box 4: Surveyed Areas */}
          <div className="flex flex-col pl-3 pt-3 border-t border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-1.5">
              <CheckSquare size={20} />
            </div>
            <span className="text-2xl xl:text-3xl font-black text-slate-900 tracking-tight leading-none">
              {formatNumber(surveyedAreasCount)}
            </span>
            <span className="text-xs xl:text-sm text-slate-600 font-semibold mt-1 truncate">
              {locale === "hi" ? "सर्वे किए गए क्षेत्र" : "Surveyed Areas"}
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Layout - Single White Card Matching Reference Image */}
      <div className="lg:hidden bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 flex flex-col gap-3">
        {/* Top: Map on left, Title on right */}
        <div className="flex items-center gap-3.5">
          <div className="w-20 h-20 shrink-0 relative flex items-center justify-center">
            {isUp ? (
              <Image
                src="/images/maps/up-hero-blue-map.png"
                alt={`${stateName} Map`}
                width={80}
                height={80}
                className="w-full h-auto object-contain select-none"
                priority
              />
            ) : (
              <StateMap
                slug={stateSlug}
                className="w-full h-full object-contain select-none text-blue-500"
                fill="#3b82f6"
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              {stateName}
            </h1>
            <p className="text-base font-bold text-blue-800 mt-1">
              {locale === "hi"
                ? isUp
                  ? "विधानसभा चुनाव सर्वेक्षण 2027"
                  : `${stateName} विधानसभा चुनाव सर्वेक्षण 2027`
                : `${electionName || stateName} Survey 2027`}
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-600 leading-relaxed">
          {locale === "hi"
            ? `${stateName} के सभी जिलों और विधानसभा क्षेत्रों के जनमत, स्थानीय मुद्दों और विकास से जुड़े मुद्दों पर लोगों की राय जानें और सर्वे में भाग लें।`
            : `Explore public opinion, local constituency issues, and development priorities across all districts of ${stateName}, and participate in the survey.`}
        </p>

        {/* 2x2 Stats Card */}
        <div className="w-full pt-1 grid grid-cols-2 gap-y-3.5 gap-x-2.5">
          {/* Box 1 */}
          <div className="flex flex-col pr-2 border-r border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 mb-1">
              <Landmark size={17} />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight leading-none">
              {formatNumber(districtCount)}
            </span>
            <span className="text-xs text-slate-600 font-semibold mt-1">
              {locale === "hi" ? "कुल जिले" : "Districts"}
            </span>
          </div>

          {/* Box 2 */}
          <div className="flex flex-col pl-2">
            <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 mb-1">
              <Users size={17} />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight leading-none">
              {formatNumber(constituencyCount)}
            </span>
            <span className="text-xs text-slate-600 font-semibold mt-1 truncate">
              {locale === "hi" ? "कुल विधानसभा क्षेत्र" : "Constituencies"}
            </span>
          </div>

          {/* Box 3 */}
          <div className="flex flex-col pr-2 pt-2.5 border-r border-t border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-1">
              <Users size={17} />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight leading-none">
              {formatNumber(participantCount)}
            </span>
            <span className="text-xs text-slate-600 font-semibold mt-1">
              {locale === "hi" ? "कुल प्रतिभागी" : "Participants"}
            </span>
          </div>

          {/* Box 4 */}
          <div className="flex flex-col pl-2 pt-2.5 border-t border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-1">
              <CheckSquare size={17} />
            </div>
            <span className="text-2xl font-black text-slate-900 tracking-tight leading-none">
              {formatNumber(surveyedAreasCount)}
            </span>
            <span className="text-xs text-slate-600 font-semibold mt-1 truncate">
              {locale === "hi" ? "सर्वे किए गए क्षेत्र" : "Surveyed Areas"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
