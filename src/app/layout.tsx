import type { Metadata, Viewport } from "next";
import { Inter, Manrope, Noto_Sans_Devanagari } from "next/font/google";
import { Providers } from "./providers";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });
const notoDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-dev",
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://up-election-2027.example";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "UP Election 2027 — Public Mood & Survey Platform",
    template: "%s | UP Election 2027",
  },
  description:
    "Voluntary public-opinion survey across all 403 Uttar Pradesh assembly constituencies — candidates, issues and live survey trends. Not an official election result.",
  openGraph: {
    type: "website",
    siteName: "UP Election 2027",
    title: "UP Election 2027 — Public Mood & Survey Platform",
    description: "Public opinion across 403 UP assembly constituencies — candidates, issues and survey results.",
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="hi"
      suppressHydrationWarning
      className={`${inter.variable} ${manrope.variable} ${notoDevanagari.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
