"use client";

import Link from "next/link";
import { VisitorPresence } from "./VisitorPresence";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { SocialLinksConfig, SocialPlatform } from "@/lib/social-links";
import { XIcon, FacebookIcon, InstagramIcon, YoutubeIcon, LinkedinIcon } from "@/components/ui/SocialIcons";

interface SiteFooterProps {
  /** Real route to the current (URL-resolved) state's active election / results page. */
  resultsHref: string;
  /** Real route to the current state's "चुनाव विश्लेषण" analytics landing page. */
  analysisHref: string;
  /** Admin-configured social URLs (src/lib/social-links.ts) — a platform with
   *  no configured URL yet renders as a disabled icon, never a fake `href="#"`. */
  socialLinks: SocialLinksConfig;
}

const SOCIAL_PLATFORMS: { platform: SocialPlatform; label: string; Icon: (props: { size?: number }) => React.ReactElement }[] = [
  { platform: "x", label: "X", Icon: XIcon },
  { platform: "facebook", label: "Facebook", Icon: FacebookIcon },
  { platform: "instagram", label: "Instagram", Icon: InstagramIcon },
  { platform: "youtube", label: "YouTube", Icon: YoutubeIcon },
  { platform: "linkedin", label: "LinkedIn", Icon: LinkedinIcon },
];

export function SiteFooter({ resultsHref, analysisHref, socialLinks }: SiteFooterProps) {
  const { t } = useLocale();
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { href: "/", label: t.siteFooter.home },
    { href: "/#elections", label: t.siteFooter.elections },
    { href: "/find-constituency", label: t.siteHeader.constituency },
    { href: resultsHref, label: t.siteHeader.results },
    { href: analysisHref, label: t.siteHeader.analysis },
  ];

  const helpLinks = [
    { href: "/about", label: t.siteFooter.aboutUs },
    { href: "/contact", label: t.siteFooter.contactUs },
    { href: "/faq", label: t.siteFooter.faq },
    { href: "/methodology", label: t.nav.methodology },
    { href: "/privacy", label: t.siteFooter.privacyPolicy },
    { href: "/terms", label: t.siteFooter.termsOfUse },
    { href: "/disclaimer", label: t.siteFooter.disclaimer },
  ];

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Top Section: Brand + Links */}
        <div className="mb-4 pb-4 border-b border-border">
          <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
            {/* Brand */}
            <div className="lg:col-span-5">
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="flex items-end gap-1">
                  <span className="h-4 w-1.5 rounded-sm bg-accent" />
                  <span className="h-6 w-1.5 rounded-sm bg-positive" />
                  <span className="h-3 w-1.5 rounded-sm bg-ink" />
                </span>
                <span className="font-display text-lg font-bold lowercase">votersurvey.in</span>
              </div>
              <p className="text-[15px] text-muted mb-2.5 max-w-sm">{t.siteHeader.tagline}</p>
              {/* Social Icons — a platform with no configured URL (src/lib/social-links.ts)
                  renders as a disabled, non-clickable icon rather than a dead `href="#"`. */}
              <div className="flex gap-3">
                {SOCIAL_PLATFORMS.map(({ platform, label, Icon }) => {
                  const href = socialLinks[platform];
                  if (!href) {
                    return (
                      <span
                        key={platform}
                        className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-lg bg-surface-2 text-muted/40"
                        aria-label={`${label} (${t.siteFooter.socialNotConfigured})`}
                        aria-disabled="true"
                      >
                        <Icon size={16} />
                      </span>
                    );
                  }
                  return (
                    <a
                      key={platform}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-muted hover:text-ink transition-colors"
                      aria-label={label}
                    >
                      <Icon size={16} />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Links Container: 2-column responsive layout for Quick Links and Help side-by-side */}
            <div className="grid grid-cols-2 gap-4 sm:gap-8 lg:col-span-7 lg:grid-cols-2">
              {/* Column 1: त्वरित लिंक */}
              <div>
                <p className="text-base font-bold mb-2">{t.siteFooter.quickLinks}</p>
                <ul className="space-y-1.5 text-[15px] text-muted">
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
                <p className="text-base font-bold mb-2">{t.siteFooter.help}</p>
                <ul className="space-y-1.5 text-[15px] text-muted">
                  {helpLinks.map((item) => (
                    <li key={item.label}>
                      <Link href={item.href} className="hover:text-foreground transition-colors">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
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
            <span className="text-border" aria-hidden="true">
              |
            </span>
            <a
              href="https://www.netlify.com"
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              Powered by <span className="font-semibold text-ink dark:text-white">Netlify</span>
            </a>
          </div>
          <p className="text-center sm:whitespace-nowrap">
            {t.siteFooter.madeWithLove}&nbsp;&nbsp;|&nbsp;&nbsp;{t.siteFooter.madeInIndia}
          </p>
        </div>
      </div>
    </footer>
  );
}
