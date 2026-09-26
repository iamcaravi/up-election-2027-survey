"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  HandHeart,
  Heart,
  HelpCircle,
  Leaf,
  Loader2,
  Lock,
  Meh,
  ShieldCheck,
  Share2,
  Target,
  ThumbsDown,
  ThumbsUp,
  Users,
  UsersRound,
  VenusAndMars,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { getDeviceFingerprint } from "@/lib/fingerprint";
import { cn } from "@/lib/utils";
import { SurveyStepper, type SurveyStepDef } from "./SurveyStepper";
import { buildSurveyCompletionShareMessage } from "@/lib/share-message";
import { BallotBoxVisual } from "./BallotBoxVisual";
import { StateCivicVisual } from "./StateCivicVisual";
import { MLA_SATISFACTION_OPTIONS } from "@/lib/enums";
import type { CurrentMlaInfo } from "@/lib/current-mla";
import * as Icons from "lucide-react";

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
  stateName?: string;
  stateSlug?: string;
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

// The 7 actual survey questions this flow can answer.
const QUESTION_KEYS = ["mla_satisfaction", "party_preference", "top_issue", "age_group", "gender", "social_category", "religion"] as const;
type QuestionKey = (typeof QUESTION_KEYS)[number];
// top_issue is "select all that apply" — tracked separately as an array
// (see selectedIssues) rather than in the single-value `answers` record.
type SingleAnswerKey = Exclude<QuestionKey, "top_issue">;

// The 4 visible pages:
// Q1: Current MLA satisfaction
// Q2: Political party preference
// Q3: Important issues
// Q4: Personal profile / demographics (groups age/gender/social_category/religion)
const PAGE_KEYS = ["mla_satisfaction", "party_preference", "top_issue", "personal_info"] as const;
type PageKey = (typeof PAGE_KEYS)[number];

const PARTY_SYMBOLS: Record<string, { hi: string; en: string }> = {
  bjp: { hi: "कमल का फूल", en: "Lotus Symbol" },
  sp: { hi: "साइकिल का निशान", en: "Bicycle Symbol" },
  bsp: { hi: "हाथी का निशान", en: "Elephant Symbol" },
  inc: { hi: "हाथ का निशान", en: "Hand Symbol" },
  aap: { hi: "झाडू का निशान", en: "Broom Symbol" },
  rld: { hi: "हैंडपंप का निशान", en: "Handpump Symbol" },
  jdlp: { hi: "कुकर का निशान", en: "Pressure Cooker Symbol" },
  jansatta: { hi: "कुकर का निशान", en: "Pressure Cooker Symbol" },
  other: { hi: "अन्य पार्टी", en: "Other Party" },
  nota: { hi: "इनमें से कोई नहीं", en: "None of the Above" },
  undecided: { hi: "अभी तय नहीं", en: "Not Decided Yet" },
};

function getPartySymbol(key: string, locale: string): string | null {
  const normalized = key.toLowerCase();
  for (const [k, sym] of Object.entries(PARTY_SYMBOLS)) {
    if (normalized.includes(k)) {
      return locale === "hi" ? sym.hi : sym.en;
    }
  }
  return null;
}

function getMlaOptionIcon(key: string) {
  if (key === "very_satisfied") {
    return <ThumbsUp size={30} className="text-[#16a34a] fill-[#16a34a] shrink-0" />;
  }
  if (key === "somewhat_satisfied") {
    return <ThumbsUp size={30} className="text-[#65a30d] fill-[#65a30d] shrink-0" />;
  }
  if (key === "neutral") {
    return (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="#eab308" className="shrink-0">
        <circle cx="12" cy="12" r="10" fill="#eab308" />
        <circle cx="8" cy="9.5" r="1.3" fill="#ffffff" />
        <circle cx="16" cy="9.5" r="1.3" fill="#ffffff" />
        <line x1="7.5" y1="15" x2="16.5" y2="15" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }
  if (key === "somewhat_dissatisfied") {
    return <ThumbsDown size={30} className="text-[#ea580c] fill-[#ea580c] shrink-0" />;
  }
  return <ThumbsDown size={30} className="text-[#dc2626] fill-[#dc2626] shrink-0" />;
}

const MOBILE_ISSUE_DETAILS: Record<
  string,
  {
    labelHi: string;
    sublabelHi: string;
    iconBg: string;
    iconType: "road" | "briefcase" | "education" | "health" | "water" | "security" | "environment" | "other";
  }
> = {
  sadak: {
    labelHi: "सड़कें और आधारभूत संरचना",
    sublabelHi: "सड़क, नाली, पुल, स्ट्रीट लाइट",
    iconBg: "bg-[#ea580c] text-white",
    iconType: "road",
  },
  rojgar: {
    labelHi: "रोज़गार और आर्थिक विकास",
    sublabelHi: "रोज़गार के अवसर, उद्योग, स्थानीय व्यापार",
    iconBg: "bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400",
    iconType: "briefcase",
  },
  shiksha: {
    labelHi: "शिक्षा",
    sublabelHi: "स्कूल, कॉलेज, शिक्षा की गुणवत्ता",
    iconBg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
    iconType: "education",
  },
  swasthya: {
    labelHi: "स्वास्थ्य सुविधाएं",
    sublabelHi: "अस्पताल, प्राथमिक स्वास्थ्य केंद्र, दवाएं",
    iconBg: "bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400",
    iconType: "health",
  },
  pani: {
    labelHi: "जल आपूर्ति और स्वच्छता",
    sublabelHi: "पीने का पानी, सीवर, सफाई व्यवस्था",
    iconBg: "bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400",
    iconType: "water",
  },
  kanoon_vyavastha: {
    labelHi: "कानून और सुरक्षा",
    sublabelHi: "अपराध नियंत्रण, महिला सुरक्षा, पुलिस व्यवस्था",
    iconBg: "bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400",
    iconType: "security",
  },
  jal_nikasi: {
    labelHi: "पर्यावरण और प्रदूषण",
    sublabelHi: "हवा, कचरा प्रबंधन, स्वच्छ वातावरण",
    iconBg: "bg-lime-100 text-lime-700 dark:bg-lime-950/60 dark:text-lime-400",
    iconType: "environment",
  },
  other: {
    labelHi: "अन्य",
    sublabelHi: "कोई अन्य महत्वपूर्ण मुद्दा",
    iconBg: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    iconType: "other",
  },
  mahangai: {
    labelHi: "महंगाई नियंत्रण",
    sublabelHi: "राशन, गैस, आवश्यक वस्तुओं की कीमतें",
    iconBg: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
    iconType: "briefcase",
  },
  bijli: {
    labelHi: "बिजली आपूर्ति",
    sublabelHi: "निर्बाध बिजली, सही बिलिंग, ट्रांसफार्मर",
    iconBg: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-400",
    iconType: "other",
  },
  krishi: {
    labelHi: "कृषि और किसान कल्याण",
    sublabelHi: "एमएसपी, खाद, सिंचाई, फसल सुरक्षा",
    iconBg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
    iconType: "environment",
  },
  parivahan: {
    labelHi: "यातायात और परिवहन",
    sublabelHi: "बस सेवा, रेलवे कनेक्टिविटी, सड़क मार्ग",
    iconBg: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400",
    iconType: "road",
  },
};

function renderMobileIssueIcon(type: string) {
  if (type === "road") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19L8 5" />
        <path d="M20 19L16 5" />
        <path d="M12 7V9" strokeWidth="3" />
        <path d="M12 15V17" strokeWidth="3" />
      </svg>
    );
  }
  if (type === "briefcase") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" />
      </svg>
    );
  }
  if (type === "education") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
      </svg>
    );
  }
  if (type === "health") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    );
  }
  if (type === "water") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </svg>
    );
  }
  if (type === "security") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
      </svg>
    );
  }
  if (type === "environment") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" />
      </svg>
    );
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}

