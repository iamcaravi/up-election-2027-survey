"use client";

import { motion } from "framer-motion";
import { ArrowRight, MapPin, Landmark, Building2, BarChart3 } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { LinkButton } from "@/components/ui/Button";
import { displayStateName, formatNumber } from "@/lib/utils";
import { electionPath, statePath } from "@/lib/routes";

export interface PrimaryStateInfo {
  slug: string;
  name: string;
  districtCount: number;
  constituencyCount: number;
  surveyCount: number;
  election: { slug: string; name: string; year: number; status: string } | null;
}

export function Hero({
  stats,
  primaryState,
}: {
  stats: { states: number; constituencies: number; districts: number; responses: number; activeSurveys: number };
  primaryState: PrimaryStateInfo | null;
}) {
  const { t, locale } = useLocale();

  return (
    <section className="relative overflow-hidden border-b border-border bg-surface">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 h-[28rem] bg-[radial-gradient(60%_60%_at_50%_0%,var(--map-glow),transparent)]"
      />
      {/* Abstract map/data motif — decorative only, no figurative imagery */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.3] dark:opacity-[0.2]">
        <svg viewBox="0 0 800 500" className="absolute -right-16 -top-10 h-[32rem] w-[32rem]" preserveAspectRatio="xMidYMid slice">
          {Array.from({ length: 7 }).map((_, row) =>
            Array.from({ length: 10 }).map((_, col) => (
              <circle
                key={`${row}-${col}`}
                cx={60 + col * 78}
                cy={40 + row * 58}
                r={2.2}
                fill="var(--ink)"
                opacity={0.15 + ((row + col) % 4) * 0.08}
              />
            ))
          )}
        </svg>
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-foreground/10 to-positive" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-14 text-center sm:px-6 sm:py-20 lg:px-8">
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-muted"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-positive" />
          {t.hero.brandEyebrow}
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="font-display text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl"
        >
          {t.hero.title1}
          <br />
          <span className="text-ink">{t.hero.title2}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12 }}
          className="mx-auto mt-5 max-w-2xl text-balance text-base text-muted sm:text-lg"
        >
          {t.hero.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18 }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <LinkButton href="/#elections" size="lg" variant="primary">
            {t.hero.ctaPrimary}
          </LinkButton>
          <LinkButton href="/#surveys" size="lg" variant="outline">
            {t.hero.ctaSecondary}
          </LinkButton>
        </motion.div>

        {/* Compact current-election context card — the UP-first gateway */}
        {primaryState && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24 }}
            className="mx-auto mt-8 max-w-xl"
          >
            <div className="card-surface flex flex-col gap-4 rounded-2xl p-5 text-left sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink/10 text-ink">
                  <MapPin size={20} />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-accent">
                    {t.home.upFocus.eyebrow}
                  </p>
                  <p className="font-display text-base font-bold sm:text-lg">
                    {displayStateName(primaryState.name, primaryState.slug, locale)} {t.home.upFocus.titlePrefix}
                    {primaryState.election ? ` ${primaryState.election.year}` : ""}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Landmark size={11} /> {formatNumber(primaryState.districtCount)} {t.home.upFocus.districtsLabel}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Building2 size={11} /> {formatNumber(primaryState.constituencyCount)}{" "}
                      {t.home.upFocus.constituenciesLabel}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <BarChart3 size={11} /> {formatNumber(primaryState.surveyCount)} {t.home.upFocus.surveysLabel}
                    </span>
                  </div>
                </div>
              </div>
              <LinkButton
                href={primaryState.election ? electionPath(primaryState.slug, primaryState.election.slug) : statePath(primaryState.slug)}
                size="md"
                variant="secondary"
                className="w-full shrink-0 sm:w-auto"
              >
                {t.home.upFocus.cta} <ArrowRight size={14} />
              </LinkButton>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-5"
        >
          {[
            { value: stats.states, label: "States" },
            { value: stats.constituencies, label: t.stats.constituencies },
            { value: stats.districts, label: t.stats.districts },
            { value: stats.responses, label: t.stats.responses },
            { value: stats.activeSurveys, label: t.stats.activeSurveys },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-background/60 px-4 py-5">
              <AnimatedCounter value={s.value} className="font-display text-2xl font-extrabold sm:text-3xl" />
              <p className="mt-1 text-xs text-muted">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
