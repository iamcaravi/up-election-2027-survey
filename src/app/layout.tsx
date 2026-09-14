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
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });
const notoDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-dev",
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "भारत चुनाव | जनता का मूड — राज्यों के चुनाव",
    template: "%s | भारत चुनाव",
  },
  description:
    "राज्यों के चुनाव, उम्मीदवार, चुनावी मुद्दे और जनता की राय को एक जगह explore करें। स्वैच्छिक सार्वजनिक सर्वे पर आधारित — यह कोई आधिकारिक चुनाव परिणाम नहीं है।",
  openGraph: {
    type: "website",
    siteName: "भारत चुनाव",
    title: "भारत चुनाव | जनता का मूड — राज्यों के चुनाव",
    description: "राज्यों के चुनाव, उम्मीदवार, चुनावी मुद्दे और जनता की राय — एक जगह।",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf8" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0c14" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [states, sectionsConfigRaw, socialLinks] = await Promise.all([
    getStates(),
    getSiteSetting("HOMEPAGE_SECTIONS_CONFIG", DEFAULT_HOMEPAGE_SECTIONS_CONFIG),
    getSocialLinks(),
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
      lang="hi"
      suppressHydrationWarning
      className={`${inter.variable} ${manrope.variable} ${notoDevanagari.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* numeric values only, sourced from homepageSectionsConfigSchema-validated config */}
        <style dangerouslySetInnerHTML={{ __html: chromeStyleCss }} />
        <Providers>
          <SiteChrome states={navStates} socialLinks={socialLinks}>
            {children}
          </SiteChrome>
        </Providers>
      </body>
    </html>
  );
}
