"use client";

import { motion } from "framer-motion";
import { Users, BarChart2, FileText, Star } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function TrustBenefitsSection() {
  const { locale } = useLocale();

  const benefits = [
    {
      icon: Users,
      iconWrapClass: "bg-emerald-50 text-emerald-600 rounded-full",
      isStar: false,
      titleHi: "वास्तविक जनमत",
      titleEn: "Real Public Opinion",
      descHi: "क्षेत्र के लोगों की असली राय और सुझाव",
      descEn: "Grassroots public mood and direct citizen opinions",
    },
    {
      icon: BarChart2,
      iconWrapClass: "bg-purple-50 text-purple-600 rounded-full",
      isStar: false,
      titleHi: "विस्तृत विश्लेषण",
      titleEn: "In-depth Analysis",
      descHi: "मुद्दों और प्राथमिकताओं की समझ",
      descEn: "Understanding core issues and localized priorities",
    },
    {
      icon: FileText,
      iconWrapClass: "bg-blue-50 text-blue-600 rounded-xl",
      isStar: false,
      titleHi: "पारदर्शी डेटा",
      titleEn: "Transparent Data",
      descHi: "स्पष्ट और तथ्य आधारित जानकारी",
      descEn: "Clear, factual, and statistically verified data",
    },
    {
      icon: Star,
      iconWrapClass: "bg-orange-50 text-orange-500 rounded-full",
      isStar: true,
      titleHi: "बेहतर लोकतंत्र",
      titleEn: "Stronger Democracy",
      descHi: "आपकी भागीदारी से मजबूत लोकतंत्र",
      descEn: "Strengthening democratic choices through citizen voice",
    },
  ];

  return (
    <section className="py-6 sm:py-7 bg-transparent">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
          {benefits.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="group flex items-center gap-3.5 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm hover:shadow-md transition-all"
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center ${item.iconWrapClass} transition-transform group-hover:scale-105`}
                >
                  <Icon size={20} className={item.isStar ? "fill-orange-500 text-orange-500" : ""} />
                </span>
                <div>
                  <h3 className="font-display text-sm sm:text-base font-bold text-slate-900 leading-tight">
                    {locale === "hi" ? item.titleHi : item.titleEn}
                  </h3>
                  <p className="mt-1 text-xs sm:text-[13px] font-medium text-slate-600 leading-normal">
                    {locale === "hi" ? item.descHi : item.descEn}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
