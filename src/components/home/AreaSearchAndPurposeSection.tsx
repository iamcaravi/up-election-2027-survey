"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Landmark,
  BarChart2,
  TrendingUp,
  Lightbulb,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { IndiaFullMap } from "@/components/map/IndiaFullMap";

const HIGHLIGHTED_STATES_ROW1 = [
  { nameHi: "उत्तर प्रदेश", nameEn: "Uttar Pradesh", color: "bg-[#3B82F6]", slug: "uttar-pradesh" },
  { nameHi: "पंजाब", nameEn: "Punjab", color: "bg-[#FB7185]", slug: "punjab" },
  { nameHi: "उत्तराखंड", nameEn: "Uttarakhand", color: "bg-[#10B981]", slug: "uttarakhand" },
  { nameHi: "गोवा", nameEn: "Goa", color: "bg-[#F59E0B]", slug: "goa" },
];

const HIGHLIGHTED_STATES_ROW2 = [
  { nameHi: "मणिपुर", nameEn: "Manipur", color: "bg-[#A855F7]", slug: "manipur" },
  { nameHi: "हिमाचल प्रदेश", nameEn: "Himachal Pradesh", color: "bg-[#06B6D4]", slug: "himachal-pradesh" },
  { nameHi: "गुजरात", nameEn: "Gujarat", color: "bg-[#8B5CF6]", slug: "gujarat" },
];

export function AreaSearchAndPurposeSection() {
  const { locale } = useLocale();

  const purposeItems = [
    {
      icon: Landmark,
      titleHi: "जनता की राय को समझना",
      titleEn: "Understanding Public Sentiment",
    },
    {
      icon: BarChart2,
      titleHi: "स्थानीय मुद्दों की पहचान",
      titleEn: "Identifying Local Issues",
    },
    {
      icon: TrendingUp,
      titleHi: "तथ्य आधारित विश्लेषण",
      titleEn: "Fact-Based Analytics",
    },
    {
      icon: Lightbulb,
      titleHi: "बेहतर नीतियों के लिए सुझाव",
      titleEn: "Informing Better Policies",
    },
  ];

  return (
    <section className="py-3 sm:py-4 bg-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:gap-3.5 items-stretch">
          {/* Left Card: Map-based Area Search (~60% / col-span-7) */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-100/90 bg-white p-3.5 sm:p-4 lg:p-4 shadow-xs lg:col-span-7">
            <div className="flex flex-col sm:flex-row items-center gap-3.5 sm:gap-4 h-full">
              {/* LEFT: Compact India Vector Map */}
              <div className="w-full sm:w-[26%] shrink-0 flex items-center justify-center">
                <IndiaFullMap maxHeight="max-h-[110px] sm:max-h-[118px]" className="w-full" />
              </div>

              {/* RIGHT: Header, Description, CTA Button on Left & Dots on Right */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h2 className="font-display text-base sm:text-lg font-bold tracking-tight text-slate-900">
                  {locale === "hi" ? "अपने क्षेत्र का सर्वे खोजें" : "Find Your Constituency Survey"}
                </h2>

                <p className="mt-1 text-xs sm:text-[13px] text-slate-600 font-medium leading-relaxed">
                  {locale === "hi"
                    ? "भारत के मानचित्र पर राज्य चुनें और अपने क्षेत्र के विधानसभा क्षेत्र का सर्वे देखें।"
                    : "Select a state on the map to explore and participate in your constituency survey."}
                </p>

                {/* Horizontal row: Navy CTA button on left + 2 rows of status dots on right */}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {/* Dark Navy CTA Button */}
                  <Link
                    href="/find-constituency"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0B1528] px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors hover:bg-slate-800 shrink-0"
                  >
                    <span>{locale === "hi" ? "मानचित्र से चुनें" : "Select via Map"}</span>
                    <ArrowRight size={13} />
                  </Link>

                  {/* 2 Rows of Status dots matching reference image */}
                  <div className="space-y-1 text-xs sm:text-[12.5px] text-slate-700 font-medium">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      {HIGHLIGHTED_STATES_ROW1.map((s) => (
                        <Link
                          key={s.slug}
                          href={`/${s.slug}`}
                          className="inline-flex items-center gap-1.5 hover:text-blue-600 transition-colors"
                        >
                          <span className={`h-2 w-2 rounded-full ${s.color} shrink-0`} />
                          <span>{locale === "hi" ? s.nameHi : s.nameEn}</span>
                        </Link>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      {HIGHLIGHTED_STATES_ROW2.map((s) => (
                        <Link
                          key={s.slug}
                          href={`/${s.slug}`}
                          className="inline-flex items-center gap-1.5 hover:text-blue-600 transition-colors"
                        >
                          <span className={`h-2 w-2 rounded-full ${s.color} shrink-0`} />
                          <span>{locale === "hi" ? s.nameHi : s.nameEn}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Card: Survey Purpose (~40% / col-span-5) */}
          <div className="flex flex-col justify-between rounded-2xl border border-slate-100/90 bg-white p-3.5 sm:p-4 lg:p-4 shadow-xs lg:col-span-5">
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold tracking-tight text-slate-900">
                {locale === "hi" ? "इस सर्वे का उद्देश्य" : "Purpose of this Survey"}
              </h2>

              <p className="mt-1 text-xs sm:text-[13px] text-slate-600 font-medium leading-relaxed">
                {locale === "hi"
                  ? "जनता की राय को डेटा और विश्लेषण के माध्यम से समझकर, स्थानीय मुद्दों को उजागर करना और एक बेहतर लोकतांत्रिक समाज के निर्माण में योगदान देना।"
                  : "Empowering citizens through data and analysis to highlight local issues and foster a stronger democratic society."}
              </p>

              {/* 4 Items with uniform soft-blue circular icons */}
              <div className="mt-2.5 space-y-1.5">
                {purposeItems.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="flex items-center gap-2.5">
                      <span className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-full bg-sky-50 text-blue-600">
                        <Icon size={12} strokeWidth={2.2} />
                      </span>
                      <h4 className="font-display text-xs sm:text-[13px] font-semibold text-slate-800">
                        {locale === "hi" ? item.titleHi : item.titleEn}
                      </h4>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
