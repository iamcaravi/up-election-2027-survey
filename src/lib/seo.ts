import type { Metadata } from "next";

// The single fallback origin used whenever NEXT_PUBLIC_SITE_URL isn't set
// (local dev without the env var, or a build that forgot to configure it) —
// shared by layout.tsx (metadataBase), sitemap.ts and robots.ts so all three
// always agree on one domain instead of silently drifting to different
// placeholder domains against each other.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://votersurvey.in").replace(/\/+$/, "");

// One place that turns {title, description, path} into a full, correct
// Metadata object — canonical + Open Graph + Twitter card — so every
// generateMetadata() across the state/election/district/constituency
// hierarchy emits consistent per-page metadata instead of silently
// inheriting the root layout's single site-wide OG card. `path` is always
// a relative, root-anchored path (e.g. "/uttar-pradesh/elections/..."); it
// resolves against the root layout's `metadataBase`, so callers never build
// an absolute URL themselves (and can never leak a localhost/dev origin).
export function buildPageMetadata({
  title,
  description,
  path,
  ogTitle,
  ogDescription,
  ogImage,
}: {
  title: string;
  description: string;
  path: string;
  /** Override when the OG card should read differently from the <title> tag
   *  (e.g. a shorter, more shareable phrasing) — defaults to `title`. */
  ogTitle?: string;
  ogDescription?: string;
  /** Custom Open Graph / Twitter image URL */
  ogImage?: string;
}): Metadata {
  const images = ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: ogTitle ?? title,
      description: ogDescription ?? description,
      url: path,
      type: "website",
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle ?? title,
      description: ogDescription ?? description,
      ...(images ? { images: [ogImage!] } : {}),
    },
  };
}
