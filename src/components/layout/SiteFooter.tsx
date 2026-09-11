"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { VisitorPresence } from "./VisitorPresence";
import { useLocale } from "@/lib/i18n/LocaleProvider";

interface SiteFooterProps {
  /** Real route to the primary (currently featured) state page. */
  stateHref: string;
  /** Real route to that state's active election / results page. */
  resultsHref: string;
}

function XIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.5 3h3l-7.3 8.34L21.5 21h-6.4l-5-6.5-5.7 6.5H1.4l7.8-8.9L1 3h6.5l4.5 5.9L17.5 3Zm-2.2 16.2h1.8L8.8 4.7H6.9l8.4 14.5Z" />
    </svg>
  );
}

function FacebookIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M14 22v-8h2.7l.5-3.5H14V8.3c0-1 .3-1.7 1.8-1.7h1.5V3.4C16.8 3.3 15.6 3 14.3 3 11.5 3 9.6 4.7 9.6 7.9v2.6H7v3.5h2.6v8h4.4Z" />
    </svg>
  );
}

function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17" cy="7" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

function YoutubeIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21.6 7.6c-.2-1-1-1.8-2-2C17.9 5.2 12 5.2 12 5.2s-5.9 0-7.6.4c-1 .2-1.8 1-2 2C2 9.3 2 12 2 12s0 2.7.4 4.4c.2 1 1 1.8 2 2 1.7.4 7.6.4 7.6.4s5.9 0 7.6-.4c1-.2 1.8-1 2-2 .4-1.7.4-4.4.4-4.4s0-2.7-.4-4.4ZM10 15.3V8.7l5.7 3.3-5.7 3.3Z" />
    </svg>
  );
}

function LinkedinIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4.98 3.5a2.48 2.48 0 1 0 0 4.96 2.48 2.48 0 0 0 0-4.96ZM3 9.75h3.96V21H3V9.75ZM9.5 9.75h3.8v1.54h.05c.53-1 1.83-1.9 3.77-1.9 4.03 0 4.78 2.5 4.78 5.76V21h-3.96v-5.13c0-1.22-.02-2.8-1.7-2.8-1.7 0-1.97 1.34-1.97 2.71V21H9.5V9.75Z" />
    </svg>
  );
}

const SOCIAL_LINKS = [
  { label: "X", href: "#", Icon: XIcon },
  { label: "Facebook", href: "#", Icon: FacebookIcon },
  { label: "Instagram", href: "#", Icon: InstagramIcon },
  { label: "YouTube", href: "#", Icon: YoutubeIcon },
  { label: "LinkedIn", href: "#", Icon: LinkedinIcon },
];

export function SiteFooter({ stateHref, resultsHref }: SiteFooterProps) {
  const { t } = useLocale();
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { href: "/", label: t.siteFooter.home },
    { href: stateHref, label: t.siteHeader.uttarPradesh },
    { href: "/#elections", label: t.siteFooter.elections },
    { href: "/states", label: t.siteHeader.constituency },
    { href: resultsHref, label: t.siteHeader.results },
    { href: resultsHref, label: t.siteHeader.premiumAnalysis },
  ];

  const helpLinks = [
    { href: "/about", label: t.siteFooter.aboutUs },
    { href: "/contact", label: t.siteFooter.contactUs },
    { href: "/privacy", label: t.siteFooter.privacyPolicy },
    { href: "/terms", label: t.siteFooter.termsOfUse },
    { href: "/disclaimer", label: t.siteFooter.disclaimer },
    { href: "/faq", label: t.siteFooter.faq },
  ];

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Top Section: Brand + Social */}
        <div className="mb-4 pb-4 border-b border-border">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="flex items-end gap-1">
                  <span className="h-4 w-1.5 rounded-sm bg-accent" />
                  <span className="h-6 w-1.5 rounded-sm bg-positive" />
                  <span className="h-3 w-1.5 rounded-sm bg-ink" />
                </span>
                <span className="font-display text-lg font-bold lowercase">votersurvey.in</span>
              </div>
              <p className="text-sm text-muted mb-2.5">{t.siteHeader.tagline}</p>
              {/* Social Icons */}
              <div className="flex gap-3">
                {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-muted hover:text-ink transition-colors"
                    aria-label={label}
                  >
                    <Icon size={16} />
                  </a>
                ))}
              </div>
            </div>

            {/* Column 1: त्वरित लिंक */}
            <div>
              <p className="text-sm font-semibold mb-2">{t.siteFooter.quickLinks}</p>
              <ul className="space-y-1.5 text-sm text-muted">
                {quickLinks.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="hover:text-foreground transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 2: सहायता */}
            <div>
              <p className="text-sm font-semibold mb-2">{t.siteFooter.help}</p>
              <ul className="space-y-1.5 text-sm text-muted">
                {helpLinks.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="hover:text-foreground transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: नवीनतम अपडेट पाएं */}
            <div>
              <p className="text-sm font-semibold mb-2">{t.siteFooter.newsletterHeading}</p>
              <p className="text-sm text-muted mb-2.5">{t.siteFooter.newsletterBody}</p>
              <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder={t.siteFooter.emailPlaceholder}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
                <button
                  type="submit"
                  aria-label="Subscribe"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink text-white hover:bg-ink/90 transition-colors"
                >
                  <ArrowRight size={16} />
                </button>
              </form>
              <p className="mt-1.5 text-xs text-muted">{t.siteFooter.noSpam}</p>
            </div>
          </div>
        </div>

        {/* Bottom Section: Copyright + Presence + Admin Login + Tagline */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted sm:justify-between sm:gap-4">
          <p className="whitespace-nowrap">
            © {currentYear} votersurvey.in. {t.siteFooter.copyright}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <VisitorPresence />
            <span className="text-border" aria-hidden="true">
              |
            </span>
            <Link href="/admin/login" className="whitespace-nowrap hover:text-foreground transition-colors">
              {t.siteFooter.adminLogin}
            </Link>
          </div>
          <p className="whitespace-nowrap">
            {t.siteFooter.madeWithLove}&nbsp;&nbsp;|&nbsp;&nbsp;{t.siteFooter.madeInIndia}
          </p>
        </div>
      </div>
    </footer>
  );
}
