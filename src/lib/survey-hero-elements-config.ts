import { z } from "zod";

// Per-element admin configuration for the constituency SURVEY hero/banner
// (src/components/survey/SurveyHero.tsx). Supersedes the earlier coarse
// SurveyHeroLayout (background/content/card as three big blocks) with a
// flat "canvas" of independently positioned/styled elements — the same
// mental model as a lightweight Canva/Figma editor: every element carries
// its own x/y/width/height/zIndex/visibility/typography, and the admin's
// Hero Visual Editor (src/components/admin/hero-editor/*) manipulates this
// object directly via drag/resize on a live preview built from the actual
// production SurveyHero component (rendered in `editable` mode).
//
// Persisted via the existing SiteSetting JSON-blob mechanism (see
// getSiteSetting / prisma.siteSetting) — no schema migration needed:
//   - SURVEY_HERO_ELEMENTS_KEY          → the global default, applied to
//     every constituency that has no override.
//   - surveyHeroElementsOverrideKey(id) → an optional per-constituency
//     override, keyed by the constituency's real cuid (not its slug, which
//     is only unique within a state).
//
// x/y are percentages of the hero canvas (resolution-independent — the
// same convention already used by the homepage Hero's text-element
// editor). width/height/fontSize/letterSpacing are px. All of this only
// applies from the `sm:` breakpoint up; mobile always falls back to a
// simple stacked flow layout regardless of these values, so the editor is
// a desktop/tablet tool by design (see SurveyHero.tsx).

export const HERO_ELEMENT_KEYS = [
  "breadcrumb",
  "constituencyName",
  "subtitle",
  "stateInfo",
  "districtInfo",
  "constituencyNumber",
  "electionYear",
  "opinionCard",
  "opinionCardIcon",
  "opinionCardHeading",
  "opinionCardSubtitle",
  "opinionCardBars",
] as const;
export type HeroElementKey = (typeof HERO_ELEMENT_KEYS)[number];

export const HERO_ELEMENT_LABELS: Record<HeroElementKey, string> = {
  breadcrumb: "Breadcrumb",
  constituencyName: "Constituency Name",
  subtitle: "Constituency Subtitle",
  stateInfo: "State",
  districtInfo: "District",
  constituencyNumber: "Constituency Number",
  electionYear: "Election Year",
  opinionCard: "Opinion Card",
  opinionCardIcon: "Opinion Card — Icon",
  opinionCardHeading: 'Opinion Card — "आपकी राय" Heading',
  opinionCardSubtitle: "Opinion Card — Subtitle",
  opinionCardBars: "Opinion Card — Accent Bars",
};

// Elements shown nested under "Opinion Card" in the layers panel — purely a
// display grouping (they are NOT DOM children of the card; every element is
// an independent, absolutely-positioned sibling on the hero canvas, which is
// what makes free dragging/resizing/z-ordering of each one possible).
export const HERO_OPINION_CARD_CHILDREN: HeroElementKey[] = [
  "opinionCardIcon",
  "opinionCardHeading",
  "opinionCardSubtitle",
  "opinionCardBars",
];

// Which elements carry real, editable static copy (the two opinion-card
// labels). Every other element's text is either structural (breadcrumb) or
// bound to live constituency/election data and must stay dynamic.
export const HERO_TEXT_OVERRIDABLE_KEYS: HeroElementKey[] = ["opinionCardHeading", "opinionCardSubtitle"];

export const HERO_TEXT_ALIGNS = ["left", "center", "right"] as const;
export type HeroTextAlign = (typeof HERO_TEXT_ALIGNS)[number];

export interface HeroElementBox {
  x: number; // percent, 0-100 — left anchor within the hero canvas
  y: number; // percent, 0-100 — top anchor
  width: number; // px
  height: number; // px — 0 means "auto" (text elements grow to fit their content)
  visible: boolean;
  zIndex: number;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
  textAlign: HeroTextAlign;
  color: string;
  /** Only meaningful for container-style elements (currently just opinionCard). */
  backgroundColor: string;
  opacity: number; // percent, 0-100
  /** Static-copy override — only read for keys in HERO_TEXT_OVERRIDABLE_KEYS. */
  text: string;
}

export interface HeroElementsBackground {
  imageUrl: string;
  x: number; // percent — object-position X
  y: number; // percent — object-position Y
  scale: number; // 1 = 100%
  overlayOpacity: number; // percent, 0-100 — black overlay above the photo, below every element
}

export interface HeroElementsConfig {
  /** Hero canvas height in px, applied from `sm:` up. */
  height: number;
  background: HeroElementsBackground;
  elements: Record<HeroElementKey, HeroElementBox>;
}

export const SURVEY_HERO_ELEMENTS_KEY = "SURVEY_HERO_ELEMENTS_DEFAULT";

export function surveyHeroElementsOverrideKey(constituencyId: string): string {
  return `SURVEY_HERO_ELEMENTS_OVERRIDE:${constituencyId}`;
}

const INK = "#0b2457";
const MUTED = "#64748b";

function box(overrides: Partial<HeroElementBox> & { x: number; y: number }): HeroElementBox {
  return {
    width: 260,
    height: 0,
    visible: true,
    zIndex: 5,
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 1.3,
    letterSpacing: 0,
    textAlign: "left",
    color: INK,
    backgroundColor: "transparent",
    opacity: 100,
    text: "",
    ...overrides,
  };
}

