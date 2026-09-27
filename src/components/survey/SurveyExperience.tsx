"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart2,
  BarChart3,
  Check,
  Copy,
  Droplets,
  GraduationCap,
  Heart,
  HeartPulse,
  Landmark,
  Leaf,
  Loader2,
  Lock,
  Megaphone,
  MoreHorizontal,
  Shield,
  ShieldCheck,
  Smile,
  Frown,
  Meh,
  Share2,
  Target,
  Users,
  Briefcase,
  Users2,
  Ban,
  TrendingUp,
  Route,
  Zap,
  Wheat,
  Bus,
  Waves,
  HelpCircle,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { getDeviceFingerprint } from "@/lib/fingerprint";
import { cn } from "@/lib/utils";
import type { CurrentMlaInfo } from "@/lib/current-mla";

export interface SurveyOptionItem {
  key: string;
  label: string;
  labelHi?: string | null;
  abbreviation?: string | null;
  logoUrl?: string | null;
  colorHex?: string | null;
  icon?: string;
}

export interface SurveyExperienceProps {
  surveyId: string;
  constituencyName: string;
  constituencyNumber?: number;
  districtName?: string;
  districtSlug?: string;
  stateName?: string;
  stateSlug?: string;
  electionYear?: number;
  validResponseCount?: number;
  basePath: string;
  constituencySlug: string;
  parties: SurveyOptionItem[];
  issues: SurveyOptionItem[];
  ageGroups: SurveyOptionItem[];
  genders: SurveyOptionItem[];
  socialCategories: SurveyOptionItem[];
  religions: SurveyOptionItem[];
  currentMla?: CurrentMlaInfo | null;
}

// 7 questions tracked in state
const QUESTION_KEYS = [
  "mla_satisfaction",
  "party_preference",
  "top_issue",
  "age_group",
  "gender",
  "social_category",
  "religion",
] as const;
type QuestionKey = (typeof QUESTION_KEYS)[number];
type SingleAnswerKey = Exclude<QuestionKey, "top_issue">;

const PAGE_KEYS = [
  "mla_satisfaction",
  "party_preference",
  "top_issue",
  "personal_info",
] as const;
type PageKey = (typeof PAGE_KEYS)[number];

// MLA satisfaction options matching Reference 1
const MLA_OPTIONS = [
  {
    key: "satisfied",
    label: "हाँ, बहुत खुश हूँ",
    labelEn: "Yes, Very Satisfied",
    color: "#16a34a",
    bgClass: "bg-[#f0fdf4] border-[#bbf7d0] hover:border-emerald-300",
    selectedClass: "border-emerald-500 bg-[#e7faec] ring-1 ring-emerald-500/30",
    icon: Smile,
    iconColor: "text-emerald-600 bg-emerald-100",
  },
  {
    key: "somewhat_satisfied",
    label: "कुछ हद तक खुश हूँ",
    labelEn: "Somewhat Satisfied",
    color: "#2563eb",
    bgClass: "bg-[#eff6ff] border-[#bfdbfe] hover:border-blue-300",
    selectedClass: "border-blue-500 bg-[#e3efff] ring-1 ring-blue-500/30",
    icon: Smile,
    iconColor: "text-blue-600 bg-blue-100",
  },
  {
    key: "dissatisfied",
    label: "नहीं, खुश नहीं हूँ",
    labelEn: "No, Dissatisfied",
    color: "#ea580c",
    bgClass: "bg-[#fff7ed] border-[#fed7aa] hover:border-orange-300",
    selectedClass: "border-orange-500 bg-[#ffedd5] ring-1 ring-orange-500/30",
    icon: Frown,
    iconColor: "text-orange-600 bg-orange-100",
  },
  {
    key: "undecided",
    label: "कह नहीं सकते",
    labelEn: "Can't Say",
    color: "#e11d48",
    bgClass: "bg-[#fff1f2] border-[#fecdd3] hover:border-rose-300",
    selectedClass: "border-rose-500 bg-[#ffe4e6] ring-1 ring-rose-500/30",
    icon: Meh,
    iconColor: "text-rose-600 bg-rose-100",
  },
];

// Custom SVG Icons matching exact visual references
function RoadIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 19L8 5M20 19L16 5M12 6v3M12 12v3M12 18v2" />
    </svg>
  );
}

function GenderIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="8.5" r="5" />
      <path d="M12 13.5v7.5M9 18h6" />
    </svg>
  );
}

function PrayerHandsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 3v18" />
      <path d="M12 5.5c-1.8 1.8-2.8 4-2.8 6.5s1 4.7 2.8 6.5" />
      <path d="M12 5.5c1.8 1.8 2.8 4 2.8 6.5s-1 4.7-2.8 6.5" />
      <path d="M6.5 12c0 3 1.2 5 2.7 6.5" />
      <path d="M17.5 12c0 3-1.2 5-2.7 6.5" />
    </svg>
  );
}

// Q3 Issue Meta: exact titles, subtitles, icons, icon-bg & borders matching Reference 1
const ISSUE_META: Record<
  string,
  {
    title: string;
    subtitle: string;
    icon: any;
    iconColor: string;
    iconBg: string;
    border: string;
    hoverBorder: string;
  }
