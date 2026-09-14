"use client";

import { motion } from "framer-motion";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { resolveOptionLabel } from "@/lib/option-labels";

interface IssueTally {
  key: string;
  label: string;
  count: number;
  pct: number;
}

export function TopIssues({
  issues,
  sufficientSample,
  minRequired,
}: {
  issues: IssueTally[];
  sufficientSample: boolean;
  minRequired: number;
}) {
  const { t, locale } = useLocale();

  if (!sufficientSample || issues.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface-2 p-8 text-center text-sm text-muted">
        {t.results.insufficientBreakdownSample.replace("{minimum}", String(minRequired))}
      </div>
    );
  }

  return (
    <div className="card-surface rounded-2xl p-6">
      <ul className="space-y-4">
        {issues.map((issue, i) => (
          <li key={issue.key}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium">{resolveOptionLabel(issue.key, issue, locale, t.surveyQuestions.options)}</span>
              <span className="text-muted">{issue.pct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-2">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${issue.pct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.08, ease: "easeOut" }}
                className="h-full rounded-full bg-ink"
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
