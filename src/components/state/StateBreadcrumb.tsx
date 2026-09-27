"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/LocaleProvider";

interface StateBreadcrumbProps {
  stateName: string;
}

export function StateBreadcrumb({ stateName }: StateBreadcrumbProps) {
  const { t, locale } = useLocale();

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-2 text-sm sm:text-base font-medium text-slate-500 py-3 sm:py-4"
    >
      <Link href="/" className="hover:text-blue-600 transition-colors">
        {t.nav.home}
      </Link>
      <span className="text-slate-400 font-normal">/</span>
      <Link href="/rajya" className="hover:text-blue-600 transition-colors">
        {locale === "hi" ? "राज्य" : "States"}
      </Link>
      <span className="text-slate-400 font-normal">/</span>
      <span className="font-semibold text-slate-800" aria-current="page">
        {stateName}
      </span>
    </nav>
  );
}
