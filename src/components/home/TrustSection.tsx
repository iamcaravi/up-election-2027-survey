"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function TrustSection() {
  const { t } = useLocale();

  const links = [
    { href: "/methodology", label: t.home.trust.methodologyCta },
    { href: "/disclaimer", label: t.home.trust.disclaimerCta },
    { href: "/privacy", label: t.home.trust.privacyCta },
  ];

  return (
    <div className="flex flex-col gap-3 border-t border-border py-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2.5">
        <ShieldCheck size={16} className="shrink-0 text-muted" />
        <p className="text-sm text-muted">
          <span className="font-semibold text-foreground">{t.home.trust.title}</span> — {t.home.trust.subtitle}
        </p>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {links.map((l, i) => (
          <span key={l.href} className="flex items-center gap-4">
            <Link href={l.href} className="font-medium text-ink hover:underline underline-offset-4">
              {l.label}
            </Link>
            {i < links.length - 1 && <span className="hidden text-border sm:inline">·</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
