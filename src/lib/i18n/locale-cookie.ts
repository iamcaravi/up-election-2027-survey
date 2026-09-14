import "server-only";
import { cookies } from "next/headers";
import type { Locale } from "./LocaleProvider";
import { LOCALE_COOKIE_NAME, DEFAULT_LOCALE, isLocale } from "./locale-constants";

export { LOCALE_COOKIE_NAME, DEFAULT_LOCALE, isLocale };

// Server-side read of the visitor's locale preference (Server Components,
// generateMetadata()). Calling this opts the calling route into dynamic
// rendering — see root layout's doc comment for why that trade-off is
// accepted there.
export async function getServerLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE_NAME)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
