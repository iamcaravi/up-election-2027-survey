"use client";

import { motion } from "framer-motion";
import { Lock, ShieldCheck, Scale, FileBarChart } from "lucide-react";
import Image from "next/image";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function ResponsibleInitiative() {
  const { t } = useLocale();
  const principles = [
    { icon: Lock, title: t.home.responsibleInitiative.principle1Title },
    { icon: ShieldCheck, title: t.home.responsibleInitiative.principle2Title },
    { icon: Scale, title: t.home.responsibleInitiative.principle3Title },
    { icon: FileBarChart, title: t.home.responsibleInitiative.principle4Title },
  ];

  return (
    <div className="grid h-full gap-4 overflow-hidden rounded-3xl border border-border bg-surface-2 px-5 py-3.5 sm:px-6 lg:grid-cols-2 lg:items-stretch lg:gap-4 lg:p-5">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="font-display text-base font-bold text-foreground sm:text-lg">{t.home.responsibleInitiative.heading}</h2>
        <div className="mt-1.5 space-y-1">
          {principles.map((p, i) => {
            const Icon = p.icon;
            return (
              <div key={i} className="flex items-center gap-2.5 rounded-lg bg-surface px-2.5 py-1 shadow-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-ink/10 text-ink dark:bg-white/10 dark:text-white">
                  <Icon size={13} />
                </span>
                <p className="text-xs font-semibold text-foreground sm:text-sm">{p.title}</p>
              </div>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative h-40 overflow-hidden rounded-2xl sm:h-44 lg:h-full"
      >
        <Image
          src="/images/homepage/responsible-india-gate.jpg"
          alt={t.home.responsibleInitiative.imageAlt}
          fill
          sizes="(min-width: 1024px) 25vw, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink/70 via-ink/15 to-transparent p-4">
          <p className="font-display text-sm font-bold text-white">{t.home.responsibleInitiative.overlayTitle}</p>
          <p className="text-xs font-medium text-white/90">{t.home.responsibleInitiative.overlaySubtitle}</p>
        </div>
      </motion.div>
    </div>
  );
}
