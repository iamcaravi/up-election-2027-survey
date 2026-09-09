"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CandidateCard } from "@/components/candidate/CandidateCard";
import { Button } from "@/components/ui/Button";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { getDeviceFingerprint } from "@/lib/fingerprint";
import { cn } from "@/lib/utils";
import { CheckCircle2, Sparkles, Users2 } from "lucide-react";

interface QuestionOption {
  key: string;
  label: string;
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
  party?: { shortName: string; colorHex: string } | null;
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

  const byKey = Object.fromEntries(questions.map((q) => [q.key, q]));
  const stepOrder = ["vote", "party_preference", "top_issue", "demographics", "complete"] as const;
  type Step = (typeof stepOrder)[number];
  const [step, setStep] = useState<Step>("vote");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stepIndex = stepOrder.indexOf(step);
  const progressPct = Math.round((stepIndex / (stepOrder.length - 1)) * 100);

  function setAnswer(key: string, value: string) {
    setAnswers((a) => ({ ...a, [key]: value }));
  }

  function goNext() {
    const idx = stepOrder.indexOf(step);
    if (idx < stepOrder.length - 1) setStep(stepOrder[idx + 1]);
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const payload = Object.entries(answers)
        .filter(([, v]) => v)
        .map(([questionKey, optionKey]) => ({ questionKey, optionKey }));

      const res = await fetch(`/api/surveys/${surveyId}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: payload, fingerprint: getDeviceFingerprint() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setSubmitting(false);
        return;
      }
      setStep("complete");
    } catch {
      setError("Network error. Please try again.");
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
          <p className="mt-2 text-xs text-muted">{constituencyName} — 2027 Survey</p>
        </div>
      )}

      <>
        {step === "vote" && (
          <StepShell key="vote">
            <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{t.vote.question}</h1>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {candidates.map((c, i) => (
                <CandidateCard
                  key={c.id}
                  index={i}
                  selectable
                  selected={answers.candidate_choice === c.slug}
                  onSelect={() => setAnswer("candidate_choice", c.slug)}
                  candidate={{
                    id: c.id,
                    name: c.name,
                    status: c.status,
                    confidenceScore: c.confidenceScore,
                    photoUrl: c.photoUrl,
                    party: c.party ? { name: c.party.shortName, shortName: c.party.shortName, colorHex: c.party.colorHex } : null,
                  }}
                />
              ))}
              <button
                onClick={() => setAnswer("candidate_choice", "other")}
                className={cn(
                  "card-surface flex items-center justify-center gap-2 rounded-2xl p-5 text-sm font-semibold transition-all hover:-translate-y-0.5",
                  answers.candidate_choice === "other" && "border-ink ring-2 ring-ink/25"
                )}
              >
                <Users2 size={16} /> {t.vote.other}
              </button>
            </div>
            {candidates.length === 0 && (
              <p className="mt-4 text-sm text-muted">
                No candidates are listed yet for this constituency — select &quot;{t.vote.other}&quot; to continue.
              </p>
            )}
            <StickyBar>
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                disabled={!answers.candidate_choice}
                onClick={goNext}
              >
                {t.vote.continue}
              </Button>
            </StickyBar>
          </StepShell>
        )}

        {step === "party_preference" && byKey.party_preference && (
          <QuestionStep
            key="party"
            question={byKey.party_preference}
            value={answers.party_preference}
            onSelect={(v) => setAnswer("party_preference", v)}
            onNext={goNext}
            onSkip={goNext}
            t={t}
          />
        )}

        {step === "top_issue" && byKey.top_issue && (
          <QuestionStep
            key="issue"
            question={byKey.top_issue}
            value={answers.top_issue}
            onSelect={(v) => setAnswer("top_issue", v)}
            onNext={goNext}
            onSkip={goNext}
            t={t}
          />
        )}

        {step === "demographics" && (
          <StepShell key="demographics">
            <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{t.demographics.title}</h1>
            <p className="mt-2 text-sm text-muted">{t.demographics.subtitle}</p>

            <div className="mt-6 space-y-6">
              {DEMO_KEYS.map((key) => {
                const q = byKey[key];
                if (!q) return null;
                return (
                  <div key={key}>
                    <p className="mb-2 text-sm font-semibold">{q.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {q.options.map((o) => (
                        <Chip
                          key={o.key}
                          label={o.label}
                          selected={answers[key] === o.key}
                          onClick={() => setAnswer(key, o.key)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {error && <p className="mt-4 text-sm text-danger">{error}</p>}

            <StickyBar>
              <Button variant="primary" size="lg" className="w-full" disabled={submitting} onClick={submit}>
                {submitting ? t.common.loading : t.common.submit}
              </Button>
            </StickyBar>
          </StepShell>
        )}

        {step === "complete" && (
          <CompletionScreen
            key="complete"
            onViewResults={() => router.push(`${basePath}/constituencies/${constituencySlug}/results`)}
          />
        )}
      </>
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
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-medium transition-all",
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
  onSelect: (v: string) => void;
  onNext: () => void;
  onSkip: () => void;
  t: ReturnType<typeof useLocale>["t"];
}) {
  return (
    <StepShell>
      <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{question.label}</h1>
      <p className="mt-1 text-xs text-muted">{t.common.optional}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {question.options.map((o) => (
          <Chip key={o.key} label={o.label} selected={value === o.key} onClick={() => onSelect(o.key)} />
        ))}
      </div>
      <StickyBar>
        <div className="flex gap-3">
          <Button variant="outline" size="lg" className="flex-1" onClick={onSkip}>
            {t.common.skip}
          </Button>
          <Button variant="primary" size="lg" className="flex-1" onClick={onNext}>
            {t.common.next}
          </Button>
        </div>
      </StickyBar>
    </StepShell>
  );
}

function CompletionScreen({
  onViewResults,
}: {
  onViewResults: () => void;
}) {
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
        {[...Array(6)].map((_, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            animate={{
              opacity: 0,
              x: Math.cos((i / 6) * Math.PI * 2) * 60,
              y: Math.sin((i / 6) * Math.PI * 2) * 60,
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

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-2">
        <p className="flex items-center justify-center gap-1.5 text-sm text-muted">
          <Sparkles size={14} className="text-accent" /> {t.completion.cta}
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-6">
        <Button variant="primary" size="lg" onClick={onViewResults}>
          {t.completion.ctaButton}
        </Button>
      </motion.div>
    </motion.div>
  );
}
