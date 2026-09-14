import "server-only";
import { z } from "zod";
import { getSiteSetting } from "./data";
import type { SocialLinksConfig } from "./social-links";

// Site-wide branding/contact settings, stored through the same generic
// SiteSetting key/value mechanism already used for HERO_CONFIG,
// HOMEPAGE_SECTIONS_CONFIG, etc. (see src/lib/data.ts's getSiteSetting).
// Kept separate from SOCIAL_LINKS (src/lib/social-links.ts) even though
// they're edited together on the same admin screen — social links already
// had their own key/reader; this only adds the fields that genuinely have
// no home yet (site name, tagline, contact email).
export const SITE_BRANDING_KEY = "SITE_BRANDING";

export const siteBrandingSchema = z.object({
  siteName: z.string().trim().min(1).max(80),
  tagline: z.string().trim().max(160),
  contactEmail: z.string().trim().email().max(160),
});

export type SiteBranding = z.infer<typeof siteBrandingSchema>;

// Matches the copy already hardcoded across the site today (footer wordmark,
// hi.ts's siteHeader.tagline, and the contact email introduced during the
// launch-readiness pass) — so wiring pages up to read from here is a no-op
// for anyone who hasn't touched Admin → Branding yet.
export const DEFAULT_SITE_BRANDING: SiteBranding = {
  siteName: "votersurvey.in",
  tagline: "जनता की राय, बेहतर कल के लिए",
  contactEmail: "votersurveyindia@gmail.com",
};

export async function getSiteBranding(): Promise<SiteBranding> {
  const stored = await getSiteSetting<Partial<SiteBranding>>(SITE_BRANDING_KEY, {});
  return { ...DEFAULT_SITE_BRANDING, ...stored };
}

export const socialLinksInputSchema = z
  .object({
    x: z.union([z.literal(""), z.string().trim().url().max(300)]).optional(),
    facebook: z.union([z.literal(""), z.string().trim().url().max(300)]).optional(),
    instagram: z.union([z.literal(""), z.string().trim().url().max(300)]).optional(),
    youtube: z.union([z.literal(""), z.string().trim().url().max(300)]).optional(),
    linkedin: z.union([z.literal(""), z.string().trim().url().max(300)]).optional(),
  })
  .partial();

/** Drops empty-string values (the admin form's "not configured" state) so the
 *  stored config only ever contains real URLs or omits the key entirely —
 *  matching SocialLinksConfig's own "falsy = unconfigured" contract. */
export function normalizeSocialLinksInput(input: z.infer<typeof socialLinksInputSchema>): SocialLinksConfig {
  const out: SocialLinksConfig = {};
  for (const [key, value] of Object.entries(input)) {
    if (value) out[key as keyof SocialLinksConfig] = value;
  }
  return out;
}
