import type { Metadata, Viewport } from "next";
import { Inter, Manrope, Noto_Sans_Devanagari } from "next/font/google";
import { Providers } from "./providers";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { getSiteSetting, getStates } from "@/lib/data";
import { getSocialLinks } from "@/lib/social-links";
import {
  DEFAULT_HOMEPAGE_SECTIONS_CONFIG,
  buildGlobalChromeStyleCss,
  normalizeHomepageSectionsConfig,
} from "@/lib/homepage-sections-config";
import { SITE_URL } from "@/lib/seo";
import { getServerLocale } from "@/lib/i18n/locale-cookie";
import type { Locale } from "@/lib/i18n/LocaleProvider";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });
const notoDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-dev",
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const ROOT_METADATA_COPY: Record<Locale, { title: string; description: string; ogDescription: string }> = {
  hi: {
    title: "भारत चुनाव | जनता का मूड — राज्यों के चुनाव",
    description:
      "राज्यों के चुनाव, उम्मीदवार, चुनावी मुद्दे और जनता की राय को एक जगह explore करें। स्वैच्छिक सार्वजनिक सर्वे पर आधारित — यह कोई आधिकारिक चुनाव परिणाम नहीं है।",
    ogDescription: "राज्यों के चुनाव, उम्मीदवार, चुनावी मुद्दे और जनता की राय — एक जगह।",
  },
  en: {
    title: "Bharat Chunav | Public Mood — State Elections",
    description:
      "Explore state elections, candidates, key issues and public opinion in one place. Based on a voluntary public survey — not an official election result.",
    ogDescription: "State elections, candidates, key issues and public opinion — in one place.",
  },
};

// Root metadata is locale-aware (reads the same cookie the rest of the SSR
// locale system reads — see getServerLocale()'s doc comment for the
// dynamic-rendering trade-off this implies). Any page-specific
// generateMetadata() further down the tree already overrides this via its
// own buildPageMetadata() call; this is only the site-wide fallback used
// when a page has none.
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const copy = ROOT_METADATA_COPY[locale];
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: copy.title,
      template: `%s | ${locale === "hi" ? "भारत चुनाव" : "Bharat Chunav"}`,
    },
    description: copy.description,
    openGraph: {
      type: "website",
      siteName: locale === "hi" ? "भारत चुनाव" : "Bharat Chunav",
      title: copy.title,
      description: copy.ogDescription,
    },
    twitter: {
      card: "summary_large_image",
    },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf8" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0c14" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [states, sectionsConfigRaw, socialLinks, locale] = await Promise.all([
    getStates(),
    getSiteSetting("HOMEPAGE_SECTIONS_CONFIG", DEFAULT_HOMEPAGE_SECTIONS_CONFIG),
    getSocialLinks(),
    // Reading the locale cookie here opts the whole tree into dynamic
    // rendering (see next/headers `cookies()`: "Using it in a layout or
    // page will opt a route into dynamic rendering") — there is no way to
    // know the visitor's locale for <html lang> and root metadata without
    // reading it at this level, since it wraps every route including the
    // handful of small static pages (about/contact/privacy/terms/
    // disclaimer/methodology/faq, the state-selector shells) that were
    // previously ISR-cached. Every genuinely heavy page (results,
    // analysis, state/constituency/survey) was already `ƒ` dynamic before
    // this change (they fetch live DB data per request), so the actual
    // cost of this trade-off is limited to a handful of cheap, low-traffic
    // pages losing their ISR cache — accepted deliberately in exchange for
    // a correct <html lang>, no language flash, and locale-correct
    // metadata, which the static Hindi-only shell could never provide.
    getServerLocale(),
  ]);
  // Every state's slug + current election slug — SiteChrome (a client
  // component) uses the current URL to resolve nav links to WHICHEVER
  // state the visitor is actually browsing, instead of the site ever
  // guessing/defaulting to one "primary" state (see SiteChrome.tsx).
  const navStates = states.map((s) => ({ slug: s.slug, electionSlug: s.elections[0]?.slug ?? null }));
  // Header/Footer render on every page (not just the homepage), so only their
  // padding — never visibility — is driven by the Homepage Sections config.
  // See buildGlobalChromeStyleCss's doc comment.
  const chromeStyleCss = buildGlobalChromeStyleCss(normalizeHomepageSectionsConfig(sectionsConfigRaw));

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${inter.variable} ${manrope.variable} ${notoDevanagari.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* numeric values only, sourced from homepageSectionsConfigSchema-validated config */}
        <style dangerouslySetInnerHTML={{ __html: chromeStyleCss }} />
        <Providers initialLocale={locale}>
          <SiteChrome states={navStates} socialLinks={socialLinks}>
            {children}
          </SiteChrome>
        </Providers>
      </body>
    </html>
  );
}
