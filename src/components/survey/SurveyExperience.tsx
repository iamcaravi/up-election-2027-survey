"use client";

import { useMemo, useState } from "react";
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
import * as Icons from "lucide-react";

export interface SurveyOptionItem {
  key: string;
  label: string;
  subLabel?: string | null;
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
  const [answers, setAnswers] = useState<Record<QuestionKey, string | undefined>>({
    party_preference: undefined,
    top_issue: undefined,
    age_group: undefined,
    gender: undefined,
    social_category: undefined,
    religion: undefined,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

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
  // Party option keys (e.g. "other") can collide with generic demographic
  // option keys in `optionLabels` — parties keep their own shortName/label
  // (already Hindi-mapped server-side via getPartyDisplayName for subLabel)
  // instead of running through the shared demographic translation table.
  const localizedParties = parties;
  const localizedIssues = localize(issues);
  const localizedAgeGroups = localize(ageGroups);
  const localizedGenders = localize(genders);
  const localizedSocialCategories = localize(socialCategories);
  const localizedReligions = localize(religions);

  function select(key: QuestionKey, value: string) {
    setAnswers((current) => ({ ...current, [key]: value }));
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
      const payload = QUESTION_KEYS.filter((key) => answers[key]).map((key) => ({
        questionKey: key,
        optionKey: answers[key] as string,
      }));
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
        resultsHref={resultsHref}
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
        <p className="text-base font-bold uppercase tracking-wider text-accent sm:text-lg">{questionOfLabel}</p>

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
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {localizedIssues.map((issue) => (
                    <IconOptionCard
                      key={issue.key}
                      option={issue}
                      selected={answers.top_issue === issue.key}
                      onSelect={() => select("top_issue", issue.key)}
                    />
                  ))}
                </div>
              </StepBody>
            )}

            {pageKey === "personal_info" && (
              <StepBody heading={t.demographics.title} subtitle={t.demographics.subtitle}>
                <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
                  <PersonalInfoRow
                    index={1}
                    icon={Users}
                    color="blue"
                    question={t.surveyFlow.ageHeading}
                    subtitle={t.surveyFlow.ageRowSubtitle}
                  >
                    <ChipGroup options={localizedAgeGroups} selected={answers.age_group} onSelect={(v) => select("age_group", v)} />
                  </PersonalInfoRow>
                  <PersonalInfoRow
                    index={2}
                    icon={VenusAndMars}
                    color="pink"
                    question={t.surveyFlow.genderHeading}
                    subtitle={t.surveyFlow.genderRowSubtitle}
                  >
                    <ChipGroup options={localizedGenders} selected={answers.gender} onSelect={(v) => select("gender", v)} />
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
                    />
                  </PersonalInfoRow>
                  <PersonalInfoRow
                    index={4}
                    icon={HandHeart}
                    color="purple"
                    question={t.surveyFlow.religionHeading}
                    subtitle={t.surveyFlow.religionRowSubtitle}
                  >
                    <ChipGroup options={localizedReligions} selected={answers.religion} onSelect={(v) => select("religion", v)} />
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

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 rounded-xl border border-ink/15 bg-ink/5 px-4 py-3.5 text-sm text-foreground sm:max-w-sm">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-ink" />
            <div>
              <p className="font-bold">{t.surveyFlow.privacyTitle}</p>
              <p className="mt-0.5 text-muted">{t.surveyFlow.privacyBody}</p>
            </div>
          </div>

          {!isFirst && (
            <Button
              variant="outline"
              size="lg"
              className="border-ink/40 text-base text-ink hover:bg-ink/5 sm:self-end"
              onClick={() => setPageIndex((i) => i - 1)}
              disabled={submitting}
            >
              <ChevronLeft size={20} /> {t.surveyFlow.previous}
            </Button>
          )}
        </div>

        {/* Bottom padding so the floating CTA below never overlaps the last
            piece of content (privacy notice / previous button / last
            answer option). */}
        <div className="pb-20 sm:pb-4" aria-hidden="true" />
      </div>

      {/* Only the primary CTA floats — no full-width bar/background behind
          it, so it never covers survey content. */}
      <div className="fixed bottom-5 right-4 z-40 sm:bottom-6 sm:right-16 lg:right-24">
        <Button
          variant="cta"
          size="lg"
          onClick={handlePrimary}
          disabled={!canAdvance || submitting}
          className="min-w-[10.5rem] justify-center text-base shadow-[0_8px_24px_-6px_rgba(234,88,12,0.5)]"
        >
          {submitting ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              {isLast ? t.surveyFlow.submitSurvey : t.surveyFlow.next}
              {!isLast && <ChevronRight size={20} />}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function StepBody({ heading, subtitle, children }: { heading: string; subtitle: string; children: React.ReactNode }) {
  return (
    <fieldset className="mt-1.5">
      <legend className="font-display text-3xl font-extrabold text-ink sm:text-4xl">{heading}</legend>
      <p className="mt-2.5 text-lg text-muted sm:text-xl">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </fieldset>
  );
}

const PERSONAL_INFO_ROW_COLORS = {
  blue: { bg: "bg-blue-50/60", icon: "bg-blue-500" },
  pink: { bg: "bg-pink-50/60", icon: "bg-pink-500" },
  green: { bg: "bg-green-50/60", icon: "bg-green-600" },
  purple: { bg: "bg-purple-50/60", icon: "bg-purple-500" },
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
    <div className={cn("flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6", palette.bg)}>
      <div className="flex items-start gap-3.5 sm:w-80 sm:shrink-0">
        <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white", palette.icon)}>
          <Icon size={22} />
        </span>
        <div>
          <p className="font-display text-lg font-extrabold leading-snug text-ink sm:text-xl">
            {index}. {question}
          </p>
          <p className="mt-0.5 text-sm text-muted">{subtitle}</p>
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
  return (
    <label
      className={cn(
        "card-surface relative flex cursor-pointer flex-col items-center gap-2 rounded-2xl p-4 text-center transition-all focus-within:ring-2 focus-within:ring-ink/40 hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]",
        selected && "border-ink bg-ink/[0.04] ring-2 ring-ink/25"
      )}
    >
      <input type="radio" name="party_preference" checked={selected} onChange={onSelect} className="sr-only" />
      {selected && (
        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-white">
          <Check size={12} />
        </span>
      )}
      <span className="flex h-16 w-16 items-center justify-center sm:h-[4.5rem] sm:w-[4.5rem]">
        {option.logoUrl ? (
          <Image src={option.logoUrl} alt="" width={72} height={72} className="h-full w-full object-contain" />
        ) : (
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full text-base font-extrabold text-white sm:h-16 sm:w-16"
            style={{ backgroundColor: option.colorHex ?? "#6b7280" }}
          >
            {option.label.slice(0, 3).toUpperCase()}
          </span>
        )}
      </span>
      <span className="font-display text-base font-extrabold text-ink sm:text-lg">{option.label}</span>
      {option.subLabel && <span className="text-sm leading-tight text-muted">{option.subLabel}</span>}
    </label>
  );
}

// Per-issue pastel tint (card background + border + icon color), matching
// the reference design's colour-coded issue grid. Keyed by the DEFAULT_ISSUES
// key (src/lib/enums.ts) — an issue key without an entry here (e.g. one an
// admin adds later) falls back to the neutral "other" palette.
const ISSUE_STYLES: Record<string, { bg: string; border: string; icon: string }> = {
  rojgar: { bg: "bg-blue-50", border: "border-blue-100", icon: "text-blue-600" },
  mahangai: { bg: "bg-green-50", border: "border-green-100", icon: "text-green-600" },
  sadak: { bg: "bg-amber-50", border: "border-amber-100", icon: "text-slate-700" },
  bijli: { bg: "bg-violet-50", border: "border-violet-100", icon: "text-violet-600" },
  pani: { bg: "bg-cyan-50", border: "border-cyan-100", icon: "text-cyan-600" },
  shiksha: { bg: "bg-pink-50", border: "border-pink-100", icon: "text-pink-600" },
  swasthya: { bg: "bg-yellow-50", border: "border-yellow-100", icon: "text-orange-500" },
  kanoon_vyavastha: { bg: "bg-emerald-50", border: "border-emerald-100", icon: "text-emerald-700" },
  krishi: { bg: "bg-rose-50", border: "border-rose-100", icon: "text-rose-700" },
  parivahan: { bg: "bg-indigo-50", border: "border-indigo-100", icon: "text-indigo-600" },
  jal_nikasi: { bg: "bg-sky-50", border: "border-sky-100", icon: "text-sky-600" },
  other: { bg: "bg-gray-100", border: "border-gray-200", icon: "text-gray-600" },
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
  const iconRegistry = Icons as unknown as Record<string, typeof HelpCircle>;
  const IconComponent = (option.icon && iconRegistry[option.icon]) || HelpCircle;
  const style = ISSUE_STYLES[option.key] ?? ISSUE_STYLES.other;
  return (
    <label
      className={cn(
        "relative flex cursor-pointer flex-col items-center justify-center gap-2.5 rounded-2xl border p-5 text-center transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]",
        style.bg,
        style.border,
        selected && "border-blue-500 ring-2 ring-blue-500"
      )}
    >
      <input type="radio" name="top_issue" checked={selected} onChange={onSelect} className="sr-only" />
      <span
        aria-hidden="true"
        className={cn(
          "absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border-2 bg-white/70",
          selected ? "border-blue-600 bg-blue-600 text-white" : "border-ink/15 text-transparent"
        )}
      >
        <Check size={12} />
      </span>
      <IconComponent size={30} className={style.icon} />
      <span className="font-display text-base font-bold text-ink">{option.label}</span>
    </label>
  );
}

function ChipGroup({
  options,
  selected,
  onSelect,
}: {
  options: SurveyOptionItem[];
  selected?: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {options.map((option) => {
        const isSelected = selected === option.key;
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(option.key)}
            className={cn(
              "rounded-full border px-6 py-3 text-base font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40",
              isSelected ? "border-ink bg-ink text-white" : "border-border bg-surface text-ink hover:bg-surface-2"
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
  resultsHref,
  onViewResults,
}: {
  steps: SurveyStepDef[];
  constituencyName: string;
  resultsHref: string;
  onViewResults: () => void;
}) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);
  const shareUrl = useMemo(() => (typeof window !== "undefined" ? window.location.origin + resultsHref : resultsHref), [resultsHref]);

  async function handleShare() {
    const shareData = { title: constituencyName, text: t.surveyFlow.shareText, url: shareUrl };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // user cancelled or share failed — fall through to clipboard
      }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(`${t.surveyFlow.shareText} ${shareUrl}`);
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
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-6">
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

          <div className="min-w-0 flex-1 text-center sm:text-left">
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

      <div className="mt-8">
        <h2 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">{t.surveyFlow.nextStepsHeading}</h2>
        <p className="mt-2 text-lg leading-relaxed text-muted">{t.surveyFlow.nextStepsSubtitle}</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <NextStepCard
            icon={BarChart3}
            color="text-blue-600 bg-blue-50"
            title={t.surveyFlow.nextStepResultsTitle}
            body={t.surveyFlow.nextStepResultsBody}
            cta={t.surveyFlow.nextStepResultsCta}
            onClick={onViewResults}
          />
          <NextStepLinkCard
            icon={FileText}
            color="text-ink bg-ink/5"
            title={t.surveyFlow.nextStepAnalysisTitle}
            body={t.surveyFlow.nextStepAnalysisBody}
            cta={t.surveyFlow.nextStepAnalysisCta}
            href="/methodology"
          />
          <NextStepCard
            icon={Share2}
            color="text-green-700 bg-green-50"
            title={t.surveyFlow.nextStepShareTitle}
            body={t.surveyFlow.nextStepShareBody}
            cta={t.surveyFlow.nextStepShareCta}
            onClick={handleShare}
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

function NextStepCard({
  icon: Icon,
  color,
  title,
  body,
  cta,
  onClick,
}: {
  icon: typeof BarChart3;
  color: string;
  title: string;
  body: string;
  cta: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
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
    </button>
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
