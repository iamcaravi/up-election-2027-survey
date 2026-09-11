import { z } from "zod";

// Admin-editable Hero visual layer — background crop/position/zoom plus a
// draggable text overlay — rendered on top of the fixed public/hero-bg.png
// artwork (see src/components/home/Hero.tsx, src/components/admin/HeroEditorForm.tsx).
// Persisted as a single JSON blob under SiteSetting key HERO_CONFIG
// (see getSiteSetting/prisma.siteSetting — no schema change needed).

export const HERO_FONT_WEIGHTS = [400, 500, 600, 700, 800, 900] as const;
export type HeroFontWeight = (typeof HERO_FONT_WEIGHTS)[number];

export const HERO_FONT_WEIGHT_LABELS: Record<HeroFontWeight, string> = {
  400: "Regular",
  500: "Medium",
  600: "Semibold",
  700: "Bold",
  800: "Extrabold",
  900: "Black",
};

export const HERO_TEXT_ALIGNS = ["left", "center", "right"] as const;
export type HeroTextAlign = (typeof HERO_TEXT_ALIGNS)[number];

// The two type families already loaded site-wide (see src/app/layout.tsx +
// globals.css --font-sans / --font-display) — Hero text picks between them
// rather than introducing a new font.
export const HERO_FONT_FAMILIES = ["sans", "display"] as const;
export type HeroFontFamily = (typeof HERO_FONT_FAMILIES)[number];

export const HERO_FONT_FAMILY_LABELS: Record<HeroFontFamily, string> = {
  sans: "Sans (Inter)",
  display: "Display (Manrope)",
};

export function heroFontFamilyCss(family: HeroFontFamily): string {
  return family === "display"
    ? "var(--font-display), var(--font-devanagari), sans-serif"
    : "var(--font-sans), var(--font-devanagari), sans-serif";
}

export const HERO_BREAKPOINTS = ["mobile", "tablet", "desktop"] as const;
export type HeroBreakpoint = (typeof HERO_BREAKPOINTS)[number];

export const HERO_BREAKPOINT_LABELS: Record<HeroBreakpoint, string> = {
  mobile: "Mobile",
  tablet: "Tablet",
  desktop: "Desktop",
};

// Reference preview widths for each tier — used only by the admin editor to
// size its live-preview canvas; the public site uses real CSS breakpoints
// (max-width 639px / 640-1023px / 1024px+) via the injected <style> below.
export const HERO_BREAKPOINT_PREVIEW_WIDTH: Record<HeroBreakpoint, number> = {
  mobile: 375,
  tablet: 768,
  desktop: 1440,
};

export interface HeroResponsiveFontSize {
  desktop: number;
  tablet: number;
  mobile: number;
}

export interface HeroPoint {
  /** Percentage (0-100) from the left edge of the hero viewport. */
  x: number;
  /** Percentage (0-100) from the top edge of the hero viewport. */
  y: number;
}

export interface HeroResponsivePosition {
  desktop: HeroPoint;
  tablet: HeroPoint;
  mobile: HeroPoint;
}

export interface HeroTextElement {
  text: string;
  fontFamily: HeroFontFamily;
  fontSize: HeroResponsiveFontSize;
  fontWeight: HeroFontWeight;
  color: string;
  /** Ignored for elements rendered inside the survey card (it positions itself). */
  position: HeroResponsivePosition;
  lineHeight: number;
  letterSpacing: number;
  textAlign: HeroTextAlign;
  visible: boolean;
}

// Trust items share one on-canvas anchor (HeroConfig.featuresPosition) as a
// group — each item controls its own typography, not its own position, since
// they flow as a row/column next to each other rather than being placed
// independently.
export interface HeroFeature {
  text: string;
  fontFamily: HeroFontFamily;
  fontSize: HeroResponsiveFontSize;
  fontWeight: HeroFontWeight;
  color: string;
  lineHeight: number;
  letterSpacing: number;
  textAlign: HeroTextAlign;
  visible: boolean;
}

// Background crop/pan/zoom. x/y map straight to CSS object-position (0-100,
// where 50/50 is centered) — the natural, well-supported way to pan a
// cover-fit image. scale is a uniform zoom multiplier on top of that;
// scaleX/scaleY let the admin stretch width/height independently of the
// uniform zoom (kept subtle — see the schema's tighter clamp on these two).
export interface HeroBackgroundTransform {
  x: number;
  y: number;
  scale: number;
  scaleX: number;
  scaleY: number;
}

