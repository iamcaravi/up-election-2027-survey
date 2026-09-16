"use client";

import { motion } from "framer-motion";
import { ArrowRight, Edit3, BarChart3, LineChart, Globe } from "lucide-react";
import Link from "next/link";
import { useLocale } from "@/lib/i18n/LocaleProvider";

interface FeatureCardsProps {
  surveyHref: string;
  resultsHref: string;
  analyticsHref: string;
}

export function FeatureCards({ surveyHref, resultsHref, analyticsHref }: FeatureCardsProps) {
  const { t } = useLocale();
  const cards = [
    {
      icon: Edit3,
      title: t.featureCards.survey.title,
      description: t.featureCards.survey.description,
      href: surveyHref,
      iconBg: "bg-green-600",
      cardBg: "bg-green-50 dark:bg-green-950/40",
      border: "border-green-200 dark:border-green-900",
      text: "text-green-700 dark:text-green-300",
    },
    {
      icon: BarChart3,
      title: t.featureCards.results.title,
      description: t.featureCards.results.description,
      href: resultsHref,
      iconBg: "bg-blue-600",
      cardBg: "bg-blue-50 dark:bg-blue-950/40",
      border: "border-blue-200 dark:border-blue-900",
      text: "text-blue-700 dark:text-blue-300",
    },
    {
      icon: LineChart,
      title: t.featureCards.analysis.title,
      description: t.featureCards.analysis.description,
      href: analyticsHref,
      iconBg: "bg-ink",
      cardBg: "bg-ink/5 dark:bg-ink/20",
      border: "border-ink/15 dark:border-ink/40",
      text: "text-ink dark:text-ink-2",
    },
    {
      icon: Globe,
      title: t.featureCards.otherStates.title,
      description: t.featureCards.otherStates.description,
      href: "/states",
      iconBg: "bg-orange-600",
      cardBg: "bg-orange-50 dark:bg-orange-950/40",
      border: "border-orange-200 dark:border-orange-900",
      text: "text-orange-700 dark:text-orange-300",
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <Link href={card.href}>
                <div
                  className={`group flex flex-col gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border ${card.border} ${card.cardBg} p-3.5 sm:p-5 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)] cursor-pointer h-full`}
                >
                  <div className={`flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-lg sm:rounded-xl ${card.iconBg} text-white`}>
                    <Icon size={18} className="sm:h-5 sm:w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-display text-sm sm:text-base font-bold leading-snug ${card.text}`}>{card.title}</h3>
                    <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-muted line-clamp-2 sm:line-clamp-none leading-snug">{card.description}</p>
                  </div>
                  <div className={`flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-semibold ${card.text} group-hover:gap-2.5 transition-all`}>
                    <ArrowRight size={14} className="sm:h-4 sm:w-4" />
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
