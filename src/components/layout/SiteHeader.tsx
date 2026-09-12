"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu, X, Search, Crown } from "lucide-react";
import { LocaleToggle } from "./LocaleToggle";
import { SearchBox } from "@/components/search/SearchBox";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { cn } from "@/lib/utils";

interface SiteHeaderProps {
  /** Real route to the primary (currently featured) state page. */
  stateHref: string;
  /** Real route to that state's active election / results page. */
  resultsHref: string;
}

export function SiteHeader({ stateHref, resultsHref }: SiteHeaderProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!searchOpen) return;
    function onClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSearchOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [searchOpen]);

  const navItems = [
    { href: "/", label: t.nav.home },
    { href: stateHref, label: t.siteHeader.uttarPradesh },
    { href: "/#elections", label: t.nav.elections },
    { href: "/states", label: t.siteHeader.constituency },
    { href: resultsHref, label: t.siteHeader.results },
    { href: "/methodology", label: t.siteHeader.analysis },
    { href: "/about", label: t.siteHeader.aboutUs },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="mx-auto flex h-[60px] w-full max-w-7xl flex-nowrap items-center justify-between gap-2 px-7 lg:px-8">
        {/* Logo & Brand */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex items-end gap-1">
            <span className="h-4 w-1.5 rounded-sm bg-accent" />
            <span className="h-6 w-1.5 rounded-sm bg-positive" />
            <span className="h-3.5 w-1.5 rounded-sm bg-ink" />
          </span>
          <span className="flex flex-col justify-center leading-tight">
            <span className="font-display text-lg font-extrabold lowercase text-foreground">votersurvey.in</span>
            <span className="text-[10.5px] font-medium text-muted">{t.siteHeader.tagline}</span>
          </span>
        </Link>

        {/* Center Navigation - Desktop */}
        <nav className="hidden shrink-0 flex-nowrap items-center gap-0.5 xl:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "relative shrink-0 whitespace-nowrap px-2.5 py-2 text-sm font-semibold text-ink transition-colors hover:text-ink-2",
                item.href === "/" &&
                  "after:absolute after:-bottom-0.5 after:left-1/2 after:h-0.5 after:w-4 after:-translate-x-1/2 after:rounded-full after:bg-ink"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right Controls */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Search - Desktop: icon only, opens a compact popover using the existing SearchBox */}
          <div ref={searchRef} className="relative hidden lg:block">
            <button
              onClick={() => setSearchOpen((o) => !o)}
              aria-label={t.siteHeader.search}
              aria-expanded={searchOpen}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-ink transition-colors hover:bg-surface-2"
            >
              <Search size={20} />
            </button>
            {searchOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-80">
                <SearchBox autoFocus />
              </div>
            )}
          </div>

          {/* Search Icon - Mobile/Tablet (opens the mobile menu's inline search) */}
          <button
            onClick={() => setOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground/60 transition-colors hover:bg-surface-2 hover:text-foreground lg:hidden"
            aria-label={t.siteHeader.search}
          >
            <Search size={18} />
          </button>

          <LocaleToggle />

          {/* Premium Analytics CTA - Desktop */}
          <Link
            href={resultsHref}
            className="hidden shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-ink-2 lg:flex"
          >
            <Crown size={15} />
            {t.siteHeader.premiumAnalysis}
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border xl:hidden"
            aria-label={t.siteHeader.menu}
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
            {t.siteHeader.premiumAnalysis}
          </Link>
        </div>
      )}
    </header>
  );
}
