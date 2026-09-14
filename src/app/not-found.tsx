import Link from "next/link";
import { getServerLocale } from "@/lib/i18n/locale-cookie";
import type { Locale } from "@/lib/i18n/LocaleProvider";

const COPY: Record<Locale, { heading: string; body: string; cta: string }> = {
  hi: {
    heading: "पेज नहीं मिला",
    body: "जिस पेज को आप खोज रहे हैं वह मौजूद नहीं है या स्थानांतरित कर दिया गया है।",
    cta: "होम पर वापस जाएं",
  },
  en: {
    heading: "Page not found",
    body: "The page you're looking for doesn't exist or has been moved.",
    cta: "Back to Home",
  },
};

// Renders within the root layout (composed with it, not a standalone
// document — see app/layout.tsx), so <html lang> and the shared
// header/footer are already correct for the visitor's locale; this only
// needs its own locale-aware copy for the 404 message itself, replacing
// Next's unbranded default English fallback that would otherwise leak
// English text into a Hindi-locale visit.
export default async function NotFound() {
  const locale = await getServerLocale();
  const c = COPY[locale];
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
      <h1 className="font-display text-2xl font-extrabold text-foreground">{c.heading}</h1>
      <p className="mt-3 text-sm text-muted">{c.body}</p>
      <Link href="/" className="mt-6 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">
        {c.cta}
      </Link>
    </div>
  );
}
