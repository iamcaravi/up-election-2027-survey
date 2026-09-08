"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";

export function LocaleToggle() {
  const { locale, setLocale } = useLocale();
  return (
    <button
      onClick={() => setLocale(locale === "hi" ? "en" : "hi")}
      className="flex h-9 items-center justify-center rounded-lg border border-border px-3 text-sm font-medium text-foreground/70 transition-colors hover:bg-surface-2 hover:text-foreground"
      aria-label="Switch language"
    >
      {locale === "hi" ? "EN" : "हि"}
    </button>
  );
}