> = {
  rojgar: {
    title: "रोजगार",
    subtitle: "अधिक अवसर, बेहतर भविष्य",
    icon: Briefcase,
    iconColor: "text-[#2563eb]",
    iconBg: "bg-[#e0edff]",
    border: "border-[#93c5fd]",
    hoverBorder: "hover:border-blue-400",
  },
  mahangai: {
    title: "महंगाई",
    subtitle: "कीमतों पर नियंत्रण",
    icon: TrendingUp,
    iconColor: "text-[#16a34a]",
    iconBg: "bg-[#dcfce7]",
    border: "border-[#86efac]",
    hoverBorder: "hover:border-emerald-400",
  },
  sadak: {
    title: "सड़क",
    subtitle: "बेहतर सड़क और बुनियादी ढांचा",
    icon: RoadIcon,
    iconColor: "text-[#d97706]",
    iconBg: "bg-[#fef3c7]",
    border: "border-[#fde047]",
    hoverBorder: "hover:border-amber-400",
  },
  bijli: {
    title: "बिजली",
    subtitle: "निश्चित और सस्ती बिजली",
    icon: Zap,
    iconColor: "text-[#9333ea]",
    iconBg: "bg-[#f3e8ff]",
    border: "border-[#d8b4fe]",
    hoverBorder: "hover:border-purple-400",
  },
  pani: {
    title: "पानी",
    subtitle: "स्वच्छ पेयजल और जलापूर्ति",
    icon: Droplets,
    iconColor: "text-[#0284c7]",
    iconBg: "bg-[#e0f2fe]",
    border: "border-[#7dd3fc]",
    hoverBorder: "hover:border-sky-400",
  },
  shiksha: {
    title: "शिक्षा",
    subtitle: "बेहतर शिक्षा, उज्ज्वल भविष्य",
    icon: GraduationCap,
    iconColor: "text-[#e11d48]",
    iconBg: "bg-[#fce7f3]",
    border: "border-[#f472b6]",
    hoverBorder: "hover:border-rose-400",
  },
  swasthya: {
    title: "स्वास्थ्य",
    subtitle: "अच्छी स्वास्थ्य सुविधाएँ",
    icon: HeartPulse,
    iconColor: "text-[#dc2626]",
    iconBg: "bg-[#ffe4e6]",
    border: "border-[#fca5a5]",
    hoverBorder: "hover:border-red-400",
  },
  kanoon_vyavastha: {
    title: "कानून-व्यवस्था",
    subtitle: "सुरक्षित और शांतिपूर्ण समाज",
    icon: ShieldCheck,
    iconColor: "text-[#059669]",
    iconBg: "bg-[#d1fae5]",
    border: "border-[#6ee7b7]",
    hoverBorder: "hover:border-emerald-400",
  },
  krishi: {
    title: "कृषि",
    subtitle: "किसानों के लिए बेहतर नीतियाँ",
    icon: Wheat,
    iconColor: "text-[#db2777]",
    iconBg: "bg-[#fdf2f8]",
    border: "border-[#f9a8d4]",
    hoverBorder: "hover:border-pink-400",
  },
  parivahan: {
    title: "परिवहन",
    subtitle: "बेहतर सार्वजनिक परिवहन सुविधा",
    icon: Bus,
    iconColor: "text-[#4f46e5]",
    iconBg: "bg-[#e0e7ff]",
    border: "border-[#a5b4fc]",
    hoverBorder: "hover:border-indigo-400",
  },
  jal_nikasi: {
    title: "जल निकासी",
    subtitle: "बेहतर नाली और बाढ़ नियंत्रण",
    icon: Waves,
    iconColor: "text-[#0891b2]",
    iconBg: "bg-[#cffafe]",
    border: "border-[#67e8f9]",
    hoverBorder: "hover:border-cyan-400",
  },
  other: {
    title: "अन्य",
    subtitle: "कोई अन्य मुद्दा",
    icon: MoreHorizontal,
    iconColor: "text-[#64748b]",
    iconBg: "bg-[#f1f5f9]",
    border: "border-[#cbd5e1]",
    hoverBorder: "hover:border-slate-400",
  },
};

const Q3_ORDER = [
  "rojgar",
  "mahangai",
  "sadak",
  "bijli",
  "pani",
  "shiksha",
  "swasthya",
  "kanoon_vyavastha",
  "krishi",
  "parivahan",
  "jal_nikasi",
  "other",
];

// Q4 ordering and display label mappings matching Reference 2
const Q4_DISPLAY_LABELS: Record<string, string> = {
  // Age
  "18-24": "18–24",
  "25-34": "25–34",
  "35-44": "35–44",
  "45-54": "45–54",
  "55-64": "55–64",
  "65+": "65+",

  // Gender
  male: "पुरुष",
  female: "महिला",
  other: "अन्य",

  // Social Category
  general: "सामान्य",
  obc: "ओबीसी",
  sc: "एससी",
  st: "एसटी",

  // Religion
  hindu: "हिंदू",
  muslim: "मुस्लिम",
  sikh: "सिख",
  christian: "ईसाई",
  buddhist: "बौद्ध",
  jain: "जैन",

  // Shared
  prefer_not_to_say: "बताना नहीं चाहते",
  undisclosed: "बताना नहीं चाहते",
  "prefer not to say": "बताना नहीं चाहते",
};

const AGE_ORDER = ["18-24", "25-34", "35-44", "45-54", "55-64", "65+", "prefer_not_to_say"];
const GENDER_ORDER = ["male", "female", "other", "prefer_not_to_say"];
const SOCIAL_ORDER = ["general", "obc", "sc", "st", "prefer_not_to_say"];
const RELIGION_ORDER = [
  "hindu",
  "muslim",
  "sikh",
  "christian",
  "buddhist",
  "jain",
  "other",
  "prefer_not_to_say",
];

