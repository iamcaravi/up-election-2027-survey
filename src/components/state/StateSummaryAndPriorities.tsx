"use client";

import Link from "next/link";
import {
  Users,
  BarChart3,
  MapPin,
  Briefcase,
  GraduationCap,
  Sprout,
  ArrowRight,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { formatNumber } from "@/lib/utils";

interface StateSummaryAndPrioritiesProps {
  stateName: string;
  stateSlug: string;
  electionSlug: string;
  districtCount: number;
  constituencyCount: number;
  participantCount: number;
  surveyedAreasCount: number;
}

function RoadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 stroke-[#334155] fill-none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19L8 5h8l4 14" />
      <line x1="12" y1="9" x2="12" y2="11" />
      <line x1="12" y1="15" x2="12" y2="17" />
    </svg>
  );
}

function HealthIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-[#ef4444]">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 7v10M7 12h10" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-[#2563eb]">
      <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z" />
      <path d="M9 12l2 2 4-4" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StateSummaryAndPriorities({
  stateName,
  stateSlug,
  electionSlug,
  districtCount,
  constituencyCount,
}: StateSummaryAndPrioritiesProps) {
  const { locale } = useLocale();

  const priorities = [
    { label: locale === "hi" ? "रोजगार और आर्थिक विकास" : "Employment & Growth", pct: 32, color: "bg-[#2563eb]" },
    { label: locale === "hi" ? "शिक्षा" : "Education", pct: 18, color: "bg-[#9333ea]" },
    { label: locale === "hi" ? "सड़क और आधारभूत संरचना" : "Roads & Infrastructure", pct: 16, color: "bg-[#f97316]" },
    { label: locale === "hi" ? "स्वास्थ्य सुविधाएं" : "Healthcare Facilities", pct: 12, color: "bg-[#22c55e]" },
    { label: locale === "hi" ? "कानून व्यवस्था" : "Law & Order", pct: 11, color: "bg-[#ef4444]" },
    { label: locale === "hi" ? "कृषि और किसान" : "Agriculture & Farmers", pct: 8, color: "bg-[#0ea5e9]" },
    { label: locale === "hi" ? "अन्य" : "Other", pct: 13, color: "bg-[#64748b]" },
  ];

  const issues = [
    {
      id: "employment",
      label: locale === "hi" ? "रोजगार" : "Employment",
      renderIcon: () => <Briefcase size={22} className="text-[#ea580c]" />,
      bg: "bg-[#fff7ed]",
      border: "border-orange-100",
    },
    {
      id: "education",
      label: locale === "hi" ? "शिक्षा" : "Education",
      renderIcon: () => <GraduationCap size={22} className="text-[#9333ea]" />,
      bg: "bg-[#faf5ff]",
      border: "border-purple-100",
    },
    {
      id: "roads",
      label: locale === "hi" ? "सड़क एवं बुनियादी ढांचा" : "Roads & Infra",
      renderIcon: () => <RoadIcon />,
      bg: "bg-[#f1f5f9]",
      border: "border-slate-200",
    },
    {
      id: "health",
      label: locale === "hi" ? "स्वास्थ्य" : "Healthcare",
      renderIcon: () => <HealthIcon />,
      bg: "bg-[#fef2f2]",
      border: "border-red-100",
    },
    {
      id: "law",
      label: locale === "hi" ? "कानून व्यवस्था" : "Law & Order",
      renderIcon: () => <ShieldIcon />,
      bg: "bg-[#eff6ff]",
      border: "border-blue-100",
    },
    {
      id: "agri",
      label: locale === "hi" ? "कृषि" : "Agriculture",
      renderIcon: () => <Sprout size={22} className="text-[#16a34a]" />,
      bg: "bg-[#f0fdf4]",
      border: "border-emerald-100",
    },
  ];

  return (
    <div className="w-full py-2 sm:py-4">
      {/* Desktop 3-Card Grid */}
      <div className="hidden lg:grid grid-cols-3 gap-4 xl:gap-5">
        {/* Card 1: Survey Summary */}
        <div className="bg-white rounded-2xl border border-slate-100/90 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg text-slate-900 tracking-tight">
              {locale === "hi" ? `${stateName} सर्वे का सार` : `${stateName} Survey Summary`}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {locale === "hi"
                ? "अब तक के प्राप्त सर्वे के आधार पर प्रमुख जानकारी"
                : "Key insights based on public survey participation to date"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            {/* Stat 1: Participants */}
            <div className="bg-emerald-50/50 rounded-xl p-3.5 border border-emerald-100/40 flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-600 flex items-center justify-center mb-1.5">
                <Users size={16} />
              </div>
              <span className="text-xl font-black text-slate-900 leading-none">
                1,24,856
              </span>
              <span className="text-[11px] text-slate-500 font-medium mt-1">
                {locale === "hi" ? "कुल प्रतिभागी" : "Participants"}
              </span>
            </div>

            {/* Stat 2: Constituencies */}
            <div className="bg-purple-50/50 rounded-xl p-3.5 border border-purple-100/40 flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-lg bg-purple-100/70 text-purple-600 flex items-center justify-center mb-1.5">
                <BarChart3 size={16} />
              </div>
              <span className="text-xl font-black text-slate-900 leading-none">
                {formatNumber(constituencyCount)}
              </span>
              <span className="text-[11px] text-slate-500 font-medium mt-1">
                {locale === "hi" ? "विधानसभा क्षेत्र" : "Constituencies"}
              </span>
            </div>

            {/* Stat 3: Surveyed Areas */}
            <div className="bg-orange-50/50 rounded-xl p-3.5 border border-orange-100/40 flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-lg bg-orange-100/70 text-orange-600 flex items-center justify-center mb-1.5">
                <Users size={16} />
              </div>
              <span className="text-xl font-black text-slate-900 leading-none">
                325
              </span>
              <span className="text-[11px] text-slate-500 font-medium mt-1">
                {locale === "hi" ? "सर्वे किए गए क्षेत्र" : "Surveyed Areas"}
              </span>
            </div>

            {/* Stat 4: Districts */}
            <div className="bg-blue-50/50 rounded-xl p-3.5 border border-blue-100/40 flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-lg bg-blue-100/70 text-blue-600 flex items-center justify-center mb-1.5">
                <MapPin size={16} />
              </div>
              <span className="text-xl font-black text-slate-900 leading-none">
                {formatNumber(districtCount)}
              </span>
              <span className="text-[11px] text-slate-500 font-medium mt-1">
                {locale === "hi" ? "कुल जिले" : "Districts"}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Voter Priorities */}
        <div className="bg-white rounded-2xl border border-slate-100/90 shadow-xs p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg text-slate-900 tracking-tight">
              {locale === "hi" ? "मतदाताओं की मुख्य प्राथमिकताएं" : "Voter Priorities"}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {locale === "hi" ? "सर्वे में दर्ज शीर्ष मुद्दे" : "Top ranked survey issues"}
            </p>
          </div>

          <div className="flex flex-col gap-2.5 mt-3.5">
            {priorities.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="w-40 text-xs font-semibold text-slate-700 truncate">
                  {item.label}
                </span>
                <div className="flex-1 h-3.5 bg-slate-100 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                    style={{ width: `${item.pct * 2.2}%` }}
                  />
                </div>
                <span className="w-9 text-right text-xs font-bold text-slate-800">
                  {item.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Key Issues */}
        <div className="bg-white rounded-2xl border border-slate-100/90 shadow-xs p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-lg text-slate-900 tracking-tight">
                {locale === "hi" ? "मुख्य मुद्दे" : "Key Issues"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {locale === "hi" ? "मुद्दों के आधार पर विश्लेषण" : "Explore issue analysis"}
              </p>
            </div>
            <Link
              href={`/${stateSlug}/elections/${electionSlug}/analysis`}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200/80 transition-colors"
            >
              <span>{locale === "hi" ? "सभी मुद्दे देखें" : "All Issues"}</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2.5 mt-4">
            {issues.map((iss) => (
              <Link
                key={iss.id}
                href={`/${stateSlug}/elections/${electionSlug}/analysis`}
                className={`${iss.bg} ${iss.border} border rounded-xl p-3 flex flex-col items-center justify-center text-center hover:scale-[1.02] transition-transform shadow-2xs group cursor-pointer`}
              >
                <div className="mb-1.5 flex items-center justify-center">
                  {iss.renderIcon()}
                </div>
                <span className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight">
                  {iss.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Stacked Layout */}
      <div className="lg:hidden flex flex-col gap-4">
        {/* Mobile: उत्तर प्रदेश सर्वे का सार - 4 Stats in 1 Row */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-3.5">
          <h3 className="font-bold text-base text-slate-900 tracking-tight">
            {locale === "hi" ? `${stateName} सर्वे का सार` : `${stateName} Survey Summary`}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5 mb-3">
            {locale === "hi"
              ? "अब तक के प्राप्त सर्वे के आधार पर प्रमुख जानकारी"
              : "Key insights based on public survey participation to date"}
          </p>

          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            {/* Stat 1 */}
            <div className="bg-emerald-50/60 rounded-xl p-2 border border-emerald-100/50 flex flex-col items-center text-center">
              <div className="w-7 h-7 rounded-lg bg-emerald-100/80 text-emerald-600 flex items-center justify-center mb-1">
                <Users size={14} />
              </div>
              <span className="text-sm font-black text-slate-900 leading-tight">
                1,24,856
              </span>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                {locale === "hi" ? "प्रतिभागी" : "Voters"}
              </span>
            </div>

            {/* Stat 2 */}
            <div className="bg-purple-50/60 rounded-xl p-2 border border-purple-100/50 flex flex-col items-center text-center">
              <div className="w-7 h-7 rounded-lg bg-purple-100/80 text-purple-600 flex items-center justify-center mb-1">
                <BarChart3 size={14} />
              </div>
              <span className="text-sm font-black text-slate-900 leading-tight">
                {formatNumber(constituencyCount)}
              </span>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5 truncate w-full">
                {locale === "hi" ? "विधानसभा क्षेत्र" : "Seats"}
              </span>
            </div>

            {/* Stat 3 */}
            <div className="bg-orange-50/60 rounded-xl p-2 border border-orange-100/50 flex flex-col items-center text-center">
              <div className="w-7 h-7 rounded-lg bg-orange-100/80 text-orange-600 flex items-center justify-center mb-1">
                <Users size={14} />
              </div>
              <span className="text-sm font-black text-slate-900 leading-tight">
                325
              </span>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5 truncate w-full">
                {locale === "hi" ? "सर्वे किए गए क्षेत्र" : "Covered"}
              </span>
            </div>

            {/* Stat 4 */}
            <div className="bg-blue-50/60 rounded-xl p-2 border border-blue-100/50 flex flex-col items-center text-center">
              <div className="w-7 h-7 rounded-lg bg-blue-100/80 text-blue-600 flex items-center justify-center mb-1">
                <MapPin size={14} />
              </div>
              <span className="text-sm font-black text-slate-900 leading-tight">
                {formatNumber(districtCount)}
              </span>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5">
                {locale === "hi" ? "जिले" : "Districts"}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile: मुख्य मुद्दे */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-3.5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-base text-slate-900 tracking-tight">
              {locale === "hi" ? "मुख्य मुद्दे" : "Key Issues"}
            </h3>
            <Link
              href={`/${stateSlug}/elections/${electionSlug}/analysis`}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/80"
            >
              <span>{locale === "hi" ? "सभी मुद्दे देखें" : "View All"}</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {issues.slice(0, 4).map((iss) => (
              <Link
                key={iss.id}
                href={`/${stateSlug}/elections/${electionSlug}/analysis`}
                className={`${iss.bg} ${iss.border} border rounded-xl p-2 flex flex-col items-center justify-center text-center shadow-2xs`}
              >
                <div className="mb-1 flex items-center justify-center">
                  {iss.renderIcon()}
                </div>
                <span className="text-[11px] font-bold text-slate-800 line-clamp-2 leading-tight">
                  {iss.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
