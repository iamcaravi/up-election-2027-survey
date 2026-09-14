import "server-only";

import { getSiteSetting } from "./data";

// Centralized config for the footer's social icons, stored through the same
// generic SiteSetting key/value mechanism already used for HERO_CONFIG,
// HOMEPAGE_SECTIONS_CONFIG, etc. (see src/lib/data.ts's getSiteSetting).
// No real handles are known yet, so every value defaults to null ("not
// configured") rather than a placeholder/invented URL — the footer renders
// an unconfigured platform as a disabled, non-clickable icon instead of a
// dead `href="#"`. Setting a real URL later (via this same SiteSetting key,
// e.g. from a future admin form) is enough to make that icon a real link —
// no code change required.
export const SOCIAL_LINKS_KEY = "SOCIAL_LINKS";

export type SocialPlatform = "x" | "facebook" | "instagram" | "youtube" | "linkedin";

export type SocialLinksConfig = Partial<Record<SocialPlatform, string>>;

const EMPTY_SOCIAL_LINKS: SocialLinksConfig = {};

export async function getSocialLinks(): Promise<SocialLinksConfig> {
  return getSiteSetting<SocialLinksConfig>(SOCIAL_LINKS_KEY, EMPTY_SOCIAL_LINKS);
}
