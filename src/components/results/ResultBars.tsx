"use client";

import { motion } from "framer-motion";
import type { PublicAnalyticsBucket } from "@/lib/public-analytics-core";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function ResultBars({ options }: { options: PublicAnalyticsBucket[] }) {
  const { locale, t } = useLocale();
  const numberFormatter = new Intl.NumberFormat(locale === "hi" ? "hi-IN" : "en-IN");

  return (
    <ul className="space-y-4">
      {options.map((option, index) => (
        <li key={option.key}>
          <div className="mb-1.5 flex min-w-0 items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 font-medium">
              {option.colorHex && (
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: option.colorHex }} />
              )}
              <span className="truncate">{locale === "hi" && option.nameHindi ? option.nameHindi : option.label}</span>
            </span>
            {option.state === "suppressed" ? (
              <span className="shrink-0 text-xs font-medium text-muted">{t.results.suppressed}</span>
            ) : (
              <span className="shrink-0 tabular-nums text-muted">
                {option.percentage}% · {numberFormatter.format(option.count)}
              </span>
            )}
          </div>
          {option.state === "available" && (
            <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${option.percentage}%` }}
                transition={{ duration: 0.65, delay: index * 0.04, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: option.colorHex ?? "var(--ink)" }}
              />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