// Fixed pixel height of the Hero viewport per tier. Deliberately NOT tied to
// the source image's own aspect ratio (unlike earlier iterations of this
// component) — now that the admin has direct pan/zoom/crop controls over the
// background, a fixed viewport + object-fit:cover is the correct, standard
// "cover photo editor" model: the box is the source of truth for the public
// composition, and the image is cropped to fill it exactly as the admin
// chooses, with zero letterboxing and zero gutters by construction.
export interface HeroViewportHeights {
  desktop: number;
  tablet: number;
  mobile: number;
}

export interface HeroConfig {
  showHero: boolean;
  showFeatureLabels: boolean;
  featuresPosition: HeroResponsivePosition;
  /** Public path/URL of the Hero background image. Defaults to /hero-bg.png; an admin
   *  upload (see /api/admin/hero/background-image) can point this at a new file instead —
   *  the original public/hero-bg.png is never overwritten. */
  backgroundImageUrl: string;
  background: HeroBackgroundTransform;
  viewport: HeroViewportHeights;
  badge: HeroTextElement;
  mainHeadingLine1: HeroTextElement;
  mainHeadingLine2: HeroTextElement;
  subtitle: HeroTextElement;
  editorialLine1: HeroTextElement;
  editorialLine2: HeroTextElement;
  surveyHeading: HeroTextElement;
  features: [HeroFeature, HeroFeature, HeroFeature];
}

const INK = "#101A3A";
const ACCENT_ORANGE = "#FF4B0B";

function pos(desktop: HeroPoint, tablet: HeroPoint, mobile: HeroPoint): HeroResponsivePosition {
  return { desktop, tablet, mobile };
}

function textEl(overrides: Partial<HeroTextElement> & { text: string; position: HeroResponsivePosition }): HeroTextElement {
  return {
    fontFamily: "sans",
    fontSize: { desktop: 18, tablet: 16, mobile: 14 },
    fontWeight: 600,
    color: INK,
    lineHeight: 1.4,
    letterSpacing: 0,
    textAlign: "left",
    visible: true,
    ...overrides,
  };
}

function featureEl(overrides: Partial<HeroFeature> & { text: string }): HeroFeature {
  return {
    fontFamily: "sans",
    fontSize: { desktop: 13, tablet: 10, mobile: 8 },
    fontWeight: 600,
    color: INK,
    lineHeight: 1.3,
    letterSpacing: 0,
    textAlign: "left",
    visible: true,
    ...overrides,
  };
}

export const DEFAULT_HERO_BACKGROUND: HeroBackgroundTransform = { x: 62, y: 38, scale: 1, scaleX: 1, scaleY: 1 };
export const DEFAULT_HERO_VIEWPORT: HeroViewportHeights = { desktop: 580, tablet: 420, mobile: 360 };

export const DEFAULT_HERO_CONFIG: HeroConfig = {
  showHero: true,
  showFeatureLabels: true,
  featuresPosition: pos({ x: 3, y: 53 }, { x: 3, y: 53 }, { x: 3, y: 53 }),
  backgroundImageUrl: "/hero-bg.png",
  background: DEFAULT_HERO_BACKGROUND,
  viewport: DEFAULT_HERO_VIEWPORT,
  badge: textEl({
    text: "भारत का सबसे बड़ा जनमत सर्वे प्लेटफॉर्म",
    fontSize: { desktop: 15, tablet: 11, mobile: 8 },
    fontWeight: 700,
    color: INK,
    position: pos({ x: 3, y: 9 }, { x: 3, y: 9 }, { x: 3, y: 5 }),
    lineHeight: 1.2,
  }),
  mainHeadingLine1: textEl({
    text: "राज्यों का चुनाव",
    fontSize: { desktop: 76, tablet: 30, mobile: 15 },
    fontWeight: 800,
    color: INK,
    position: pos({ x: 3, y: 18 }, { x: 3, y: 18 }, { x: 3, y: 18 }),
    lineHeight: 1.02,
    letterSpacing: -1.5,
  }),
  mainHeadingLine2: textEl({
    text: "जनता का मूड",
    fontSize: { desktop: 76, tablet: 30, mobile: 15 },
    fontWeight: 800,
    color: ACCENT_ORANGE,
    position: pos({ x: 3, y: 30 }, { x: 3, y: 30 }, { x: 3, y: 30 }),
    lineHeight: 1.02,
    letterSpacing: -1.5,
  }),
  subtitle: textEl({
    text: "आपकी राय, एक बेहतर और मजबूत लोकतंत्र के लिए",
    fontSize: { desktop: 19, tablet: 12, mobile: 8 },
    fontWeight: 600,
    color: INK,
    position: pos({ x: 3, y: 42 }, { x: 3, y: 42 }, { x: 3, y: 42 }),
    lineHeight: 1.4,
  }),
  editorialLine1: textEl({
    text: "राज्यों के चुनाव में",
    fontSize: { desktop: 38, tablet: 18, mobile: 10 },
    fontWeight: 800,
    color: ACCENT_ORANGE,
    position: pos({ x: 52, y: 19 }, { x: 52, y: 19 }, { x: 52, y: 19 }),
    lineHeight: 1.1,
  }),
  editorialLine2: textEl({
    text: "कौन मारेगा बाज़ी?",
    fontSize: { desktop: 38, tablet: 18, mobile: 10 },
    fontWeight: 800,
    color: INK,
    position: pos({ x: 52, y: 27 }, { x: 52, y: 27 }, { x: 52, y: 27 }),
    lineHeight: 1.1,
  }),
  surveyHeading: textEl({
    text: "अपना विधानसभा क्षेत्र चुनें और सर्वे में भाग लें।",
    fontSize: { desktop: 20, tablet: 18, mobile: 16 },
    fontWeight: 700,
    color: INK,
    position: pos({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }),
    lineHeight: 1.3,
  }),
  features: [
    featureEl({ text: "जनता की भागीदारी" }),
    featureEl({ text: "तथ्यों पर आधारित विश्लेषण" }),
    featureEl({ text: "गोपनीयता और सुरक्षित" }),
  ],
};

