"use client";

import { motion } from "framer-motion";
import { LinkButton } from "@/components/ui/Button";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";

export function Hero({
  stats,
}: {
  stats: { constituencies: number; districts: number; responses: number; activeSurveys: number };
}) {
  const { t } = useLocale();

  return (
    <section className="relative overflow-hidden border-b border-border bg-surface">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 h-[32rem] bg-[radial-gradient(60%_60%_at_50%_0%,var(--map-glow),transparent)]"
      />
      <div className="relative mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:px-8">
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 px-3.5 py-1.5 text-xs font-medium text-muted"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-positive" />
          Voluntary public survey · Not an official result
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
          className="mx-auto mt-6 max-w-2xl text-balance text-base text-muted sm:text-lg"
        >
          {t.hero.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <LinkButton href="/uttar-pradesh" size="lg" variant="primary">
            {t.hero.ctaPrimary}
          </LinkButton>
          <LinkButton href="/uttar-pradesh" size="lg" variant="outline">
            {t.hero.ctaSecondary}
          </LinkButton>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {[
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