function prepareDemographicOptions(
  list: SurveyOptionItem[],
  order: string[]
): Array<{ key: string; labelDisplay: string }> {
  // Ensure "prefer_not_to_say" exists
  const hasPreferNotToSay = list.some(
    (o) =>
      o.key.toLowerCase() === "prefer_not_to_say" ||
      o.key.toLowerCase() === "undisclosed" ||
      (o.label || "").toLowerCase().includes("prefer")
  );
  const fullList = hasPreferNotToSay
    ? list
    : [
        ...list,
        {
          key: "prefer_not_to_say",
          label: "बताना नहीं चाहते",
          labelHi: "बताना नहीं चाहते",
        },
      ];

  const sorted = [...fullList].sort((a, b) => {
    const ia = order.indexOf(a.key.toLowerCase());
    const ib = order.indexOf(b.key.toLowerCase());
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  return sorted.map((opt) => {
    const keyNorm = opt.key.toLowerCase().trim();
    const labelDisplay =
      Q4_DISPLAY_LABELS[keyNorm] ||
      (opt.labelHi && opt.labelHi !== opt.label ? opt.labelHi : opt.label);
    return {
      key: opt.key,
      labelDisplay,
    };
  });
}

// Hindi localization mappings for survey options
const HINDI_OPTION_LABELS: Record<string, string> = {
  // Genders
  male: "पुरुष",
  female: "महिला",
  other: "अन्य",
  prefer_not_to_say: "बताना नहीं चाहते",
  undisclosed: "बताना नहीं चाहते",
  "prefer not to say": "बताना नहीं चाहते",

  // Social Categories
  general: "सामान्य",
  obc: "ओबीसी",
  sc: "एससी",
  st: "एसटी",

  // Religions
  hindu: "हिंदू",
  muslim: "मुस्लिम",
  sikh: "सिख",
  christian: "ईसाई",
  jain: "जैन",
  buddhist: "बौद्ध",

  // Age Groups
  "18-25": "18-25 वर्ष",
  "26-35": "26-35 वर्ष",
  "36-50": "36-50 वर्ष",
  "50+": "50+ वर्ष",
  "51+": "50+ वर्ष",
  "50_plus": "50+ वर्ष",
  "above_50": "50+ वर्ष",
  "18-25 years": "18-25 वर्ष",
  "26-35 years": "26-35 वर्ष",
  "36-50 years": "36-50 वर्ष",
  "50+ years": "50+ वर्ष",
};

function getLocalizedOptionLabel(opt: SurveyOptionItem, locale: string): string {
  if (locale === "hi") {
    if (opt.labelHi) return opt.labelHi;
    const keyNorm = (opt.key || "").toLowerCase().trim();
    if (HINDI_OPTION_LABELS[keyNorm]) return HINDI_OPTION_LABELS[keyNorm];
    const labelNorm = (opt.label || "").toLowerCase().trim();
    if (HINDI_OPTION_LABELS[labelNorm]) return HINDI_OPTION_LABELS[labelNorm];

    if (keyNorm.includes("female") || labelNorm.includes("female")) return "महिला";
    if (keyNorm.includes("male") || labelNorm.includes("male")) return "पुरुष";
    if (keyNorm.includes("general") || labelNorm.includes("general")) return "सामान्य";
    if (keyNorm.includes("obc") || labelNorm.includes("obc")) return "ओबीसी";
    if (keyNorm.includes("sc") || labelNorm.includes("sc")) return "एससी";
    if (keyNorm.includes("st") || labelNorm.includes("st")) return "एसटी";
    if (keyNorm.includes("hindu") || labelNorm.includes("hindu")) return "हिंदू";
    if (keyNorm.includes("muslim") || labelNorm.includes("muslim")) return "मुस्लिम";
    if (keyNorm.includes("sikh") || labelNorm.includes("sikh")) return "सिख";
    if (keyNorm.includes("christian") || labelNorm.includes("christian")) return "ईसाई";
    if (keyNorm.includes("jain") || labelNorm.includes("jain")) return "जैन";
    if (keyNorm.includes("buddhist") || labelNorm.includes("buddhist")) return "बौद्ध";
    if (
      keyNorm.includes("prefer") ||
      keyNorm.includes("undisclosed") ||
      labelNorm.includes("prefer")
    ) {
      return "बताना नहीं चाहते";
    }
    if (keyNorm.includes("other") || labelNorm.includes("other")) return "अन्य";

    // Age groups
    if (keyNorm.includes("18") && keyNorm.includes("25")) return "18-25 वर्ष";
    if (keyNorm.includes("26") && keyNorm.includes("35")) return "26-35 वर्ष";
    if (keyNorm.includes("36") && keyNorm.includes("50")) return "36-50 वर्ष";
    if (keyNorm.includes("50") || keyNorm.includes("51")) return "50+ वर्ष";
  }
  return opt.labelHi && locale === "hi" ? opt.labelHi : opt.label;
}

export function SurveyExperience({
  surveyId,
  constituencyName,
  constituencyNumber,
  districtName = "गोंडा",
  districtSlug = "gonda",
  stateName = "उत्तर प्रदेश",
  stateSlug = "uttar-pradesh",
  electionYear = 2027,
  validResponseCount = 20,
  basePath,
  constituencySlug,
  parties,
  issues,
  ageGroups,
  genders,
  socialCategories,
  religions,
  currentMla,
}: SurveyExperienceProps) {
  const { t, locale } = useLocale();
  const router = useRouter();

  const [pageIndex, setPageIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<SingleAnswerKey, string | undefined>>({
    mla_satisfaction: undefined,
    party_preference: undefined,
    age_group: undefined,
    gender: undefined,
    social_category: undefined,
    religion: undefined,
  });
  // Q3 multi-select array
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const resultsHref = `${basePath}/constituencies/${constituencySlug}/results`;

  const mlaName =
    (locale === "hi" && currentMla?.nameHindi?.trim())
      ? currentMla.nameHindi.trim()
      : currentMla?.name?.trim() &&
        currentMla.name.trim().toLowerCase() !== "null" &&
        currentMla.name.trim().toLowerCase() !== "undefined"
      ? currentMla.name.trim()
      : null;

  const pageKey: PageKey = PAGE_KEYS[pageIndex];
  const progressPct = (pageIndex + 1) * 25;

  const canAdvance =
    pageKey === "mla_satisfaction"
      ? Boolean(answers.mla_satisfaction)
      : pageKey === "party_preference"
      ? Boolean(answers.party_preference)
      : true;

  function selectSingle(key: SingleAnswerKey, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function toggleIssue(key: string) {
    setSelectedIssues((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  async function handlePrimary() {
    if (!canAdvance || submitting) return;
    if (pageIndex < PAGE_KEYS.length - 1) {
      setPageIndex((i) => i + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    await submit();
  }

  function handleBack() {
    if (pageIndex > 0) {
      setPageIndex((i) => i - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const singleAnswerKeys = QUESTION_KEYS.filter(
        (key): key is SingleAnswerKey =>
          key !== "top_issue" && Boolean(answers[key as SingleAnswerKey])
      );
      const payload = [
        ...singleAnswerKeys.map((key) => ({
          questionKey: key,
          optionKey: answers[key] as string,
        })),
        ...selectedIssues.map((issueKey) => ({
          questionKey: "top_issue",
          optionKey: issueKey,
        })),
      ];
      const response = await fetch(`/api/surveys/${surveyId}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payload, fingerprint: getDeviceFingerprint() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? "सर्वे दर्ज करने में समस्या आई। कृपया पुनः प्रयास करें।");
        return;
      }
      setDone(true);
      window.scrollTo({ top: 0, behavior: "instant" });
    } catch {
      setError("नेटवर्क त्रुटि। कृपया अपना इंटरनेट कनेक्शन जांचें।");
    } finally {
      setSubmitting(false);
    }
  }

  // Stepper definition
  const stepperItems = [
    {
      step: 1,
      title: "प्रश्न 1",
      subtitle: "वर्तमान विधायक से संतुष्टि",
    },
    {
      step: 2,
      title: "प्रश्न 2",
      subtitle: "वोट प्राथमिकता",
    },
    {
      step: 3,
      title: "प्रश्न 3",
      subtitle: "क्षेत्र के विकास से जुड़ी राय",
    },
    {
      step: 4,
      title: "प्रश्न 4",
      subtitle: "अन्य महत्वपूर्ण विषय",
    },
  ];

  // If completed, show approved Success Screen
  if (done) {
    return (
      <SuccessScreen
        constituencyName={constituencyName}
        constituencyNumber={constituencyNumber}
        districtName={districtName}
        stateName={stateName}
        electionYear={electionYear}
        validResponseCount={validResponseCount + 1}
        resultsHref={resultsHref}
        constituencySlug={constituencySlug}
        stateSlug={stateSlug}
        districtSlug={districtSlug}
      />
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-5 lg:px-6 py-3 sm:py-5 pb-44 sm:pb-48 lg:pb-32">
      {/* 1. TOP BREADCRUMB */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center flex-wrap gap-1.5 text-xs sm:text-[13px] text-slate-500 mb-2.5 sm:mb-3.5"
      >
        <Link href="/" className="hover:text-slate-900 transition-colors">
          होम
        </Link>
        <span>&gt;</span>
        <Link href={`/${stateSlug}`} className="hover:text-slate-900 transition-colors">
          राज्य
        </Link>
        <span>&gt;</span>
        <Link href={`/${stateSlug}`} className="hover:text-slate-900 transition-colors">
          {stateName}
        </Link>
        <span>&gt;</span>
        <Link href={`/${stateSlug}#districts`} className="hover:text-slate-900 transition-colors">
          जिले
        </Link>
        <span>&gt;</span>
        <Link
          href={`/${stateSlug}/elections/assembly-${electionYear}/districts/${districtSlug}`}
          className="hover:text-slate-900 transition-colors"
        >
          {districtName}
        </Link>
        <span>&gt;</span>
        <Link
          href={`/${stateSlug}/elections/assembly-${electionYear}/constituencies/${constituencySlug}`}
          className="hover:text-slate-900 transition-colors"
        >
          {constituencyName}
        </Link>
        <span>&gt;</span>
        <span className="font-semibold text-slate-900">सर्वेक्षण</span>
      </nav>

      {/* 2. COMPACT DESKTOP INTRO BANNER (Target Height ~120-135px) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 px-5 py-3.5 sm:px-6 sm:py-4 shadow-2xs mb-3.5 sm:mb-4">
        <p className="text-xs sm:text-[13px] font-bold text-[#ea580c] tracking-wide">
          {stateName} • {districtName} • {constituencyName}
        </p>
        <h1 className="text-xl sm:text-[23px] font-black text-slate-900 mt-0.5 tracking-tight leading-tight">
          विधानसभा चुनाव सर्वेक्षण {electionYear}
        </h1>
        <p className="text-slate-600 text-xs sm:text-[13px] mt-0.5 font-medium leading-normal">
          अपने क्षेत्र से जुड़ी राय साझा करें। आपकी राय आपके क्षेत्र की तस्वीर समझने में मदद करती है।
        </p>
      </div>

      {/* COMPACT MOBILE INTRO (Only for mobile, tight height) */}
      <div className="md:hidden bg-white rounded-xl border border-slate-200/80 px-3.5 py-2.5 shadow-2xs mb-2.5">
        <p className="text-[11px] font-bold text-[#ea580c]">
          {stateName} • {districtName} • {constituencyName}
        </p>
        <h1 className="text-base font-black text-slate-900 mt-0.5">
          विधानसभा चुनाव सर्वेक्षण {electionYear}
        </h1>
      </div>

      {/* 3. MAIN 2-COLUMN LAYOUT (DESKTOP: Left ~30-31%, Right ~69-70%) / 1-COLUMN (MOBILE) */}
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[300px_1fr] gap-4 lg:gap-5 items-start">
        {/* LEFT SIDEBAR (DESKTOP ONLY, COMPACT ~20px PADDING, TIGHT STEPPER) */}
        <div className="hidden md:flex flex-col gap-3">
          {/* Progress & Stepper Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-900 text-sm sm:text-base">आपकी प्रगति</span>
              </div>
              <span className="font-bold text-slate-700 text-xs sm:text-sm">{progressPct}%</span>
            </div>

            {/* Orange Progress Bar (8px height) */}
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-2.5 mb-4">
              <div
                className="h-full bg-[#ea580c] transition-all duration-300 rounded-full"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* Stepper Items (Row height ~52px, circles 34px) */}
            <div className="flex flex-col space-y-2.5">
              {stepperItems.map((item, idx) => {
                const isPassed = pageIndex > idx;
                const isCurrent = pageIndex === idx;
                const isLastItem = idx === stepperItems.length - 1;

                return (
                  <div key={item.step} className="relative flex items-center gap-3">
                    {/* Connecting line */}
                    {!isLastItem && (
                      <div
                        className={cn(
                          "absolute left-[17px] top-[30px] w-0.5 h-4 -ml-[1px] transition-colors z-0",
                          isPassed ? "bg-emerald-500" : "bg-slate-200"
                        )}
                      />
                    )}

                    {/* Step Icon (34px) */}
                    <div
                      className={cn(
                        "relative z-10 w-[34px] h-[34px] rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all",
                        isPassed
                          ? "bg-emerald-500 text-white"
                          : isCurrent
                          ? "bg-[#ea580c] text-white shadow-xs ring-2 ring-orange-200"
                          : "border-2 border-slate-300 text-slate-400 bg-white"
                      )}
                    >
                      {isPassed ? <Check size={16} strokeWidth={3} /> : item.step}
                    </div>

                    {/* Step Title & Subtitle */}
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "text-xs sm:text-[13.5px] font-bold leading-tight",
                          isCurrent
                            ? "text-slate-900"
                            : isPassed
                            ? "text-slate-800"
                            : "text-slate-400"
                        )}
                      >
                        {item.title}
                      </p>
                      <p className="text-[11px] sm:text-xs text-slate-500 leading-tight mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real Statistics Box (Compact Horizontal 3-Column Card) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-3.5 shadow-2xs">
            <div className="grid grid-cols-3 gap-1.5 text-center divide-x divide-slate-100">
              <div className="px-1 flex flex-col items-center">
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-1">
                  <Landmark size={14} />
                </div>
                <span className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                  {validResponseCount}
                </span>
                <span className="text-[10px] font-bold text-slate-700 leading-tight mt-0.5">
                  कुल प्रतिक्रियाएं
                </span>
                <span className="text-[9px] text-slate-400 leading-tight">
                  अब तक प्राप्त
                </span>
              </div>

              <div className="px-1 flex flex-col items-center">
                <div className="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center mb-1">
                  <ShieldCheck size={14} />
                </div>
                <span className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                  {constituencyNumber ? `#${constituencyNumber}` : "100%"}
                </span>
                <span className="text-[10px] font-bold text-slate-700 leading-tight mt-0.5">
                  {constituencyNumber ? "विधानसभा संख्या" : "सुरक्षित एवं गोपनीय"}
                </span>
                <span className="text-[9px] text-slate-400 leading-tight">
                  इस क्षेत्र में
                </span>
              </div>

              <div className="px-1 flex flex-col items-center">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
                  <BarChart3 size={14} />
                </div>
                <span className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                  {electionYear}
                </span>
                <span className="text-[10px] font-bold text-slate-700 leading-tight mt-0.5">
                  विधानसभा चुनाव
                </span>
                <span className="text-[9px] text-slate-400 leading-tight">
                  आने वाला है
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT / MAIN QUESTION CARD (Compact padding: 20-24px, tightly spaced) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 lg:p-6 shadow-2xs">
          {/* Card Top: Progress Pill & Percentage */}
          <div className="flex items-center justify-between">
            <span className="bg-orange-50 text-[#ea580c] font-bold text-xs px-2.5 py-0.5 rounded-full border border-orange-100">
              प्रश्न {pageIndex + 1} / 4
            </span>
            <span className="font-bold text-slate-600 text-xs sm:text-sm">
              {progressPct}%
            </span>
          </div>

          {/* Orange Progress Bar (8px) */}
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-2 mb-3.5 sm:mb-4">
            <div
              className="h-full bg-[#ea580c] transition-all duration-300 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* QUESTION 1: CURRENT MLA SATISFACTION */}
          {pageKey === "mla_satisfaction" && (
            <div className="space-y-3.5 sm:space-y-4">
              <div>
                <h2 className="text-[22px] sm:text-[26px] lg:text-[28px] font-black text-slate-900 tracking-tight leading-snug">
                  {locale === "en"
                    ? mlaName
                      ? `Are you satisfied with the work of your current MLA ${mlaName}?`
                      : "Are you satisfied with the work of your current MLA?"
                    : mlaName
                    ? `क्या आप अपने वर्तमान विधायक ${mlaName} के कार्यों से खुश हैं?`
                    : "क्या आप अपने वर्तमान विधायक के कार्यों से खुश हैं?"}
                </h2>
                <p className="text-slate-500 text-sm sm:text-[15px] font-medium mt-1">
                  कृपया नीचे दिए गए विकल्पों में से एक को चुनें।
                </p>
              </div>

              {/* 4 Options: Compact 58-64px height, 8-10px gap */}
              <div className="flex flex-col gap-2.5 sm:gap-3 pt-1">
                {MLA_OPTIONS.map((opt) => {
                  const isSelected = answers.mla_satisfaction === opt.key;
                  const IconComp = opt.icon;

                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => selectSingle("mla_satisfaction", opt.key)}
                      className={cn(
                        "w-full flex items-center gap-3.5 px-4 py-3 sm:px-4.5 sm:py-3.5 min-h-[58px] sm:min-h-[62px] rounded-[14px] border text-left transition-all cursor-pointer shadow-2xs",
                        opt.bgClass,
                        isSelected && opt.selectedClass
                      )}
                    >
                      {/* Radio Circle (20px) */}
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                          isSelected
                            ? "border-slate-800 bg-white"
                            : "border-slate-300 bg-white"
                        )}
                      >
                        {isSelected && (
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                        )}
                      </div>

                      {/* Smiley Icon (36-40px) */}
                      <div
                        className={cn(
                          "w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0",
                          opt.iconColor
                        )}
                      >
                        <IconComp size={22} strokeWidth={2.4} />
                      </div>

                      {/* Option Text (17-18px desktop, 15-17px mobile) */}
                      <span className="font-bold text-slate-900 text-[16px] sm:text-[18px] leading-snug">
                        {locale === "en" ? opt.labelEn : opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* QUESTION 2: PARTY PREFERENCE */}
          {pageKey === "party_preference" && (
            <div className="space-y-3.5 sm:space-y-4">
              <div>
                <h2 className="text-[22px] sm:text-[26px] lg:text-[28px] font-black text-slate-900 tracking-tight leading-snug">
                  विधानसभा चुनाव में आप किस पार्टी को वोट देंगे?
                </h2>
                <p className="text-slate-500 text-sm sm:text-[15px] font-medium mt-1">
                  कृपया नीचे दिए गए विकल्पों में से एक को चुनें।
                </p>
              </div>

              {/* Party rows: Compact 58-64px height, 8-10px gap */}
              <div className="flex flex-col gap-2.5 sm:gap-3 pt-1">
                {parties.map((party) => {
                  const isSelected = answers.party_preference === party.key;
                  const keyLower = party.key.toLowerCase();
                  const isOther = keyLower === "other";
                  const isNota = keyLower === "nota";

                  let cardBg = "bg-[#f8fafc] border-[#e2e8f0]/80";
                  if (keyLower.includes("bjp")) {
                    cardBg = "bg-[#fff8f0] border-[#fed7aa] hover:border-orange-300";
                  } else if (keyLower.includes("inc") || keyLower.includes("congress")) {
                    cardBg = "bg-[#f0f9ff] border-[#bae6fd] hover:border-sky-300";
                  } else if (keyLower.includes("sp") || keyLower.includes("samajwadi")) {
                    cardBg = "bg-[#f0fdf4] border-[#bbf7d0] hover:border-emerald-300";
                  } else if (keyLower.includes("bsp")) {
                    cardBg = "bg-[#f5f7ff] border-[#c7d2fe] hover:border-indigo-300";
                  } else if (isOther) {
                    cardBg = "bg-[#fdf2f8] border-[#fbcfe8] hover:border-pink-300";
                  } else if (isNota) {
                    cardBg = "bg-[#f8fafc] border-[#e2e8f0] hover:border-slate-300";
                  }

                  const displayName = isOther
                    ? locale === "hi"
                      ? "अन्य"
                      : "Other"
                    : isNota
                    ? locale === "hi"
                      ? "कोई भी नहीं (NOTA)"
                      : "None of the Above (NOTA)"
                    : locale === "hi"
                    ? party.labelHi || party.label
                    : party.label;

                  return (
                    <button
                      key={party.key}
                      type="button"
                      onClick={() => selectSingle("party_preference", party.key)}
                      className={cn(
                        "w-full flex items-center gap-3.5 px-4 py-3 sm:px-4.5 sm:py-3.5 min-h-[58px] sm:min-h-[62px] rounded-[14px] border text-left transition-all cursor-pointer shadow-2xs",
                        cardBg,
                        isSelected &&
                          "border-2 border-[#ea580c] bg-orange-50/50 ring-1 ring-[#ea580c]/30 shadow-xs"
                      )}
                    >
                      {/* Radio Circle (20px) */}
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                          isSelected
                            ? "border-slate-800 bg-white"
                            : "border-slate-300 bg-white"
                        )}
                      >
                        {isSelected && (
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                        )}
                      </div>

                      {/* Party Logo / Icon (36-40px) */}
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden bg-white shadow-2xs border border-slate-100">
                        {isOther ? (
                          <Users2 className="w-5 h-5 text-pink-600" />
                        ) : isNota ? (
                          <Ban className="w-5 h-5 text-slate-600" />
                        ) : party.logoUrl ? (
                          <Image
                            src={party.logoUrl}
                            alt=""
                            width={34}
                            height={34}
                            className="w-full h-full object-contain p-0.5"
                          />
                        ) : (
                          <span
                            className="text-xs font-bold text-white w-full h-full flex items-center justify-center"
                            style={{ backgroundColor: party.colorHex ?? "#64748b" }}
                          >
                            {(party.abbreviation ?? party.label).slice(0, 3)}
                          </span>
                        )}
                      </div>

                      {/* Party Name (17-18px desktop, 15-17px mobile) */}
                      <span className="font-bold text-slate-900 text-[16px] sm:text-[18px] leading-snug">
                        {displayName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* QUESTION 3: TOP DEVELOPMENT ISSUE — EXACTLY MATCHING REFERENCE IMAGE 1 */}
          {pageKey === "top_issue" && (() => {
            const orderedIssues = [...issues].sort((a, b) => {
              const ia = Q3_ORDER.indexOf(a.key.toLowerCase());
              const ib = Q3_ORDER.indexOf(b.key.toLowerCase());
              return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
            });

            return (
              <div className="space-y-3.5 sm:space-y-4">
                <div>
                  <h2 className="text-[22px] sm:text-[26px] lg:text-[28px] font-black text-slate-900 tracking-tight leading-snug">
                    आपके लिए इस विधानसभा क्षेत्र में सबसे महत्वपूर्ण मुद्दा क्या है?
                  </h2>
                  <p className="text-slate-600 text-sm sm:text-[15px] font-medium mt-1">
                    आप एक से अधिक मुद्दे चुन सकते हैं, या इस प्रश्न को छोड़ दें।
                  </p>
                </div>

                {/* 2-Column Grid of Horizontal Cards */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 pt-1.5">
                  {orderedIssues.map((issue) => {
                    const isSelected = selectedIssues.includes(issue.key);
                    const meta = ISSUE_META[issue.key] ?? {
                      title: issue.label,
                      subtitle: "",
                      icon: HelpCircle,
                      iconColor: "text-slate-600",
                      iconBg: "bg-slate-100",
                      border: "border-slate-300",
                      hoverBorder: "hover:border-slate-400",
                    };
                    const IconComp = meta.icon;

                    return (
                      <button
                        key={issue.key}
                        type="button"
                        onClick={() => toggleIssue(issue.key)}
                        className={cn(
                          "relative flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border-2 transition-all text-left bg-white cursor-pointer group shadow-2xs",
                          meta.border,
                          meta.hoverBorder,
                          isSelected &&
                            "border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20 shadow-xs"
                        )}
                      >
                        {/* Left: Icon in circular badge */}
                        <div
                          className={cn(
                            "w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                            meta.iconBg,
                            meta.iconColor
                          )}
                        >
                          <IconComp className="w-5 h-5 sm:w-5.5 sm:h-5.5" size={20} strokeWidth={2.4} />
                        </div>

                        {/* Center: Title & Subtitle */}
                        <div className="flex-1 min-w-0 pl-2 sm:pl-2.5 pr-1 sm:pr-2">
                          <p className="font-extrabold text-slate-900 text-xs sm:text-[14.5px] leading-tight truncate">
                            {meta.title}
                          </p>
                          <p className="text-[10px] sm:text-[11.5px] text-slate-500 leading-tight mt-0.5 line-clamp-2">
                            {meta.subtitle}
                          </p>
                        </div>

                        {/* Right: Round Selection Indicator */}
                        <div
                          className={cn(
                            "w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-all",
                            isSelected
                              ? "border-blue-600 bg-blue-600 text-white shadow-2xs"
                              : "border-slate-300 bg-white group-hover:border-slate-400"
                          )}
                        >
                          {isSelected && <Check size={13} strokeWidth={3.5} />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Privacy Assurance Banner */}
                <div className="flex items-start gap-2.5 rounded-xl border border-slate-200/80 bg-[#f8fafc] p-2.5 sm:p-3 text-xs text-slate-700 mt-3">
                  <ShieldCheck size={18} className="mt-0.5 text-slate-600 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-900 leading-tight">
                      आपका उत्तर पूरी तरह गोपनीय है
                    </p>
                    <p className="text-slate-500 text-[11px] sm:text-xs mt-0.5 leading-relaxed">
                      आपकी व्यक्तिगत जानकारी सुरक्षित है और इसे किसी के साथ साझा नहीं किया जाएगा।
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* QUESTION 4: PROFILE DEMOGRAPHICS — EXACTLY MATCHING REFERENCE IMAGE 2 */}
          {pageKey === "personal_info" && (() => {
            const orderedAgeGroups = prepareDemographicOptions(ageGroups, AGE_ORDER);
            const orderedGenders = prepareDemographicOptions(genders, GENDER_ORDER);
            const orderedSocialCategories = prepareDemographicOptions(socialCategories, SOCIAL_ORDER);
            const orderedReligions = prepareDemographicOptions(religions, RELIGION_ORDER);

            return (
              <div className="space-y-4">
                <div>
                  <h2 className="text-[22px] sm:text-[26px] lg:text-[28px] font-black text-slate-900 tracking-tight leading-snug">
                    अपनी प्रोफ़ाइल बताना चाहेंगे?
                  </h2>
                  <p className="text-slate-500 text-sm sm:text-[15px] font-medium mt-1">
                    यह जानकारी वैकल्पिक है और केवल समग्र सांख्यिकीय विश्लेषण के लिए उपयोग की जाएगी।
                  </p>
                </div>

                {/* 4 STACKED FULL-WIDTH SECTIONS */}
                <div className="flex flex-col gap-3.5 sm:gap-4.5 pt-1">
                  {/* 1. Age Group (Blue) */}
                  <div className="bg-[#f4f8ff] border border-[#bfdbfe] rounded-2xl p-4 sm:p-5 shadow-2xs">
                    <div className="flex items-center gap-3 mb-3.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Users size={20} />
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                          1. आपकी आयु क्या है?
                        </p>
                        <p className="text-xs sm:text-[13px] text-slate-500 leading-tight mt-0.5">
                          अपनी आयु का सही वर्ग चुनें।
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-2.5">
                      {orderedAgeGroups.map((opt) => {
                        const isSelected = answers.age_group === opt.key;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => selectSingle("age_group", opt.key)}
                            className={cn(
                              "rounded-full bg-white border border-[#bfdbfe] px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-[13.5px] font-bold text-slate-800 shadow-2xs hover:border-blue-400 transition-all cursor-pointer",
                              isSelected &&
                                "bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-500/20"
                            )}
                          >
                            {opt.labelDisplay}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Gender (Pink) */}
                  <div className="bg-[#fff5f8] border border-[#fbcfe8] rounded-2xl p-4 sm:p-5 shadow-2xs">
                    <div className="flex items-center gap-3 mb-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[#ec4899] text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <GenderIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                          2. आपका लिंग क्या है?
                        </p>
                        <p className="text-xs sm:text-[13px] text-slate-500 leading-tight mt-0.5">
                          अपना लिंग चुनें।
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-2.5">
                      {orderedGenders.map((opt) => {
                        const isSelected = answers.gender === opt.key;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => selectSingle("gender", opt.key)}
                            className={cn(
                              "rounded-full bg-white border border-[#fbcfe8] px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-[13.5px] font-bold text-slate-800 shadow-2xs hover:border-pink-400 transition-all cursor-pointer",
                              isSelected &&
                                "bg-[#ec4899] text-white border-[#ec4899] shadow-xs ring-2 ring-pink-500/20"
                            )}
                          >
                            {opt.labelDisplay}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Social Category (Green) */}
                  <div className="bg-[#f0fbf4] border border-[#bbf7d0] rounded-2xl p-4 sm:p-5 shadow-2xs">
                    <div className="flex items-center gap-3 mb-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[#16a34a] text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Users2 size={20} />
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                          3. आपकी सामाजिक श्रेणी क्या है?
                        </p>
                        <p className="text-xs sm:text-[13px] text-slate-500 leading-tight mt-0.5">
                          अपनी सामाजिक श्रेणी चुनें।
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-2.5">
                      {orderedSocialCategories.map((opt) => {
                        const isSelected = answers.social_category === opt.key;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => selectSingle("social_category", opt.key)}
                            className={cn(
                              "rounded-full bg-white border border-[#bbf7d0] px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-[13.5px] font-bold text-slate-800 shadow-2xs hover:border-emerald-400 transition-all cursor-pointer",
                              isSelected &&
                                "bg-[#16a34a] text-white border-[#16a34a] shadow-xs ring-2 ring-emerald-500/20"
                            )}
                          >
                            {opt.labelDisplay}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. Religion (Purple) */}
                  <div className="bg-[#faf5ff] border border-[#e9d5ff] rounded-2xl p-4 sm:p-5 shadow-2xs">
                    <div className="flex items-center gap-3 mb-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[#9333ea] text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <PrayerHandsIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                          4. आपका धर्म क्या है?
                        </p>
                        <p className="text-xs sm:text-[13px] text-slate-500 leading-tight mt-0.5">
                          अपना धर्म चुनें।
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:gap-2.5">
                      {orderedReligions.map((opt) => {
                        const isSelected = answers.religion === opt.key;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => selectSingle("religion", opt.key)}
                            className={cn(
                              "rounded-full bg-white border border-[#e9d5ff] px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-[13.5px] font-bold text-slate-800 shadow-2xs hover:border-purple-400 transition-all cursor-pointer",
                              isSelected &&
                                "bg-[#9333ea] text-white border-[#9333ea] shadow-xs ring-2 ring-purple-500/20"
                            )}
                          >
                            {opt.labelDisplay}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Bottom Privacy Assurance Banner */}
                <div className="flex items-start gap-2.5 rounded-xl border border-slate-200/80 bg-[#f8fafc] p-2.5 sm:p-3 text-xs text-slate-700">
                  <ShieldCheck size={18} className="mt-0.5 text-slate-600 shrink-0" />
                  <div>
                    <p className="font-bold text-slate-900 leading-tight">
                      आपका उत्तर पूरी तरह गोपनीय है
                    </p>
                    <p className="text-slate-500 text-[11px] sm:text-xs mt-0.5 leading-relaxed">
                      आपकी व्यक्तिगत जानकारी सुरक्षित है और इसे किसी के साथ साझा नहीं किया जाएगा।
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ERROR ALERT */}
          {error && (
            <div className="mt-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-medium">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* 4. MOBILE STATS STRIP (Directly below question card on mobile) */}
      <div className="md:hidden mt-4 bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs">
        <div className="grid grid-cols-3 gap-1.5 text-center divide-x divide-slate-100">
          <div className="px-1 flex flex-col items-center">
            <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-1">
              <Landmark size={13} />
            </div>
            <span className="font-extrabold text-slate-900 text-xs sm:text-sm leading-tight">
              {validResponseCount}
            </span>
            <span className="text-[9.5px] font-bold text-slate-700 leading-tight mt-0.5">
              कुल प्रतिक्रियाएं
            </span>
            <span className="text-[8.5px] text-slate-400 leading-tight">अब तक प्राप्त</span>
          </div>

          <div className="px-1 flex flex-col items-center">
            <div className="w-6 h-6 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center mb-1">
              <ShieldCheck size={13} />
            </div>
            <span className="font-extrabold text-slate-900 text-xs sm:text-sm leading-tight">
              {constituencyNumber ? `#${constituencyNumber}` : "100%"}
            </span>
            <span className="text-[9.5px] font-bold text-slate-700 leading-tight mt-0.5">
              {constituencyNumber ? "विधानसभा संख्या" : "सुरक्षित एवं गोपनीय"}
            </span>
            <span className="text-[8.5px] text-slate-400 leading-tight">इस क्षेत्र में</span>
          </div>

          <div className="px-1 flex flex-col items-center">
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
              <BarChart3 size={13} />
            </div>
            <span className="font-extrabold text-slate-900 text-xs sm:text-sm leading-tight">
              {electionYear}
            </span>
            <span className="text-[9.5px] font-bold text-slate-700 leading-tight mt-0.5">
              विधानसभा चुनाव
            </span>
            <span className="text-[8.5px] text-slate-400 leading-tight">आने वाला है</span>
          </div>
        </div>
      </div>

      {/* 5. STICKY / FIXED BOTTOM ACTION BAR (Positioned above mobile tab nav on mobile, flush on desktop) */}
      <div className="fixed bottom-[56px] lg:bottom-0 inset-x-0 z-[60] bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_24px_rgba(0,0,0,0.09)] py-2.5 sm:py-3.5 px-3.5 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {pageIndex > 0 && (
            <button
              type="button"
              onClick={handleBack}
              disabled={submitting}
              className="flex-1 sm:flex-none sm:min-w-[130px] flex items-center justify-center gap-1.5 px-4 sm:px-6 h-[48px] sm:h-[50px] rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm sm:text-base shadow-2xs transition-colors cursor-pointer"
            >
              <span>← पिछला</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePrimary}
            disabled={!canAdvance || submitting}
            className={cn(
              "flex items-center justify-center gap-2 h-[48px] sm:h-[50px] rounded-xl font-bold text-sm sm:text-base text-white shadow-2xs transition-all cursor-pointer",
              pageIndex === 0 ? "w-full" : "flex-1 sm:flex-none sm:min-w-[150px] px-6 sm:px-8",
              !canAdvance || submitting
                ? "bg-orange-300 cursor-not-allowed"
                : "bg-[#ea580c] hover:bg-[#c2410c] active:scale-[0.98]"
            )}
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>जमा हो रहा है...</span>
              </>
            ) : pageIndex === 3 ? (
              <>
                <span>सर्वे जमा करें →</span>
              </>
            ) : (
              <>
                <span>अगला प्रश्न →</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// SUCCESS SCREEN COMPONENT MATCHING APPROVED REFERENCE 5 (COMPACT & BALANCED)
function SuccessScreen({
  constituencyName,
  constituencyNumber,
  districtName,
  stateName,
  electionYear,
  validResponseCount,
  resultsHref,
  constituencySlug,
  stateSlug,
  districtSlug,
}: {
  constituencyName: string;
  constituencyNumber?: number;
  districtName: string;
  stateName: string;
  electionYear: number;
  validResponseCount: number;
  resultsHref: string;
  constituencySlug: string;
  stateSlug: string;
  districtSlug: string;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const shareText = `मैंने ${constituencyName} (${districtName}) विधानसभा चुनाव ${electionYear} के सर्वे में अपनी राय दर्ज की है। आप भी अपनी राय दें:`;
  const shareUrl = typeof window !== "undefined" ? window.location.href.split("?")[0] : "";

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `विधानसभा चुनाव सर्वे — ${constituencyName}`,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // Fall back to clipboard
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  function handleCopyLink() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-5 lg:px-6 py-3 sm:py-5">
      {/* 1. TOP BREADCRUMB MATCHING REFERENCE 5 */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center flex-wrap gap-1.5 text-xs sm:text-[13px] text-slate-500 mb-2.5 sm:mb-4"
      >
        <Link href="/" className="hover:text-slate-900 transition-colors">
          होम
        </Link>
        <span>&gt;</span>
        <Link href={`/${stateSlug}`} className="hover:text-slate-900 transition-colors">
          {stateName}
        </Link>
        <span>&gt;</span>
        <Link
          href={`/${stateSlug}/elections/assembly-${electionYear}/districts/${districtSlug}`}
          className="hover:text-slate-900 transition-colors"
        >
          {districtName}
        </Link>
        <span>&gt;</span>
        <Link
          href={`/${stateSlug}/elections/assembly-${electionYear}/constituencies/${constituencySlug}`}
          className="hover:text-slate-900 transition-colors"
        >
          {constituencyName}
        </Link>
        <span>&gt;</span>
        <span className="text-slate-600">सर्वेक्षण</span>
        <span>&gt;</span>
        <span className="font-semibold text-slate-900">पूरा हुआ</span>
      </nav>

      {/* 2. MAIN SUCCESS CARD (COMPACT COMPOSITION) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-7 shadow-xs relative overflow-hidden"
      >
        {/* Soft Background Radial Gradient */}
        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-sky-50/50 via-emerald-50/20 to-transparent pointer-events-none" />

        {/* HERO SECTION */}
        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Green Halo Checkmark Badge (Compact) */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-2.5 ring-6 ring-emerald-50">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-2xs">
              <Check size={22} strokeWidth={3.5} />
            </div>
          </div>

          {/* Heading & Subtitle */}
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            धन्यवाद!
          </h1>
          <p className="mt-1 text-sm sm:text-base font-bold text-slate-800">
            आपका उत्तर सफलतापूर्वक जमा हो गया है।
          </p>

          {/* Dynamic Constituency Acknowledgment */}
          <p className="mt-1 text-xs sm:text-sm text-slate-700">
            आपने{" "}
            <strong className="font-bold text-slate-900">
              {constituencyName.toLowerCase().trim() === districtName.toLowerCase().trim()
                ? constituencyName
                : `${constituencyName} (${districtName})`}
            </strong>{" "}
            विधानसभा क्षेत्र के लिए अपना मत दर्ज कर दिया है।
          </p>
          <p className="mt-0.5 text-[11px] sm:text-xs text-slate-500">
            आपका उत्तर सुरक्षित रूप से हमारे सिस्टम में रिकॉर्ड कर लिया गया है।
          </p>

          {/* 1. REAL STATS BOXES */}
          <div className="w-full max-w-xl grid grid-cols-3 gap-2 mt-4 bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 divide-x divide-slate-200">
            <div className="px-1.5 flex flex-col items-center">
              <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center mb-1">
                <Users size={14} />
              </div>
              <span className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                {validResponseCount}
              </span>
              <span className="text-[10px] font-bold text-slate-700 leading-tight mt-0.5">
                कुल प्रतिभागी
              </span>
              <span className="text-[9px] text-slate-400 leading-tight">अब तक प्राप्त</span>
            </div>

            <div className="px-1.5 flex flex-col items-center">
              <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center mb-1">
                <ShieldCheck size={14} />
              </div>
              <span className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                {constituencyNumber ? `#${constituencyNumber}` : "100%"}
              </span>
              <span className="text-[10px] font-bold text-slate-700 leading-tight mt-0.5">
                {constituencyNumber ? "विधानसभा संख्या" : "सुरक्षित एवं गोपनीय"}
              </span>
              <span className="text-[9px] text-slate-400 leading-tight">इस क्षेत्र में</span>
            </div>

            <div className="px-1.5 flex flex-col items-center">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-1">
                <BarChart3 size={14} />
              </div>
              <span className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                {electionYear}
              </span>
              <span className="text-[10px] font-bold text-slate-700 leading-tight mt-0.5">
                विधानसभा चुनाव
              </span>
              <span className="text-[9px] text-slate-400 leading-tight">आने वाला है</span>
            </div>
          </div>

          {/* 2. ACTION CTA BUTTONS (RESULT & SHARE — SIDE BY SIDE & TALLER) */}
          <div className="w-full max-w-xl grid grid-cols-2 gap-2 sm:gap-3.5 mt-4 sm:mt-5">
            <button
              type="button"
              onClick={() => router.push(resultsHref)}
              className="flex items-center justify-center bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold h-[50px] sm:h-[54px] rounded-xl shadow-xs text-[11.5px] min-[380px]:text-[13px] sm:text-sm md:text-base px-1.5 sm:px-4 transition-all cursor-pointer text-center leading-tight whitespace-nowrap"
            >
              <span>वर्तमान परिणाम देखें →</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="flex items-center justify-center gap-1.5 sm:gap-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold h-[50px] sm:h-[54px] rounded-xl shadow-xs text-[11.5px] min-[380px]:text-[13px] sm:text-sm md:text-base px-1.5 sm:px-4 transition-all cursor-pointer text-center leading-tight whitespace-nowrap"
            >
              <Share2 size={16} className="shrink-0" />
              <span>{copied ? "कॉपी हो गया!" : "सर्वे शेयर करें"}</span>
            </button>
          </div>

          {/* 3. TRUST BADGES (SHIFTED BELOW RESULT & SHARE BUTTONS) */}
          <div className="w-full max-w-xl grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4 sm:mt-5 text-left">
            <div className="flex items-center gap-2.5 bg-[#f8fbff] border border-blue-100/80 rounded-xl p-2.5 shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Lock size={14} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 leading-tight">आपकी गोपनीयता</p>
                <p className="text-[10.5px] text-slate-500 leading-tight mt-0.5">100% सुरक्षित</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-[#faf8fd] border border-purple-100/80 rounded-xl p-2.5 shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                <BarChart3 size={14} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 leading-tight">आपका डेटा केवल</p>
                <p className="text-[10.5px] text-slate-500 leading-tight mt-0.5">सार्वजनिक विश्लेषण के लिए</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-[#f7fcf9] border border-emerald-100/80 rounded-xl p-2.5 shadow-2xs">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck size={14} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 leading-tight">कोई व्यक्तिगत जानकारी</p>
                <p className="text-[10.5px] text-slate-500 leading-tight mt-0.5">सार्वजनिक नहीं की जाती</p>
              </div>
            </div>
          </div>

          {/* SOCIAL SHARE STRIP */}
          <div className="w-full max-w-xl mt-4 p-3 rounded-xl bg-orange-50/50 border border-orange-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-left">
              <div className="w-8 h-8 rounded-full bg-orange-100 text-[#ea580c] flex items-center justify-center shrink-0">
                <Megaphone size={16} />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-xs sm:text-[13px] leading-tight">अपनी राय साझा करें</p>
                <p className="text-[11px] text-slate-600 leading-tight mt-0.5">
                  इस सर्वेक्षण को अपने परिवार और दोस्तों के साथ शेयर करें।
                </p>
              </div>
            </div>

            {/* Social Share Icons */}
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `${shareText} ${shareUrl}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-2xs"
                title="WhatsApp"
                aria-label="Share on WhatsApp"
              >
                <span className="font-bold text-[11px]">WA</span>
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                  shareUrl
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-2xs"
                title="Facebook"
                aria-label="Share on Facebook"
              >
                <span className="font-bold text-[11px]">FB</span>
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  shareText
                )}&url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-2xs"
                title="X (Twitter)"
                aria-label="Share on X"
              >
                <span className="font-bold text-[11px]">𝕏</span>
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                  shareUrl
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-[#0A66C2] text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-2xs"
                title="LinkedIn"
                aria-label="Share on LinkedIn"
              >
                <span className="font-bold text-[11px]">in</span>
              </a>
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                title="Copy Link"
                aria-label="Copy survey link"
              >
                <Copy size={14} />
              </button>
            </div>
          </div>

          {/* 4 CIVIC VALUE CARDS AT BOTTOM */}
          <div className="w-full max-w-3xl mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-left">
            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50/70 border border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                <Users size={14} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-900 leading-tight">जनता की भागीदारी</p>
                <p className="text-[10px] text-slate-500 leading-tight mt-0.5">बेहतर लोकतंत्र के लिए</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50/70 border border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Target size={14} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-900 leading-tight">हर आवाज मायने रखती है</p>
                <p className="text-[10px] text-slate-500 leading-tight mt-0.5">आइए मिलकर भविष्य बनाएं</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50/70 border border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Leaf size={14} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-900 leading-tight">एक जिम्मेदार नागरिक बनें</p>
                <p className="text-[10px] text-slate-500 leading-tight mt-0.5">अपने क्षेत्र के विकास में भाग लें</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50/70 border border-slate-100">
              <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Heart size={14} className="fill-rose-600" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-900 leading-tight">votersurvey.in</p>
                <p className="text-[10px] text-slate-500 leading-tight mt-0.5">जनता की राय, बेहतर कल के लिए</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
