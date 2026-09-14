"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import hi from "./locales/hi";
import en from "./locales/en";
import { LOCALE_COOKIE_NAME } from "./locale-constants";

export type Locale = "hi" | "en";
const dictionaries = { hi, en };

type Dictionary = typeof hi;

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Dictionary;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

// The locale COOKIE is the single canonical source of truth — read
// server-side (root layout's `<html lang>`, every generateMetadata()) via
// getServerLocale(), and mirrored here as this Context's initial state so
// the first client render matches what the server already sent (no flash,
// no hydration mismatch). There is deliberately no second store
// (no localStorage) that could drift out of sync with the cookie.
export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback(
    (l: Locale) => {
      setLocaleState(l);
      if (typeof document !== "undefined") {
        document.documentElement.lang = l;
        // Plain, non-sensitive UI preference — a client-set cookie is the
        // standard pattern here since Server Components cannot set cookies
        // during render (see next/headers `cookies()` docs). 1 year, readable
        // by the server on the next request so SSR (html lang, metadata,
        // static legal pages) matches immediately without waiting on a second
        // round trip.
        document.cookie = `${LOCALE_COOKIE_NAME}=${l}; path=/; max-age=31536000; samesite=lax`;
      }
      // Re-renders every Server Component on the current route (root layout
      // included) against the freshly-set cookie, so <html lang>, any
      // server-rendered locale-dependent copy, and metadata catch up
      // immediately instead of only updating on the next full navigation.
      router.refresh();
    },
    [router]
  );

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, t: dictionaries[locale] }),
    [locale, setLocale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
