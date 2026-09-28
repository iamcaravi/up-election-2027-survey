"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { StateMap } from "@/components/map/StateMap";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { analysisScopePath } from "@/lib/routes";

const ANALYSIS_CARDS = [
  {
    stateSlug: "uttar-pradesh",
    stateNameHi: "उत्तर प्रदेश",
    stateNameEn: "Uttar Pradesh",
    titleHi: "युवाओं के लिए रोज़गार सबसे बड़ा मुद्दा",
    titleEn: "Youth Employment Emerges as the Top Priority",
    dateHi: "20 सित 2026",
    dateEn: "20 Sep 2026",
    boxBg: "bg-[#EEF5FF]",
    mapFill: "#3B82F6",
  },
  {
    stateSlug: "punjab",
    stateNameHi: "पंजाब",
    stateNameEn: "Punjab",
    titleHi: "खेती, MSP और रोज़गार पर जनता की राय",
    titleEn: "Public Mood on Agriculture, MSP & Rural Jobs",
    dateHi: "18 सित 2026",
    dateEn: "18 Sep 2026",
    boxBg: "bg-[#FFF0F3]",
    mapFill: "#FB7185",
  },
  {
    stateSlug: "gujarat",
    stateNameHi: "गुजरात",
    stateNameEn: "Gujarat",
    titleHi: "विकास कार्यों पर मिला-जुला फ़ैसला",
    titleEn: "Mixed Public Sentiment on Infrastructure & Delivery",
    dateHi: "16 सित 2026",
    dateEn: "16 Sep 2026",
    boxBg: "bg-[#F2EDFF]",
    mapFill: "#8B5CF6",
  },
  {
    stateSlug: "himachal-pradesh",
    stateNameHi: "हिमाचल प्रदेश",
    stateNameEn: "Himachal Pradesh",
    titleHi: "पर्यटन और रोज़गार मुख्य मुद्दे",
    titleEn: "Tourism Revival and Local Employment Focus",
    dateHi: "14 सित 2026",
    dateEn: "14 Sep 2026",
    boxBg: "bg-[#EDF8FF]",
    mapFill: "#06B6D4",
  },
];

export function LatestAnalysisSection() {
  const { locale } = useLocale();

  return (
    <section className="py-4 sm:py-5 bg-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header matching reference image 1 */}
        <div className="mb-3.5 sm:mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {locale === "hi" ? "हाल के विश्लेषण" : "Latest Analysis"}
          </h2>
          <Link
            href="/analysis"
            className="group inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <span>{locale === "hi" ? "सभी विश्लेषण देखें" : "View All Analysis"}</span>
            <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* 4 Cards Grid matching Reference Image 1 exactly */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-3.5">
          {ANALYSIS_CARDS.map((item, idx) => (
            <div
              key={item.stateSlug}
              className="h-full"
            >
              <Link
                href={analysisScopePath({ state: item.stateSlug })}
                className="group flex items-center gap-2.5 sm:gap-3 rounded-2xl border border-slate-100/90 bg-white p-2.5 sm:p-3 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md h-full"
              >
                {/* Left: State map silhouette in soft tinted pastel box */}
                <div
                  className={`w-12 h-14 sm:w-13 sm:h-15 rounded-xl ${item.boxBg} flex items-center justify-center p-1 shrink-0 group-hover:scale-[1.03] transition-transform`}
                >
                  <StateMap
                    slug={item.stateSlug}
                    className="h-8 w-8 sm:h-9 sm:w-9 object-contain drop-shadow-xs"
                    fill={item.mapFill}
                  />
                </div>

                {/* Right: State Name, Headline & Footer Date / Link */}
                <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
                  <div>
                    <span className="text-[11px] sm:text-xs font-semibold text-slate-500 block truncate">
                      {locale === "hi" ? item.stateNameHi : item.stateNameEn}
                    </span>
                    <h3 className="font-display text-xs sm:text-[13px] lg:text-[13.5px] font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug mt-0.5">
                      {locale === "hi" ? item.titleHi : item.titleEn}
                    </h3>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">
                      {locale === "hi" ? item.dateHi : item.dateEn}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-blue-600 group-hover:underline">
                      <span>{locale === "hi" ? "पूरा विश्लेषण पढ़ें" : "Read"}</span>
                      <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
