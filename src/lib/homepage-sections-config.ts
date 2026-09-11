import { z } from "zod";

// Admin-editable per-device visibility/spacing/image layer for the homepage's
// major sections — a sibling to hero-config.ts's rich per-element Hero editor,
// NOT a replacement for it. Persisted as a single JSON blob under SiteSetting
// key HOMEPAGE_SECTIONS_CONFIG (see getSiteSetting/prisma.siteSetting — same
// mechanism HERO_CONFIG already uses, no schema change needed).
//
// Header and Footer are rendered site-wide from the root layout (every page,
// not just the homepage), so — unlike the other sections here — their
// `visible` flag is intentionally NOT wired to actually hide them (doing so
// would hide site navigation/footer on every page, not just the homepage).
// Their `paddingY` still applies (harmless, cosmetic, defaults to 0 = no
// change) via the same layout. See src/app/layout.tsx and src/app/page.tsx.

export const HOMEPAGE_DEVICES = ["mobile", "tablet", "desktop"] as const;
export type HomepageDevice = (typeof HOMEPAGE_DEVICES)[number];

export const HOMEPAGE_DEVICE_LABELS: Record<HomepageDevice, string> = {
  mobile: "Mobile",
  tablet: "Tablet",
  desktop: "Desktop",
};

// Reference preview widths — used only by the admin editor's own preview
// canvas; the public site uses real CSS breakpoints (max-width 639px /
// 640-1023px / 1024px+), matching the ranges already established by Hero.tsx.
export const HOMEPAGE_DEVICE_PREVIEW_WIDTH: Record<HomepageDevice, number> = {
  mobile: 390,
  tablet: 768,
  desktop: 1440,
};

export const HOMEPAGE_SECTION_KEYS = [
  "header",
  "hero",
  "surveyCta",
  "stats",
  "featureCards",
  "issues",
  "about",
  "states",
  "footer",
] as const;
export type HomepageSectionKey = (typeof HOMEPAGE_SECTION_KEYS)[number];

export const HOMEPAGE_SECTION_LABELS: Record<HomepageSectionKey, string> = {
  header: "Header / Navigation",
  hero: "Hero",
  surveyCta: "Survey Entry / CTA (in Hero)",
  stats: "Statistics Bar",
  featureCards: "Feature Cards (Take Survey / Results / Premium / Other States)",
  issues: "Issues (मुद्दे जो मायने रखते हैं)",
  about: "About + Responsible Initiative (हमारा उद्देश्य / एक जिम्मेदार पहल)",
  states: "Current States",
  footer: "Footer",
};

export interface HomepageDeviceFlags<T> {
  desktop: T;
  tablet: T;
  mobile: T;
}

export interface HomepageSectionConfig {
  visible: HomepageDeviceFlags<boolean>;
  /** Extra vertical padding (px) added on top of the section's own existing spacing. 0 = unchanged from today. */
  paddingY: HomepageDeviceFlags<number>;
}

// About's composited artwork already bakes both "हमारा उद्देश्य" and "एक
// जिम्मेदार पहल" into one image (see LowerCardsSection.tsx) — they share one
// config entry rather than being split into two independently-visible
// sections, since splitting them would mean redesigning that section back
// into separate components, which is out of scope here.
export interface HomepageAboutSectionConfig extends HomepageSectionConfig {
  /** null = tablet falls back to the desktop composite (today's behavior). */
  tabletImageUrl: string | null;
  mobileImageUrl: string;
}

export interface HomepageHeroSectionConfig extends HomepageSectionConfig {
  /** null = tablet falls back to the desktop Hero (photo + admin text layer, today's behavior). */
  tabletImageUrl: string | null;
  mobileImageUrl: string;
}

export interface HomepageSectionsConfig {
  header: HomepageSectionConfig;
  hero: HomepageHeroSectionConfig;
  surveyCta: HomepageSectionConfig;
  stats: HomepageSectionConfig;
  featureCards: HomepageSectionConfig;
  issues: HomepageSectionConfig;
  about: HomepageAboutSectionConfig;
  states: HomepageSectionConfig;
  footer: HomepageSectionConfig;
}

