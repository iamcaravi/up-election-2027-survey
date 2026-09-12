"use client";

import { motion } from "framer-motion";
import { Briefcase, GraduationCap, Wheat, HeartPulse, Route, Gavel, Sprout, Users, type LucideIcon } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { HomepageIssueStats } from "@/lib/analytics";

interface HomepageIssue {
  key: string;
  labelKey: "rojgar" | "shiksha" | "kisan" | "swasthya" | "infrastructure" | "lawOrder" | "development" | "socialJustice";
  icon: LucideIcon;
}

// Editorial showcase of broad issue categories for the homepage — distinct from
// the survey's own DEFAULT_ISSUES (src/lib/enums.ts), which drives real survey
// questions/analytics and must not be changed here. `key` here matches the
// HOMEPAGE_ISSUE_SOURCE_MAP keys in src/lib/analytics.ts (getHomepageIssueStats),
// which is what actually ties each card to real Q2 survey data.
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

function formatIssuePct(pct: number): string {
  if (pct <= 0) return "0%";
  if (pct < 1) return "<1%";
  return `${Math.round(pct)}%`;
}

export function IssuesSection({ stats }: { stats: HomepageIssueStats }) {
  const { t } = useLocale();
  const hasData = stats.total > 0;

  return (
    <div>
      {!hasData && <p className="mb-4 text-sm font-medium text-muted">{t.homeIssues.emptyState}</p>}
      <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-4 sm:gap-3 sm:overflow-visible sm:pb-0 lg:grid-cols-8">
        {HOMEPAGE_ISSUES.map((issue, i) => {
          const Icon = issue.icon;
          const pct = stats.percentages[issue.key] ?? null;
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
              {hasData && (
                <div className="min-h-[2.25rem]">
                  {pct === null ? (
                    <p className="text-[11px] leading-tight text-muted">{t.homeIssues.noDataSource}</p>
                  ) : (
                    <>
                      <p className="font-display text-lg font-extrabold leading-none text-accent">{formatIssuePct(pct)}</p>
                      <p className="mt-1 text-[11px] leading-tight text-muted">{t.homeIssues.peoplesOpinion}</p>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