// Chosen to closely reproduce the previous hardcoded flex layout, so saving
// nothing (i.e. before an admin ever visits the new editor) looks the same
// as before.
export const DEFAULT_HERO_ELEMENTS_CONFIG: HeroElementsConfig = {
  height: 270,
  background: {
    imageUrl: "/images/survey/voter-survey-hero-2.png",
    x: 50,
    y: 50,
    scale: 1,
    overlayOpacity: 0,
  },
  elements: {
    breadcrumb: box({ x: 3, y: 6, width: 640, fontSize: 13, fontWeight: 500, color: MUTED, zIndex: 6 }),
    constituencyName: box({ x: 3, y: 24, width: 640, fontSize: 34, fontWeight: 800, lineHeight: 1.08, color: INK, zIndex: 6 }),
    subtitle: box({ x: 3, y: 42, width: 420, fontSize: 14, fontWeight: 500, color: MUTED, zIndex: 6 }),
    stateInfo: box({ x: 3, y: 55, width: 150, fontSize: 13, fontWeight: 700, color: INK, zIndex: 6 }),
    districtInfo: box({ x: 20, y: 55, width: 150, fontSize: 13, fontWeight: 700, color: INK, zIndex: 6 }),
    constituencyNumber: box({ x: 37, y: 55, width: 130, fontSize: 13, fontWeight: 700, color: INK, zIndex: 6 }),
    electionYear: box({ x: 52, y: 55, width: 130, fontSize: 13, fontWeight: 700, color: INK, zIndex: 6 }),
    opinionCard: box({ x: 72, y: 12, width: 260, height: 150, backgroundColor: INK, zIndex: 1 }),
    opinionCardIcon: box({ x: 75.5, y: 16, width: 36, height: 36, zIndex: 3 }),
    opinionCardHeading: box({
      x: 75.5,
      y: 25,
      width: 210,
      fontSize: 18,
      fontWeight: 800,
      color: "#ffffff",
      zIndex: 3,
    }),
    opinionCardSubtitle: box({
      x: 75.5,
      y: 32,
      width: 210,
      fontSize: 12,
      fontWeight: 500,
      color: "#ffffff",
      opacity: 75,
      zIndex: 3,
    }),
    opinionCardBars: box({ x: 75.5, y: 40, width: 130, height: 4, zIndex: 3 }),
  },
};

const percent = z.number().finite().min(0).max(100);
const hexOrTransparent = z.union([
  z.literal("transparent"),
  z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid hex color"),
  z.string().regex(/^rgba?\(/i, "Invalid color"),
]);

const heroElementBoxSchema = z.object({
  x: percent,
  y: percent,
  width: z.number().finite().min(4).max(2000),
  height: z.number().finite().min(0).max(2000),
  visible: z.boolean(),
  zIndex: z.number().int().min(0).max(100),
  fontSize: z.number().finite().min(6).max(160),
  fontWeight: z.union([
    z.literal(400),
    z.literal(500),
    z.literal(600),
    z.literal(700),
    z.literal(800),
    z.literal(900),
  ]),
  lineHeight: z.number().finite().min(0.5).max(3),
  letterSpacing: z.number().finite().min(-10).max(20),
  textAlign: z.enum(HERO_TEXT_ALIGNS),
  color: hexOrTransparent,
  backgroundColor: hexOrTransparent,
  opacity: percent,
  text: z.string().max(200),
}) satisfies z.ZodType<HeroElementBox>;

const heroElementsRecordSchema = z.object(
  Object.fromEntries(HERO_ELEMENT_KEYS.map((key) => [key, heroElementBoxSchema])) as Record<
    HeroElementKey,
    typeof heroElementBoxSchema
  >
);

const heroBackgroundSchema = z.object({
  imageUrl: z
    .string()
    .trim()
    .min(1)
    .max(300)
    .regex(/^\/[a-zA-Z0-9/_.-]+$/, "Must be a local path starting with /"),
  x: percent,
  y: percent,
  scale: z.number().finite().min(0.5).max(3),
  overlayOpacity: percent,
}) satisfies z.ZodType<HeroElementsBackground>;

export const heroElementsConfigSchema = z.object({
  height: z.number().finite().min(160).max(900),
  background: heroBackgroundSchema,
  elements: heroElementsRecordSchema,
}) satisfies z.ZodType<HeroElementsConfig>;

function coerceBox(value: unknown, fallback: HeroElementBox): HeroElementBox {
  if (!value || typeof value !== "object") return fallback;
  const candidate = { ...fallback, ...(value as Record<string, unknown>) };
  const parsed = heroElementBoxSchema.safeParse(candidate);
  return parsed.success ? parsed.data : fallback;
}

// Schema-tolerant merge over the defaults, mirroring normalizeHeroConfig in
// hero-config.ts — an old/partial saved blob (or a config saved before a new
// element key existed) still loads sensibly instead of crashing or silently
// discarding valid neighboring fields.
export function normalizeHeroElementsConfig(value: unknown): HeroElementsConfig {
  if (!value || typeof value !== "object") return DEFAULT_HERO_ELEMENTS_CONFIG;
  const v = value as Record<string, unknown>;

  const background = (() => {
    const parsed = heroBackgroundSchema.safeParse(v.background);
    return parsed.success ? parsed.data : DEFAULT_HERO_ELEMENTS_CONFIG.background;
  })();

  const height = typeof v.height === "number" && Number.isFinite(v.height) ? v.height : DEFAULT_HERO_ELEMENTS_CONFIG.height;

  const elementsRaw = v.elements && typeof v.elements === "object" ? (v.elements as Record<string, unknown>) : {};
  const elements = Object.fromEntries(
    HERO_ELEMENT_KEYS.map((key) => [key, coerceBox(elementsRaw[key], DEFAULT_HERO_ELEMENTS_CONFIG.elements[key])])
  ) as Record<HeroElementKey, HeroElementBox>;

  const candidate: HeroElementsConfig = { height, background, elements };
  const parsed = heroElementsConfigSchema.safeParse(candidate);
  return parsed.success ? parsed.data : DEFAULT_HERO_ELEMENTS_CONFIG;
}
