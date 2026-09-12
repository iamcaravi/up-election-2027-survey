"use client";

import { ThemeProvider } from "next-themes";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";

// The site's brand identity is the light navy/saffron/green tricolor theme —
// it must never silently switch to the dark palette just because a visitor's
// OS is set to dark mode (defaultTheme="system" did exactly that, and with no
// theme toggle currently exposed in the header there was no way back).
// enableSystem is off so every visitor sees the intended light theme by
// default.
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <LocaleProvider>{children}</LocaleProvider>
    </ThemeProvider>
  );
}
