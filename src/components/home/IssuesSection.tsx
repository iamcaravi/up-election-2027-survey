"use client";

import { motion } from "framer-motion";
import {
  Briefcase,
  TrendingUp,
  Route,
  Zap,
  Droplet,
  BookOpen,
  HeartPulse,
  Scale,
  Wheat,
  Bus,
  Waves,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";
import { DEFAULT_ISSUES } from "@/lib/enums";

interface IssueTally {
  key: string;
  label: string;
  count: number;
  pct: number;
}

const ISSUE_ICONS: Record<string, LucideIcon> = {
  rojgar: Briefcase,
  mahangai: TrendingUp,
  sadak: Route,
  bijli: Zap,
  pani: Droplet,
  shiksha: BookOpen,
  swasthya: HeartPulse,
  kanoon_vyavastha: Scale,
  krishi: Wheat,
  parivahan: Bus,
  jal_nikasi: Waves,
  other: MoreHorizontal,
};

export function IssuesSection({
  issues,
  sufficientSample,
}: {
  issues: IssueTally[];
  sufficientSample: boolean;
}) {
  const pctByKey = new Map(issues.map((i) => [i.key, i.pct]));

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {DEFAULT_ISSUES.map((issue, i) => {
        const Icon = ISSUE_ICONS[issue.key] ?? MoreHorizontal;
        const pct = sufficientSample ? pctByKey.get(issue.key) : undefined;
        return (
          <motion.div
            key={issue.key}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.35, delay: i * 0.03 }}
            className="card-surface flex flex-col items-center gap-2.5 rounded-2xl p-4 text-center transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink/10 text-ink dark:bg-white/10 dark:text-white">
              <Icon size={20} />
            </div>
            <p className="font-display text-sm font-bold text-foreground">{issue.label}</p>
            {pct !== undefined && <p className="text-xs text-muted">{pct}% प्राथमिकता</p>}
          </motion.div>
        );
      })}
    </div>
  );
}
