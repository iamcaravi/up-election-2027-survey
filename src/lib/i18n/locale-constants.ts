import type { Locale } from "./LocaleProvider";

// Client-safe constants shared by every reader/writer of the locale
// preference — split out from locale-cookie.ts (which additionally imports
// next/headers' cookies() and can only run in a Server Component) so the
// client-side LocaleProvider can import just the name/default without
// pulling a server-only API into the browser bundle.
export const LOCALE_COOKIE_NAME = "locale";

// The site's pre-existing default — every visitor without an explicit
// preference sees Hindi, unchanged from the original hardcoded behavior.
export const DEFAULT_LOCALE: Locale = "hi";

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "hi" || value === "en";
}
