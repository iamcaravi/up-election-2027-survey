"use client";

import { motion } from "framer-motion";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { SectionHeading } from "@/components/home/SectionHeading";

interface IssueTally {
  key: string;
  label: string;
  count: number;
  pct: number;
}

export function IssuesSection({
  issues,
  sufficientSample,
}: {
  issues: IssueTally[];
  sufficientSample: boolean;
}) {
  const { t } = useLocale();

  return (
    <>
      <SectionHeading eyebrow="Issues" title={t.home.issues.title} subtitle={t.home.issues.subtitle} />
      {!sufficientSample || issues.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-2 p-8 text-center text-sm text-muted">
          {t.home.issues.empty}
        </div>
      ) : (
        <div className="card-surface rounded-2xl p-6">
          <ul className="space-y-4">
            {issues.map((issue, i) => (
              <li key={issue.key}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium">{issue.label}</span>
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
      )}
    </>
  );
}
