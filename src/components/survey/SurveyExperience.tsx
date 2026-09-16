"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  HandHeart,
  HelpCircle,
  Info,
  Loader2,
  Lock,
  ShieldCheck,
  Share2,
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
import { SITE_URL } from "@/lib/seo";
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
  basePath,
  constituencySlug,
  parties,
  issues,
  ageGroups,
  genders,
  socialCategories,
  religions,
}: SurveyExperienceProps) {
  const { t } = useLocale();
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
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
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
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
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
                <div className="flex flex-col gap-3">
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

        <div className="mt-6 sm:mt-8">
          <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-foreground sm:max-w-md">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-slate-700" />
            <div>
              <p className="font-bold text-xs sm:text-sm text-ink">{t.surveyFlow.privacyTitle}</p>
              <p className="mt-0.5 text-xs text-muted leading-relaxed">{t.surveyFlow.privacyBody}</p>
            </div>
          </div>
        </div>

        {/* Bottom padding so the floating Previous/Next controls below never
            overlap the last piece of content (privacy notice / last answer
            option). */}
        <div className="pb-28 sm:pb-8" aria-hidden="true" />
      </div>

      {/* Fixed bottom navigation bar */}
      <div className="fixed bottom-0 inset-x-0 p-3 sm:p-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200/80 dark:bg-ink/95 dark:border-slate-800 sm:bg-transparent sm:backdrop-blur-none sm:border-0 sm:bottom-6 sm:right-16 sm:inset-x-auto flex items-center justify-between gap-3 sm:gap-3 sm:justify-end lg:right-24">
        {!isFirst ? (
          <Button
            variant="outline"
            size="lg"
            className="flex-1 sm:flex-initial justify-center text-sm sm:text-base font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 sm:border sm:border-ink/40 sm:bg-transparent sm:text-ink sm:shadow-none hover:sm:bg-ink/5"
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
            className="flex-1 sm:hidden justify-center text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
            onClick={() => router.push(basePath)}
            disabled={submitting}
            aria-label={t.surveyFlow.previous}
          >
            <ChevronLeft size={18} />
            <span>{t.surveyFlow.previous}</span>
          </Button>
        )}

        <Button
          variant="cta"
          size="lg"
          onClick={handlePrimary}
          disabled={!canAdvance || submitting}
          className="flex-1 sm:flex-initial min-w-0 sm:min-w-[10.5rem] justify-center text-sm sm:text-base font-bold shadow-[0_8px_24px_-6px_rgba(234,88,12,0.5)] bg-orange-600 hover:bg-orange-700 text-white"
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
  );
}

function StepBody({ heading, subtitle, children }: { heading: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="w-full mt-1.5">
      <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold text-ink leading-[1.35] py-1 break-words overflow-visible">
        {heading}
      </h1>
      <p className="mt-1 text-sm sm:text-base text-muted leading-relaxed">{subtitle}</p>
      <div className="mt-4 sm:mt-6">{children}</div>
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
    <div className={cn("flex flex-col gap-3 rounded-2xl border p-3.5 sm:p-4 sm:flex-row sm:items-center sm:gap-5", palette.bg, palette.border)}>
      <div className="flex items-start gap-3 sm:w-72 sm:shrink-0">
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm", palette.icon)}>
          <Icon size={18} />
        </span>
        <div>
          <p className="font-display text-sm sm:text-base font-extrabold leading-snug text-ink">
            {index}. {question}
          </p>
          <p className="mt-0.5 text-xs text-muted leading-snug">{subtitle}</p>
        </div>
      </div>
      <div className="sm:flex-1">{children}</div>
    </div>
  );
}

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

  return (
    <label
      className={cn(
        "card-surface relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-border p-3 text-center transition-all focus-within:ring-2 focus-within:ring-ink/40 hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)] min-h-[110px] sm:min-h-[130px]",
        selected && "border-accent bg-orange-50/50 ring-2 ring-accent dark:bg-orange-950/20"
      )}
    >
      <input type="radio" name="party_preference" checked={selected} onChange={onSelect} className="sr-only" />
      {selected && (
        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white">
          <Check size={12} strokeWidth={3} />
        </span>
      )}
      <span className="flex h-12 w-12 items-center justify-center sm:h-16 sm:w-16">
        {option.logoUrl ? (
          <Image src={option.logoUrl} alt="" width={80} height={80} className="h-full w-full object-contain" />
        ) : (
          <span
            className="flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-full text-xs sm:text-sm font-extrabold text-white"
            style={{ backgroundColor: option.colorHex ?? "#6b7280" }}
          >
            {(option.abbreviation ?? option.label).slice(0, 3).toUpperCase()}
          </span>
        )}
      </span>
      <span className="font-display text-xs font-extrabold leading-snug text-ink sm:text-sm text-center px-1">
        {displayName}
      </span>
    </label>
  );
}