export function SurveyExperience({
  surveyId,
  constituencyName,
  stateName,
  stateSlug,
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
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) {
      if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      const resetScroll = () => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        if (document.documentElement) document.documentElement.scrollTop = 0;
        if (document.body) document.body.scrollTop = 0;
      };
      resetScroll();
      const rafId = requestAnimationFrame(resetScroll);
      const timeoutId = setTimeout(resetScroll, 50);
      return () => {
        cancelAnimationFrame(rafId);
        clearTimeout(timeoutId);
      };
    }
  }, [done]);

  const steps: SurveyStepDef[] = [
    { key: "mla_satisfaction", label: t.surveyFlow.stepMla },
    { key: "party_preference", label: t.surveyFlow.stepParty },
    { key: "top_issue", label: t.surveyFlow.stepIssue },
    { key: "personal_info", label: t.surveyFlow.stepPersonalInfo },
  ];

  const pageKey: PageKey = PAGE_KEYS[pageIndex];
  const isFirst = pageIndex === 0;
  const isLast = pageIndex === PAGE_KEYS.length - 1;
  const canAdvance =
    pageKey === "mla_satisfaction"
      ? Boolean(answers.mla_satisfaction)
      : pageKey === "party_preference"
      ? Boolean(answers.party_preference)
      : true;

  const resultsHref = `${basePath}/constituencies/${constituencySlug}/results`;

  const optionLabels = t.surveyQuestions.options as Record<string, string>;
  const localize = (items: SurveyOptionItem[]) =>
    items.map((item) => ({ ...item, label: optionLabels[item.key] ?? item.label }));

  const localizedParties = parties.map((party) => {
    const isJansatta =
      party.key.toLowerCase().includes("jansatta") ||
      (party.label ?? "").toLowerCase().includes("jansatta") ||
      (party.abbreviation ?? "").toLowerCase() === "jdlp";
    if (isJansatta) {
      return {
        ...party,
        label: "JDLP",
        labelHi: "जनसत्ता दल (JDLP)",
      };
    }
    if (party.key === "other") {
      return {
        ...party,
        label: "Other",
        labelHi: "अन्य",
      };
    }
    if (party.key === "nota") {
      return {
        ...party,
        label: "NOTA",
        labelHi: "इनमें से कोई नहीं",
      };
    }
    if (party.key === "undecided") {
      return {
        ...party,
        label: "Undecided",
        labelHi: "अनिर्णीत",
      };
    }
    return party;
  });
  const localizedIssues = localize(issues);
  const localizedAgeGroups = localize(ageGroups);
  const localizedGenders = localize(genders);
  const localizedSocialCategories = localize(socialCategories);
  const localizedReligions = localize(religions);

  function select(key: SingleAnswerKey, value: string) {
    setAnswers((current) => ({ ...current, [key]: value }));
  }

  function toggleIssue(key: string) {
    setSelectedIssues((current) => (current.includes(key) ? current.filter((k) => k !== key) : [...current, key]));
  }

  async function handlePrimary() {
    if (!canAdvance) return;
    if (!isLast) {
      setPageIndex((i) => i + 1);
      return;
    }
    await submit();
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const singleAnswerKeys = QUESTION_KEYS.filter((key): key is SingleAnswerKey => key !== "top_issue" && Boolean(answers[key as SingleAnswerKey]));
      const payload = [
        ...singleAnswerKeys.map((key) => ({ questionKey: key, optionKey: answers[key] as string })),
        ...selectedIssues.map((issueKey) => ({ questionKey: "top_issue", optionKey: issueKey })),
      ];
      const response = await fetch(`/api/surveys/${surveyId}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payload, fingerprint: getDeviceFingerprint() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error ?? t.common.error);
        return;
      }
      setDone(true);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      }
    } catch {
      setError(t.vote.networkError);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <SuccessScreen
        steps={steps}
        constituencyName={constituencyName}
        stateName={stateName}
        stateSlug={stateSlug}
        onViewResults={() => router.push(resultsHref)}
      />
    );
  }

  const questionOfLabel =
    pageKey === "personal_info"
      ? t.surveyFlow.personalInfoQuestionLabel
      : t.surveyFlow.questionOf.replace("{current}", String(pageIndex + 1)).replace("{total}", String(PAGE_KEYS.length));

  return (
    <div>
      <SurveyStepper steps={steps} currentIndex={pageIndex} />

      <div className="mt-3">
        <p className="hidden sm:block text-base font-bold uppercase tracking-wider text-accent sm:text-lg">{questionOfLabel}</p>

        {
          // No AnimatePresence/exit animation here on purpose: gating the
          // next step's mount on an exit animation finishing (mode="wait")
          // risks the step never advancing if that animation is ever
          // delayed or skipped (e.g. a backgrounded tab, reduced-motion, or
          // a slow device) — form progression must never depend on an
          // animation actually completing.
        }
        <motion.div
          key={pageKey}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.22 }}
        >
            {pageKey === "mla_satisfaction" && (
              <div>
                {/* Mobile Experience (<sm) matching reference Image 2 */}
                <div className="sm:hidden space-y-4">
                  {/* Large Editorial Hero */}
                  <div className="relative pt-2 pb-3 overflow-hidden min-h-[195px]">
                    <div className="absolute top-0 right-[-10px] w-[58%] h-full pointer-events-none select-none">
                      <Image
                        src="/images/survey/mla-hero-mobile.png"
                        alt=""
                        fill
                        className="object-contain object-top-right"
                        priority
                      />
                    </div>
                    <div className="relative z-10 w-[70%] pr-1">
                      <h1 className="font-display font-extrabold text-[22px] leading-[1.25] text-slate-900 dark:text-slate-100 tracking-tight">
                        {locale === "hi" ? (
                          <>
                            आप अपने वर्तमान{" "}
                            <span className="text-[#ea580c]">विधायक (MLA)</span> के कार्यों
                            से कितने संतुष्ट हैं?
                          </>
                        ) : (
                          <>
                            How satisfied are you with your current{" "}
                            <span className="text-[#ea580c]">MLA&apos;s</span> work?
                          </>
                        )}
                      </h1>
                      <p className="mt-2 text-[12.5px] leading-[1.4] text-slate-600 dark:text-slate-300 font-medium">
                        {locale === "hi"
                          ? "अपने क्षेत्र में हुए विकास कार्यों, जनता की समस्याओं के समाधान और समग्र कार्यप्रणाली को ध्यान में रखकर जवाब दें।"
                          : "Respond considering the development work, resolution of public issues, and overall administration in your area."}
                      </p>
                    </div>
                  </div>

                  {/* Large Horizontal Satisfaction Cards */}
                  <div className="flex flex-col gap-3">
                    {MLA_SATISFACTION_OPTIONS.map((opt) => {
                      const isSelected = answers.mla_satisfaction === opt.key;
                      return (
                        <button
                          type="button"
                          key={opt.key}
                          onClick={() => select("mla_satisfaction", opt.key)}
                          className={cn(
                            "group relative flex w-full items-center justify-between gap-3.5 rounded-2xl p-4 text-left transition-all cursor-pointer shadow-xs",
                            isSelected
                              ? "border-2 border-emerald-600 bg-emerald-50/25 ring-1 ring-emerald-600/30"
                              : "border border-slate-200/90 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                          )}
                        >
                          <div className="flex min-w-0 items-center gap-3.5">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center">
                              {getMlaOptionIcon(opt.key)}
                            </span>
                            <div className="min-w-0">
                              <p className="font-bold text-[16px] text-slate-900 dark:text-slate-100 leading-snug">
                                {locale === "hi" ? opt.label : opt.labelEn}
                              </p>
                              <p className="mt-0.5 text-[12.5px] text-slate-500 dark:text-slate-400 leading-snug">
                                {locale === "hi" ? opt.sublabel : opt.sublabelEn}
                              </p>
                            </div>
                          </div>
                          <div
                            className={cn(
                              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                              isSelected
                                ? "border-emerald-600 bg-white"
                                : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                            )}
                          >
                            {isSelected && <span className="h-3 w-3 rounded-full bg-emerald-600" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Desktop Experience (>=sm) - Untouched existing layout */}
                <div className="hidden sm:block space-y-4">
                  <div className="rounded-2xl border border-border bg-surface-2 p-4 sm:p-5 shadow-xs">
                    <div className="flex items-center gap-3.5 sm:gap-4">
                      {currentMla?.photoUrl ? (
                        <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-full border-2 border-border shadow-xs">
                          <Image
                            src={currentMla.photoUrl}
                            alt={currentMla.name ?? "MLA"}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 font-bold text-xl sm:text-2xl shadow-inner">
                          {currentMla?.name ? currentMla.name.trim().slice(0, 1) : <Users size={26} />}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="inline-block rounded-md bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                          {t.surveyFlow.currentMla}
                        </span>
                        <h3 className="mt-1 truncate font-display text-base font-extrabold text-ink sm:text-xl">
                          {currentMla?.name ?? t.surveyFlow.noMlaData}
                        </h3>
                        <p className="mt-0.5 text-xs sm:text-sm font-medium text-muted">
                          {currentMla?.party ? `${currentMla.party} · ` : ""}{constituencyName}
                        </p>
                      </div>
                    </div>
                  </div>

                  <StepBody heading={t.surveyFlow.mlaHeading} subtitle={t.surveyFlow.mlaSubtitle}>
                    <div className="flex flex-col gap-2.5 sm:gap-3">
                      {MLA_SATISFACTION_OPTIONS.map((opt) => {
                        const isSelected = answers.mla_satisfaction === opt.key;
                        const icon =
                          opt.key === "very_satisfied" || opt.key === "somewhat_satisfied" ? (
                            <ThumbsUp size={20} className={isSelected ? "fill-current" : ""} />
                          ) : opt.key === "neutral" ? (
                            <Meh size={20} />
                          ) : (
                            <ThumbsDown size={20} className={isSelected ? "fill-current" : ""} />
                          );

                        return (
                          <button
                            type="button"
                            key={opt.key}
                            onClick={() => select("mla_satisfaction", opt.key)}
                            className={cn(
                              "group relative flex w-full items-center justify-between gap-3.5 rounded-2xl border p-3.5 sm:p-4 text-left transition-all duration-150 cursor-pointer shadow-xs",
                              isSelected
                                ? "border-2 bg-surface-2 shadow-sm ring-1 ring-inset"
                                : "border-border bg-surface hover:border-slate-300 dark:hover:border-slate-700"
                            )}
                            style={{
                              borderColor: isSelected ? opt.colorHex : undefined,
                              backgroundColor: isSelected ? `${opt.colorHex}0d` : undefined,
                            }}
                          >
                            <div className="flex min-w-0 items-center gap-3 sm:gap-3.5">
                              <span
                                className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
                                style={{
                                  backgroundColor: `${opt.colorHex}18`,
                                  color: opt.colorHex,
                                }}
                              >
                                {icon}
                              </span>
                              <div className="min-w-0">
                                <p className="font-bold text-sm sm:text-base text-ink leading-snug">
                                  {locale === "hi" ? opt.label : opt.labelEn}
                                </p>
                                <p className="mt-0.5 text-xs sm:text-[13px] text-muted leading-tight">
                                  {locale === "hi" ? opt.sublabel : opt.sublabelEn}
                                </p>
                              </div>
                            </div>
                            <div
                              className={cn(
                                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                                isSelected ? "border-transparent" : "border-slate-300 dark:border-slate-600 bg-transparent"
                              )}
                              style={{ backgroundColor: isSelected ? opt.colorHex : undefined }}
                            >
                              {isSelected && <span className="h-2 w-2 rounded-full bg-white" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </StepBody>
                </div>
              </div>
            )}

            {pageKey === "party_preference" && (
              <div>
                {/* Mobile Experience (<sm) matching reference Image 3 */}
                <div className="sm:hidden space-y-4">
                  {/* Large Editorial Hero */}
                  <div className="relative pt-2 pb-3 overflow-hidden min-h-[195px]">
                    <div className="absolute top-0 right-[-10px] w-[58%] h-full pointer-events-none select-none">
                      <Image
                        src="/images/survey/party-hero-mobile.png"
                        alt=""
                        fill
                        className="object-contain object-top-right"
                        priority
                      />
                    </div>
                    <div className="relative z-10 w-[70%] pr-1">
                      <h1 className="font-display font-extrabold text-[22px] leading-[1.25] text-slate-900 dark:text-slate-100 tracking-tight">
                        {locale === "hi" ? (
                          <>
                            आपके विधानसभा क्षेत्र में आगामी चुनाव में आप किस{" "}
                            <span className="text-[#ea580c]">राजनीतिक पार्टी</span> को
                            समर्थन देंगे?
                          </>
                        ) : (
                          <>
                            Which{" "}
                            <span className="text-[#ea580c]">Political Party</span> will
                            you support in the upcoming election in your constituency?
                          </>
                        )}
                      </h1>
                      <p className="mt-2 text-[12.5px] leading-[1.4] text-slate-600 dark:text-slate-300 font-medium">
                        {locale === "hi"
                          ? "अपने क्षेत्र में विकास, नेतृत्व और मुद्दों के आधार पर अपनी पसंद चुनें।"
                          : "Choose your preference based on local development, leadership, and key issues."}
                      </p>
                    </div>
                  </div>

                  {/* Large Horizontal Party Cards */}
                  <div className="flex flex-col gap-3">
                    {localizedParties.map((party) => {
                      const isSelected = answers.party_preference === party.key;
                      const isJansatta =
                        party.key.toLowerCase().includes("jansatta") ||
                        (party.label ?? "").toLowerCase().includes("jansatta") ||
                        (party.abbreviation ?? "").toLowerCase() === "jdlp";
                      const displayName = isJansatta
                        ? (locale === "hi" ? "जनसत्ता दल (JDLP)" : "JDLP")
                        : (locale === "hi" ? (party.labelHi || party.label) : party.label);
                      const symbolText = getPartySymbol(party.key, locale);

                      return (
                        <button
                          type="button"
                          key={party.key}
                          onClick={() => select("party_preference", party.key)}
                          className={cn(
                            "group relative flex w-full items-center justify-between gap-3.5 rounded-2xl p-4 text-left transition-all cursor-pointer shadow-xs",
                            isSelected
                              ? "border-2 border-orange-500 bg-orange-50/25 ring-1 ring-orange-500/30"
                              : "border border-slate-200/90 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                          )}
                        >
                          <div className="flex min-w-0 items-center gap-3.5">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center p-0.5">
                              {party.logoUrl ? (
                                <Image
                                  src={party.logoUrl}
                                  alt=""
                                  width={44}
                                  height={44}
                                  className="h-full w-full object-contain"
                                />
                              ) : (
                                <span
                                  className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white shadow-xs"
                                  style={{ backgroundColor: party.colorHex ?? "#64748b" }}
                                >
                                  {(party.abbreviation ?? party.label).slice(0, 3).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-[16px] text-slate-900 dark:text-slate-100 leading-snug">
                                {displayName}
                              </p>
                              {symbolText && (
                                <p className="mt-0.5 text-[12.5px] text-slate-500 dark:text-slate-400 leading-snug">
                                  {symbolText}
                                </p>
                              )}
                            </div>
                          </div>
                          <div
                            className={cn(
                              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                              isSelected
                                ? "border-red-600 bg-white"
                                : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                            )}
                          >
                            {isSelected && <span className="h-3 w-3 rounded-full bg-red-600" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Desktop Experience (>=sm) - Untouched existing layout */}
                <div className="hidden sm:block">
                  <StepBody heading={t.surveyFlow.partyHeading} subtitle={t.surveyFlow.partySubtitle}>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 lg:gap-3 xl:gap-4">
                      {localizedParties.map((party) => (
                        <PartyOptionCard
                          key={party.key}
                          option={party}
                          selected={answers.party_preference === party.key}
                          onSelect={() => select("party_preference", party.key)}
                        />
                      ))}
                    </div>
                  </StepBody>
                </div>
              </div>
            )}

            {pageKey === "top_issue" && (
              <div>
                {/* Mobile Experience (<sm) matching reference Image 4 */}
                <div className="sm:hidden space-y-4">
                  {/* Large Editorial Hero */}
                  <div className="relative pt-2 pb-3 overflow-hidden min-h-[190px]">
                    <div className="absolute top-0 right-[-10px] w-[58%] h-full pointer-events-none select-none">
                      <Image
                        src="/images/survey/issue-hero-mobile.png"
                        alt=""
                        fill
                        className="object-contain object-top-right"
                        priority
                      />
                    </div>
                    <div className="relative z-10 w-[70%] pr-1">
                      <h1 className="font-display font-extrabold text-[22px] leading-[1.25] text-slate-900 dark:text-slate-100 tracking-tight">
                        {locale === "hi" ? (
                          <>
                            आपके क्षेत्र में सबसे{" "}
                            <span className="text-[#ea580c]">महत्वपूर्ण मुद्दा</span> क्या है?
                          </>
                        ) : (
                          <>
                            What is the most{" "}
                            <span className="text-[#ea580c]">important issue</span> in your area?
                          </>
                        )}
                      </h1>
                      <p className="mt-2 text-[12.5px] leading-[1.4] text-slate-600 dark:text-slate-300 font-medium">
                        {locale === "hi"
                          ? "आपके क्षेत्र में विकास के लिए किन समस्याओं पर सबसे पहले ध्यान दिया जाना चाहिए? कृपया एक विकल्प चुनें।"
                          : "Which problems in your area should be addressed with the highest priority? Please select an option."}
                      </p>
                    </div>
                  </div>

                  {/* Large Horizontal Issue Cards */}
                  <div className="flex flex-col gap-3">
                    {localizedIssues.map((issue) => {
                      const isSelected = selectedIssues.includes(issue.key);
                      const details = MOBILE_ISSUE_DETAILS[issue.key] ?? {
                        labelHi: issue.labelHi || issue.label,
                        sublabelHi: "महत्वपूर्ण जनसमस्या",
                        iconBg: "bg-slate-100 text-slate-600",
                        iconType: "other" as const,
                      };
                      const title = locale === "hi" ? details.labelHi : issue.label;
                      const subtitle = locale === "hi" ? details.sublabelHi : "";

                      return (
                        <button
                          type="button"
                          key={issue.key}
                          onClick={() => {
                            toggleIssue(issue.key);
                          }}
                          className={cn(
                            "group relative flex w-full items-center justify-between gap-3.5 rounded-2xl p-4 text-left transition-all cursor-pointer shadow-xs",
                            isSelected
                              ? "border-2 border-orange-500 bg-orange-50/25 ring-1 ring-orange-500/30"
                              : "border border-slate-200/90 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900"
                          )}
                        >
                          <div className="flex min-w-0 items-center gap-3.5">
                            <span
                              className={cn(
                                "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-xs",
                                details.iconBg
                              )}
                            >
                              {renderMobileIssueIcon(details.iconType)}
                            </span>
                            <div className="min-w-0">
                              <p className="font-bold text-[16px] text-slate-900 dark:text-slate-100 leading-snug">
                                {title}
                              </p>
                              {subtitle && (
                                <p className="mt-0.5 text-[12.5px] text-slate-500 dark:text-slate-400 leading-snug">
                                  {subtitle}
                                </p>
                              )}
                            </div>
                          </div>
                          <div
                            className={cn(
                              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                              isSelected
                                ? "border-red-600 bg-white"
                                : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                            )}
                          >
                            {isSelected && <span className="h-3 w-3 rounded-full bg-red-600" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Desktop Experience (>=sm) - Untouched existing layout */}
                <div className="hidden sm:block">
                  <StepBody heading={t.surveyFlow.issueHeading} subtitle={t.surveyFlow.issueSubtitle}>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 lg:gap-3 xl:gap-3.5">
                      {localizedIssues.map((issue) => (
                        <IconOptionCard
                          key={issue.key}
                          option={issue}
                          selected={selectedIssues.includes(issue.key)}
                          onSelect={() => toggleIssue(issue.key)}
                        />
                      ))}
                    </div>
                  </StepBody>
                </div>
              </div>
            )}

            {pageKey === "personal_info" && (
              <StepBody heading={t.demographics.title} subtitle={t.demographics.subtitle}>
                <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-4 xl:gap-5">
                  <PersonalInfoRow
                    index={1}
                    icon={Users}
                    color="blue"
                    question={t.surveyFlow.ageHeading}
                    subtitle={t.surveyFlow.ageRowSubtitle}
                  >
                    <ChipGroup
                      options={localizedAgeGroups}
                      selected={answers.age_group}
                      onSelect={(v) => select("age_group", v)}
                      activeColor={PERSONAL_INFO_ROW_COLORS.blue.chipActive}
                    />
                  </PersonalInfoRow>
                  <PersonalInfoRow
                    index={2}
                    icon={VenusAndMars}
                    color="pink"
                    question={t.surveyFlow.genderHeading}
                    subtitle={t.surveyFlow.genderRowSubtitle}
                  >
                    <ChipGroup
                      options={localizedGenders}
                      selected={answers.gender}
                      onSelect={(v) => select("gender", v)}
                      activeColor={PERSONAL_INFO_ROW_COLORS.pink.chipActive}
                    />
                  </PersonalInfoRow>
                  <PersonalInfoRow
                    index={3}
                    icon={UsersRound}
                    color="green"
                    question={t.surveyFlow.socialCategoryHeading}
                    subtitle={t.surveyFlow.socialCategoryRowSubtitle}
                  >
                    <ChipGroup
                      options={localizedSocialCategories}
                      selected={answers.social_category}
                      onSelect={(v) => select("social_category", v)}
                      activeColor={PERSONAL_INFO_ROW_COLORS.green.chipActive}
                    />
                  </PersonalInfoRow>
                  <PersonalInfoRow
                    index={4}
                    icon={HandHeart}
                    color="purple"
                    question={t.surveyFlow.religionHeading}
                    subtitle={t.surveyFlow.religionRowSubtitle}
                  >
                    <ChipGroup
                      options={localizedReligions}
                      selected={answers.religion}
                      onSelect={(v) => select("religion", v)}
                      activeColor={PERSONAL_INFO_ROW_COLORS.purple.chipActive}
                    />
                  </PersonalInfoRow>
                </div>
              </StepBody>
            )}
        </motion.div>

        {error && (
          <p role="alert" className="mt-4 text-sm font-medium text-danger">
            {error}
          </p>
        )}

        <div className="mt-5 lg:mt-6">
          <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-foreground sm:max-w-md lg:max-w-none">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-slate-700" />
            <div>
              <p className="font-bold text-xs sm:text-sm text-ink">{t.surveyFlow.privacyTitle}</p>
              <p className="mt-0.5 text-xs text-muted leading-relaxed">{t.surveyFlow.privacyBody}</p>
            </div>
          </div>
        </div>

        {/* Bottom clearance so the fixed Previous/Next controls below never
            overlap the last piece of content (privacy notice / last answer
            option) on any viewport. */}
        <div className="pb-28 sm:pb-8 lg:pb-20 xl:pb-24" aria-hidden="true" />
      </div>

      {/* Mobile/Tablet bottom navigation bar matching target design */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 dark:bg-slate-900/95 dark:border-slate-800 shadow-sm py-3 px-4">
        <div className="max-w-md mx-auto flex items-center gap-3">
          {!isFirst && (
            <Button
              variant="outline"
              size="lg"
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-[15px] bg-white hover:bg-blue-50 text-blue-600 border-2 border-blue-200 dark:bg-slate-800 dark:text-blue-400 dark:border-blue-900/60 transition-colors shadow-xs"
              onClick={() => setPageIndex((i) => i - 1)}
              disabled={submitting}
              aria-label={locale === "hi" ? "पिछला सवाल" : t.surveyFlow.previous}
            >
              <ChevronLeft size={19} />
              <span>{locale === "hi" ? "पिछला सवाल" : t.surveyFlow.previous}</span>
            </Button>
          )}

          <Button
            variant="cta"
            size="lg"
            onClick={handlePrimary}
            disabled={!canAdvance || submitting}
            className={cn(
              "flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-[15px] text-white shadow-md transition-colors bg-[#ef4444] hover:bg-[#dc2626]",
              isFirst ? "w-full" : "flex-1"
            )}
          >
            {submitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <span>{isLast ? t.surveyFlow.submitSurvey : (locale === "hi" ? "अगला सवाल" : t.surveyFlow.next)}</span>
                <ChevronRight size={19} />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Desktop floating navigation buttons - bottom-right of viewport, side-by-side, no full-width strip */}
      <div className="hidden lg:flex fixed bottom-5 right-6 xl:bottom-6 xl:right-8 z-50 items-center gap-3 xl:gap-3.5">
        {!isFirst ? (
          <Button
            variant="outline"
            size="lg"
            className="flex items-center justify-center gap-2 px-5 xl:px-6 py-2.5 rounded-xl font-bold text-sm xl:text-base bg-[#f1f5f9] hover:bg-[#e2e8f0] text-slate-800 border border-slate-200/90 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 transition-all shadow-sm hover:shadow"
            onClick={() => setPageIndex((i) => i - 1)}
            disabled={submitting}
            aria-label={locale === "hi" ? "पिछला प्रश्न" : t.surveyFlow.previous}
          >
            <ChevronLeft size={18} />
            <span>{locale === "hi" ? "पिछला प्रश्न" : t.surveyFlow.previous}</span>
          </Button>
        ) : (
          <Button
            variant="outline"
            size="lg"
            className="flex items-center justify-center gap-2 px-5 xl:px-6 py-2.5 rounded-xl font-bold text-sm xl:text-base bg-[#f1f5f9] hover:bg-[#e2e8f0] text-slate-800 border border-slate-200/90 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 transition-all shadow-sm hover:shadow"
            onClick={() => router.push(basePath)}
            disabled={submitting}
            aria-label={locale === "hi" ? "पिछला प्रश्न" : t.surveyFlow.previous}
          >
            <ChevronLeft size={18} />
            <span>{locale === "hi" ? "पिछला प्रश्न" : t.surveyFlow.previous}</span>
          </Button>
        )}

        <Button
          variant="cta"
          size="lg"
          onClick={handlePrimary}
          disabled={!canAdvance || submitting}
          className="flex items-center justify-center gap-2 px-6 xl:px-7 py-2.5 rounded-xl font-bold text-sm xl:text-base shadow-[0_4px_16px_-2px_rgba(255,87,34,0.45)] hover:shadow-[0_6px_20px_-2px_rgba(255,87,34,0.55)] bg-[#ff5722] hover:bg-[#f4511e] text-white transition-all"
        >
          {submitting ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              <span>{isLast ? t.surveyFlow.submitSurvey : (locale === "hi" ? "अगला प्रश्न" : t.surveyFlow.next)}</span>
              {!isLast && <ChevronRight size={18} />}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function StepBody({ heading, subtitle, children }: { heading: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="w-full mt-1.5 lg:mt-2">
      <h1 className="font-display text-2xl sm:text-3xl lg:text-3xl font-extrabold text-ink leading-[1.3] py-0.5 break-words overflow-visible">
        {heading}
      </h1>
      <p className="mt-0.5 lg:mt-1 text-sm sm:text-base text-muted leading-relaxed">{subtitle}</p>
      <div className="mt-3.5 sm:mt-4 lg:mt-4 xl:mt-5">{children}</div>
    </div>
  );
}

const PERSONAL_INFO_ROW_COLORS = {
  blue: {
    bg: "bg-blue-50/50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-900",
    icon: "bg-blue-600",
    chipActive: "border-blue-600 bg-blue-600 text-white",
  },
  pink: {
    bg: "bg-pink-50/50 dark:bg-pink-950/30",
    border: "border-pink-200 dark:border-pink-900",
    icon: "bg-pink-500",
    chipActive: "border-pink-600 bg-pink-600 text-white",
  },
  green: {
    bg: "bg-emerald-50/50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-900",
    icon: "bg-emerald-600",
    chipActive: "border-emerald-600 bg-emerald-600 text-white",
  },
  purple: {
    bg: "bg-purple-50/50 dark:bg-purple-950/30",
    border: "border-purple-200 dark:border-purple-900",
    icon: "bg-purple-600",
    chipActive: "border-purple-600 bg-purple-600 text-white",
  },
} as const;

function PersonalInfoRow({
  index,
  icon: Icon,
  color,
  question,
  subtitle,
  children,
}: {
  index: number;
  icon: typeof Users;
  color: keyof typeof PERSONAL_INFO_ROW_COLORS;
  question: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const palette = PERSONAL_INFO_ROW_COLORS[color];
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border p-3.5 sm:p-4 sm:flex-row sm:items-center sm:gap-5 lg:flex-col lg:items-start lg:gap-2.5 lg:p-4 xl:p-4.5",
        palette.bg,
        palette.border
      )}
    >
      <div className="flex items-start gap-3 sm:w-72 sm:shrink-0 lg:w-full">
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm lg:h-10 lg:w-10", palette.icon)}>
          <Icon size={18} />
        </span>
        <div>
          <p className="font-display text-sm sm:text-base font-extrabold leading-snug text-ink lg:text-sm xl:text-base">
            {index}. {question}
          </p>
          <p className="mt-0.5 text-xs text-muted leading-snug">{subtitle}</p>
        </div>
      </div>
      <div className="sm:flex-1 lg:w-full lg:mt-0.5">{children}</div>
    </div>
  );
}

const PARTY_THEMES: Record<string, {
  desktopBg: string;
  desktopBorder: string;
  badgeBg: string;
}> = {
  bjp: {
    desktopBg: "lg:bg-[#fff9f2] dark:lg:bg-orange-950/20",
    desktopBorder: "lg:border-[#fed7aa] dark:lg:border-orange-900/50",
    badgeBg: "bg-orange-500",
  },
  sp: {
    desktopBg: "lg:bg-[#fff5f5] dark:lg:bg-red-950/20",
    desktopBorder: "lg:border-[#fecaca] dark:lg:border-red-900/50",
    badgeBg: "bg-red-600",
  },
  bsp: {
    desktopBg: "lg:bg-[#f0f7ff] dark:lg:bg-blue-950/20",
    desktopBorder: "lg:border-[#bfdbfe] dark:lg:border-blue-900/50",
    badgeBg: "bg-blue-600",
  },
  inc: {
    desktopBg: "lg:bg-[#f0fdf4] dark:lg:bg-emerald-950/20",
    desktopBorder: "lg:border-[#bbf7d0] dark:lg:border-emerald-900/50",
    badgeBg: "bg-emerald-600",
  },
  rld: {
    desktopBg: "lg:bg-[#f0fdf4] dark:lg:bg-emerald-950/20",
    desktopBorder: "lg:border-[#bbf7d0] dark:lg:border-emerald-900/50",
    badgeBg: "bg-emerald-600",
  },
  aap: {
    desktopBg: "lg:bg-[#f0f9ff] dark:lg:bg-sky-950/20",
    desktopBorder: "lg:border-[#bae6fd] dark:lg:border-sky-900/50",
    badgeBg: "bg-sky-600",
  },
  other: {
    desktopBg: "lg:bg-[#faf5ff] dark:lg:bg-purple-950/20",
    desktopBorder: "lg:border-[#e9d5ff] dark:lg:border-purple-900/50",
    badgeBg: "bg-purple-600",
  },
  nota: {
    desktopBg: "lg:bg-[#fff1f2] dark:lg:bg-rose-950/20",
    desktopBorder: "lg:border-[#fecdd3] dark:lg:border-rose-900/50",
    badgeBg: "bg-rose-600",
  },
  undecided: {
    desktopBg: "lg:bg-[#f8fafc] dark:lg:bg-slate-900/40",
    desktopBorder: "lg:border-[#e2e8f0] dark:lg:border-slate-800",
    badgeBg: "bg-slate-600",
  },
};

function PartyOptionCard({
  option,
  selected,
  onSelect,
}: {
  option: SurveyOptionItem;
  selected: boolean;
  onSelect: () => void;
}) {
  const { locale } = useLocale();
  const isJansatta =
    option.key.toLowerCase().includes("jansatta") ||
    (option.label ?? "").toLowerCase().includes("jansatta") ||
    (option.abbreviation ?? "").toLowerCase() === "jdlp";
  const displayName = isJansatta
    ? (locale === "hi" ? "जनसत्ता दल (JDLP)" : "JDLP")
    : (locale === "hi" ? (option.labelHi || option.label) : option.label);

  const theme = PARTY_THEMES[option.key.toLowerCase()];

  return (
    <label
      className={cn(
        "card-surface relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-border p-3 text-center transition-all focus-within:ring-2 focus-within:ring-ink/40 hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)] min-h-[110px] sm:min-h-[130px] lg:min-h-[120px] xl:min-h-[125px] lg:py-3.5 lg:px-3",
        theme?.desktopBg,
        theme?.desktopBorder,
        selected
          ? "border-accent bg-orange-50/50 ring-2 ring-accent dark:bg-orange-950/20 lg:ring-2 lg:ring-orange-500 lg:border-orange-500 lg:bg-orange-50/60 lg:shadow-md"
          : "lg:hover:border-slate-300 dark:lg:hover:border-slate-700"
      )}
    >
      <input type="radio" name="party_preference" checked={selected} onChange={onSelect} className="sr-only" />
      {/* Top right radio indicator */}
      {selected ? (
        <span className="absolute right-2 top-2 lg:right-2.5 lg:top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white ring-2 ring-orange-500/20">
          <Check size={12} strokeWidth={3} />
        </span>
      ) : (
        <span
          aria-hidden="true"
          className="hidden lg:flex absolute right-2.5 top-2.5 h-5 w-5 items-center justify-center rounded-full border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
        />
      )}
      <span className="flex h-12 w-12 items-center justify-center sm:h-16 sm:w-16 lg:h-12 lg:w-12 xl:h-14 xl:w-14">
        {option.logoUrl ? (
          <Image src={option.logoUrl} alt="" width={80} height={80} className="h-full w-full object-contain" />
        ) : (
          <span
            className={cn(
              "flex h-10 w-10 sm:h-14 sm:w-14 lg:h-11 lg:w-11 xl:h-12 xl:w-12 items-center justify-center rounded-full text-xs sm:text-sm font-extrabold text-white shadow-xs",
              theme?.badgeBg || "bg-slate-600"
            )}
            style={!theme?.badgeBg ? { backgroundColor: option.colorHex ?? "#6b7280" } : undefined}
          >
            {(option.abbreviation ?? option.label).slice(0, 3).toUpperCase()}
          </span>
        )}
      </span>
      <span className="font-display text-xs font-extrabold leading-snug text-ink sm:text-sm lg:text-[13px] xl:text-sm text-center px-1">
        {displayName}
      </span>
    </label>
  );
}

// Per-issue styling matching the user's reference design
const ISSUE_STYLES: Record<string, {
  bg: string;
  border: string;
  desktopBg: string;
  desktopBorder: string;
  iconBox: string;
  iconColor: string;
}> = {
  rojgar: {
    bg: "bg-white",
    border: "border-blue-200",
    desktopBg: "lg:bg-[#eff6ff] dark:lg:bg-blue-950/20",
    desktopBorder: "lg:border-[#bfdbfe] dark:lg:border-blue-900/60",
    iconBox: "bg-blue-600",
    iconColor: "text-white",
  },
  mahangai: {
    bg: "bg-white",
    border: "border-emerald-200",
    desktopBg: "lg:bg-[#f0fdf4] dark:lg:bg-emerald-950/20",
    desktopBorder: "lg:border-[#bbf7d0] dark:lg:border-emerald-900/60",
    iconBox: "bg-emerald-500",
    iconColor: "text-white",
  },
  sadak: {
    bg: "bg-white",
    border: "border-amber-200",
    desktopBg: "lg:bg-[#fefce8] dark:lg:bg-amber-950/20",
    desktopBorder: "lg:border-[#fde68a] dark:lg:border-amber-900/60",
    iconBox: "bg-amber-100",
    iconColor: "text-amber-900",
  },
  bijli: {
    bg: "bg-white",
    border: "border-purple-200",
    desktopBg: "lg:bg-[#faf5ff] dark:lg:bg-purple-950/20",
    desktopBorder: "lg:border-[#e9d5ff] dark:lg:border-purple-900/60",
    iconBox: "bg-purple-600",
    iconColor: "text-white",
  },
  pani: {
    bg: "bg-white",
    border: "border-sky-200",
    desktopBg: "lg:bg-[#f0fdfa] dark:lg:bg-sky-950/20",
    desktopBorder: "lg:border-[#bae6fd] dark:lg:border-sky-900/60",
    iconBox: "bg-sky-100",
    iconColor: "text-sky-600",
  },
  shiksha: {
    bg: "bg-white",
    border: "border-pink-200",
    desktopBg: "lg:bg-[#fff1f2] dark:lg:bg-pink-950/20",
    desktopBorder: "lg:border-[#fecdd3] dark:lg:border-pink-900/60",
    iconBox: "bg-pink-100",
    iconColor: "text-pink-600",
  },
  swasthya: {
    bg: "bg-white",
    border: "border-rose-200",
    desktopBg: "lg:bg-[#fff5f5] dark:lg:bg-red-950/20",
    desktopBorder: "lg:border-[#fecaca] dark:lg:border-red-900/60",
    iconBox: "bg-red-500",
    iconColor: "text-white",
  },
  kanoon_vyavastha: {
    bg: "bg-white",
    border: "border-emerald-200",
    desktopBg: "lg:bg-[#f0fdf4] dark:lg:bg-emerald-950/20",
    desktopBorder: "lg:border-[#bbf7d0] dark:lg:border-emerald-900/60",
    iconBox: "bg-emerald-600",
    iconColor: "text-white",
  },
  krishi: {
    bg: "bg-white",
    border: "border-pink-200",
    desktopBg: "lg:bg-[#fdf2f8] dark:lg:bg-pink-950/20",
    desktopBorder: "lg:border-[#fbcfe8] dark:lg:border-pink-900/60",
    iconBox: "bg-pink-500",
    iconColor: "text-white",
  },
  parivahan: {
    bg: "bg-white",
    border: "border-indigo-200",
    desktopBg: "lg:bg-[#eff6ff] dark:lg:bg-blue-950/20",
    desktopBorder: "lg:border-[#bfdbfe] dark:lg:border-blue-900/60",
    iconBox: "bg-blue-600",
    iconColor: "text-white",
  },
  jal_nikasi: {
    bg: "bg-white",
    border: "border-cyan-200",
    desktopBg: "lg:bg-[#f0fdfa] dark:lg:bg-cyan-950/20",
    desktopBorder: "lg:border-[#a5f3fc] dark:lg:border-cyan-900/60",
    iconBox: "bg-cyan-100",
    iconColor: "text-cyan-600",
  },
  other: {
    bg: "bg-white",
    border: "border-slate-200",
    desktopBg: "lg:bg-[#f8fafc] dark:lg:bg-slate-900/40",
    desktopBorder: "lg:border-[#e2e8f0] dark:lg:border-slate-800",
    iconBox: "bg-slate-200",
    iconColor: "text-slate-600",
  },
};

const ISSUE_DESCRIPTIONS: Record<string, { hi: string; en: string }> = {
  rojgar: { hi: "अधिक अवसर, बेहतर भविष्य", en: "More opportunities, better future" },
  mahangai: { hi: "कीमतों पर नियंत्रण", en: "Control on prices" },
  sadak: { hi: "बेहतर सड़क और बुनियादी ढांचा", en: "Better roads and infrastructure" },
  bijli: { hi: "निश्चित और सस्ती बिजली", en: "Reliable and affordable electricity" },
  pani: { hi: "स्वच्छ पेयजल और जलापूर्ति", en: "Clean drinking water & supply" },
  shiksha: { hi: "बेहतर शिक्षा, उज्ज्वल भविष्य", en: "Better education, bright future" },
  swasthya: { hi: "अच्छी स्वास्थ्य सुविधाएँ", en: "Good healthcare facilities" },
  kanoon_vyavastha: { hi: "सुरक्षित और शांतिपूर्ण समाज", en: "Safe and peaceful society" },
  krishi: { hi: "किसानों के लिए बेहतर नीतियाँ", en: "Better policies for farmers" },
  parivahan: { hi: "बेहतर सार्वजनिक परिवहन सुविधा", en: "Better public transport" },
  jal_nikasi: { hi: "बेहतर नाली और बाढ़ नियंत्रण", en: "Better drainage & flood control" },
  other: { hi: "कोई अन्य मुद्दा", en: "Any other issue" },
};

function IconOptionCard({
  option,
  selected,
  onSelect,
}: {
  option: SurveyOptionItem;
  selected: boolean;
  onSelect: () => void;
}) {
  const { locale } = useLocale();
  const iconRegistry = Icons as unknown as Record<string, typeof HelpCircle>;
  const IconComponent = (option.icon && iconRegistry[option.icon]) || HelpCircle;
  const style = ISSUE_STYLES[option.key] ?? ISSUE_STYLES.other;
  const desc = ISSUE_DESCRIPTIONS[option.key]?.[locale === "en" ? "en" : "hi"] ?? "";

  return (
    <label
      className={cn(
        "relative flex cursor-pointer items-center gap-2.5 sm:gap-3 rounded-2xl border p-2.5 sm:p-3 lg:p-2.5 xl:p-3 text-left transition-all hover:shadow-[var(--shadow-soft)] min-h-[72px] sm:min-h-[80px] lg:min-h-[80px] xl:min-h-[84px]",
        style.bg,
        style.border,
        style.desktopBg,
        style.desktopBorder,
        selected
          ? "border-blue-500 ring-2 ring-blue-400/50 bg-blue-50/40 dark:bg-blue-950/20 lg:border-blue-600 lg:ring-2 lg:ring-blue-500/20 lg:bg-blue-50/60"
          : "lg:hover:border-slate-300 dark:lg:hover:border-slate-700"
      )}
    >
      <input type="checkbox" checked={selected} onChange={onSelect} className="sr-only" />
      <span className={cn("flex h-10 w-10 sm:h-11 sm:w-11 lg:h-10 lg:w-10 xl:h-11 xl:w-11 shrink-0 items-center justify-center rounded-xl", style.iconBox, style.iconColor)}>
        <IconComponent size={20} />
      </span>
      <div className="flex-1 min-w-0 pr-1">
        <div className="font-display font-bold text-xs sm:text-sm lg:text-[13px] xl:text-sm text-ink leading-tight truncate sm:whitespace-normal">
          {option.label}
        </div>
        {desc && (
          <div className="text-[10px] sm:text-xs lg:text-[11px] xl:text-xs text-muted leading-tight mt-0.5 line-clamp-2">
            {desc}
          </div>
        )}
      </div>
      <span
        aria-hidden="true"
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          selected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800 text-transparent"
        )}
      >
        <Check size={12} strokeWidth={3} />
      </span>
    </label>
  );
}

function ChipGroup({
  options,
  selected,
  onSelect,
  activeColor = "border-ink bg-ink text-white",
}: {
  options: SurveyOptionItem[];
  selected?: string;
  onSelect: (value: string) => void;
  activeColor?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected === option.key;
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(option.key)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-xs sm:text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 shadow-sm",
              isSelected
                ? activeColor
                : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function SuccessScreen({
  steps,
  constituencyName,
  stateName,
  stateSlug,
  onViewResults,
}: {
  steps: SurveyStepDef[];
  constituencyName: string;
  stateName?: string;
  stateSlug?: string;
  onViewResults: () => void;
}) {
  const { t, locale } = useLocale();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    const resetScroll = () => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
    };
    resetScroll();
    const rafId = requestAnimationFrame(resetScroll);
    const timeoutId = setTimeout(resetScroll, 50);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
    };
  }, []);

  async function handleShare() {
    // Never derived from the respondent's actual answers (party/candidate/
    // issue/etc. never reach this function) — see getSurveyShareMessage's
    // own doc comment for why every share surface must go through it.
    const shareText = buildSurveyCompletionShareMessage({ locale, constituencyName });
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        // Pass shareText as text without a separate url parameter so platforms
        // do not duplicate the URL (the message already contains exactly one URL).
        await navigator.share({ text: shareText });
        return;
      } catch {
        // user cancelled or share failed — fall through to clipboard
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  const isHindi = locale === "hi";

  return (
    <div className="w-full">
      {/* 1. Top Section: 3-Step Progress Stepper + Time Estimate Pill */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 pb-2">
        <div className="flex items-center w-full sm:w-auto sm:min-w-[340px] max-w-md">
          {/* Step 1: Party */}
          <div className="flex flex-col items-center">
            <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm text-xs">
              <Check size={14} strokeWidth={3} />
            </span>
            <span className="text-[11px] sm:text-xs font-bold text-slate-800 mt-1 whitespace-nowrap">
              {steps[0]?.label ?? (isHindi ? "पार्टी" : "Party")}
            </span>
          </div>

          {/* Connector 1 */}
          <div className="h-0.5 flex-1 bg-blue-600 mx-2 -mt-4" />

          {/* Step 2: Issues */}
          <div className="flex flex-col items-center">
            <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm text-xs">
              <Check size={14} strokeWidth={3} />
            </span>
            <span className="text-[11px] sm:text-xs font-bold text-slate-800 mt-1 whitespace-nowrap">
              {steps[1]?.label ?? (isHindi ? "मुख्य मुद्दे" : "Key Issues")}
            </span>
          </div>

          {/* Connector 2 */}
          <div className="h-0.5 flex-1 bg-blue-600 mx-2 -mt-4" />

          {/* Step 3: Profile */}
          <div className="flex flex-col items-center">
            <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm text-xs">
              <Check size={14} strokeWidth={3} />
            </span>
            <span className="text-[11px] sm:text-xs font-bold text-slate-800 mt-1 whitespace-nowrap">
              {steps[2]?.label ?? (isHindi ? "व्यक्तिगत जानकारी" : "Profile")}
            </span>
          </div>
        </div>

        {/* Time estimate pill on the right */}
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-blue-100 bg-[#eef4fd] px-4 py-2 text-xs sm:text-sm font-semibold text-blue-900 shadow-sm">
          <Clock size={16} className="text-blue-600 shrink-0" />
          <span>{t.surveyFlow.timeEstimate}</span>
        </div>
      </div>

      {/* 2. Main Card: 3-Column Premium Composition */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-2 overflow-hidden rounded-[28px] border border-blue-100/80 bg-gradient-to-r from-[#eef7ff] via-[#f7faff] to-[#f0f6ff] shadow-sm p-4 sm:p-5 lg:py-6 lg:px-6"
      >
        <div className="grid grid-cols-1 lg:[grid-template-columns:20%_60%_20%] items-center w-full">
          {/* Column 1 (Left, 20%): 3D Ballot Box & Slogan */}
          <div className="w-full flex flex-col items-center justify-center order-2 lg:order-1 px-1 py-1">
            <BallotBoxVisual
              sloganLine1={isHindi ? "आपकी राय" : "Your Voice"}
              sloganLine2={isHindi ? "देश की ताकत है" : "Power of the Nation"}
            />
          </div>

          {/* Column 2 (Center, 60%): Confirmation & Actions */}
          <div className="w-full flex flex-col justify-center text-center lg:text-left order-1 lg:order-2 px-1 sm:px-3 lg:px-6 py-1">
            {/* Confirmation Header Group */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left order-1">
              {/* Green Pill Badge */}
              <div className="inline-flex items-center gap-1.5 self-center lg:self-start px-3 py-1 rounded-full bg-[#e6f7ef] border border-[#b2e5cc] text-[#0d824d] text-xs font-bold shadow-xs">
                <CheckCircle2 size={14} className="text-[#0d824d]" />
                <span>{isHindi ? "सर्वे सफलतापूर्वक दर्ज हो गया" : "Survey Successfully Recorded"}</span>
              </div>

              {/* Heading */}
              <h1 className="mt-1.5 sm:mt-2 font-display text-2xl sm:text-3xl lg:text-[32px] font-black text-slate-900 tracking-tight flex items-center justify-center lg:justify-start gap-2">
                <span>{t.surveyFlow.successTitle}</span>
                <span className="text-2xl sm:text-3xl select-none" aria-hidden="true">👏</span>
              </h1>

              {/* Subheading */}
              <p className="mt-0.5 font-display text-sm sm:text-base font-bold text-slate-900">
                {t.surveyFlow.successBody}
              </p>

              {/* Dynamic Constituency Acknowledgment */}
              <p className="mt-1 text-xs sm:text-sm text-slate-600 leading-normal">
                {isHindi ? (
                  <>
                    आपने <strong className="font-bold text-slate-900">{constituencyName}</strong> विधानसभा क्षेत्र के लिए अपना मत दर्ज कर दिया है।
                  </>
                ) : (
                  <>
                    You have recorded your opinion for the <strong className="font-bold text-slate-900">{constituencyName}</strong> assembly constituency.
                  </>
                )}
              </p>

              {/* Secure Storage Note */}
              <p className="mt-0.5 text-[11px] sm:text-xs text-slate-500">
                {t.surveyFlow.successStoredSecurely}
              </p>
            </div>

            {/* 2 Action CTA Buttons (order-2 on mobile directly below thank-you content, order-4 on desktop below privacy cards) */}
            <div className="mt-2.5 sm:mt-4 flex flex-col sm:flex-row gap-2.5 sm:gap-3 order-2 lg:order-4">
              <Button
                variant="cta"
                size="lg"
                className="flex-1 justify-center gap-2 bg-[#f9570c] hover:bg-[#ea4803] text-white font-bold shadow-md hover:shadow-lg border-0 transition-all text-sm py-2.5 sm:py-3"
                onClick={onViewResults}
              >
                <Eye size={18} />
                <span>{t.surveyFlow.viewResults}</span>
                <ArrowRight size={17} />
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="flex-1 justify-center gap-2 border-slate-300 bg-white text-slate-800 font-bold hover:bg-slate-50 shadow-sm transition-all text-sm py-2.5 sm:py-3"
                onClick={handleShare}
              >
                <Share2 size={16} />
                <span>{copied ? t.surveyFlow.shareCopied : t.surveyFlow.shareSurvey}</span>
              </Button>
            </div>

            {/* Dedicated Mobile State Legislative Assembly Visual (Compact, current-size image, order-3 on mobile) */}
            <div className="lg:hidden mt-2.5 mb-1 w-full order-3">
              <StateCivicVisual
                stateName={stateName}
                stateSlug={stateSlug}
                locale={locale}
                variant="mobile"
              />
            </div>

            {/* 3 Privacy / Trust Cards (order-4 on mobile below CTAs, order-3 on desktop above CTAs) */}
            <div className="mt-3 sm:mt-3.5 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5 order-4 lg:order-3">
              <div className="flex items-center gap-2 rounded-xl border border-slate-100/90 bg-white p-2.5 shadow-sm">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Lock size={15} />
                </span>
                <div className="min-w-0 text-left">
                  <p className="text-xs font-bold text-slate-800 leading-tight">
                    {isHindi ? "आपकी गोपनीयता" : "Your Privacy"}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 leading-tight mt-0.5">
                    {isHindi ? "100% सुरक्षित" : "100% Secure"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-slate-100/90 bg-white p-2.5 shadow-sm">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                  <BarChart3 size={15} />
                </span>
                <div className="min-w-0 text-left">
                  <p className="text-xs font-bold text-slate-800 leading-tight">
                    {isHindi ? "आपका डेटा केवल" : "Your Data Only"}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 leading-tight mt-0.5">
                    {isHindi ? "सार्वजनिक विश्लेषण के लिए" : "For Public Analysis"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-slate-100/90 bg-white p-2.5 shadow-sm">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <ShieldCheck size={15} />
                </span>
                <div className="min-w-0 text-left">
                  <p className="text-xs font-bold text-slate-800 leading-tight">
                    {isHindi ? "कोई व्यक्तिगत जानकारी" : "No Personal Info"}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 leading-tight mt-0.5">
                    {isHindi ? "सार्वजनिक नहीं की जाती" : "Is Ever Made Public"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3 (Right, 20%): Dynamic State Identity Visual (Hero Artwork Area, Desktop Only) */}
          <div className="hidden lg:flex w-full flex-col items-center justify-center order-3 relative overflow-hidden pl-0 lg:pl-1">
            <StateCivicVisual
              stateName={stateName}
              stateSlug={stateSlug}
              locale={locale}
              variant="desktop"
            />
          </div>
        </div>
      </motion.div>

      {/* 3. Bottom Strip: 4-Column Civic Trust Strip */}
      <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white/90 p-3 sm:p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 divide-y sm:divide-y-0 lg:divide-x divide-slate-200">
          {/* Item 1 */}
          <div className="flex items-center gap-3 pt-2 sm:pt-0 lg:px-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
              <Users size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-slate-800">
                {isHindi ? "जनता की भागीदारी" : "Public Participation"}
              </p>
              <p className="text-[11px] text-slate-500">
                {isHindi ? "बेहतर लोकतंत्र की नींव है" : "Foundation of democracy"}
              </p>
            </div>
          </div>

          {/* Item 2 */}
          <div className="flex items-center gap-3 pt-2 sm:pt-0 lg:px-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Target size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-slate-800">
                {isHindi ? "हर आवाज़ मायने रखती है" : "Every Voice Matters"}
              </p>
              <p className="text-[11px] text-slate-500">
                {isHindi ? "आइए मिलकर भविष्य बनाएं" : "Building our future together"}
              </p>
            </div>
          </div>

          {/* Item 3 */}
          <div className="flex items-center gap-3 pt-2 sm:pt-0 lg:px-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Leaf size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-slate-800">
                {isHindi ? "एक जिम्मेदार नागरिक बनें" : "Be a Responsible Citizen"}
              </p>
              <p className="text-[11px] text-slate-500">
                {isHindi ? "अपने क्षेत्र के विकास में भाग लें" : "Participate in development"}
              </p>
            </div>
          </div>

          {/* Item 4 */}
          <div className="flex items-center gap-3 pt-2 sm:pt-0 lg:px-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <Heart size={18} className="fill-rose-600" />
            </span>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-slate-800">votersurvey.in</p>
              <p className="text-[11px] text-slate-500">
                {isHindi ? "जनता की राय, सबके लिए" : "Public opinion for everyone"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
