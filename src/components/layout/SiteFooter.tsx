"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Heart, BarChart2, User } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { SocialLinksConfig, SocialPlatform } from "@/lib/social-links";
import { XIcon, FacebookIcon, InstagramIcon, YoutubeIcon, LinkedinIcon } from "@/components/ui/SocialIcons";

interface SiteFooterProps {
  /** Real route to the current (URL-resolved) state's active election / results page. */
  resultsHref: string;
  /** Real route to the current state's "चुनाव विश्लेषण" analytics landing page. */
  analysisHref: string;
  /** Admin-configured social URLs (src/lib/social-links.ts) */
  socialLinks: SocialLinksConfig;
}

const SOCIAL_PLATFORMS: { platform: SocialPlatform; label: string; defaultUrl: string; Icon: (props: { size?: number }) => React.ReactElement }[] = [
  { platform: "x", label: "X", defaultUrl: "https://x.com", Icon: XIcon },
  { platform: "facebook", label: "Facebook", defaultUrl: "https://facebook.com", Icon: FacebookIcon },
  { platform: "instagram", label: "Instagram", defaultUrl: "https://instagram.com", Icon: InstagramIcon },
  { platform: "youtube", label: "YouTube", defaultUrl: "https://youtube.com", Icon: YoutubeIcon },
  { platform: "linkedin", label: "LinkedIn", defaultUrl: "https://linkedin.com", Icon: LinkedinIcon },
];

