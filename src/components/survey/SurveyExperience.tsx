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
  ShieldCheck,
  Share2,
  Target,
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
}

// The 6 actual survey questions this flow can answer.
const QUESTION_KEYS = ["party_preference", "top_issue", "age_group", "gender", "social_category", "religion"] as const;
type QuestionKey = (typeof QUESTION_KEYS)[number];
// top_issue is "select all that apply" — tracked separately as an array
// (see selectedIssues) rather than in the single-value `answers` record.
type SingleAnswerKey = Exclude<QuestionKey, "top_issue">;

// The 3 visible pages: personal_info groups age/gender/social_category/
// religion onto one page instead of one page per question.
const PAGE_KEYS = ["party_preference", "top_issue", "personal_info"] as const;
type PageKey = (typeof PAGE_KEYS)[number];

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
}: SurveyExperienceProps) {
  const { t, locale } = useLocale();
  const router = useRouter();
  const [pageIndex, setPageIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<SingleAnswerKey, string | undefined>>({
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
    { key: "party_preference", label: t.surveyFlow.stepParty },
    { key: "top_issue", label: t.surveyFlow.stepIssue },
    { key: "personal_info", label: t.surveyFlow.stepPersonalInfo },
  ];

  const pageKey: PageKey = PAGE_KEYS[pageIndex];
  const isFirst = pageIndex === 0;
  const isLast = pageIndex === PAGE_KEYS.length - 1;
  const canAdvance = pageKey === "party_preference" ? Boolean(answers.party_preference) : true;

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
            {pageKey === "party_preference" && (
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
            )}

            {pageKey === "top_issue" && (
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

      {/* Mobile/Tablet bottom navigation bar - untouched behavior for <lg */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 dark:bg-slate-900/95 dark:border-slate-800 shadow-sm py-3 sm:py-3.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between sm:justify-end gap-3">
          {!isFirst ? (
            <Button
              variant="outline"
              size="lg"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold text-sm sm:text-base bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 transition-colors shadow-xs"
              onClick={() => setPageIndex((i) => i - 1)}
              disabled={submitting}
              aria-label={t.surveyFlow.previous}
            >
              <ChevronLeft size={18} className="sm:h-5 sm:w-5" />
              <span>{t.surveyFlow.previous}</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="lg"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold text-sm sm:text-base bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 transition-colors shadow-xs"
              onClick={() => router.push(basePath)}
              disabled={submitting}
              aria-label={t.surveyFlow.previous}
            >
              <ChevronLeft size={18} className="sm:h-5 sm:w-5" />
              <span>{t.surveyFlow.previous}</span>
            </Button>
          )}

          <Button
            variant="cta"
            size="lg"
            onClick={handlePrimary}
            disabled={!canAdvance || submitting}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 min-w-[10.5rem] sm:min-w-[12rem] px-8 sm:px-10 py-2.5 sm:py-3 rounded-xl font-bold text-sm sm:text-base shadow-[0_8px_24px_-6px_rgba(255,87,34,0.4)] bg-[#ff5722] hover:bg-[#f4511e] text-white transition-colors"
          >
            {submitting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <span>{isLast ? t.surveyFlow.submitSurvey : t.surveyFlow.next}</span>
                {!isLast && <ChevronRight size={18} className="sm:h-5 sm:w-5" />}
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
