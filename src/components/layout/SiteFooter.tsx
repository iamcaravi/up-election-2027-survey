"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function SiteFooter() {
  const { t } = useLocale();
  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-lg font-bold">{t.common.siteName}</p>
            <p className="mt-2 max-w-xs text-sm text-muted">
              A public-opinion survey platform. Independent of, and not affiliated with, any political party.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">Explore</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li><Link href="/uttar-pradesh" className="hover:text-foreground">Districts</Link></li>
              <li><Link href="/" className="hover:text-foreground">Home</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Legal</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li><Link href="/methodology" className="hover:text-foreground">Methodology</Link></li>
              <li><Link href="/privacy" className="hover:text-foreground">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-foreground">Terms</Link></li>
              <li><Link href="/disclaimer" className="hover:text-foreground">Disclaimer</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Admin</p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li><Link href="/admin" className="hover:text-foreground">Admin panel</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 rounded-xl border border-border bg-surface-2 p-4 text-xs leading-relaxed text-muted">
          {t.disclaimer}
        </div>
        <p className="mt-6 text-xs text-muted">
          © {new Date().getFullYear()} {t.common.siteName}. Political neutrality maintained — this platform does
          not promote or attack any party.
        </p>
      </div>
    </footer>
  );
}
