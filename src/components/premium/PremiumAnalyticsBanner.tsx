"use client";

import Link from "next/link";
import { Crown, ArrowRight } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function PremiumAnalyticsBanner({ href }: { href: string }) {
  const { t } = useLocale();
  return (
    <Link
      href={href}
      className="mt-6 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 transition-colors hover:bg-amber-100/70 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <Crown size={16} />
        </span>
        <div>
          <p className="text-sm font-bold text-ink">{t.featureCards.premium.title}</p>
          <p className="mt-0.5 text-xs leading-5 text-muted">{t.featureCards.premium.description}</p>
        </div>
      </div>
      <span className="flex shrink-0 items-center gap-1.5 text-sm font-bold text-amber-700">
        {t.premium.pricingCard.cta} <ArrowRight size={15} />
      </span>
    </Link>
  );
}
