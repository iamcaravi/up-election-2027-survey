"use client";

import { Lightbulb } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

// Shared "what am I looking at" block — 1–3 short bullets under a chart,
// generated elsewhere from already-computed data (src/lib/analysis-summaries.ts).
// This component only renders whatever strings it's given; it never invents
// numbers itself. Renders nothing when there's nothing to say (never a fake
// placeholder reading).
export function KeyReading({ lines, label }: { lines: string[]; label?: string }) {
  const { t } = useLocale();
  if (lines.length === 0) return null;
  return (
    <div className="mt-3 rounded-xl bg-surface-2 p-3">
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-accent">
        <Lightbulb size={12} /> {label ?? t.analysisHub.keyReadingLabel}
      </p>
      <ul className="mt-1.5 space-y-1">
        {lines.map((line, i) => (
          <li key={i} className="text-xs leading-relaxed text-foreground">
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
