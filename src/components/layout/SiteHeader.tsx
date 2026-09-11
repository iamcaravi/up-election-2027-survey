"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Search, Crown } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { LocaleToggle } from "./LocaleToggle";
import { SearchBox } from "@/components/search/SearchBox";
import { useLocale } from "@/lib/i18n/LocaleProvider";

interface SiteHeaderProps {
  /** Real route to the primary (currently featured) state page. */
  stateHref: string;
  /** Real route to that state's active election / results page. */
  resultsHref: string;
}

export function SiteHeader({ stateHref, resultsHref }: SiteHeaderProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  const navItems = [
    { href: "/", label: t.nav.home },
    { href: stateHref, label: "उत्तर प्रदेश" },
    { href: "/#elections", label: t.nav.elections },
    { href: "/states", label: "विधानसभा क्षेत्र" },
    { href: resultsHref, label: "परिणाम" },
    { href: "/methodology", label: "विश्लेषण" },
    { href: "/methodology", label: "हमारे बारे में" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:h-[68px] lg:px-8">
        {/* Logo & Brand */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5 font-display text-lg font-extrabold lg:gap-3 lg:text-[22px]">
          <span className="flex items-end gap-1 lg:gap-1.5">
            <span className="h-4 w-1.5 rounded-sm bg-accent lg:h-5 lg:w-2" />
            <span className="h-6 w-1.5 rounded-sm bg-positive lg:h-[30px] lg:w-2" />
            <span className="h-3 w-1.5 rounded-sm bg-ink lg:h-4 lg:w-2" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="lowercase">votersurvey.in</span>
            <span className="text-[10px] font-medium tracking-wide text-muted lg:text-xs">जनता की राय, बेहतर कल के लिए</span>
          </span>
        </Link>

        {/* Center Navigation - Desktop */}
        <nav className="hidden items-center gap-0.5 xl:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-lg px-2.5 py-2 text-base font-medium text-foreground/70 transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right Controls */}
        <div className="ml-auto flex items-center gap-2 sm:gap-2.5">
          {/* Search - Desktop */}
          <div className="hidden w-44 lg:block">
            <SearchBox />
          </div>

          {/* Search Icon - Mobile/Tablet */}
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground/60 transition-colors hover:bg-surface-2 hover:text-foreground lg:hidden"
            aria-label="Search"
          >
            <Search size={18} />
          </button>

          <LocaleToggle />
          <ThemeToggle />

          {/* Premium Analytics CTA - Desktop */}
          <Link
            href={resultsHref}
            className="hidden items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-ink-2 lg:flex"
          >
            <Crown size={14} />
            प्रीमियम विश्लेषण
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border xl:hidden"
            aria-label="Menu"
          >
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="border-t border-border px-4 py-3 xl:hidden">
          <SearchBox className="mb-3" />
          <div className="mb-4 flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-surface-2"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <Link
            href={resultsHref}
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-ink-2"
          >
            <Crown size={14} />
            प्रीमियम विश्लेषण
          </Link>
        </div>
      )}
    </header>
  );
}
