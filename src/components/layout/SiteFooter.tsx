"use client";

import Link from "next/link";
import { Mail, GitBranch, Share2 } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export function SiteFooter() {
  const { t } = useLocale();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Top Section: Brand + Social */}
        <div className="mb-12 pb-12 border-b border-border">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1">
                  <span className="flex h-6 w-1 rounded-sm bg-accent" />
                  <span className="flex h-6 w-1 rounded-sm bg-positive" />
                </div>
                <span className="font-display text-lg font-bold">{t.common.siteName}</span>
              </div>
              <p className="text-sm text-muted mb-4">
                एक स्वतंत्र जनमत सर्वे मंच। किसी भी राजनीतिक दल से स्वतंत्र।
              </p>
              {/* Social Icons */}
              <div className="flex gap-3">
                <a
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-muted hover:text-ink transition-colors"
                  aria-label="Share"
                >
                  <Share2 size={16} />
                </a>
                <a
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-muted hover:text-ink transition-colors"
                  aria-label="GitHub"
                >
                  <GitBranch size={16} />
                </a>
              </div>
            </div>

            {/* Column 1: त्वरित लिंक */}
            <div>
              <p className="text-sm font-semibold mb-4">त्वरित लिंक</p>
              <ul className="space-y-3 text-sm text-muted">
                <li>
                  <Link href="/#elections" className="hover:text-foreground transition-colors">
                    {t.nav.elections}
                  </Link>
                </li>
                <li>
                  <Link href="/states" className="hover:text-foreground transition-colors">
                    {t.nav.districts}
                  </Link>
                </li>
                <li>
                  <Link href="/#surveys" className="hover:text-foreground transition-colors">
                    {t.nav.surveys}
                  </Link>
                </li>
                <li>
                  <Link href="/#issues" className="hover:text-foreground transition-colors">
                    {t.nav.issues}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: सहायता */}
            <div>
              <p className="text-sm font-semibold mb-4">सहायता</p>
              <ul className="space-y-3 text-sm text-muted">
                <li>
                  <Link href="/methodology" className="hover:text-foreground transition-colors">
                    पद्धति
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-foreground transition-colors">
                    गोपनीयता
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-foreground transition-colors">
                    शर्तें
                  </Link>
                </li>
                <li>
                  <Link href="/disclaimer" className="hover:text-foreground transition-colors">
                    अस्वीकरण
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: न्यूज़लेटर */}
            <div>
              <p className="text-sm font-semibold mb-4">न्यूज़लेटर</p>
              <p className="text-sm text-muted mb-4">हमारे सर्वे अपडेट और विश्लेषण सीधे अपने इनबॉक्स में पाएं।</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="आपका ईमेल"
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
                <button className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white hover:bg-accent-2 transition-colors">
                  <Mail size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Copyright */}
        <div className="space-y-4 text-xs text-muted">
          <p className="text-center">
            © {currentYear} {t.common.siteName}. सभी अधिकार सुरक्षित हैं।
          </p>
          <p className="text-center font-semibold">
            जनता की आवाज़, एक बेहतर भारत के लिए
          </p>
          <p className="text-center">
            Made with ❤️ in India
          </p>
          <p className="text-center">
            <Link href="/admin/login" className="hover:text-foreground transition-colors">
              Admin Login
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
