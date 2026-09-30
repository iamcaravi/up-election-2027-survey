"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
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
  MapPin,
  Megaphone,
  MoreHorizontal,
  Shield,
  ShieldCheck,
  Smile,
  Frown,
  Meh,
  Share2,
  Target,
  User,
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
  type LucideIcon,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { getDeviceFingerprint } from "@/lib/fingerprint";
import { cn } from "@/lib/utils";
import type { CurrentMlaInfo } from "@/lib/current-mla";
import { resultsPath } from "@/lib/routes";

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
    icon: LucideIcon | ((props: { className?: string }) => React.ReactElement);
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

  const resultsHref = resultsPath({ state: stateSlug, district: districtSlug, constituency: constituencySlug });

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

  const stepperItems = [
    { step: 1, title: "प्रश्न 1", subtitle: "वर्तमान विधायक के कार्यों से संतुष्टि" },
    { step: 2, title: "प्रश्न 2", subtitle: "वोट प्राथमिकता" },
    { step: 3, title: "प्रश्न 3", subtitle: "क्षेत्र के विकास से जुड़ी राय" },
    { step: 4, title: "प्रश्न 4", subtitle: "अन्य महत्वपूर्ण विषय" },
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
        basePath={basePath}
      />
    );
  }

  // Current-MLA header card — everything comes from the same currentMla prop
  // (getCurrentMlaForConstituency); the party logo is looked up in this
  // survey's own party options rather than a second data source.
  const mlaPartyFull = (
    (locale === "hi" ? currentMla?.partyHindi?.trim() || currentMla?.party?.trim() : currentMla?.party?.trim()) || ""
  ).trim();
  const mlaPartyShort = currentMla?.partyShortName?.trim() || "";
  const mlaPartyLabel = mlaPartyFull
    ? mlaPartyShort && mlaPartyShort.toLowerCase() !== mlaPartyFull.toLowerCase()
      ? `${mlaPartyFull} (${mlaPartyShort})`
      : mlaPartyFull
    : mlaPartyShort;
  const mlaPartyOption = mlaPartyShort
    ? parties.find((p) => (p.abbreviation ?? "").toLowerCase() === mlaPartyShort.toLowerCase())
    : undefined;

  const questionTitle = "text-[21px] sm:text-[26px] lg:text-[30px] font-black text-slate-900 tracking-tight leading-snug";
  const questionHelper = "text-slate-500 text-sm sm:text-[15px] font-medium mt-1.5";

  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-3 sm:px-5 sm:py-5 lg:px-6">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="mb-2.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-slate-500 sm:mb-3.5 sm:text-[13px]"
      >
        <Link href="/" className="transition-colors hover:text-slate-900">
          होम
        </Link>
        <span aria-hidden="true" className="hidden sm:inline">&gt;</span>
        <Link href="/rajya" className="hidden transition-colors hover:text-slate-900 sm:inline">
          राज्य
        </Link>
        <span aria-hidden="true">&gt;</span>
        <Link href={`/${stateSlug}`} className="transition-colors hover:text-slate-900">
          {stateName}
        </Link>
        <span aria-hidden="true" className="hidden sm:inline">&gt;</span>
        <Link href={`/${stateSlug}#district-explorer`} className="hidden transition-colors hover:text-slate-900 sm:inline">
          जिले
        </Link>
        <span aria-hidden="true">&gt;</span>
        <Link href={`${basePath}/districts/${districtSlug}`} className="transition-colors hover:text-slate-900">
          {districtName}
        </Link>
        <span aria-hidden="true">&gt;</span>
        <Link href={`${basePath}/constituencies/${constituencySlug}`} className="transition-colors hover:text-slate-900">
          {constituencyName}
        </Link>
        <span aria-hidden="true">&gt;</span>
        <span className="font-semibold text-slate-900" aria-current="page">
          सर्वेक्षण
        </span>
      </nav>

      {/* Constituency header + current MLA */}
      <header className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-stretch">
          <div className="flex min-w-0 flex-1 items-start gap-4 px-4 pb-3 pt-3.5 sm:px-5 sm:py-5">
            <span
              className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-[#ea580c] sm:flex"
              aria-hidden="true"
            >
              <MapPin size={28} strokeWidth={2.2} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold tracking-wide text-[#ea580c] sm:text-sm">
                {stateName} • {districtName} • {constituencyName}
              </p>
              <h1 className="mt-0.5 text-lg font-black leading-tight tracking-tight text-slate-900 sm:text-2xl lg:text-[30px]">
                विधानसभा चुनाव सर्वेक्षण {electionYear}
              </h1>
              <p className="mt-1 text-xs font-medium leading-relaxed text-slate-600 sm:text-sm">
                अपने क्षेत्र से जुड़ी राय साझा करें। आपकी राय आपके क्षेत्र की तस्वीर समझने में मदद करती है।
              </p>
            </div>
          </div>

          <div className="mx-4 border-t border-slate-100 md:mx-0 md:my-4 md:border-l md:border-t-0" aria-hidden="true" />

          <div className="flex items-center gap-3 px-4 pb-3.5 pt-3 sm:gap-3.5 sm:px-5 sm:py-4 md:w-[330px] lg:w-[370px]">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 sm:h-14 sm:w-14" aria-hidden="true">
              <User size={24} strokeWidth={2.2} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-slate-500 sm:text-xs">वर्तमान विधायक</p>
              <p className="break-words text-[15px] font-extrabold leading-tight text-slate-900 sm:text-lg">
                {mlaName ?? "जानकारी उपलब्ध नहीं"}
              </p>
              {mlaName && mlaPartyLabel && (
                <p className="mt-0.5 break-words text-xs font-bold leading-tight text-[#ea580c] sm:text-[13px]">{mlaPartyLabel}</p>
              )}
            </div>
            {mlaName && mlaPartyShort && (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-2xs sm:h-14 sm:w-14">
                {mlaPartyOption?.logoUrl ? (
                  <Image src={mlaPartyOption.logoUrl} alt={mlaPartyShort} width={48} height={48} className="h-full w-full object-contain p-1" />
                ) : (
                  <span
                    className="flex h-full w-full items-center justify-center text-[11px] font-bold text-white"
                    style={{ backgroundColor: mlaPartyOption?.colorHex ?? "#64748b" }}
                  >
                    {mlaPartyShort.slice(0, 4)}
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="mt-3 grid grid-cols-1 items-start gap-4 sm:mt-4 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-5">
        {/* Progress sidebar (desktop) */}
        <aside className="hidden flex-col gap-3 lg:flex" aria-label="सर्वेक्षण प्रगति">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-blue-600" aria-hidden="true" />
                <span className="text-base font-bold text-slate-900">आपकी प्रगति</span>
              </div>
              <span className="text-sm font-bold text-slate-700">{progressPct}%</span>
            </div>
            <div className="mb-4 mt-2.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-[#ea580c] transition-all duration-300" style={{ width: `${progressPct}%` }} />
            </div>

            <ol className="flex flex-col gap-1.5">
              {stepperItems.map((item, idx) => {
                const isPassed = pageIndex > idx;
                const isCurrent = pageIndex === idx;
                return (
                  <li
                    key={item.step}
                    aria-current={isCurrent ? "step" : undefined}
                    className={cn("flex items-center gap-3 rounded-xl px-2 py-2 transition-colors", isCurrent && "bg-orange-50")}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all",
                        isPassed
                          ? "bg-emerald-500 text-white"
                          : isCurrent
                          ? "bg-[#ea580c] text-white ring-4 ring-orange-100"
                          : "border-2 border-slate-300 bg-white text-slate-400"
                      )}
                    >
                      {isPassed ? <Check size={17} strokeWidth={3} /> : item.step}
                    </span>
                    <span className="min-w-0">
                      <span className={cn("block text-[14px] font-bold leading-tight", isCurrent ? "text-[#ea580c]" : isPassed ? "text-slate-800" : "text-slate-500")}>
                        {item.title}
                      </span>
                      <span className="mt-0.5 block text-xs leading-tight text-slate-500">{item.subtitle}</span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
            <div className="grid grid-cols-3 gap-1.5 divide-x divide-slate-100 text-center">
              <div className="flex flex-col items-center px-1">
                <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                  <Landmark size={14} />
                </div>
                <span className="text-base font-extrabold leading-tight text-slate-900">{validResponseCount}</span>
                <span className="mt-0.5 text-[10px] font-bold leading-tight text-slate-700">कुल प्रतिक्रियाएं</span>
                <span className="text-[9px] leading-tight text-slate-400">अब तक प्राप्त</span>
              </div>
              <div className="flex flex-col items-center px-1">
                <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                  <ShieldCheck size={14} />
                </div>
                <span className="text-base font-extrabold leading-tight text-slate-900">
                  {constituencyNumber ? `#${constituencyNumber}` : "100%"}
                </span>
                <span className="mt-0.5 text-[10px] font-bold leading-tight text-slate-700">
                  {constituencyNumber ? "विधानसभा संख्या" : "सुरक्षित एवं गोपनीय"}
                </span>
                <span className="text-[9px] leading-tight text-slate-400">इस क्षेत्र में</span>
              </div>
              <div className="flex flex-col items-center px-1">
                <div className="mb-1 flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <BarChart3 size={14} />
                </div>
                <span className="text-base font-extrabold leading-tight text-slate-900">{electionYear}</span>
                <span className="mt-0.5 text-[10px] font-bold leading-tight text-slate-700">विधानसभा चुनाव</span>
                <span className="text-[9px] leading-tight text-slate-400">आने वाला है</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Question card */}
        <section className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs sm:p-5 lg:p-6" aria-live="polite">
          <div className="flex items-center justify-between">
            <span className="rounded-full border border-orange-100 bg-orange-50 px-2.5 py-0.5 text-xs font-bold text-[#ea580c]">
              प्रश्न {pageIndex + 1} / 4
            </span>
            <span className="text-xs font-bold text-slate-600 sm:text-sm">{progressPct}%</span>
          </div>
          <div className="mb-4 mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 sm:mb-5">
            <div className="h-full rounded-full bg-[#ea580c] transition-all duration-300" style={{ width: `${progressPct}%` }} />
          </div>

          {/* Q1 — current MLA satisfaction (single select) */}
          {pageKey === "mla_satisfaction" && (
            <div>
              <h2 id="q-title" className={questionTitle}>
                {locale === "en"
                  ? mlaName
                    ? `Are you satisfied with the work of your current MLA ${mlaName}?`
                    : "Are you satisfied with the work of your current MLA?"
                  : mlaName
                  ? `क्या आप अपने वर्तमान विधायक ${mlaName} के कार्यों से खुश हैं?`
                  : "क्या आप अपने वर्तमान विधायक के कार्यों से खुश हैं?"}
              </h2>
              <p className={questionHelper}>कृपया नीचे दिए गए विकल्पों में से एक को चुनें।</p>

              <div role="radiogroup" aria-labelledby="q-title" className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-5 sm:gap-3">
                {MLA_OPTIONS.map((opt) => {
                  const isSelected = answers.mla_satisfaction === opt.key;
                  const IconComp = opt.icon;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => selectSingle("mla_satisfaction", opt.key)}
                      className={cn(
                        "relative flex w-full cursor-pointer flex-col items-center gap-2 rounded-2xl border px-2.5 pb-3.5 pt-4 text-center shadow-2xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 sm:min-h-[84px] sm:flex-row sm:gap-3.5 sm:px-4 sm:py-3.5 sm:text-left",
                        opt.bgClass,
                        isSelected && opt.selectedClass
                      )}
                    >
                      <RadioDot selected={isSelected} className="absolute left-2.5 top-2.5 sm:static" />
                      <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full sm:h-12 sm:w-12", opt.iconColor)}>
                        <IconComp size={24} strokeWidth={2.3} />
                      </span>
                      <span className="text-[14px] font-bold leading-snug text-slate-900 sm:text-[17px]">
                        {locale === "en" ? opt.labelEn : opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Q2 — party preference (single select, options from the survey config) */}
          {pageKey === "party_preference" && (
            <div>
              <h2 id="q-title" className={questionTitle}>
                विधानसभा चुनाव में आप किस पार्टी को वोट देंगे?
              </h2>
              <p className={questionHelper}>कृपया नीचे दिए गए विकल्पों में से एक को चुनें।</p>

              <div role="radiogroup" aria-labelledby="q-title" className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-5 sm:gap-3">
                {parties.map((party) => {
                  const isSelected = answers.party_preference === party.key;
                  const keyLower = party.key.toLowerCase();
                  const isOther = keyLower === "other";
                  const isNota = keyLower === "nota";
                  const isUndecided = keyLower === "undecided";
                  // Tint comes from each party's own configured colour — the
                  // same treatment for every party, so no option is favoured.
                  const tint = isOther ? "#db2777" : isNota ? "#64748b" : isUndecided ? "#d97706" : party.colorHex;
                  const style = isSelected
                    ? undefined
                    : { backgroundColor: withAlpha(tint, 0.06) ?? "#f8fafc", borderColor: withAlpha(tint, 0.3) ?? "#e2e8f0" };

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
                  const showAbbr = !isOther && !isNota && !isUndecided && party.abbreviation && !displayName.includes(party.abbreviation);

                  return (
                    <button
                      key={party.key}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => selectSingle("party_preference", party.key)}
                      style={style}
                      className={cn(
                        "relative flex w-full cursor-pointer flex-col items-center gap-2 rounded-2xl border px-2.5 pb-3.5 pt-4 text-center shadow-2xs transition-all hover:shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 sm:min-h-[84px] sm:flex-row sm:gap-3.5 sm:px-4 sm:py-3.5 sm:text-left",
                        isSelected && "border-[#ea580c] bg-orange-50 ring-2 ring-[#ea580c]/25"
                      )}
                    >
                      <RadioDot selected={isSelected} className="absolute left-2.5 top-2.5 sm:static" />
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-100 bg-white shadow-2xs sm:h-12 sm:w-12">
                        {isOther ? (
                          <MoreHorizontal className="h-5 w-5 text-pink-600" />
                        ) : isNota ? (
                          <Ban className="h-5 w-5 text-slate-600" />
                        ) : isUndecided ? (
                          <HelpCircle className="h-5 w-5 text-amber-600" />
                        ) : party.logoUrl ? (
                          <Image src={party.logoUrl} alt="" width={44} height={44} className="h-full w-full object-contain p-1" />
                        ) : (
                          <span
                            className="flex h-full w-full items-center justify-center text-xs font-bold text-white"
                            style={{ backgroundColor: party.colorHex ?? "#64748b" }}
                          >
                            {(party.abbreviation ?? party.label).slice(0, 3)}
                          </span>
                        )}
                      </span>
                      <span className="min-w-0 break-words text-[14px] font-bold leading-snug text-slate-900 sm:text-[16.5px]">
                        {displayName}
                        {showAbbr && <span className="block text-[12px] font-semibold text-slate-500 sm:text-[13px]">({party.abbreviation})</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Q3 — top issues (MULTI-select) */}
          {pageKey === "top_issue" &&
            (() => {
              const orderedIssues = [...issues].sort((a, b) => {
                const ia = Q3_ORDER.indexOf(a.key.toLowerCase());
                const ib = Q3_ORDER.indexOf(b.key.toLowerCase());
                return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
              });
              return (
                <div>
                  <h2 id="q-title" className={questionTitle}>
                    आपके लिए इस विधानसभा क्षेत्र में सबसे महत्वपूर्ण मुद्दा क्या है?
                  </h2>
                  <p className={questionHelper}>आप एक से अधिक मुद्दे चुन सकते हैं, या इस प्रश्न को छोड़ दें।</p>

                  <div role="group" aria-labelledby="q-title" className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-5 sm:gap-3">
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
                          role="checkbox"
                          aria-checked={isSelected}
                          onClick={() => toggleIssue(issue.key)}
                          className={cn(
                            "relative flex w-full cursor-pointer flex-col items-center gap-1.5 rounded-2xl border-2 bg-white px-2.5 pb-3 pt-4 text-center shadow-2xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 sm:flex-row sm:gap-3 sm:px-3.5 sm:py-3 sm:text-left",
                            meta.border,
                            meta.hoverBorder,
                            isSelected && "border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20"
                          )}
                        >
                          <CheckBoxDot selected={isSelected} className="absolute left-2.5 top-2.5 sm:static" />
                          <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-11 sm:w-11", meta.iconBg, meta.iconColor)}>
                            <IconComp className="h-5 w-5" size={20} strokeWidth={2.4} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block break-words text-[14px] font-extrabold leading-tight text-slate-900 sm:text-[15.5px]">{meta.title}</span>
                            {meta.subtitle && (
                              <span className="mt-0.5 block text-[11px] leading-snug text-slate-500 sm:text-xs">{meta.subtitle}</span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

          {/* Q4 — optional profile */}
          {pageKey === "personal_info" &&
            (() => {
              const sections: {
                key: Exclude<SingleAnswerKey, "mla_satisfaction" | "party_preference">;
                title: string;
                helper: string;
                icon: ReactNode;
                options: { key: string; labelDisplay: string }[];
                card: string;
                iconBox: string;
                pill: string;
                pillSelected: string;
              }[] = [
                {
                  key: "age_group",
                  title: "1. आपकी आयु क्या है?",
                  helper: "अपनी आयु का सही वर्ग चुनें",
                  icon: <Users size={22} />,
                  options: prepareDemographicOptions(ageGroups, AGE_ORDER),
                  card: "bg-[#f4f8ff] border-[#bfdbfe]",
                  iconBox: "bg-blue-600",
                  pill: "border-[#bfdbfe] hover:border-blue-400",
                  pillSelected: "border-blue-600 bg-blue-600 text-white ring-2 ring-blue-500/20",
                },
                {
                  key: "gender",
                  title: "2. आपका लिंग क्या है?",
                  helper: "अपना लिंग चुनें",
                  icon: <GenderIcon className="h-[22px] w-[22px]" />,
                  options: prepareDemographicOptions(genders, GENDER_ORDER),
                  card: "bg-[#fff5f8] border-[#fbcfe8]",
                  iconBox: "bg-[#ec4899]",
                  pill: "border-[#fbcfe8] hover:border-pink-400",
                  pillSelected: "border-[#ec4899] bg-[#ec4899] text-white ring-2 ring-pink-500/20",
                },
                {
                  key: "social_category",
                  title: "3. आपकी सामाजिक श्रेणी क्या है?",
                  helper: "अपनी सामाजिक श्रेणी चुनें",
                  icon: <Users2 size={22} />,
                  options: prepareDemographicOptions(socialCategories, SOCIAL_ORDER),
                  card: "bg-[#f0fbf4] border-[#bbf7d0]",
                  iconBox: "bg-[#16a34a]",
                  pill: "border-[#bbf7d0] hover:border-emerald-400",
                  pillSelected: "border-[#16a34a] bg-[#16a34a] text-white ring-2 ring-emerald-500/20",
                },
                {
                  key: "religion",
                  title: "4. आपका धर्म क्या है?",
                  helper: "अपना धर्म चुनें",
                  icon: <PrayerHandsIcon className="h-[22px] w-[22px]" />,
                  options: prepareDemographicOptions(religions, RELIGION_ORDER),
                  card: "bg-[#faf5ff] border-[#e9d5ff]",
                  iconBox: "bg-[#9333ea]",
                  pill: "border-[#e9d5ff] hover:border-purple-400",
                  pillSelected: "border-[#9333ea] bg-[#9333ea] text-white ring-2 ring-purple-500/20",
                },
              ];

              return (
                <div>
                  <h2 className={questionTitle}>अपनी प्रोफ़ाइल बताना चाहेंगे?</h2>
                  <p className={questionHelper}>यह जानकारी वैकल्पिक है और केवल समग्र सांख्यिकीय विश्लेषण के लिए उपयोग की जाएगी।</p>

                  <div className="mt-4 flex flex-col gap-3 sm:mt-5">
                    {sections.map((s) => (
                      <div
                        key={s.key}
                        className={cn("flex flex-col gap-3 rounded-2xl border p-3.5 shadow-2xs sm:p-4 lg:flex-row lg:items-center lg:gap-5", s.card)}
                      >
                        <div className="flex items-center gap-3 lg:w-[230px] lg:shrink-0">
                          <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-2xs", s.iconBox)} aria-hidden="true">
                            {s.icon}
                          </span>
                          <span className="min-w-0">
                            <span id={`q4-${s.key}`} className="block text-[15px] font-extrabold leading-tight text-slate-900 sm:text-base">
                              {s.title}
                            </span>
                            <span className="mt-0.5 block text-xs leading-tight text-slate-500 sm:text-[13px]">{s.helper}</span>
                          </span>
                        </div>
                        <div role="radiogroup" aria-labelledby={`q4-${s.key}`} className="flex flex-1 flex-wrap gap-2">
                          {s.options.map((opt) => {
                            const isSelected = answers[s.key] === opt.key;
                            return (
                              <button
                                key={opt.key}
                                type="button"
                                role="radio"
                                aria-checked={isSelected}
                                onClick={() => selectSingle(s.key, opt.key)}
                                className={cn(
                                  "min-h-[38px] cursor-pointer rounded-full border bg-white px-4 py-1.5 text-[13px] font-bold text-slate-800 shadow-2xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 sm:px-4.5 sm:text-sm",
                                  s.pill,
                                  isSelected && s.pillSelected
                                )}
                              >
                                {opt.labelDisplay}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

          <PrivacyNote />

          {error && (
            <div role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-medium text-red-700 sm:text-sm">
              {error}
            </div>
          )}
        </section>
      </div>

      {/* Survey actions — in normal flow so they never cover the options */}
      <div className="mt-3 flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-2xs sm:mt-4 sm:justify-between sm:p-4">
        <button
          type="button"
          onClick={handleBack}
          disabled={pageIndex === 0 || submitting}
          className="flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-[15px] font-bold text-slate-800 shadow-2xs transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 sm:flex-none sm:min-w-[170px] sm:text-base"
        >
          <ArrowLeft size={18} aria-hidden="true" />
          पिछला
        </button>
        <button
          type="button"
          onClick={handlePrimary}
          disabled={!canAdvance || submitting}
          className={cn(
            "flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-5 text-[15px] font-bold text-white shadow-2xs transition-all sm:flex-none sm:min-w-[220px] sm:text-base",
            !canAdvance || submitting ? "cursor-not-allowed bg-orange-300" : "bg-[#ea580c] hover:bg-[#c2410c] active:scale-[0.98]"
          )}
        >
          {submitting ? (
            <>
              <Loader2 size={18} className="animate-spin" aria-hidden="true" />
              जमा हो रहा है...
            </>
          ) : (
            <>
              {pageIndex === PAGE_KEYS.length - 1 ? "सर्वे जमा करें" : "अगला प्रश्न"}
              <ArrowRight size={18} aria-hidden="true" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function withAlpha(hex: string | null | undefined, alpha: number): string | null {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return null;
  return `${hex}${Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0")}`;
}

function RadioDot({ selected, className }: { selected: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 bg-white transition-colors",
        selected ? "border-slate-800" : "border-slate-300",
        className
      )}
    >
      {selected && <span className="h-2.5 w-2.5 rounded-full bg-slate-800" />}
    </span>
  );
}

function CheckBoxDot({ selected, className }: { selected: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all",
        selected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white",
        className
      )}
    >
      {selected && <Check size={13} strokeWidth={3.5} />}
    </span>
  );
}

function PrivacyNote() {
  return (
    <div className="mt-4 flex items-start gap-3 rounded-xl border border-slate-200/80 bg-[#f8fafc] px-3 py-2.5 sm:mt-5 sm:px-4 sm:py-3">
      <ShieldCheck size={20} className="mt-0.5 shrink-0 text-slate-600" aria-hidden="true" />
      <div>
        <p className="text-[13px] font-bold leading-tight text-slate-900 sm:text-sm">आपका उत्तर पूरी तरह गोपनीय है</p>
        <p className="mt-0.5 text-[11.5px] leading-relaxed text-slate-500 sm:text-[13px]">
          आपकी व्यक्तिगत जानकारी सुरक्षित है और इसे किसी के साथ साझा नहीं किया जाएगा।
        </p>
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
  basePath,
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
  basePath: string;
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
    <div className="w-full max-w-4xl lg:max-w-5xl xl:max-w-[1240px] mx-auto px-3 sm:px-5 lg:px-6 xl:px-8 py-3 sm:py-5 xl:py-8">
      {/* 1. TOP BREADCRUMB MATCHING REFERENCE 5 */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center flex-wrap gap-1.5 text-xs sm:text-[13px] xl:text-sm text-slate-500 mb-2.5 sm:mb-4 xl:mb-5"
      >
        <Link href="/" className="hover:text-slate-900 transition-colors">
          होम
        </Link>
        <span>&gt;</span>
        <Link href="/rajya" className="hover:text-slate-900 transition-colors">
          राज्य
        </Link>
        <span>&gt;</span>
        <Link href={`/${stateSlug}`} className="hover:text-slate-900 transition-colors">
          {stateName}
        </Link>
        <span>&gt;</span>
        <Link href={`/${stateSlug}#district-explorer`} className="hover:text-slate-900 transition-colors">
          जिले
        </Link>
        <span>&gt;</span>
        <Link
          href={`${basePath}/districts/${districtSlug}`}
          className="hover:text-slate-900 transition-colors"
        >
          {districtName}
        </Link>
        <span>&gt;</span>
        <Link
          href={`${basePath}/constituencies/${constituencySlug}`}
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
        className="bg-white rounded-2xl xl:rounded-3xl border border-slate-200/80 p-5 sm:p-7 lg:px-10 lg:py-9 xl:px-14 xl:py-12 shadow-xs relative overflow-hidden"
      >
        {/* Soft Background Radial Gradient */}
        <div className="absolute top-0 inset-x-0 h-32 xl:h-48 bg-gradient-to-b from-sky-50/50 via-emerald-50/20 to-transparent pointer-events-none" />

        {/* HERO SECTION */}
        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Green Halo Checkmark Badge (Compact) */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 xl:w-20 xl:h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-2.5 xl:mb-4 ring-6 xl:ring-8 ring-emerald-50">
            <div className="w-9 h-9 sm:w-10 sm:h-10 xl:w-12 xl:h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-2xs">
              <Check size={22} strokeWidth={3.5} className="xl:h-7 xl:w-7" />
            </div>
          </div>

          {/* Heading & Subtitle */}
          <h1 className="text-2xl sm:text-3xl xl:text-[42px] xl:leading-tight font-black text-slate-900 tracking-tight">
            धन्यवाद!
          </h1>
          <p className="mt-1 xl:mt-2 text-sm sm:text-base xl:text-xl font-bold text-slate-800">
            आपका उत्तर सफलतापूर्वक जमा हो गया है।
          </p>

          {/* Dynamic Constituency Acknowledgment */}
          <p className="mt-1 xl:mt-2 text-xs sm:text-sm xl:text-[17px] text-slate-700">
            आपने{" "}
            <strong className="font-bold text-slate-900">
              {constituencyName.toLowerCase().trim() === districtName.toLowerCase().trim()
                ? constituencyName
                : `${constituencyName} (${districtName})`}
            </strong>{" "}
            विधानसभा क्षेत्र के लिए अपना मत दर्ज कर दिया है।
          </p>
          <p className="mt-0.5 xl:mt-1 text-[11px] sm:text-xs xl:text-sm text-slate-500">
            आपका उत्तर सुरक्षित रूप से हमारे सिस्टम में रिकॉर्ड कर लिया गया है।
          </p>

          {/* 1. REAL STATS BOXES */}
          <div className="w-full max-w-xl lg:max-w-3xl xl:max-w-[920px] grid grid-cols-3 gap-2 mt-4 xl:mt-8 bg-slate-50/70 border border-slate-200/80 rounded-xl xl:rounded-2xl p-3 lg:p-4 xl:py-6 divide-x divide-slate-200">
            <div className="px-1.5 xl:px-4 flex flex-col items-center">
              <div className="w-7 h-7 xl:w-10 xl:h-10 rounded-lg xl:rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-1 xl:mb-2">
                <Users size={14} className="xl:h-5 xl:w-5" />
              </div>
              <span className="font-extrabold text-slate-900 text-sm sm:text-base xl:text-[28px] leading-tight">
                {validResponseCount}
              </span>
              <span className="text-[10px] xl:text-sm font-bold text-slate-700 leading-tight mt-0.5 xl:mt-1">
                कुल प्रतिभागी
              </span>
              <span className="text-[9px] xl:text-xs text-slate-400 leading-tight xl:mt-0.5">अब तक प्राप्त</span>
            </div>

            <div className="px-1.5 xl:px-4 flex flex-col items-center">
              <div className="w-7 h-7 xl:w-10 xl:h-10 rounded-lg xl:rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-1 xl:mb-2">
                <ShieldCheck size={14} className="xl:h-5 xl:w-5" />
              </div>
              <span className="font-extrabold text-slate-900 text-sm sm:text-base xl:text-[28px] leading-tight">
                {constituencyNumber ? `#${constituencyNumber}` : "100%"}
              </span>
              <span className="text-[10px] xl:text-sm font-bold text-slate-700 leading-tight mt-0.5 xl:mt-1">
                {constituencyNumber ? "विधानसभा संख्या" : "सुरक्षित एवं गोपनीय"}
              </span>
              <span className="text-[9px] xl:text-xs text-slate-400 leading-tight xl:mt-0.5">इस क्षेत्र में</span>
            </div>

            <div className="px-1.5 xl:px-4 flex flex-col items-center">
              <div className="w-7 h-7 xl:w-10 xl:h-10 rounded-lg xl:rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-1 xl:mb-2">
                <BarChart3 size={14} className="xl:h-5 xl:w-5" />
              </div>
              <span className="font-extrabold text-slate-900 text-sm sm:text-base xl:text-[28px] leading-tight">
                {electionYear}
              </span>
              <span className="text-[10px] xl:text-sm font-bold text-slate-700 leading-tight mt-0.5 xl:mt-1">
                विधानसभा चुनाव
              </span>
              <span className="text-[9px] xl:text-xs text-slate-400 leading-tight xl:mt-0.5">आने वाला है</span>
            </div>
          </div>

          {/* 2. ACTION CTA BUTTONS (RESULT & SHARE — SIDE BY SIDE & TALLER) */}
          <div className="w-full max-w-xl lg:max-w-3xl xl:max-w-[920px] grid grid-cols-2 gap-2 sm:gap-3.5 xl:gap-5 mt-4 sm:mt-5 xl:mt-7">
            <button
              type="button"
              onClick={() => router.push(resultsHref)}
              className="flex items-center justify-center bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold h-[50px] sm:h-[54px] xl:h-16 rounded-xl xl:rounded-2xl shadow-xs text-[11.5px] min-[380px]:text-[13px] sm:text-sm md:text-base xl:text-lg px-1.5 sm:px-4 transition-all cursor-pointer text-center leading-tight whitespace-nowrap"
            >
              <span>वर्तमान परिणाम देखें →</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="flex items-center justify-center gap-1.5 sm:gap-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold h-[50px] sm:h-[54px] xl:h-16 rounded-xl xl:rounded-2xl shadow-xs text-[11.5px] min-[380px]:text-[13px] sm:text-sm md:text-base xl:text-lg px-1.5 sm:px-4 transition-all cursor-pointer text-center leading-tight whitespace-nowrap"
            >
              <Share2 size={16} className="shrink-0 xl:h-5 xl:w-5" />
              <span>{copied ? "कॉपी हो गया!" : "सर्वे शेयर करें"}</span>
            </button>
          </div>

          {/* 3. TRUST BADGES (SHIFTED BELOW RESULT & SHARE BUTTONS) */}
          <div className="w-full max-w-xl lg:max-w-3xl xl:max-w-[920px] grid grid-cols-1 sm:grid-cols-3 gap-2.5 xl:gap-4 mt-4 sm:mt-5 xl:mt-7 text-left">
            <div className="flex items-center gap-2.5 bg-[#f8fbff] border border-blue-100/80 rounded-xl xl:rounded-2xl p-2.5 xl:p-4 xl:gap-3.5 shadow-2xs">
              <div className="w-7 h-7 xl:w-10 xl:h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Lock size={14} className="xl:h-5 xl:w-5" />
              </div>
              <div>
                <p className="text-xs xl:text-[15px] font-bold text-slate-900 leading-tight">आपकी गोपनीयता</p>
                <p className="text-[10.5px] xl:text-[13px] text-slate-500 leading-tight mt-0.5 xl:mt-1">100% सुरक्षित</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-[#faf8fd] border border-purple-100/80 rounded-xl xl:rounded-2xl p-2.5 xl:p-4 xl:gap-3.5 shadow-2xs">
              <div className="w-7 h-7 xl:w-10 xl:h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                <BarChart3 size={14} className="xl:h-5 xl:w-5" />
              </div>
              <div>
                <p className="text-xs xl:text-[15px] font-bold text-slate-900 leading-tight">आपका डेटा केवल</p>
                <p className="text-[10.5px] xl:text-[13px] text-slate-500 leading-tight mt-0.5 xl:mt-1">सार्वजनिक विश्लेषण के लिए</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-[#f7fcf9] border border-emerald-100/80 rounded-xl xl:rounded-2xl p-2.5 xl:p-4 xl:gap-3.5 shadow-2xs">
              <div className="w-7 h-7 xl:w-10 xl:h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck size={14} className="xl:h-5 xl:w-5" />
              </div>
              <div>
                <p className="text-xs xl:text-[15px] font-bold text-slate-900 leading-tight">कोई व्यक्तिगत जानकारी</p>
                <p className="text-[10.5px] xl:text-[13px] text-slate-500 leading-tight mt-0.5 xl:mt-1">सार्वजनिक नहीं की जाती</p>
              </div>
            </div>
          </div>

          {/* SOCIAL SHARE STRIP */}
          <div className="w-full max-w-xl lg:max-w-3xl xl:max-w-[920px] mt-4 xl:mt-5 p-3 xl:px-6 xl:py-5 rounded-xl xl:rounded-2xl bg-orange-50/50 border border-orange-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 xl:gap-4 text-left">
              <div className="w-8 h-8 xl:w-11 xl:h-11 rounded-full bg-orange-100 text-[#ea580c] flex items-center justify-center shrink-0">
                <Megaphone size={16} className="xl:h-6 xl:w-6" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-xs sm:text-[13px] xl:text-base leading-tight">अपनी राय साझा करें</p>
                <p className="text-[11px] xl:text-sm text-slate-600 leading-tight mt-0.5 xl:mt-1">
                  इस सर्वेक्षण को अपने परिवार और दोस्तों के साथ शेयर करें।
                </p>
              </div>
            </div>

            {/* Social Share Icons */}
            <div className="flex items-center gap-2 xl:gap-3 shrink-0">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `${shareText} ${shareUrl}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 xl:w-11 xl:h-11 rounded-full bg-[#25D366] text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-2xs"
                title="WhatsApp"
                aria-label="Share on WhatsApp"
              >
                <span className="font-bold text-[11px] xl:text-[13px]">WA</span>
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                  shareUrl
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 xl:w-11 xl:h-11 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-2xs"
                title="Facebook"
                aria-label="Share on Facebook"
              >
                <span className="font-bold text-[11px] xl:text-[13px]">FB</span>
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                  shareText
                )}&url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 xl:w-11 xl:h-11 rounded-full bg-black text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-2xs"
                title="X (Twitter)"
                aria-label="Share on X"
              >
                <span className="font-bold text-[11px] xl:text-[13px]">𝕏</span>
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                  shareUrl
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 xl:w-11 xl:h-11 rounded-full bg-[#0A66C2] text-white flex items-center justify-center hover:opacity-90 transition-opacity shadow-2xs"
                title="LinkedIn"
                aria-label="Share on LinkedIn"
              >
                <span className="font-bold text-[11px] xl:text-[13px]">in</span>
              </a>
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-8 h-8 xl:w-11 xl:h-11 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                title="Copy Link"
                aria-label="Copy survey link"
              >
                <Copy size={14} className="xl:h-[18px] xl:w-[18px]" />
              </button>
            </div>
          </div>

          {/* 4 CIVIC VALUE CARDS AT BOTTOM */}
          <div className="w-full max-w-3xl lg:max-w-4xl xl:max-w-none mt-5 xl:mt-10 pt-4 xl:pt-7 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 xl:gap-4 text-left">
            <div className="flex items-center gap-2.5 xl:gap-3.5 p-2 xl:p-4 rounded-lg xl:rounded-xl bg-slate-50/70 border border-slate-100">
              <div className="w-7 h-7 xl:w-10 xl:h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                <Users size={14} className="xl:h-5 xl:w-5" />
              </div>
              <div>
                <p className="text-[11px] xl:text-sm font-bold text-slate-900 leading-tight">जनता की भागीदारी</p>
                <p className="text-[10px] xl:text-[12.5px] text-slate-500 leading-tight mt-0.5 xl:mt-1">बेहतर लोकतंत्र के लिए</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 xl:gap-3.5 p-2 xl:p-4 rounded-lg xl:rounded-xl bg-slate-50/70 border border-slate-100">
              <div className="w-7 h-7 xl:w-10 xl:h-10 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Target size={14} className="xl:h-5 xl:w-5" />
              </div>
              <div>
                <p className="text-[11px] xl:text-sm font-bold text-slate-900 leading-tight">हर आवाज मायने रखती है</p>
                <p className="text-[10px] xl:text-[12.5px] text-slate-500 leading-tight mt-0.5 xl:mt-1">आइए मिलकर भविष्य बनाएं</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 xl:gap-3.5 p-2 xl:p-4 rounded-lg xl:rounded-xl bg-slate-50/70 border border-slate-100">
              <div className="w-7 h-7 xl:w-10 xl:h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Leaf size={14} className="xl:h-5 xl:w-5" />
              </div>
              <div>
                <p className="text-[11px] xl:text-sm font-bold text-slate-900 leading-tight">एक जिम्मेदार नागरिक बनें</p>
                <p className="text-[10px] xl:text-[12.5px] text-slate-500 leading-tight mt-0.5 xl:mt-1">अपने क्षेत्र के विकास में भाग लें</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 xl:gap-3.5 p-2 xl:p-4 rounded-lg xl:rounded-xl bg-slate-50/70 border border-slate-100">
              <div className="w-7 h-7 xl:w-10 xl:h-10 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Heart size={14} className="fill-rose-600 xl:h-5 xl:w-5" />
              </div>
              <div>
                <p className="text-[11px] xl:text-sm font-bold text-slate-900 leading-tight">votersurvey.in</p>
                <p className="text-[10px] xl:text-[12.5px] text-slate-500 leading-tight mt-0.5 xl:mt-1">जनता की राय, बेहतर कल के लिए</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
