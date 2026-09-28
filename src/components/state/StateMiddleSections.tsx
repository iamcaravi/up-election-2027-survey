"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Users,
  BarChart3,
  MapPin,
  Briefcase,
  GraduationCap,
  Sprout,
  ArrowRight,
  Plus,
  Minus,
  ChevronRight,
  Landmark,
  Building2,
  Users2,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { formatNumber } from "@/lib/utils";
import { StateMap } from "@/components/map/StateMap";
import { analysisScopePath } from "@/lib/routes";

export interface PriorityItem {
  label: string;
  pct: number;
  color: string;
}

interface StateMiddleSectionsProps {
  stateName: string;
  stateSlug: string;
  electionSlug: string;
  districtCount: number;
  constituencyCount: number;
  participantCount: number;
  surveyedAreasCount: number;
  priorities?: PriorityItem[];
}

function RoadIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 stroke-[#334155] fill-none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19L8 5h8l4 14" />
      <line x1="12" y1="9" x2="12" y2="11" />
      <line x1="12" y1="15" x2="12" y2="17" />
    </svg>
  );
}

function HealthIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 fill-[#ef4444]" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 7v10M7 12h10" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6 fill-[#2563eb]" aria-hidden="true">
      <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z" />
      <path d="M9 12l2 2 4-4" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const STATE_PROFILES: Record<
  string,
  {
    populationHi: string;
    populationEn: string;
    descHi: string;
    descEn: string;
  }
> = {
  "uttar-pradesh": {
    populationHi: "~ 24 करोड़ जनसंख्या (लगभग)",
    populationEn: "~ 240 Million Population (est.)",
    descHi:
      "उत्तर प्रदेश भारत का सबसे बड़ा राज्य है, जहाँ 403 विधानसभा क्षेत्र हैं। यह राज्य देश की राजनीति में महत्वपूर्ण भूमिका निभाता है और यहाँ के मतदाताओं की राय राष्ट्रीय राजनीति को भी प्रभावित करती है।",
    descEn:
      "Uttar Pradesh is India's most populous state with 403 legislative assembly constituencies, playing a pivotal role in national politics.",
  },
  "punjab": {
    populationHi: "~ 3 करोड़ जनसंख्या (लगभग)",
    populationEn: "~ 30 Million Population (est.)",
    descHi:
      "पंजाब भारत का एक प्रमुख उत्तरी राज्य है, जहाँ 117 विधानसभा क्षेत्र हैं। यहाँ के किसान, विकास और स्थानीय मुद्दे चुनाव में महत्वपूर्ण भूमिका निभाते हैं।",
    descEn:
      "Punjab is a key northern state with 117 legislative assembly constituencies, where agriculture, employment, and governance are key issues.",
  },
  "uttarakhand": {
    populationHi: "~ 1.1 करोड़ जनसंख्या (लगभग)",
    populationEn: "~ 11 Million Population (est.)",
    descHi:
      "उत्तराखंड एक प्रमुख हिमालयी राज्य है, जहाँ 70 विधानसभा क्षेत्र हैं। यहाँ पर्यटन, पर्यावरण, रोजगार और आधारभूत विकास मुख्य चुनावी मुद्दे हैं।",
    descEn:
      "Uttarakhand is a prominent Himalayan state with 70 legislative assembly constituencies, focused on infrastructure, tourism, and hill-region development.",
  },
  "goa": {
    populationHi: "~ 15 लाख जनसंख्या (लगभग)",
    populationEn: "~ 1.5 Million Population (est.)",
    descHi:
      "गोवा भारत का तटीय राज्य है, जहाँ 40 विधानसभा क्षेत्र हैं। यहाँ पर्यटन, पर्यावरण और स्थानीय आजीविका प्रमुख चुनावी विषय हैं।",
    descEn:
      "Goa is a coastal state with 40 legislative assembly constituencies, where tourism, governance, and environment drive voter choices.",
  },
  "manipur": {
    populationHi: "~ 32 लाख जनसंख्या (लगभग)",
    populationEn: "~ 3.2 Million Population (est.)",
    descHi:
      "मणिपुर पूर्वोत्तर भारत का एक महत्वपूर्ण राज्य है, जहाँ 60 विधानसभा क्षेत्र हैं। यहाँ शांति, सामाजिक सद्भाव, विकास और स्थानीय मुद्दे प्रमुख हैं।",
    descEn:
      "Manipur is an important northeastern state with 60 legislative assembly constituencies, centered on stability, peace, and economic growth.",
  },
  "himachal-pradesh": {
    populationHi: "~ 75 लाख जनसंख्या (लगभग)",
    populationEn: "~ 7.5 Million Population (est.)",
    descHi:
      "हिमाचल प्रदेश एक पहाड़ी राज्य है, जहाँ 68 विधानसभा क्षेत्र हैं। यहाँ सेब उत्पादक, पर्यटन, सड़क और रोजगार मुख्य चुनावी विषय हैं।",
    descEn:
      "Himachal Pradesh is a mountainous state with 68 legislative assembly constituencies, focused on horticulture, tourism, and infrastructure.",
  },
  "gujarat": {
    populationHi: "~ 7 करोड़ जनसंख्या (लगभग)",
    populationEn: "~ 70 Million Population (est.)",
    descHi:
      "गुजरात पश्चिमी भारत का एक प्रमुख औद्योगिक और व्यापारिक राज्य है, जहाँ 182 विधानसभा क्षेत्र हैं। यहाँ आर्थिक विकास और जन कल्याण महत्वपूर्ण मुद्दे हैं।",
    descEn:
      "Gujarat is a major industrial and economic powerhouse with 182 legislative assembly constituencies, focused on enterprise and public welfare.",
  },
};

const STATE_ANALYSIS_ARTICLES: Record<
  string,
  Array<{ titleHi: string; titleEn: string; dateHi: string; dateEn: string }>
> = {
  "uttar-pradesh": [
    {
      titleHi: "उत्तर प्रदेश में युवाओं की प्राथमिकताएं",
      titleEn: "Youth Priorities Across Uttar Pradesh",
      dateHi: "20 सित 2026",
      dateEn: "20 Sep 2026",
    },
    {
      titleHi: "पूर्वांचल में विकास बनाम रोजगार का मुद्दा",
      titleEn: "Purvanchal: Development vs Employment",
      dateHi: "18 सित 2026",
      dateEn: "18 Sep 2026",
    },
    {
      titleHi: "पश्चिमी उत्तर प्रदेश में जातीय समीकरण",
      titleEn: "Caste Dynamics & Electoral Trends in Western UP",
      dateHi: "16 सित 2026",
      dateEn: "16 Sep 2026",
    },
    {
      titleHi: "महिलाओं की भागीदारी और राजनीतिक रुझान",
      titleEn: "Women Participation & Electoral Sentiment",
      dateHi: "14 सित 2026",
      dateEn: "14 Sep 2026",
    },
  ],
  "punjab": [
    {
      titleHi: "पंजाब में किसानों और युवाओं की प्राथमिकताएं",
      titleEn: "Farmer and Youth Priorities Across Punjab",
      dateHi: "20 सित 2026",
      dateEn: "20 Sep 2026",
    },
    {
      titleHi: "मालवा और माझा में चुनावी समीकरण",
      titleEn: "Electoral Equations Across Malwa & Majha",
      dateHi: "18 सित 2026",
      dateEn: "18 Sep 2026",
    },
    {
      titleHi: "नशा मुक्ति और रोजगार का मुद्दा",
      titleEn: "Youth Employment and Welfare Focus",
      dateHi: "16 सित 2026",
      dateEn: "16 Sep 2026",
    },
    {
      titleHi: "ग्रामीण अर्थव्यवस्था और बुनियादी ढांचा",
      titleEn: "Rural Economy and Infrastructure Insights",
      dateHi: "14 सित 2026",
      dateEn: "14 Sep 2026",
    },
  ],
  "default": [
    {
      titleHi: "राज्य में युवाओं और मतदाताओं की प्राथमिकताएं",
      titleEn: "Voter & Youth Priorities in State",
      dateHi: "20 सित 2026",
      dateEn: "20 Sep 2026",
    },
    {
      titleHi: "विकास बनाम स्थानीय मुद्दों पर जनता की राय",
      titleEn: "Public Mood on Development and Local Issues",
      dateHi: "18 सित 2026",
      dateEn: "18 Sep 2026",
    },
    {
      titleHi: "क्षेत्रीय स्तर पर चुनावी समीकरण और रुझान",
      titleEn: "Regional Dynamics and Voter Sentiment",
      dateHi: "16 सित 2026",
      dateEn: "16 Sep 2026",
    },
    {
      titleHi: "महिलाओं और नए मतदाताओं की भागीदारी",
      titleEn: "Participation of Women and First-Time Voters",
      dateHi: "14 सित 2026",
      dateEn: "14 Sep 2026",
    },
  ],
};

export function StateMiddleSections({
  stateName,
  stateSlug,
  districtCount,
  constituencyCount,
  participantCount,
  surveyedAreasCount,
  priorities: propPriorities,
}: StateMiddleSectionsProps) {
  const { locale } = useLocale();
  const [zoomLevel, setZoomLevel] = useState(1);

  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.15, 1.4));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.15, 0.85));

  const handleMapClick = () => {
    const el = document.getElementById("district-explorer");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const defaultPriorities: PriorityItem[] = [
    { label: locale === "hi" ? "रोजगार और आर्थिक विकास" : "Employment & Growth", pct: 32, color: "bg-[#2563eb]" },
    { label: locale === "hi" ? "शिक्षा" : "Education", pct: 18, color: "bg-[#9333ea]" },
    { label: locale === "hi" ? "सड़क और आधारभूत संरचना" : "Roads & Infrastructure", pct: 16, color: "bg-[#f97316]" },
    { label: locale === "hi" ? "स्वास्थ्य सुविधाएं" : "Healthcare Facilities", pct: 12, color: "bg-[#22c55e]" },
    { label: locale === "hi" ? "कानून व्यवस्था" : "Law & Order", pct: 11, color: "bg-[#ef4444]" },
    { label: locale === "hi" ? "कृषि और किसान" : "Agriculture & Farmers", pct: 8, color: "bg-[#0ea5e9]" },
    { label: locale === "hi" ? "अन्य" : "Other", pct: 13, color: "bg-[#64748b]" },
  ];

  const priorities = propPriorities && propPriorities.length > 0 ? propPriorities : defaultPriorities;

  const issues = [
    {
      id: "employment",
      label: locale === "hi" ? "रोजगार" : "Employment",
      renderIcon: () => <Briefcase size={22} className="text-[#ea580c]" />,
      bg: "bg-[#fff7ed]",
      border: "border-orange-200/80",
    },
    {
      id: "education",
      label: locale === "hi" ? "शिक्षा" : "Education",
      renderIcon: () => <GraduationCap size={22} className="text-[#9333ea]" />,
      bg: "bg-[#faf5ff]",
      border: "border-purple-200/80",
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
      border: "border-red-200/80",
    },
    {
      id: "law",
      label: locale === "hi" ? "कानून व्यवस्था" : "Law & Order",
      renderIcon: () => <ShieldIcon />,
      bg: "bg-[#eff6ff]",
      border: "border-blue-200/80",
    },
    {
      id: "agri",
      label: locale === "hi" ? "कृषि" : "Agriculture",
      renderIcon: () => <Sprout size={22} className="text-[#16a34a]" />,
      bg: "bg-[#f0fdf4]",
      border: "border-emerald-200/80",
    },
  ];

  const articlesData =
    STATE_ANALYSIS_ARTICLES[stateSlug] || STATE_ANALYSIS_ARTICLES["default"];

  const analysisArticles = articlesData.map((art) => ({
    title: locale === "hi" ? art.titleHi : art.titleEn,
    date: locale === "hi" ? art.dateHi : art.dateEn,
    href: analysisScopePath({ state: stateSlug }),
  }));

  const isUp = stateSlug === "uttar-pradesh";
  const profile =
    STATE_PROFILES[stateSlug] || {
      populationHi: "~ 2 करोड़ जनसंख्या (लगभग)",
      populationEn: "~ 20 Million Population (est.)",
      descHi: `${stateName} में ${formatNumber(constituencyCount)} विधानसभा क्षेत्र हैं, जहाँ विभिन्न मुद्दों पर जनता की सक्रिय राय दर्ज की जा रही है।`,
      descEn: `${stateName} has ${formatNumber(constituencyCount)} legislative assembly constituencies with active public survey participation.`,
    };

  return (
    <div className="w-full">
      {/* ======================================================== */}
      {/* DESKTOP LAYOUT: Exactly 2 rows x 3 cards (Matching Reference Image) */}
      {/* ======================================================== */}
      <div className="hidden lg:flex flex-col gap-4 xl:gap-5 py-3 pb-8">
        {/* Row 1: Summary, Priorities, Key Issues */}
        <div className="grid grid-cols-3 gap-4 xl:gap-5">
          {/* Card 1: Survey Summary */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-lg xl:text-xl text-slate-900 tracking-tight">
                {locale === "hi" ? `${stateName} सर्वे का सार` : `${stateName} Survey Summary`}
              </h3>
              <p className="text-xs xl:text-sm text-slate-500 mt-1">
                {locale === "hi"
                  ? "अब तक के प्राप्त सर्वे के आधार पर प्रमुख जानकारी"
                  : "Key insights based on public survey participation to date"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              {/* Stat 1: Participants */}
              <div className="bg-emerald-50/50 rounded-xl p-3.5 border border-emerald-100/50 flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-lg bg-emerald-100/70 text-emerald-600 flex items-center justify-center mb-1.5">
                  <Users size={18} />
                </div>
                <span className="text-2xl xl:text-3xl font-black text-slate-900 leading-none">
                  {formatNumber(participantCount)}
                </span>
                <span className="text-xs xl:text-sm text-slate-600 font-semibold mt-1.5">
                  {locale === "hi" ? "कुल प्रतिभागी" : "Participants"}
                </span>
              </div>

              {/* Stat 2: Constituencies */}
              <div className="bg-purple-50/50 rounded-xl p-3.5 border border-purple-100/50 flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-lg bg-purple-100/70 text-purple-600 flex items-center justify-center mb-1.5">
                  <BarChart3 size={18} />
                </div>
                <span className="text-2xl xl:text-3xl font-black text-slate-900 leading-none">
                  {formatNumber(constituencyCount)}
                </span>
                <span className="text-xs xl:text-sm text-slate-600 font-semibold mt-1.5">
                  {locale === "hi" ? "विधानसभा क्षेत्र" : "Constituencies"}
                </span>
              </div>

              {/* Stat 3: Surveyed Areas */}
              <div className="bg-orange-50/50 rounded-xl p-3.5 border border-orange-100/50 flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-lg bg-orange-100/70 text-orange-600 flex items-center justify-center mb-1.5">
                  <Users size={18} />
                </div>
                <span className="text-2xl xl:text-3xl font-black text-slate-900 leading-none">
                  {formatNumber(surveyedAreasCount)}
                </span>
                <span className="text-xs xl:text-sm text-slate-600 font-semibold mt-1.5 truncate">
                  {locale === "hi" ? "सर्वे किए गए क्षेत्र" : "Surveyed Areas"}
                </span>
              </div>

              {/* Stat 4: Districts */}
              <div className="bg-blue-50/50 rounded-xl p-3.5 border border-blue-100/50 flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-lg bg-blue-100/70 text-blue-600 flex items-center justify-center mb-1.5">
                  <MapPin size={18} />
                </div>
                <span className="text-2xl xl:text-3xl font-black text-slate-900 leading-none">
                  {formatNumber(districtCount)}
                </span>
                <span className="text-xs xl:text-sm text-slate-600 font-semibold mt-1.5">
                  {locale === "hi" ? "कुल जिले" : "Districts"}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Voter Priorities */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-lg xl:text-xl text-slate-900 tracking-tight">
                {locale === "hi" ? "मतदाताओं की मुख्य प्राथमिकताएं" : "Voter Priorities"}
              </h3>
              <p className="text-xs xl:text-sm text-slate-500 mt-1">
                {locale === "hi" ? "सर्वे में दर्ज शीर्ष मुद्दे" : "Top ranked survey issues"}
              </p>
            </div>

            <div className="flex flex-col gap-2.5 mt-3.5">
              {priorities.map((item) => (
                <div key={item.label} className="flex items-center gap-2.5 xl:gap-3">
                  <span className="w-36 xl:w-42 text-xs xl:text-sm font-semibold text-slate-700 truncate">
                    {item.label}
                  </span>
                  <div className="flex-1 h-3.5 bg-slate-100 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                      style={{ width: `${Math.min(item.pct * 2.5, 100)}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs xl:text-sm font-bold text-slate-800">
                    {item.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Key Issues */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-lg xl:text-xl text-slate-900 tracking-tight">
                  {locale === "hi" ? "मुख्य मुद्दे" : "Key Issues"}
                </h3>
                <p className="text-xs xl:text-sm text-slate-500 mt-1">
                  {locale === "hi" ? "मुद्दों के आधार पर विश्लेषण" : "Explore issue analysis"}
                </p>
              </div>
              <Link
                href={analysisScopePath({ state: stateSlug })}
                className="text-xs xl:text-sm font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/80 transition-colors"
              >
                <span>{locale === "hi" ? "सभी मुद्दे देखें" : "All Issues"}</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2.5 mt-4">
              {issues.map((iss) => (
                <Link
                  key={iss.id}
                  href={analysisScopePath({ state: stateSlug })}
                  className={`${iss.bg} ${iss.border} border rounded-xl p-3 flex flex-col items-center justify-center text-center hover:scale-[1.02] transition-transform shadow-2xs group cursor-pointer`}
                >
                  <div className="mb-1.5 flex items-center justify-center">
                    {iss.renderIcon()}
                  </div>
                  <span className="text-xs xl:text-sm font-bold text-slate-800 line-clamp-2 leading-tight">
                    {iss.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: Map, About, Analysis */}
        <div className="grid grid-cols-3 gap-4 xl:gap-5">
          {/* Card 4: Interactive Map */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-lg xl:text-xl text-slate-900 tracking-tight">
                {locale === "hi" ? "मानचित्र से अपना क्षेत्र खोजें" : "Explore Constituency via Map"}
              </h3>
              <p className="text-xs xl:text-sm text-slate-500 mt-1">
                {locale === "hi"
                  ? `${stateName} के मानचित्र पर किसी जिले को चुनें और वहाँ के विधानसभा क्षेत्रों का सर्वे देखें।`
                  : `Select a district on the map to view constituency-level survey insights.`}
              </p>
            </div>

            <div className="relative flex items-center justify-between gap-2 mt-4 min-h-[170px]">
              {/* Zoom Controls */}
              <div className="flex flex-col rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden z-10 shrink-0">
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
                {isUp ? (
                  <Image
                    src="/images/maps/up-interactive-color-map.png"
                    alt={`${stateName} District Participation Map`}
                    width={140}
                    height={125}
                    priority
                    unoptimized
                    className="w-auto h-[125px] sm:h-[135px] object-contain drop-shadow-xs"
                  />
                ) : (
                  <StateMap
                    slug={stateSlug}
                    className="w-auto h-[125px] sm:h-[135px] object-contain text-blue-500 drop-shadow-xs"
                    fill="#3b82f6"
                  />
                )}
              </div>

              {/* Legend */}
              <div className="flex flex-col gap-2 shrink-0 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                <span className="text-xs xl:text-sm font-bold text-slate-800">
                  {locale === "hi" ? "सर्वे की स्थिति" : "Survey Status"}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
                  <span className="text-xs xl:text-[13px] text-slate-600 font-medium">
                    {locale === "hi" ? "उच्च सहभागिता" : "High"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                  <span className="text-xs xl:text-[13px] text-slate-600 font-medium">
                    {locale === "hi" ? "मध्यम सहभागिता" : "Medium"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#a855f7]" />
                  <span className="text-xs xl:text-[13px] text-slate-600 font-medium">
                    {locale === "hi" ? "कम सहभागिता" : "Low"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#60a5fa]" />
                  <span className="text-xs xl:text-[13px] text-slate-600 font-medium">
                    {locale === "hi" ? "अभी शुरू नहीं" : "Not Started"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: About State */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-lg xl:text-xl text-slate-900 tracking-tight">
                {locale === "hi" ? `${stateName} के बारे में` : `About ${stateName}`}
              </h3>
              <p className="text-sm xl:text-base text-slate-600 mt-2 leading-relaxed">
                {locale === "hi" ? profile.descHi : profile.descEn}
              </p>
            </div>

            <div className="flex flex-col gap-2.5 mt-4">
              <div className="flex items-center gap-2.5 text-sm xl:text-base text-slate-700 font-medium">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Landmark size={17} />
                </div>
                <span>
                  {formatNumber(districtCount)} {locale === "hi" ? "जिले" : "Districts"}
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-sm xl:text-base text-slate-700 font-medium">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Building2 size={17} />
                </div>
                <span>
                  {formatNumber(constituencyCount)}{" "}
                  {locale === "hi" ? "विधानसभा क्षेत्र" : "Assembly Constituencies"}
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-sm xl:text-base text-slate-700 font-medium">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Users2 size={17} />
                </div>
                <span>{locale === "hi" ? profile.populationHi : profile.populationEn}</span>
              </div>

              <Link
                href={analysisScopePath({ state: stateSlug })}
                className="mt-2 inline-flex items-center justify-center gap-1.5 border border-blue-200 text-blue-600 hover:bg-blue-50/60 rounded-xl px-4 py-2.5 font-semibold text-sm xl:text-base transition-colors"
              >
                <span>{locale === "hi" ? "राज्य का पूरा प्रोफाइल देखें" : "View Full State Profile"}</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* Card 6: Recent Analysis */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-lg xl:text-xl text-slate-900 tracking-tight">
                  {locale === "hi" ? "हाल के विश्लेषण" : "Recent Analysis"}
                </h3>
                <p className="text-xs xl:text-sm text-slate-500 mt-1">
                  {locale === "hi" ? "विशेषज्ञ चुनावी विश्लेषण" : "Expert electoral analysis"}
                </p>
              </div>
              <Link
                href={analysisScopePath({ state: stateSlug })}
                className="text-xs xl:text-sm font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/80 transition-colors"
              >
                <span>{locale === "hi" ? "सभी विश्लेषण देखें" : "All Analysis"}</span>
                <ArrowRight size={13} />
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
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm1 9h-6V9h6v2zm-6 4h6v-2h-6v2zm0 4h3v-2h-3v2z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm xl:text-base text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                        {art.title}
                      </p>
                      <p className="text-xs xl:text-[13px] text-slate-500 mt-0.5">{art.date}</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-600 shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MOBILE LAYOUT: Ordered matching Reference Image Exactly */}
      {/* 1. उत्तर प्रदेश सर्वे का सार (4 horizontal stats in 1 row) */}
      {/* 2. मानचित्र से अपना क्षेत्र खोजें (with circle arrow) */}
      {/* 3. मुख्य मुद्दे (4 items horizontal) */}
      {/* 4. हाल के विश्लेषण */}
      {/* ======================================================== */}
      <div className="lg:hidden flex flex-col gap-3.5 py-2 pb-8">
        {/* Mobile 1: उत्तर प्रदेश सर्वे का सार */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3.5 sm:p-4">
          <h3 className="font-bold text-lg text-slate-900 tracking-tight mb-2.5">
            {locale === "hi" ? `${stateName} सर्वे का सार` : `${stateName} Survey Summary`}
          </h3>

          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            <div className="min-w-0 bg-emerald-50/60 rounded-xl p-2 border border-emerald-100/50 flex flex-col items-center text-center">
              <div className="w-7 h-7 rounded-lg bg-emerald-100/80 text-emerald-600 flex items-center justify-center mb-1">
                <Users size={15} />
              </div>
              <span className="text-sm sm:text-base font-black text-slate-900 leading-tight truncate w-full">
                {formatNumber(participantCount)}
              </span>
              <span className="text-xs text-slate-600 font-semibold mt-0.5 truncate w-full">
                {locale === "hi" ? "प्रतिभागी" : "Voters"}
              </span>
            </div>

            <div className="min-w-0 bg-purple-50/60 rounded-xl p-2 border border-purple-100/50 flex flex-col items-center text-center">
              <div className="w-7 h-7 rounded-lg bg-purple-100/80 text-purple-600 flex items-center justify-center mb-1">
                <BarChart3 size={15} />
              </div>
              <span className="text-sm sm:text-base font-black text-slate-900 leading-tight truncate w-full">
                {formatNumber(constituencyCount)}
              </span>
              <span className="text-xs text-slate-600 font-semibold mt-0.5 truncate w-full">
                {locale === "hi" ? "विधानसभा" : "Seats"}
              </span>
            </div>

            <div className="min-w-0 bg-orange-50/60 rounded-xl p-2 border border-orange-100/50 flex flex-col items-center text-center">
              <div className="w-7 h-7 rounded-lg bg-orange-100/80 text-orange-600 flex items-center justify-center mb-1">
                <Users size={15} />
              </div>
              <span className="text-sm sm:text-base font-black text-slate-900 leading-tight truncate w-full">
                {formatNumber(surveyedAreasCount)}
              </span>
              <span className="text-xs text-slate-600 font-semibold mt-0.5 truncate w-full">
                {locale === "hi" ? "क्षेत्र" : "Covered"}
              </span>
            </div>

            <div className="min-w-0 bg-blue-50/60 rounded-xl p-2 border border-blue-100/50 flex flex-col items-center text-center">
              <div className="w-7 h-7 rounded-lg bg-blue-100/80 text-blue-600 flex items-center justify-center mb-1">
                <MapPin size={15} />
              </div>
              <span className="text-sm sm:text-base font-black text-slate-900 leading-tight truncate w-full">
                {formatNumber(districtCount)}
              </span>
              <span className="text-xs text-slate-600 font-semibold mt-0.5 truncate w-full">
                {locale === "hi" ? "जिले" : "Districts"}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile 2: मानचित्र से अपना क्षेत्र खोजें */}
        <div
          onClick={handleMapClick}
          className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3.5 sm:p-4 cursor-pointer"
        >
          <h3 className="font-bold text-lg text-slate-900 tracking-tight mb-2">
            {locale === "hi" ? "मानचित्र से अपना क्षेत्र खोजें" : "Explore via Map"}
          </h3>
          <div className="flex items-center justify-between gap-3 py-1">
            <div className="flex-1 flex items-center justify-center">
              {isUp ? (
                <Image
                  src="/images/maps/up-interactive-color-map.png"
                  alt={`${stateName} Map`}
                  width={150}
                  height={120}
                  priority
                  unoptimized
                  className="w-auto h-[110px] object-contain drop-shadow-xs"
                />
              ) : (
                <StateMap
                  slug={stateSlug}
                  className="w-auto h-[110px] object-contain text-blue-500 drop-shadow-xs"
                  fill="#3b82f6"
                />
              )}
            </div>
            {/* Circle arrow button matching reference image */}
            <div className="w-9 h-9 rounded-full border border-blue-200 bg-white flex items-center justify-center text-blue-600 shadow-xs shrink-0">
              <ChevronRight size={18} />
            </div>
          </div>
        </div>

        {/* Mobile 3: मुख्य मुद्दे (matching reference image) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3.5 sm:p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-lg text-slate-900 tracking-tight">
              {locale === "hi" ? "मुख्य मुद्दे" : "Key Issues"}
            </h3>
            <Link
              href={analysisScopePath({ state: stateSlug })}
              className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80"
            >
              <span>{locale === "hi" ? "सभी मुद्दे देखें" : "View All"}</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {issues.slice(0, 4).map((iss) => (
              <Link
                key={iss.id}
                href={analysisScopePath({ state: stateSlug })}
                className={`${iss.bg} ${iss.border} border rounded-xl p-2 sm:p-2.5 flex flex-col items-center justify-center text-center shadow-2xs`}
              >
                <div className="mb-1.5 flex items-center justify-center">
                  {iss.renderIcon()}
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2 leading-tight">
                  {iss.label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Mobile 4: हाल के विश्लेषण (matching reference image) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3.5 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-lg text-slate-900 tracking-tight">
              {locale === "hi" ? "हाल के विश्लेषण" : "Recent Analysis"}
            </h3>
            <Link
              href={analysisScopePath({ state: stateSlug })}
              className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80 inline-flex items-center gap-1"
            >
              <span>{locale === "hi" ? "सभी देखें" : "View All"}</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="flex flex-col divide-y divide-slate-100">
            {analysisArticles.slice(0, 3).map((art) => (
              <Link
                key={art.title}
                href={art.href}
                className="py-2.5 flex items-center justify-between gap-2 group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm1 9h-6V9h6v2zm-6 4h6v-2h-6v2zm0 4h3v-2h-3v2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-slate-900 truncate">
                      {art.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{art.date}</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
