"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Sparkles, Users2 } from "lucide-react";
import { CandidateCard } from "@/components/candidate/CandidateCard";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { getDeviceFingerprint } from "@/lib/fingerprint";
import {
  buildPublicSurveyAnswers,
  changePartySelection,
  getCandidatesForSelectedParty,
} from "@/lib/survey-public-flow";
import { cn } from "@/lib/utils";

interface QuestionOption {
  key: string;
  label: string;
  partyId: string | null;
  isSpecialParty: boolean;
  colorHex: string | null;
}

interface QuestionData {
  key: string;
  label: string;
  required: boolean;
  allowSkip: boolean;
  options: QuestionOption[];
}

interface CandidateOption {
  id: string;
  slug: string;
  name: string;
  status: string;
  confidenceScore: string;
  photoUrl?: string | null;
  partyId: string;
  party: { shortName: string; colorHex: string };
}

const DEMO_KEYS = ["age_group", "gender", "social_category", "religion"];

export function SurveyFlow({
  surveyId,
  constituencyName,
  basePath,
  constituencySlug,
  candidates,
  questions,
}: {
  surveyId: string;
  constituencyName: string;
  basePath: string;
  constituencySlug: string;
  candidates: CandidateOption[];
  questions: QuestionData[];
}) {
  const { t } = useLocale();
  const router = useRouter();
  const byKey = Object.fromEntries(questions.map((question) => [question.key, question]));
  const stepOrder = ["party_preference", "candidate_choice", "top_issue", "demographics", "complete"] as const;
  type Step = (typeof stepOrder)[number];

  const [step, setStep] = useState<Step>("party_preference");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const partyQuestion = byKey.party_preference;
  const candidateQuestion = byKey.candidate_choice;
  const selectedParty = partyQuestion?.options.find((option) => option.key === answers.party_preference);
  const partyCandidates = getCandidatesForSelectedParty(selectedParty, candidates);
  const syntheticOtherCandidate = candidateQuestion?.options.find((option) => option.key === "other");
  const candidateRequired = Boolean(selectedParty && !selectedParty.isSpecialParty && partyCandidates.length > 0);
  const stepIndex = stepOrder.indexOf(step);
  const progressPct = Math.round((stepIndex / (stepOrder.length - 1)) * 100);

  function setAnswer(key: string, value: string) {
    setAnswers((current) => ({ ...current, [key]: value }));
  }

  function selectParty(partyKey: string) {
    setAnswers((current) => changePartySelection(current, partyKey));
    setError(null);
  }

  function continueFromParty() {
    if (!selectedParty) return;
    setStep(selectedParty.isSpecialParty ? "top_issue" : "candidate_choice");
  }

  function goNext() {
    const index = stepOrder.indexOf(step);
    if (index < stepOrder.length - 1) setStep(stepOrder[index + 1]);
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const payload = buildPublicSurveyAnswers(
        answers,
        selectedParty,
        candidates,
        Boolean(syntheticOtherCandidate)
      );
      const response = await fetch(`/api/surveys/${surveyId}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payload, fingerprint: getDeviceFingerprint() }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? t.common.error);
        return;
      }
      setStep("complete");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? t.vote.invalidSelection : t.vote.networkError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {step !== "complete" && (
        <div className="mb-8">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
            <motion.div
              className="h-full rounded-full bg-ink"
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
          <p className="mt-2 text-xs text-muted">{constituencyName} — {t.vote.surveyLabel}</p>
        </div>
      )}

      {step === "party_preference" && partyQuestion && (
        <StepShell>
          <fieldset>
            <legend className="font-display text-2xl font-extrabold sm:text-3xl">{t.vote.partyQuestion}</legend>
            <p className="mt-2 text-sm font-medium text-ink">{t.common.required}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {partyQuestion.options.map((option) => {
                const selected = answers.party_preference === option.key;
                const label = option.key === "other"
                  ? t.vote.otherParty
                  : option.key === "undecided" || option.key === "prefer_not_to_say"
                    ? t.vote.undecided
                    : option.label;
                return (
                  <label
                    key={option.key}
                    className={cn(
                      "card-surface flex min-w-0 cursor-pointer items-center gap-3 rounded-2xl p-4 transition-colors focus-within:ring-2 focus-within:ring-ink/40",
                      selected && "border-ink ring-2 ring-ink/25"
                    )}
                  >
                    <input
                      type="radio"
                      name="party_preference"
                      value={option.key}
                      checked={selected}
                      required
                      onChange={() => selectParty(option.key)}
                      className="sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-border",
                        selected && "border-ink"
                      )}
                    >
                      {selected && <span className="h-2.5 w-2.5 rounded-full bg-ink" />}
                    </span>
                    <span className="min-w-0 font-semibold">{label}</span>
                    {option.colorHex && (
                      <span
                        aria-hidden="true"
                        className="ml-auto h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: option.colorHex }}
                      />
                    )}
                  </label>
                );
              })}
            </div>
          </fieldset>
          <StickyBar>
            <Button className="w-full" size="lg" disabled={!selectedParty} onClick={continueFromParty}>
              {t.common.next}
            </Button>
          </StickyBar>
        </StepShell>
      )}

      {step === "candidate_choice" && selectedParty && !selectedParty.isSpecialParty && (
        <StepShell>
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{t.vote.candidateQuestion}</h1>
          <p className="mt-2 text-sm text-muted">
            {t.vote.selectedParty}: <span className="font-semibold text-foreground">{selectedParty.label}</span>
          </p>

          {partyCandidates.length > 0 ? (
            <fieldset className="mt-6">
              <legend className="mb-3 text-sm font-medium text-ink">{t.vote.candidateRequired}</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {partyCandidates.map((candidate, index) => (
                  <CandidateCard
                    key={candidate.id}
                    index={index}
                    selectable
                    selected={answers.candidate_choice === candidate.slug}
                    radioName="candidate_choice"
                    radioValue={candidate.slug}
                    required={candidateRequired}
                    onSelect={() => setAnswer("candidate_choice", candidate.slug)}
                    candidate={{
                      id: candidate.id,
                      name: candidate.name,
                      status: candidate.status,
                      confidenceScore: candidate.confidenceScore,
                      photoUrl: candidate.photoUrl,
                      party: {
                        name: candidate.party.shortName,
                        shortName: candidate.party.shortName,
                        colorHex: candidate.party.colorHex,
                      },
                    }}
                  />
                ))}
                {syntheticOtherCandidate && (
                  <label
                    className={cn(
                      "card-surface flex cursor-pointer items-center justify-center gap-3 rounded-2xl p-5 text-sm font-semibold transition-colors focus-within:ring-2 focus-within:ring-ink/40",
                      answers.candidate_choice === "other" && "border-ink ring-2 ring-ink/25"
                    )}
                  >
                    <input
                      type="radio"
                      name="candidate_choice"
                      value="other"
                      checked={answers.candidate_choice === "other"}
                      required={candidateRequired}
                      onChange={() => setAnswer("candidate_choice", "other")}
                      className="sr-only"
                    />
                    <Users2 size={17} aria-hidden="true" /> {t.vote.otherCandidate}
                  </label>
                )}
              </div>
            </fieldset>
          ) : (
            <div className="mt-6 rounded-2xl border border-border bg-surface-2 p-4 text-sm text-muted" role="status">
              {t.vote.noCandidates}
            </div>
          )}

          <StickyBar>
            <div className="flex gap-3">
              <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep("party_preference")}>
                {t.common.back}
              </Button>
              <Button
                size="lg"
                className="flex-1"
                disabled={candidateRequired && !answers.candidate_choice}
                onClick={goNext}
              >
                {t.common.next}
              </Button>
            </div>
          </StickyBar>
        </StepShell>
      )}

      {step === "top_issue" && byKey.top_issue && (
        <QuestionStep
          question={byKey.top_issue}
          value={answers.top_issue}
          onSelect={(value) => setAnswer("top_issue", value)}
          onNext={() => setStep("demographics")}
          onSkip={() => setStep("demographics")}
          t={t}
        />
      )}

      {step === "demographics" && (
        <StepShell>
          <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{t.demographics.title}</h1>
          <p className="mt-2 text-sm text-muted">{t.demographics.subtitle}</p>
          <div className="mt-6 space-y-6">
            {DEMO_KEYS.map((key) => {
              const question = byKey[key];
              if (!question) return null;
              return (
                <div key={key}>
                  <p className="mb-2 text-sm font-semibold">{getQuestionLabel(question, t)}</p>
                  <div className="flex flex-wrap gap-2">
                    {question.options.map((option) => (
                      <Chip
                        key={option.key}
                        label={getOptionLabel(option, t)}
                        selected={answers[key] === option.key}
                        onClick={() => setAnswer(key, option.key)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          {error && <p className="mt-4 text-sm text-danger" role="alert">{error}</p>}
          <StickyBar>
            <Button className="w-full" size="lg" disabled={submitting} onClick={submit}>
              {submitting ? t.common.loading : t.common.submit}
            </Button>
          </StickyBar>
        </StepShell>
      )}

      {step === "complete" && (
        <CompletionScreen
          onViewResults={() => router.push(`${basePath}/constituencies/${constituencySlug}/results`)}
        />
      )}
    </div>
  );
}

function StepShell({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  );
}

function StickyBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky bottom-4 z-10 mt-8 rounded-2xl border border-border bg-surface/95 p-3 shadow-[var(--shadow-soft)] backdrop-blur">
      {children}
    </div>
  );
}

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-medium transition-[color,background-color,border-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40",
        selected ? "border-ink bg-ink text-white" : "border-border bg-surface hover:bg-surface-2"
      )}
    >
      {label}
    </button>
  );
}

function QuestionStep({
  question,
  value,
  onSelect,
  onNext,
  onSkip,
  t,
}: {
  question: QuestionData;
  value?: string;
  onSelect: (value: string) => void;
  onNext: () => void;
  onSkip: () => void;
  t: ReturnType<typeof useLocale>["t"];
}) {
  const canSkip = question.allowSkip && !question.required;
  return (
    <StepShell>
      <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{getQuestionLabel(question, t)}</h1>
      {!question.required && <p className="mt-1 text-xs text-muted">{t.common.optional}</p>}
      <div className="mt-6 flex flex-wrap gap-2">
        {question.options.map((option) => (
          <Chip
            key={option.key}
            label={getOptionLabel(option, t)}
            selected={value === option.key}
            onClick={() => onSelect(option.key)}
          />
        ))}
      </div>
      <StickyBar>
        <div className="flex gap-3">
          {canSkip && (
            <Button variant="outline" size="lg" className="flex-1" onClick={onSkip}>
              {t.common.skip}
            </Button>
          )}
          <Button size="lg" className="flex-1" disabled={question.required && !value} onClick={onNext}>
            {t.common.next}
          </Button>
        </div>
      </StickyBar>
    </StepShell>
  );
}

function getQuestionLabel(question: QuestionData, t: ReturnType<typeof useLocale>["t"]): string {
  const labels: Record<string, string> = {
    top_issue: t.surveyQuestions.topIssue,
    age_group: t.surveyQuestions.ageGroup,
    gender: t.surveyQuestions.gender,
    social_category: t.surveyQuestions.socialCategory,
    religion: t.surveyQuestions.religion,
  };
  return labels[question.key] ?? question.label;
}

function getOptionLabel(option: QuestionOption, t: ReturnType<typeof useLocale>["t"]): string {
  return (t.surveyQuestions.options as Record<string, string>)[option.key] ?? option.label;
}

function CompletionScreen({ onViewResults }: { onViewResults: () => void }) {
  const { t } = useLocale();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center py-10 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
        className="relative flex h-20 w-20 items-center justify-center rounded-full bg-positive/15 text-positive"
      >
        <CheckCircle2 size={40} />
        {[...Array(6)].map((_, index) => (
          <motion.span
            key={index}
            initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            animate={{
              opacity: 0,
              x: Math.cos((index / 6) * Math.PI * 2) * 60,
              y: Math.sin((index / 6) * Math.PI * 2) * 60,
              scale: 0,
            }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="absolute h-1.5 w-1.5 rounded-full bg-accent"
          />
        ))}
      </motion.div>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-6 font-display text-xl font-bold"
      >
        {t.completion.recorded}
      </motion.p>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-2 flex items-center justify-center gap-1.5 text-sm text-muted"
      >
        <Sparkles size={14} className="text-accent" /> {t.completion.cta}
      </motion.p>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-6">
        <Button size="lg" onClick={onViewResults}>{t.completion.ctaButton}</Button>
      </motion.div>
    </motion.div>
  );
}