const hexColor = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid hex color");
const fontSize = z.number().finite().min(8).max(160);
const percent = z.number().finite().min(0).max(100);
const fontFamily = z.enum(HERO_FONT_FAMILIES);
const fontWeight = z.union([
  z.literal(400),
  z.literal(500),
  z.literal(600),
  z.literal(700),
  z.literal(800),
  z.literal(900),
]);

const heroResponsiveFontSizeSchema = z.object({
  desktop: fontSize,
  tablet: fontSize,
  mobile: fontSize,
});

const heroPointSchema = z.object({ x: percent, y: percent });
const heroResponsivePositionSchema = z.object({
  desktop: heroPointSchema,
  tablet: heroPointSchema,
  mobile: heroPointSchema,
});

const heroTextElementSchema = z.object({
  text: z.string().trim().min(1).max(200),
  fontFamily,
  fontSize: heroResponsiveFontSizeSchema,
  fontWeight,
  color: hexColor,
  position: heroResponsivePositionSchema,
  lineHeight: z.number().finite().min(0.5).max(3),
  letterSpacing: z.number().finite().min(-10).max(20),
  textAlign: z.enum(HERO_TEXT_ALIGNS),
  visible: z.boolean(),
});

const heroFeatureSchema = z.object({
  text: z.string().trim().min(1).max(80),
  fontFamily,
  fontSize: heroResponsiveFontSizeSchema,
  fontWeight,
  color: hexColor,
  lineHeight: z.number().finite().min(0.5).max(3),
  letterSpacing: z.number().finite().min(-10).max(20),
  textAlign: z.enum(HERO_TEXT_ALIGNS),
  visible: z.boolean(),
});

const heroBackgroundSchema = z.object({
  x: percent,
  y: percent,
  scale: z.number().finite().min(0.5).max(3),
  scaleX: z.number().finite().min(0.7).max(1.6),
  scaleY: z.number().finite().min(0.7).max(1.6),
});

const heroViewportSchema = z.object({
  desktop: z.number().finite().min(200).max(900),
  tablet: z.number().finite().min(180).max(800),
  mobile: z.number().finite().min(160).max(700),
});

const heroBackgroundImageUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(300)
  .regex(/^\/[a-zA-Z0-9/_.-]+$/, "Must be a local path starting with /");

export const heroConfigSchema = z.object({
  showHero: z.boolean(),
  showFeatureLabels: z.boolean(),
  featuresPosition: heroResponsivePositionSchema,
  backgroundImageUrl: heroBackgroundImageUrlSchema,
  background: heroBackgroundSchema,
  viewport: heroViewportSchema,
  badge: heroTextElementSchema,
  mainHeadingLine1: heroTextElementSchema,
  mainHeadingLine2: heroTextElementSchema,
  subtitle: heroTextElementSchema,
  editorialLine1: heroTextElementSchema,
  editorialLine2: heroTextElementSchema,
  surveyHeading: heroTextElementSchema,
  features: z.tuple([heroFeatureSchema, heroFeatureSchema, heroFeatureSchema]),
}) satisfies z.ZodType<HeroConfig>;