function allDevices<T>(value: T): HomepageDeviceFlags<T> {
  return { desktop: value, tablet: value, mobile: value };
}

function defaultSection(): HomepageSectionConfig {
  return { visible: allDevices(true), paddingY: allDevices(0) };
}

export const DEFAULT_HOMEPAGE_SECTIONS_CONFIG: HomepageSectionsConfig = {
  header: defaultSection(),
  hero: { ...defaultSection(), tabletImageUrl: null, mobileImageUrl: "/images/homepage/hero-mobile.png" },
  surveyCta: defaultSection(),
  stats: defaultSection(),
  featureCards: defaultSection(),
  issues: defaultSection(),
  about: { ...defaultSection(), tabletImageUrl: null, mobileImageUrl: "/images/homepage/about-mobile.png" },
  states: defaultSection(),
  footer: defaultSection(),
};

const deviceFlags = <T extends z.ZodTypeAny>(schema: T) =>
  z.object({ desktop: schema, tablet: schema, mobile: schema });

const paddingValue = z.number().finite().min(0).max(200);
const localImagePathSchema = z
  .string()
  .trim()
  .min(1)
  .max(300)
  .regex(/^\/[a-zA-Z0-9/_.-]+$/, "Must be a local path starting with /");

const sectionSchema = z.object({
  visible: deviceFlags(z.boolean()),
  paddingY: deviceFlags(paddingValue),
});

const heroSectionSchema = sectionSchema.extend({
  tabletImageUrl: localImagePathSchema.nullable(),
  mobileImageUrl: localImagePathSchema,
});

const aboutSectionSchema = sectionSchema.extend({
  tabletImageUrl: localImagePathSchema.nullable(),
  mobileImageUrl: localImagePathSchema,
});

export const homepageSectionsConfigSchema = z.object({
  header: sectionSchema,
  hero: heroSectionSchema,
  surveyCta: sectionSchema,
  stats: sectionSchema,
  featureCards: sectionSchema,
  issues: sectionSchema,
  about: aboutSectionSchema,
  states: sectionSchema,
  footer: sectionSchema,
}) satisfies z.ZodType<HomepageSectionsConfig>;

// --- Backward-compatible loading --------------------------------------------
// Mirrors hero-config.ts's normalizeHeroConfig: merge whatever validates over
// the current defaults field-by-field, so a partially-old or hand-edited
// saved blob still loads sensibly instead of crashing or being discarded
// wholesale — missing/invalid fields simply fall back to their defaults.
function coerceDeviceFlags<T>(value: unknown, fallback: HomepageDeviceFlags<T>, isValid: (v: unknown) => v is T): HomepageDeviceFlags<T> {
  if (!value || typeof value !== "object") return fallback;
  const v = value as Record<string, unknown>;
  return {
    desktop: isValid(v.desktop) ? v.desktop : fallback.desktop,
    tablet: isValid(v.tablet) ? v.tablet : fallback.tablet,
    mobile: isValid(v.mobile) ? v.mobile : fallback.mobile,
  };
}

const isBoolean = (v: unknown): v is boolean => typeof v === "boolean";
const isValidPadding = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 200;

function coerceSection(value: unknown, fallback: HomepageSectionConfig): HomepageSectionConfig {
  if (!value || typeof value !== "object") return fallback;
  const v = value as Record<string, unknown>;
  return {
    visible: coerceDeviceFlags(v.visible, fallback.visible, isBoolean),
    paddingY: coerceDeviceFlags(v.paddingY, fallback.paddingY, isValidPadding),
  };
}

function coerceImageUrl(value: unknown, fallback: string): string {
  const parsed = localImagePathSchema.safeParse(value);
  return parsed.success ? parsed.data : fallback;
}

function coerceNullableImageUrl(value: unknown, fallback: string | null): string | null {
  if (value === null) return null;
  const parsed = localImagePathSchema.safeParse(value);
  return parsed.success ? parsed.data : fallback;
}

