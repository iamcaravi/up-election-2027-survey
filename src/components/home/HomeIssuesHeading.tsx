"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function HomeIssuesHeading() {
  const { t } = useLocale();
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">{t.homeIssues.heading}</h2>
      <Link href="/methodology" className="flex items-center gap-1 text-sm font-semibold text-accent">
        {t.homeIssues.seeWhatOthersThink} <ArrowRight size={14} />
      </Link>
    </div>
  );
}