// --- Backward-compatible loading --------------------------------------------
// Older saved configs may predate one or more of: per-breakpoint text
// `position` (previously a flat `x`/`y`), `background`, or `viewport`. Rather
// than reject/crash on a partially-old shape, merge whatever validates over
// the current defaults field-by-field so an old save still loads sensibly —
// new fields simply fall back to their defaults until the admin touches them.
function coercePoint(value: unknown, fallback: HeroPoint): HeroPoint {
  const parsed = heroPointSchema.safeParse(value);
  return parsed.success ? parsed.data : fallback;
}

function coerceResponsivePosition(value: unknown, fallback: HeroResponsivePosition): HeroResponsivePosition {
  if (value && typeof value === "object") {
    const v = value as Record<string, unknown>;
    // Old shape: a single flat {x, y} applied to every breakpoint.
    if (typeof v.x === "number" && typeof v.y === "number" && !("desktop" in v)) {
      const flat = coercePoint(v, fallback.desktop);
      return { desktop: flat, tablet: flat, mobile: flat };
    }
    return {
      desktop: coercePoint(v.desktop, fallback.desktop),
      tablet: coercePoint(v.tablet, fallback.tablet),
      mobile: coercePoint(v.mobile, fallback.mobile),
    };
  }
  return fallback;
}

function coerceTextElement(value: unknown, fallback: HeroTextElement): HeroTextElement {
  if (!value || typeof value !== "object") return fallback;
  const v = value as Record<string, unknown>;
  const candidate = {
    ...fallback,
    ...v,
    position: coerceResponsivePosition(v.position ?? v, fallback.position),
  };
  const parsed = heroTextElementSchema.safeParse(candidate);
  return parsed.success ? parsed.data : fallback;
}

function coerceFeature(value: unknown, fallback: HeroFeature): HeroFeature {
  if (!value || typeof value !== "object") return fallback;
  const candidate = { ...fallback, ...(value as Record<string, unknown>) };
  const parsed = heroFeatureSchema.safeParse(candidate);
  return parsed.success ? parsed.data : fallback;
}

export function normalizeHeroConfig(value: unknown): HeroConfig {
  if (!value || typeof value !== "object") return DEFAULT_HERO_CONFIG;
  const v = value as Record<string, unknown>;

  const background = (() => {
    const parsed = heroBackgroundSchema.safeParse(v.background);
    return parsed.success ? parsed.data : DEFAULT_HERO_BACKGROUND;
  })();

  const viewport = (() => {
    const parsed = heroViewportSchema.safeParse(v.viewport);
    return parsed.success ? parsed.data : DEFAULT_HERO_VIEWPORT;
  })();

  const backgroundImageUrl = (() => {
    const parsed = heroBackgroundImageUrlSchema.safeParse(v.backgroundImageUrl);
    return parsed.success ? parsed.data : DEFAULT_HERO_CONFIG.backgroundImageUrl;
  })();

  const featuresRaw = Array.isArray(v.features) ? v.features : DEFAULT_HERO_CONFIG.features;
  const features: [HeroFeature, HeroFeature, HeroFeature] = [
    coerceFeature(featuresRaw[0], DEFAULT_HERO_CONFIG.features[0]),
    coerceFeature(featuresRaw[1], DEFAULT_HERO_CONFIG.features[1]),
    coerceFeature(featuresRaw[2], DEFAULT_HERO_CONFIG.features[2]),
  ];

  return {
    showHero: typeof v.showHero === "boolean" ? v.showHero : DEFAULT_HERO_CONFIG.showHero,
    showFeatureLabels: typeof v.showFeatureLabels === "boolean" ? v.showFeatureLabels : DEFAULT_HERO_CONFIG.showFeatureLabels,
    featuresPosition: coerceResponsivePosition(v.featuresPosition, DEFAULT_HERO_CONFIG.featuresPosition),
    backgroundImageUrl,
    background,
    viewport,
    badge: coerceTextElement(v.badge, DEFAULT_HERO_CONFIG.badge),
    mainHeadingLine1: coerceTextElement(v.mainHeadingLine1, DEFAULT_HERO_CONFIG.mainHeadingLine1),
    mainHeadingLine2: coerceTextElement(v.mainHeadingLine2, DEFAULT_HERO_CONFIG.mainHeadingLine2),
    subtitle: coerceTextElement(v.subtitle, DEFAULT_HERO_CONFIG.subtitle),
    editorialLine1: coerceTextElement(v.editorialLine1, DEFAULT_HERO_CONFIG.editorialLine1),
    editorialLine2: coerceTextElement(v.editorialLine2, DEFAULT_HERO_CONFIG.editorialLine2),
    surveyHeading: coerceTextElement(v.surveyHeading, DEFAULT_HERO_CONFIG.surveyHeading),
    features,
  };
}
