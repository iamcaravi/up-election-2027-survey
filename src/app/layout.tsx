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

// Site chrome data (nav state links, header/footer padding, footer social
// links). The root layout sits above every error boundary, so an error thrown
// here cannot be rendered as an error page: on the Worker it escapes the fetch
// handler and Cloudflare answers with Error 1101. If this data cannot be read,
// log it and render the chrome without it; the page below still reports its
// own failure through the nearest error.tsx.
async function loadSiteChromeData() {
  try {
    const states = await getStates();
    const sectionsConfigRaw = await getSiteSetting("HOMEPAGE_SECTIONS_CONFIG", DEFAULT_HOMEPAGE_SECTIONS_CONFIG);
    const socialLinks = await getSocialLinks();
    return { states, sectionsConfigRaw, socialLinks };
  } catch (error) {
    console.error("[layout] site chrome data failed to load:", error);
    return { states: [], sectionsConfigRaw: DEFAULT_HOMEPAGE_SECTIONS_CONFIG, socialLinks: {} };
  }
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Keep DB reads serialized on Workers. Parallel Prisma calls can cause
  // intermittent request-context failures under concurrent mobile requests.
  const locale = await getServerLocale();
  const { states, sectionsConfigRaw, socialLinks } = await loadSiteChromeData();
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
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${inter.variable} ${manrope.variable} ${notoDevanagari.variable} h-full antialiased`}
    >
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6665490745490381"
          crossOrigin="anonymous"
        />
      </head>
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