export function normalizeHomepageSectionsConfig(value: unknown): HomepageSectionsConfig {
  const def = DEFAULT_HOMEPAGE_SECTIONS_CONFIG;
  if (!value || typeof value !== "object") return def;
  const v = value as Record<string, unknown>;

  const heroRaw = (v.hero ?? {}) as Record<string, unknown>;
  const aboutRaw = (v.about ?? {}) as Record<string, unknown>;

  return {
    header: coerceSection(v.header, def.header),
    hero: {
      ...coerceSection(v.hero, def.hero),
      tabletImageUrl: coerceNullableImageUrl(heroRaw.tabletImageUrl, def.hero.tabletImageUrl),
      mobileImageUrl: coerceImageUrl(heroRaw.mobileImageUrl, def.hero.mobileImageUrl),
    },
    surveyCta: coerceSection(v.surveyCta, def.surveyCta),
    stats: coerceSection(v.stats, def.stats),
    featureCards: coerceSection(v.featureCards, def.featureCards),
    issues: coerceSection(v.issues, def.issues),
    about: {
      ...coerceSection(v.about, def.about),
      tabletImageUrl: coerceNullableImageUrl(aboutRaw.tabletImageUrl, def.about.tabletImageUrl),
      mobileImageUrl: coerceImageUrl(aboutRaw.mobileImageUrl, def.about.mobileImageUrl),
    },
    states: coerceSection(v.states, def.states),
    footer: coerceSection(v.footer, def.footer),
  };
}

// Section keys actually rendered inside src/app/page.tsx (the homepage tree).
// Header/Footer render site-wide from the root layout instead — see
// buildGlobalChromeStyleCss below for their (padding-only) handling.
const HOMEPAGE_ONLY_SECTION_KEYS = HOMEPAGE_SECTION_KEYS.filter(
  (k): k is Exclude<HomepageSectionKey, "header" | "footer"> => k !== "header" && k !== "footer"
);

// Builds one aggregated <style> block covering every homepage section's
// per-device visibility + extra padding, keyed by `[data-section="<key>"]`.
// Pure CSS (media queries), so it's SSR-safe with zero client JS and zero
// hydration risk — the same technique Hero.tsx already uses for its own
// responsive text-position/size rules (see buildResponsiveStyleCss there).
export function buildHomepageSectionsStyleCss(config: HomepageSectionsConfig): string {
  const rules: string[] = [];
  for (const key of HOMEPAGE_ONLY_SECTION_KEYS) {
    const section = config[key];
    const selector = `[data-section="${key}"]`;
    rules.push(
      `${selector}{display:${section.visible.mobile ? "block" : "none"};padding-top:${section.paddingY.mobile}px;padding-bottom:${section.paddingY.mobile}px;}`
    );
    rules.push(
      `@media(min-width:640px){${selector}{display:${section.visible.tablet ? "block" : "none"};padding-top:${section.paddingY.tablet}px;padding-bottom:${section.paddingY.tablet}px;}}`
    );
    rules.push(
      `@media(min-width:1024px){${selector}{display:${section.visible.desktop ? "block" : "none"};padding-top:${section.paddingY.desktop}px;padding-bottom:${section.paddingY.desktop}px;}}`
    );
  }
  return rules.join("");
}

// Header/Footer render from the root layout on every page, not just the
// homepage — deliberately padding-only (never `display`), so a misconfigured
// or future admin control can never hide site-wide navigation/footer.
export function buildGlobalChromeStyleCss(config: HomepageSectionsConfig): string {
  const rules: string[] = [];
  for (const key of ["header", "footer"] as const) {
    const section = config[key];
    const selector = `[data-section="${key}"]`;
    rules.push(`${selector}{padding-top:${section.paddingY.mobile}px;padding-bottom:${section.paddingY.mobile}px;}`);
    rules.push(
      `@media(min-width:640px){${selector}{padding-top:${section.paddingY.tablet}px;padding-bottom:${section.paddingY.tablet}px;}}`
    );
    rules.push(
      `@media(min-width:1024px){${selector}{padding-top:${section.paddingY.desktop}px;padding-bottom:${section.paddingY.desktop}px;}}`
    );
  }
  return rules.join("");
}
