"use client";

import { useLocale } from "@/lib/i18n/LocaleProvider";

export function LocaleToggle() {
  const { locale, setLocale } = useLocale();
  return (
    <div className="flex h-10 items-center rounded-lg border border-border p-0.5 text-sm font-medium" role="group" aria-label="Switch language">
      <button
        onClick={() => setLocale("hi")}
        aria-pressed={locale === "hi"}
        className={`rounded-md px-2.5 py-1.5 transition-colors ${
          locale === "hi" ? "bg-ink text-white" : "text-foreground/70 hover:bg-surface-2 hover:text-foreground"
        }`}
      >
        HI
      </button>
      <button
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        className={`rounded-md px-2.5 py-1.5 transition-colors ${
          locale === "en" ? "bg-ink text-white" : "text-foreground/70 hover:bg-surface-2 hover:text-foreground"
        }`}
      >
        EN
      </button>
    </div>
  );
}
