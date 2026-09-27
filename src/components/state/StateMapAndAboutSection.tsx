"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Plus, Minus, ChevronRight, ArrowRight, Landmark, Building2, Users2 } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { formatNumber } from "@/lib/utils";

interface StateMapAndAboutSectionProps {
  stateName: string;
  stateSlug: string;
  electionSlug: string;
  districtCount: number;
  constituencyCount: number;
}

export function StateMapAndAboutSection({
  stateName,
  stateSlug,
  electionSlug,
  districtCount,
  constituencyCount,
}: StateMapAndAboutSectionProps) {
  const { locale } = useLocale();
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.15, 1.4));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.15, 0.85));

  const handleMapClick = () => {
    const el = document.getElementById("district-explorer");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const analysisArticles = [
    {
      title: locale === "hi" ? "उत्तर प्रदेश में युवाओं की प्राथमिकताएं" : "Youth Priorities Across Uttar Pradesh",
      date: locale === "hi" ? "20 सित 2026" : "20 Sep 2026",
      href: `/${stateSlug}/elections/${electionSlug}/analysis`,
    },
    {
      title: locale === "hi" ? "पूर्वांचल में विकास बनाम रोजगार का मुद्दा" : "Purvanchal: Development vs Employment",
      date: locale === "hi" ? "18 सित 2026" : "18 Sep 2026",
      href: `/${stateSlug}/elections/${electionSlug}/analysis`,
    },
    {
      title: locale === "hi" ? "पश्चिमी उत्तर प्रदेश में जातीय समीकरण" : "Caste Dynamics & Electoral Trends in Western UP",
      date: locale === "hi" ? "16 सित 2026" : "16 Sep 2026",
      href: `/${stateSlug}/elections/${electionSlug}/analysis`,
    },
    {
      title: locale === "hi" ? "महिलाओं की भागीदारी और राजनीतिक रुझान" : "Women Participation & Electoral Sentiment",
      date: locale === "hi" ? "14 सित 2026" : "14 Sep 2026",
      href: `/${stateSlug}/elections/${electionSlug}/analysis`,
    },
  ];

  return (
    <>
      {/* Desktop Layout: Bottom Row of 3 Cards */}
      <div className="hidden lg:grid grid-cols-3 gap-4 xl:gap-5 py-4 pb-12">
        {/* Card 1: Interactive Map */}
        <div className="bg-white rounded-2xl border border-slate-100/90 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg text-slate-900 tracking-tight">
              {locale === "hi" ? "मानचित्र से अपना क्षेत्र खोजें" : "Explore Constituency via Map"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {locale === "hi"
                ? `${stateName} के मानचित्र पर किसी जिले को चुनें और वहाँ के विधानसभा क्षेत्रों का सर्वे देखें।`
                : `Select a district on the map to view constituency-level survey insights.`}
            </p>
          </div>

          <div className="relative flex items-center justify-between gap-2 mt-4 min-h-[170px]">
            {/* Zoom Controls */}
            <div className="flex flex-col rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden z-10">
              <button
                onClick={handleZoomIn}
                aria-label="Zoom in"
                className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-50 border-b border-slate-200 transition-colors cursor-pointer"
              >
                <Plus size={14} />
              </button>
              <button
                onClick={handleZoomOut}
                aria-label="Zoom out"
                className="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Minus size={14} />
              </button>
            </div>

            {/* Interactive Color Map */}
            <div
              onClick={handleMapClick}
              className="flex-1 flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-105"
              style={{ transform: `scale(${zoomLevel})` }}
              title={locale === "hi" ? "जिले देखने के लिए क्लिक करें" : "Click to view districts"}
            >
              <Image
                src="/images/maps/up-interactive-color-map.png"
                alt={`${stateName} District Participation Map`}
                width={140}
                height={125}
                className="w-auto h-[125px] sm:h-[140px] object-contain drop-shadow-xs"
              />
            </div>

            {/* Legend */}
            <div className="flex flex-col gap-2 shrink-0 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
              <span className="text-[11px] font-bold text-slate-800">
                {locale === "hi" ? "सर्वे की स्थिति" : "Survey Status"}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
                <span className="text-[10.5px] text-slate-600 font-medium">
                  {locale === "hi" ? "उच्च सहभागिता" : "High"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                <span className="text-[10.5px] text-slate-600 font-medium">
                  {locale === "hi" ? "मध्यम सहभागिता" : "Medium"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#a855f7]" />
                <span className="text-[10.5px] text-slate-600 font-medium">
                  {locale === "hi" ? "कम सहभागिता" : "Low"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#60a5fa]" />
                <span className="text-[10.5px] text-slate-600 font-medium">
                  {locale === "hi" ? "अभी शुरू नहीं" : "Not Started"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: About State */}
        <div className="bg-white rounded-2xl border border-slate-100/90 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg text-slate-900 tracking-tight">
              {locale === "hi" ? `${stateName} के बारे में` : `About ${stateName}`}
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {locale === "hi"
                ? `${stateName} भारत का सबसे बड़ा राज्य है, जहाँ ${formatNumber(constituencyCount)} विधानसभा क्षेत्र हैं। यह राज्य देश की राजनीति में महत्वपूर्ण भूमिका निभाता है और यहाँ के मतदाताओं की राय राष्ट्रीय राजनीति को भी प्रभावित करती है।`
                : `${stateName} is India's most populous state with ${formatNumber(constituencyCount)} legislative assembly constituencies, playing a pivotal role in national politics.`}
            </p>
          </div>

          <div className="flex flex-col gap-2.5 mt-4">
            <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Landmark size={15} />
              </div>
              <span>
                {formatNumber(districtCount)} {locale === "hi" ? "जिले" : "Districts"}
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Building2 size={15} />
              </div>
              <span>
                {formatNumber(constituencyCount)} {locale === "hi" ? "विधानसभा क्षेत्र" : "Assembly Constituencies"}
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Users2 size={15} />
              </div>
              <span>
                {locale === "hi" ? "~ 24 करोड़ जनसंख्या (लगभग)" : "~ 240 Million Population (est.)"}
              </span>
            </div>

            <Link
              href={`/${stateSlug}/elections/${electionSlug}/analysis`}
              className="mt-2 inline-flex items-center justify-center gap-1.5 border border-blue-200 text-blue-600 hover:bg-blue-50/60 rounded-xl px-4 py-2 font-semibold text-xs sm:text-sm transition-colors"
            >
              <span>{locale === "hi" ? "राज्य का पूरा प्रोफाइल देखें" : "View Full State Profile"}</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Card 3: Recent Analysis */}
        <div className="bg-white rounded-2xl border border-slate-100/90 shadow-xs p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-lg text-slate-900 tracking-tight">
                {locale === "hi" ? "हाल के विश्लेषण" : "Recent Analysis"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {locale === "hi" ? "विशेषज्ञ चुनावी विश्लेषण" : "Expert electoral analysis"}
              </p>
            </div>
            <Link
              href={`/${stateSlug}/elections/${electionSlug}/analysis`}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200/80 transition-colors"
            >
              <span>{locale === "hi" ? "सभी विश्लेषण देखें" : "All Analysis"}</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="flex flex-col divide-y divide-slate-100 mt-2">
            {analysisArticles.map((art) => (
              <Link
                key={art.title}
                href={art.href}
                className="py-2.5 flex items-center justify-between gap-2 group hover:bg-slate-50/80 px-1 rounded-lg transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm1 9h-6V9h6v2zm-6 4h6v-2h-6v2zm0 4h3v-2h-3v2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-xs text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                      {art.title}
                    </p>
                    <p className="text-[10.5px] text-slate-400 mt-0.5">{art.date}</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-400 group-hover:text-blue-600 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Layout: Map Card with Circular Arrow Button */}
      <div className="lg:hidden flex flex-col gap-4 pb-8">
        {/* Mobile Map Card */}
        <div
          onClick={handleMapClick}
          className="bg-white rounded-2xl border border-slate-100 shadow-xs p-3.5 cursor-pointer"
        >
          <h3 className="font-bold text-base text-slate-900 tracking-tight mb-2">
            {locale === "hi" ? "मानचित्र से अपना क्षेत्र खोजें" : "Explore via Map"}
          </h3>
          <div className="flex items-center justify-between gap-2 py-2">
            <div className="flex-1 flex items-center justify-center">
              <Image
                src="/images/maps/up-interactive-color-map.png"
                alt={`${stateName} Map`}
                width={140}
                height={120}
                className="w-auto h-[115px] object-contain"
              />
            </div>
            {/* Round circle arrow button matching ref_mob_bot.png */}
            <div className="w-10 h-10 rounded-full border border-blue-200 bg-white flex items-center justify-center text-blue-600 shadow-xs shrink-0">
              <ChevronRight size={20} />
            </div>
          </div>
        </div>

        {/* Mobile Recent Analysis */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-3.5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-base text-slate-900 tracking-tight">
              {locale === "hi" ? "हाल के विश्लेषण" : "Recent Analysis"}
            </h3>
            <Link
              href={`/${stateSlug}/elections/${electionSlug}/analysis`}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/80 inline-flex items-center gap-1"
            >
              <span>{locale === "hi" ? "सभी देखें" : "View All"}</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="flex flex-col divide-y divide-slate-100">
            {analysisArticles.slice(0, 3).map((art) => (
              <Link
                key={art.title}
                href={art.href}
                className="py-2 flex items-center justify-between gap-2 group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm1 9h-6V9h6v2zm-6 4h6v-2h-6v2zm0 4h3v-2h-3v2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-xs text-slate-900 truncate">
                      {art.title}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{art.date}</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-slate-400 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
