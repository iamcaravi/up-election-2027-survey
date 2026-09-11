"use client";

import { motion } from "framer-motion";
import { Briefcase, GraduationCap, Wheat, HeartPulse, Route, Gavel, Sprout, Users, type LucideIcon } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

interface HomepageIssue {
  key: string;
  labelKey: "rojgar" | "shiksha" | "kisan" | "swasthya" | "infrastructure" | "lawOrder" | "development" | "socialJustice";
  icon: LucideIcon;
}

// Editorial showcase of broad issue categories for the homepage — distinct from
// the survey's own DEFAULT_ISSUES (src/lib/enums.ts), which drives real survey
// questions/analytics and must not be changed here.
const HOMEPAGE_ISSUES: HomepageIssue[] = [
  { key: "rojgar", labelKey: "rojgar", icon: Briefcase },
  { key: "shiksha", labelKey: "shiksha", icon: GraduationCap },
  { key: "kisan", labelKey: "kisan", icon: Wheat },
  { key: "swasthya", labelKey: "swasthya", icon: HeartPulse },
  { key: "infra", labelKey: "infrastructure", icon: Route },
  { key: "kanoon", labelKey: "lawOrder", icon: Gavel },
  { key: "vikas", labelKey: "development", icon: Sprout },
  { key: "samajik_nyay", labelKey: "socialJustice", icon: Users },
];

export function IssuesSection() {
  const { t } = useLocale();
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-4 sm:gap-3 sm:overflow-visible sm:pb-0 lg:grid-cols-8">
      {HOMEPAGE_ISSUES.map((issue, i) => {
        const Icon = issue.icon;
        return (
          <motion.div
            key={issue.key}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.35, delay: i * 0.03 }}
            className="card-surface flex w-[104px] shrink-0 flex-col items-center gap-2.5 rounded-2xl p-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)] sm:w-auto sm:shrink"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink/10 text-ink dark:bg-white/10 dark:text-white">
              <Icon size={20} />
            </div>
            <p className="font-display text-sm font-bold text-foreground">{t.homeIssues[issue.labelKey]}</p>
          </motion.div>
        );
      })}
    </div>
  );
}
