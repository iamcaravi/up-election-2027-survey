"use client";

import { ThemeProvider } from "next-themes";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <LocaleProvider>{children}</LocaleProvider>
    </ThemeProvider>
  );
}
