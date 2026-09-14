"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function MissionSection() {
  const { t } = useLocale();
  return (
    <div className="grid h-full gap-4 overflow-hidden rounded-3xl bg-gradient-to-br from-orange-50 via-white to-green-50 dark:from-orange-950/20 dark:via-surface dark:to-green-950/20 lg:grid-cols-2 lg:items-center">
      {/* Left Content */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5 }}
        className="px-5 py-4 sm:px-6 lg:p-6"
      >
        <h2 className="font-display text-lg font-bold text-foreground sm:text-xl">{t.home.mission.heading}</h2>
        <p className="mt-1.5 text-sm leading-snug text-muted">{t.home.mission.body1}</p>
        <p className="mt-1 text-xs leading-snug text-muted">{t.home.mission.body2}</p>
        <Link
          href="/about"
          className="mt-2.5 inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:gap-3 transition-all dark:text-orange-400"
        >
          {t.home.mission.cta} <ArrowRight size={14} />
        </Link>
      </motion.div>

      {/* Right Visual — Indian tricolor with an inked voting finger */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative h-40 overflow-hidden sm:h-44 lg:h-full lg:min-h-[190px] lg:self-stretch"
      >
        <Image
          src="/images/homepage/mission-hand-tricolor.jpg"
          alt={t.home.mission.imageAlt}
          fill
          sizes="(min-width: 1024px) 25vw, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink/70 via-ink/5 to-transparent p-4">
          <p className="font-display text-sm font-bold text-white">{t.home.mission.overlayTitle}</p>
          <p className="text-xs font-medium text-white/90">{t.home.mission.overlaySubtitle}</p>
        </div>
      </motion.div>
    </div>
  );
}