export function SiteFooter({ resultsHref, analysisHref, socialLinks }: SiteFooterProps) {
  const { locale } = useLocale();
  const pathname = usePathname();
  const isHi = locale === "hi";

  const navLinks = [
    { href: "/", label: isHi ? "होम" : "Home" },
    { href: "/rajya", label: isHi ? "राज्य" : "States" },
    { href: "/find-constituency", label: isHi ? "विधानसभा क्षेत्र" : "Constituencies" },
    { href: resultsHref, label: isHi ? "परिणाम" : "Results" },
    { href: analysisHref, label: isHi ? "विश्लेषण" : "Analysis" },
    { href: "/about", label: isHi ? "हमारे बारे में" : "About Us" },
  ];

  // 4 mobile bottom tabs
  const mobileNavItems = [
    { href: "/", label: isHi ? "होम" : "Home", icon: Home },
    { href: "/rajya", label: isHi ? "राज्य" : "States", icon: Heart },
    { href: analysisHref, label: isHi ? "विश्लेषण" : "Analysis", icon: BarChart2 },
    { href: "/about", label: isHi ? "हमारे बारे में" : "About Us", icon: User },
  ];

  return (
    <>
      {/* ── Single Ultra-Compact Dark Navy Footer Bar matching Reference Image ── */}
      <footer className="border-t border-slate-800/90 bg-[#061224] text-slate-300 pb-16 lg:pb-0">
        <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8 lg:py-0 lg:h-[74px] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5 lg:gap-6">

          {/* ── LEFT: Logo + Tagline ── */}
          <div className="flex items-center gap-2.5 shrink-0 justify-center sm:justify-start">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="flex items-end gap-1">
                <span className="h-4 w-1.5 rounded-sm bg-[#f97316]" />
                <span className="h-6 w-1.5 rounded-sm bg-[#10b981]" />
                <span className="h-3.5 w-1.5 rounded-sm bg-[#2563eb]" />
              </span>
              <div className="flex flex-col leading-tight">
                <span className="font-display text-[17px] sm:text-[19px] font-extrabold lowercase text-white tracking-tight">
                  votersurvey.in
                </span>
                <span className="text-[10px] sm:text-[10.5px] text-slate-400 font-normal tracking-normal -mt-0.5">
                  {isHi ? "जनता की राय, बेहतर कल के लिए" : "Public Opinion, For a Better Tomorrow"}
                </span>
              </div>
            </Link>
          </div>

          {/* ── CENTER: Inline Navigation Links (Desktop: 1 row, Mobile: 2 compact rows) ── */}
          <nav
            aria-label="Footer Quick Links"
            className="flex flex-wrap items-center justify-center gap-x-2.5 sm:gap-x-3 gap-y-1 text-xs sm:text-[13px] font-medium text-slate-300"
          >
            {navLinks.map((item, idx) => (
              <div key={item.label} className="flex items-center gap-2.5 sm:gap-3">
                <Link href={item.href} className="hover:text-white transition-colors">
                  {item.label}
                </Link>
                {idx < navLinks.length - 1 && (
                  <span className="text-slate-600/90 select-none text-xs font-normal" aria-hidden="true">
                    |
                  </span>
                )}
              </div>
            ))}
          </nav>

          {/* ── RIGHT: Separator + Social Icons + Email ── */}
          <div className="flex items-center justify-center lg:justify-end gap-3 shrink-0">
            {/* Subtle vertical separator before social group */}
            <span className="hidden xl:inline text-slate-700/80 font-light select-none text-sm" aria-hidden="true">
              |
            </span>

            <div className="flex flex-col items-center lg:items-end gap-1">
              {/* Circular Social Icons in one horizontal row */}
              <div className="flex items-center gap-1.5">
                {SOCIAL_PLATFORMS.map(({ platform, label, defaultUrl, Icon }) => {
                  const href = socialLinks[platform] || defaultUrl;
                  return (
                    <a
                      key={platform}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-6 w-6 sm:h-[26px] sm:w-[26px] items-center justify-center rounded-full bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                      aria-label={label}
                    >
                      <Icon size={12} />
                    </a>
                  );
                })}
              </div>

              {/* Email Address */}
              <a
                href="mailto:votersurveyindia@gmail.com"
                className="text-[10px] sm:text-[11px] text-slate-400 hover:text-slate-200 transition-colors select-all leading-tight"
                title="Email Us"
              >
                votersurveyindia@gmail.com
              </a>
            </div>
          </div>
        </div>

        {/* ── Sub-bar: Copyright & Legal Links ── */}
        <div className="border-t border-slate-800/80 py-3 text-[11px] text-slate-400">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <div>
              © {new Date().getFullYear()} votersurvey.in. {isHi ? "सभी अधिकार सुरक्षित।" : "All rights reserved."}
            </div>
            <div className="flex items-center gap-3">
              <Link href="/privacy" className="hover:text-slate-200 transition-colors">
                {isHi ? "गोपनीयता नीति" : "Privacy Policy"}
              </Link>
              <span className="text-slate-600" aria-hidden="true">|</span>
              <Link href="/terms" className="hover:text-slate-200 transition-colors">
                {isHi ? "उपयोग की शर्तें" : "Terms of Service"}
              </Link>
              <span className="text-slate-600" aria-hidden="true">|</span>
              <Link href="/contact" className="hover:text-slate-200 transition-colors">
                {isHi ? "संपर्क करें" : "Contact Us"}
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Mobile Bottom Tab Navigation ── */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-slate-200/90 bg-white/95 px-2 py-1.5 backdrop-blur-lg shadow-[0_-2px_10px_rgba(0,0,0,0.06)] lg:hidden"
      >
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isStateActive =
            item.href === "/rajya" &&
            (pathname === "/rajya" ||
              pathname === "/states" ||
              (Boolean(pathname) &&
                pathname !== "/" &&
                !pathname?.startsWith("/find-constituency") &&
                !pathname?.startsWith("/about") &&
                !pathname?.startsWith("/privacy") &&
                !pathname?.startsWith("/terms") &&
                !pathname?.startsWith("/results") &&
                !pathname?.startsWith("/analysis")));
          const isActive = pathname === item.href || isStateActive;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2 transition-colors ${
                isActive ? "text-blue-600 font-bold" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon size={19} className={isActive ? "text-blue-600 fill-blue-600" : "text-slate-400"} />
              <span className={`mt-0.5 text-[10px] ${isActive ? "font-bold text-blue-600" : "font-medium text-slate-500"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