// Per-issue styling matching the user's reference design
const ISSUE_STYLES: Record<string, { bg: string; border: string; iconBox: string; iconColor: string }> = {
  rojgar: { bg: "bg-white", border: "border-blue-200", iconBox: "bg-blue-500", iconColor: "text-white" },
  mahangai: { bg: "bg-white", border: "border-emerald-200", iconBox: "bg-emerald-100", iconColor: "text-emerald-600" },
  sadak: { bg: "bg-white", border: "border-amber-200", iconBox: "bg-amber-100", iconColor: "text-slate-800" },
  bijli: { bg: "bg-white", border: "border-purple-200", iconBox: "bg-purple-100", iconColor: "text-purple-600" },
  pani: { bg: "bg-white", border: "border-sky-200", iconBox: "bg-sky-100", iconColor: "text-sky-600" },
  shiksha: { bg: "bg-white", border: "border-pink-200", iconBox: "bg-pink-100", iconColor: "text-pink-600" },
  swasthya: { bg: "bg-white", border: "border-rose-200", iconBox: "bg-rose-100", iconColor: "text-rose-500" },
  kanoon_vyavastha: { bg: "bg-white", border: "border-emerald-200", iconBox: "bg-emerald-600", iconColor: "text-white" },
  krishi: { bg: "bg-white", border: "border-pink-200", iconBox: "bg-pink-100", iconColor: "text-rose-600" },
  parivahan: { bg: "bg-white", border: "border-indigo-200", iconBox: "bg-blue-600", iconColor: "text-white" },
  jal_nikasi: { bg: "bg-white", border: "border-cyan-200", iconBox: "bg-cyan-100", iconColor: "text-cyan-600" },
  other: { bg: "bg-white", border: "border-slate-200", iconBox: "bg-slate-200", iconColor: "text-slate-600" },
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
        "relative flex cursor-pointer items-center gap-2 sm:gap-2.5 rounded-2xl border p-2.5 sm:p-3 text-left transition-all hover:shadow-[var(--shadow-soft)] min-h-[72px] sm:min-h-[80px]",
        style.bg,
        style.border,
        selected && "border-blue-500 ring-2 ring-blue-400/50 bg-blue-50/40 dark:bg-blue-950/20"
      )}
    >
      <input type="checkbox" checked={selected} onChange={onSelect} className="sr-only" />
      <span className={cn("flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl", style.iconBox, style.iconColor)}>
        <IconComponent size={20} />
      </span>
      <div className="flex-1 min-w-0 pr-1">
        <div className="font-display font-bold text-xs sm:text-sm text-ink leading-tight truncate sm:whitespace-normal">
          {option.label}
        </div>
        {desc && (
          <div className="text-[10px] sm:text-xs text-muted leading-tight mt-0.5 line-clamp-2">
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
  onViewResults,
}: {
  steps: SurveyStepDef[];
  constituencyName: string;
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
  // Deliberately the site's homepage, not the results page for this
  // specific constituency+party breakdown — the share text below already
  // names the constituency (which is fine to disclose), but the link
  // itself stays generic so nothing about it points at any particular
  // result. resultsHref is still used for the "View Results" button next
  // to Share, just not for what gets shared.
  const shareUrl = SITE_URL;

  async function handleShare() {
    // Never derived from the respondent's actual answers (party/candidate/
    // issue/etc. never reach this function) — see buildSurveyCompletionShareMessage's
    // own doc comment for why every share surface must go through it.
    const shareText = buildSurveyCompletionShareMessage({ locale, constituencyName });
    const shareData = { text: shareText, url: shareUrl };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
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

  const trustItems = [
    { icon: Lock, title: t.surveyFlow.successTrustPrivacyTitle, value: t.surveyFlow.successTrustPrivacyValue },
    { icon: BarChart3, title: t.surveyFlow.successTrustDataTitle, value: t.surveyFlow.successTrustDataValue },
    { icon: ShieldCheck, title: t.surveyFlow.successTrustNoPersonalTitle, value: t.surveyFlow.successTrustNoPersonalValue },
  ];

  return (
    <div>
      {/* All steps read as completed on the success screen — reusing the
          same stepper component the live survey uses, just with
          currentIndex past the end so every step renders in its "done"
          state. */}
      <SurveyStepper steps={steps} currentIndex={steps.length} />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-2 overflow-hidden rounded-3xl border border-blue-100 bg-blue-50/60 p-5 sm:mt-3 sm:p-7"
      >
        {/* Compact mobile-only header: a simple green check badge + heading
            + one short confirmation line, directly above the primary
            actions — no scrolling past a decorative illustration or trust
            badges to reach Result/Share. Hidden at sm: where the original
            side-by-side illustration layout (below) already puts the
            actions within easy reach on a taller/wider viewport. */}
        <div className="flex flex-col items-center gap-2 text-center sm:hidden">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-positive/15 text-positive" aria-hidden="true">
            <Check size={28} strokeWidth={3} />
          </span>
          <h1 className="font-display text-2xl font-extrabold text-ink">{t.surveyFlow.successTitle}</h1>
          <p className="font-display text-base font-bold text-ink">{t.surveyFlow.successBody}</p>
          <p className="text-xs leading-5 text-muted">
            {t.surveyFlow.successVoteRecorded.replace("{constituency}", constituencyName)}
          </p>

          <div className="mt-3 flex w-full flex-col gap-2.5">
            <Button variant="cta" size="lg" className="justify-center" onClick={onViewResults}>
              {t.surveyFlow.viewResults} <ArrowRight size={18} />
            </Button>
            <Button variant="outline" size="lg" className="justify-center border-ink/60 bg-white text-ink hover:bg-ink/5" onClick={handleShare}>
              <Share2 size={17} /> {copied ? t.surveyFlow.shareCopied : t.surveyFlow.shareSurvey}
            </Button>
          </div>
        </div>

        {/* Original desktop/tablet layout — illustration + heading/body +
            trust badges + actions side by side. Hidden below sm: (the
            compact block above takes over there) so nothing here needs to
            change for mobile; unchanged from before. */}
        <div className="hidden sm:flex sm:flex-row sm:items-center sm:gap-6">
          <div className="relative flex shrink-0 flex-col items-center justify-center sm:w-[34%]">
            <span className="absolute -left-3 top-6 h-3 w-3 rounded-full bg-orange-500" aria-hidden="true" />
            <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-white ring-2 ring-green-200" aria-hidden="true" />
            <span className="absolute bottom-8 right-0 h-3 w-3 rounded-full bg-green-600" aria-hidden="true" />

            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
              className="relative w-full max-w-[180px] pt-7 sm:max-w-[200px]"
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.15 }}
                className="absolute left-1/2 top-0 z-10 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-blue-600 text-white shadow-[var(--shadow-card)] ring-4 ring-white sm:h-16 sm:w-16"
              >
                <Check size={26} strokeWidth={3} />
              </motion.span>

              <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-[var(--shadow-soft)]">
                <div className="flex h-8 items-center justify-center rounded-t-3xl bg-blue-50 sm:h-9">
                  <span className="h-1.5 w-14 rounded-full bg-blue-200 sm:w-16" aria-hidden="true" />
                </div>
                <div className="flex flex-col items-center gap-1 px-5 py-5 text-center sm:py-6">
                  <p className="font-display text-lg font-extrabold leading-snug text-ink sm:text-xl">
                    {t.surveyFlow.successIllustrationCaption}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col text-center sm:text-left">
            <h1 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">{t.surveyFlow.successTitle}</h1>
            <p className="mt-1.5 font-display text-lg font-bold text-ink sm:text-xl">{t.surveyFlow.successBody}</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              {t.surveyFlow.successVoteRecorded.replace("{constituency}", constituencyName)}
            </p>
            <p className="mt-0.5 text-sm leading-6 text-muted">{t.surveyFlow.successStoredSecurely}</p>

            <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
              {trustItems.map((item) => (
                <div
                  key={item.title}
                  className="flex items-center gap-2.5 rounded-xl border border-border bg-white px-3.5 py-2.5 text-left shadow-[var(--shadow-card)]"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                    <item.icon size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-ink">{item.title}</p>
                    <p className="truncate text-[11px] text-muted">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button variant="cta" size="lg" className="justify-center sm:flex-1" onClick={onViewResults}>
                {t.surveyFlow.viewResults} <ArrowRight size={18} />
              </Button>
              <Button variant="outline" size="lg" className="justify-center border-ink/40 text-ink hover:bg-ink/5 sm:flex-1" onClick={handleShare}>
                <Share2 size={17} /> {copied ? t.surveyFlow.shareCopied : t.surveyFlow.shareSurvey}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Only Analysis is offered here — Results and Share already have
          exactly one clear, immediately-visible primary action each in the
          card above (View Results / Share buttons); repeating them as
          "next step" cards too would just duplicate the same two actions. */}
      <div className="mt-8">
        <h2 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">{t.surveyFlow.nextStepsHeading}</h2>
        <p className="mt-2 text-lg leading-relaxed text-muted">{t.surveyFlow.nextStepsSubtitle}</p>

        <div className="mt-4 grid gap-3 sm:max-w-sm">
          <NextStepLinkCard
            icon={FileText}
            color="text-ink bg-ink/5"
            title={t.surveyFlow.nextStepAnalysisTitle}
            body={t.surveyFlow.nextStepAnalysisBody}
            cta={t.surveyFlow.nextStepAnalysisCta}
            href="/methodology"
          />
        </div>
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3.5 sm:items-center">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
          <Info size={16} />
        </span>
        <div>
          <p className="text-lg font-bold text-ink">{t.surveyFlow.infoBannerTitle}</p>
          <p className="mt-1 text-base leading-6 text-muted">{t.surveyFlow.infoBannerBody}</p>
        </div>
      </div>
    </div>
  );
}

function NextStepLinkCard({
  icon: Icon,
  color,
  title,
  body,
  cta,
  href,
}: {
  icon: typeof BarChart3;
  color: string;
  title: string;
  body: string;
  cta: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="card-surface flex flex-col items-start gap-3 rounded-2xl p-6 text-left transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]"
    >
      <span className={cn("flex h-12 w-12 items-center justify-center rounded-xl", color)}>
        <Icon size={22} />
      </span>
      <p className="font-display text-xl font-bold text-ink">{title}</p>
      <p className="text-base leading-6 text-muted">{body}</p>
      <span className="mt-1 inline-flex items-center gap-1.5 text-base font-bold text-orange-600">
        {cta} <ArrowRight size={16} />
      </span>
    </Link>
  );
}
