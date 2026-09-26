"use client";

import Image from "next/image";
import { useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { Users, CheckCircle2, Shield } from "lucide-react";
import {
  DEFAULT_HERO_CONFIG,
  heroFontFamilyCss,
  type HeroBreakpoint,
  type HeroConfig,
  type HeroFeature,
  type HeroPoint,
  type HeroTextElement,
} from "@/lib/hero-config";
import { SurveyEntryCard, type SurveyEntryState } from "./SurveyEntryCard";
import { useLocale } from "@/lib/i18n/LocaleProvider";

const FEATURE_ICONS = [Users, CheckCircle2, Shield];

// The mobile poster's real, natural aspect ratio (hero-mobile.png is
// 941x1672 px). This MUST match the file's actual dimensions — the
// container below renders at this ratio with object-fit:cover, and any
// mismatch between this ratio and the file's real one makes cover crop
// the image top+bottom (centered) to fill the mismatched box, which is
// exactly what was silently clipping the top badge before this constant
// was introduced. If the poster asset is ever replaced, update this to
// match the new file's real width/height.
const MOBILE_HERO_ASPECT_RATIO = "941 / 1672";

// See tierRules()'s mobile branch: how far (as % of the poster's own
// width) the survey CTA card is pulled up over the mobile hero poster so
// it lands in the first viewport instead of requiring a scroll. Tuned
// against the shipped hero-mobile.png poster at its real, uncropped
// aspect ratio (1672/941 ≈ 1.777x width) — the raised Indian flag begins
// at roughly 69% of the image's height, so the card is pulled up to start
// right there. A different poster image would need this retuned.
const MOBILE_HERO_CARD_OVERLAP = 36;

// The Hero's text is admin-positioned pixel-by-pixel (see hero-config.ts) and
// stored as a single plain string per element — there's no per-locale field
// in that schema, and doubling it would mean reworking the drag-and-drop
// admin editor too. Rather than leave the public hero permanently Hindi-only
// regardless of the site's language toggle, this maps the platform's DEFAULT
// Hindi copy to its English equivalent for display only: an admin who has
// customized a line still sees exactly what they typed (this never rewrites
// their text, only the read-only English substitution shown to visitors).
const EN_HERO_TEXT: Record<string, string> = {
  "भारत का सबसे बड़ा जनमत सर्वे प्लेटफॉर्म": "India's Largest Public Opinion Survey Platform",
  "राज्यों का चुनाव": "STATE ELECTIONS",
  "जनता का मूड": "THE PEOPLE'S MOOD",
  "आपकी राय, एक बेहतर और मजबूत लोकतंत्र के लिए": "Your voice, for a better and stronger democracy",
  "देश के हर राज्य में": "Who will win across",
  "कौन मारेगा बाज़ी?": "India's states?",
  "जनता की भागीदारी": "People's participation",
  "तथ्यों पर आधारित विश्लेषण": "Fact-based analysis",
  "गोपनीयता और सुरक्षित": "Private & secure",
};

function heroText(text: string, locale: "hi" | "en"): string {
  if (locale !== "en") return text;
  return EN_HERO_TEXT[text] ?? text;
}

// Public-site + admin-preview breakpoints (unchanged from before): <640 mobile,
// 640-1023 tablet, >=1024 desktop. Implemented with CSS *container* queries
// (keyed off the Hero <section>'s own width, see `container-type: inline-size`
// below) rather than viewport @media queries, so the admin editor's preview —
// which renders this exact component inside a canvas narrower than the
// browser window — shows the true tablet/mobile layout instead of always
// resolving to whatever the real browser viewport happens to be. On the
// public site the Hero section spans the full viewport width anyway, so
// container queries there produce identical results to @media queries.
type HeroStyleTextElements = Record<
  string,
  { fontSize: HeroTextElement["fontSize"]; position?: HeroTextElement["position"] }
>;

function tierRules(
  tier: HeroBreakpoint,
  textElements: HeroStyleTextElements,
  viewport: HeroConfig["viewport"],
  fluidDesktop: boolean
): string[] {
  const rules: string[] = [];
  for (const [key, el] of Object.entries(textElements)) {
    const selector = `[data-hero-text="${key}"]`;
    if (tier === "desktop" && fluidDesktop) {
      // Fluidly interpolates from the tablet px size at 1024 container-width up to the
      // desktop px size at 1440, instead of jumping straight to the desktop value — see
      // buildResponsiveStyleCss's doc comment.
      const { tablet: tabletPx, desktop: desktopPx } = el.fontSize;
      const slope = (desktopPx - tabletPx) / (1440 - 1024);
      const fluid = `calc(${tabletPx}px + (100cqw - 1024px) * ${slope.toFixed(6)})`;
      const lo = Math.min(tabletPx, desktopPx);
      const hi = Math.max(tabletPx, desktopPx);
      rules.push(`${selector}{font-size:clamp(${lo}px, ${fluid}, ${hi}px);}`);
    } else {
      rules.push(`${selector}{font-size:${el.fontSize[tier]}px;}`);
    }
    if (el.position) {
      rules.push(`${selector}{left:${el.position[tier].x}%;top:${el.position[tier].y}%;}`);
    }
  }

  rules.push(`[data-hero-viewport]{height:${viewport[tier]}px;}`);

  if (tier === "mobile") {
    // Pulls the survey CTA card up so it overlaps the lower (photo-only,
    // no baked-in text) portion of the tall mobile poster instead of
    // sitting entirely below it — the card starts near where the poster's
    // text content ends and its decorative crowd/monument photo begins, so
    // the CTA is visible in the first mobile viewport without scrolling.
    // A negative *percentage* margin-top resolves against the container's
    // WIDTH (per the CSS spec), and since the poster's height is a fixed
    // multiple of its width (MOBILE_HERO_ASPECT_RATIO = 1672/941 ≈ 1.777x),
    // this scales correctly at every mobile width instead of needing a
    // hardcoded px value. The card stays in normal flow (not
    // position:absolute), so it still reserves its own space and can never
    // overlap whatever section follows the hero.
    rules.push(
      `[data-hero-card]{position:relative;margin-top:-${MOBILE_HERO_CARD_OVERLAP}%;margin-left:auto;margin-right:auto;margin-bottom:1.5rem;width:calc(100% - 2rem);}`
    );
    rules.push(`[data-hero-text="features"]{flex-direction:column;gap:0.5rem;max-width:44%;}`);
  } else if (tier === "tablet") {
    rules.push(`[data-hero-card]{position:relative;margin-top:1.5rem;margin-left:auto;margin-right:auto;width:calc(100% - 3rem);}`);
    rules.push(`[data-hero-text="features"]{flex-direction:row;flex-wrap:nowrap;gap:0.25rem 1rem;max-width:54%;}`);
    rules.push(`[data-hero-text="badge"]{max-width:44%;}`);
    rules.push(`[data-hero-text="subtitle"]{max-width:40%;}`);
    rules.push(`[data-hero-text="editorialLine1"],[data-hero-text="editorialLine2"]{max-width:38%;}`);
  } else {
    rules.push(
      `[data-hero-card]{position:absolute;inset-inline:0;bottom:1rem;margin-top:0;width:80%;max-width:1120px;}`
    );
    rules.push(`[data-hero-text="features"]{flex-direction:row;flex-wrap:nowrap;gap:0.25rem 1.25rem;max-width:46%;}`);
    rules.push(`[data-hero-text="badge"]{max-width:44%;}`);
    rules.push(`[data-hero-text="subtitle"]{max-width:40%;}`);
    rules.push(`[data-hero-text="editorialLine1"],[data-hero-text="editorialLine2"]{max-width:38%;}`);
  }

  return rules;
}

// Public-site breakpoints: <640 mobile, 640-1023 tablet, >=1024 desktop. Implemented with
// CSS *container* queries (keyed off the Hero <section>'s own width, see
// `container-type: inline-size` below) rather than viewport @media queries, so the same
// stylesheet-building approach also works for the admin preview (see buildStaticStyleCss)
// where the container is narrower than the browser window itself.
function buildResponsiveStyleCss(textElements: HeroStyleTextElements, viewport: HeroConfig["viewport"]) {
  const base = tierRules("mobile", textElements, viewport, false);
  const tablet = tierRules("tablet", textElements, viewport, false);
  const desktop = tierRules("desktop", textElements, viewport, true);
  return `${base.join("")}@container (min-width:640px){${tablet.join("")}}@container (min-width:1024px){${desktop.join("")}}`;
}

// The admin preview renders inside a canvas that's deliberately NOT full viewport width
// (e.g. the ~50%-wide left column of the two-panel editor layout — see HeroEditorForm),
// so it can never physically reach the >=1024px container width the "desktop" tier's
// `@container` query above requires, even when previewing the "Desktop" tier. Rather than
// fight that with container-width tricks, the preview just renders the ONE selected
// tier's values directly, unconditionally — exactly what "preview the desktop/tablet/
// mobile tier" means anyway, independent of the physical pixels available to show it in.
function buildStaticStyleCss(tier: HeroBreakpoint, textElements: HeroStyleTextElements, viewport: HeroConfig["viewport"]) {
  return tierRules(tier, textElements, viewport, false).join("");
}

// A crisp photographic background gives no guaranteed contrast for arbitrary
// text placement, so a minimal shadow (not a scrim/blur panel) keeps every
// text element readable without dimming or cropping the artwork underneath.
const SUBTLE_TEXT_SHADOW = "0 1px 2px rgba(0,0,0,0.3)";

function textStyle(el: HeroTextElement | HeroFeature): CSSProperties {
  return {
    color: el.color,
    fontFamily: heroFontFamilyCss(el.fontFamily),
    fontWeight: el.fontWeight,
    lineHeight: el.lineHeight,
    letterSpacing: `${el.letterSpacing}px`,
    textAlign: el.textAlign,
    textShadow: SUBTLE_TEXT_SHADOW,
  };
}

export type HeroElementKey =
  | "background"
  | "badge"
  | "mainHeadingLine1"
  | "mainHeadingLine2"
  | "subtitle"
  | "editorialLine1"
  | "editorialLine2"
  | "features";

export interface HeroEditableProps {
  /** Enables drag-to-reposition + selection outlines. Never set on the public site. */
  editable?: boolean;
  /** Which breakpoint's position values dragging/selection currently target. */
  activeTier?: HeroBreakpoint;
  selectedKey?: HeroElementKey | null;
  onSelect?: (key: HeroElementKey | null) => void;
  onDragText?: (key: Exclude<HeroElementKey, "background" | "features">, tier: HeroBreakpoint, point: HeroPoint) => void;
  onDragFeatures?: (tier: HeroBreakpoint, point: HeroPoint) => void;
  /** Incremental pan delta (percentage points), not an absolute position. */
  onDragBackground?: (delta: { dx: number; dy: number }) => void;
}

export function Hero({
  surveyStates,
  config = DEFAULT_HERO_CONFIG,
  editable = false,
  activeTier = "desktop",
  selectedKey = null,
  onSelect,
  onDragText,
  onDragFeatures,
  onDragBackground,
  // Homepage Sections editor overrides (src/lib/homepage-sections-config.ts):
  // an admin-set tablet image switches the <640px..1024px tier over to the
  // same "single pre-composited poster" model mobile already uses, instead of
  // the desktop photo+text layer above. `null` (the default) means "no
  // override" — tablet keeps rendering the desktop composition exactly as it
  // does today, unaffected by any of this.
  mobileImageUrl = "/images/homepage/hero-mobile.png",
  tabletImageUrl = null,
  desktopImageUrl = "/images/homepage/hero-desktop.png",
  initialDistricts = [],
}: {
  surveyStates: SurveyEntryState[];
  initialDistricts?: Parameters<typeof SurveyEntryCard>[0]["initialDistricts"];
  config?: HeroConfig;
  mobileImageUrl?: string;
  tabletImageUrl?: string | null;
  /** Public site (>=640px, or >=1024px when tabletImageUrl is set): a single
   *  pre-composited poster, same model as mobileImageUrl — the admin-editable
   *  photo+live-text layer below is now only ever shown inside the /admin/hero
   *  editor (editable=true), never on the public homepage. */
  desktopImageUrl?: string;
} & HeroEditableProps) {
  const { locale } = useLocale();
  const heroAltText =
    locale === "en"
      ? "India's Largest Public Opinion Survey Platform — State Elections, the People's Mood"
      : "भारत का सबसे बड़ा जनमत सर्वे प्लेटफॉर्म — राज्यों का चुनाव, जनता का मूड";
  // The public hero is a flat poster image with its heading baked into the
  // pixels (see the desktop/mobile <Image> blocks below) — that alone would
  // leave the page with no real <h1>, which breaks the document's heading
  // hierarchy for screen readers and search engines. This mirrors the exact
  // same text visually shown in the poster, so nothing new is communicated,
  // it's just made available as real markup instead of only as pixels.
  const heroHeadingText = `${heroText(config.mainHeadingLine1.text, locale)} ${heroText(config.mainHeadingLine2.text, locale)}`;
  const bannerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<HeroElementKey | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);

  const styleTextElements: HeroStyleTextElements = {
    badge: config.badge,
    mainHeadingLine1: config.mainHeadingLine1,
    mainHeadingLine2: config.mainHeadingLine2,
    subtitle: config.subtitle,
    editorialLine1: config.editorialLine1,
    editorialLine2: config.editorialLine2,
    surveyHeading: config.surveyHeading,
    "feature-0": config.features[0],
    "feature-1": config.features[1],
    "feature-2": config.features[2],
    features: { fontSize: { desktop: 0, tablet: 0, mobile: 0 }, position: config.featuresPosition },
  };
  // The admin preview always shows exactly the selected tier's values (see
  // buildStaticStyleCss's doc comment) since its physical width can't be relied on to
  // match the public site's real breakpoints. The public site keeps the container-query
  // version so it responds to the visitor's actual viewport width.
  const responsiveStyleCss = editable
    ? buildStaticStyleCss(activeTier, styleTextElements, config.viewport)
    : buildResponsiveStyleCss(styleTextElements, config.viewport);

  function pointFromEvent(e: ReactPointerEvent) {
    const box = bannerRef.current?.getBoundingClientRect();
    if (!box) return null;
    const x = Math.min(100, Math.max(0, ((e.clientX - box.left) / box.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - box.top) / box.height) * 100));
    return { x, y };
  }

  function startDrag(key: HeroElementKey, e: ReactPointerEvent) {
    if (!editable) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect?.(key);
    setDragging(key);
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handleMove(e: ReactPointerEvent) {
    if (!editable || !dragging) return;
    if (dragging === "background") {
      // Delta-based pan (grab-and-drag feel) rather than snapping to the
      // cursor — dragging the photo right should reveal more of what's on
      // its left, i.e. object-position-x should DECREASE, so the delta is
      // inverted relative to pointer movement.
      const box = bannerRef.current?.getBoundingClientRect();
      const last = lastPointerRef.current;
      if (!box || !last) return;
      const dxPct = ((e.clientX - last.x) / box.width) * 100;
      const dyPct = ((e.clientY - last.y) / box.height) * 100;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      onDragBackground?.({ dx: -dxPct, dy: -dyPct });
      return;
    }
    const point = pointFromEvent(e);
    if (!point) return;
    if (dragging === "features") {
      onDragFeatures?.(activeTier, point);
    } else {
      onDragText?.(dragging as Exclude<HeroElementKey, "background" | "features">, activeTier, point);
    }
  }

  function endDrag() {
    setDragging(null);
    lastPointerRef.current = null;
  }

  function selectionStyle(key: HeroElementKey): CSSProperties {
    if (!editable) return {};
    const isSelected = selectedKey === key;
    return {
      cursor: "grab",
      outline: isSelected ? "2px solid #2563eb" : "2px dashed transparent",
      outlineOffset: 2,
      borderRadius: 4,
    };
  }

  const bg = config.background;

  // In the admin editor (editable=true), which of {desktop banner, tablet
  // poster, mobile poster} is showing is driven deterministically by the
  // already-selected `activeTier`, not real CSS breakpoints — the same
  // reasoning buildStaticStyleCss already documents above: the editor's
  // preview canvas can be physically narrower than the browser window, so a
  // real `sm:`/`lg:` viewport media query would never reflect the tier the
  // admin actually picked. On the public site (editable=false) this is
  // irrelevant — the CSS-driven classNames below are used instead.
  const editorShowsDesktopBanner = activeTier === "desktop" || (activeTier === "tablet" && !tabletImageUrl);
  const editorShowsTabletPoster = activeTier === "tablet" && !!tabletImageUrl;
  const editorShowsMobilePoster = activeTier === "mobile";

  return (
    <section
      className="relative w-full"
      style={{ containerType: "inline-size" }}
      onClick={(e) => {
        // Only deselect when the click lands on the section itself (empty
        // space), not when it bubbles up from a child element's click —
        // each element's own onPointerDown already handles selecting itself.
        if (editable && e.target === e.currentTarget) onSelect?.(null);
      }}
    >
      {/* numeric/hex values only, sourced from heroConfigSchema-validated config */}
      <style dangerouslySetInnerHTML={{ __html: responsiveStyleCss }} />

      {/* Real <h1> for the page — the poster image below shows this same text
          visually, but a screen reader / search engine needs it as markup,
          not only as pixels. Not rendered a second time in the admin editor,
          which already has its own live <h1> in the canvas below. */}
      {!editable && <h1 className="sr-only">{heroHeadingText}</h1>}

      {/* Admin-editable photo+live-text composition — ONLY ever rendered inside
          the /admin/hero editor (editable=true) now. The public homepage always
          shows the flat poster images below instead, so there is no live
          HTML/CSS text layer on the actual site. */}
      {editable && (
      <div
        ref={bannerRef}
        data-hero-viewport
        className={editorShowsDesktopBanner ? "relative w-full overflow-hidden bg-ink" : "hidden"}
        onPointerMove={handleMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        {/* Provided hero artwork (public/hero-bg.png) stays the fixed image file — never
            edited/replaced/regenerated. Its crop/pan/zoom within the Hero viewport is
            fully admin-controlled (see HeroConfig.background + /admin/hero), not baked
            into the file. object-fit:cover + object-position give the pan, a CSS
            transform:scale gives the zoom/stretch on top. */}
        <div
          className="absolute inset-0"
          onPointerDown={(e) => startDrag("background", e)}
          style={editable ? { cursor: dragging === "background" ? "grabbing" : "grab" } : undefined}
        >
          <Image
            key={config.backgroundImageUrl}
            src={config.backgroundImageUrl}
            alt={heroAltText}
            fill
            priority
            sizes="100vw"
            draggable={false}
            className="object-cover"
            style={{
              objectPosition: `${bg.x}% ${bg.y}%`,
              transform: `scale(${bg.scale * bg.scaleX}, ${bg.scale * bg.scaleY})`,
            }}
          />
          {editable && selectedKey === "background" && (
            <div className="pointer-events-none absolute inset-0 outline outline-2 outline-blue-600" />
          )}
        </div>

        {config.showHero && (
          <>
            {config.mainHeadingLine1.visible && (
              <h1
                data-hero-text="mainHeadingLine1"
                className="absolute z-[2] max-w-[46%]"
                style={{ ...textStyle(config.mainHeadingLine1), ...selectionStyle("mainHeadingLine1") }}
                onPointerDown={(e) => startDrag("mainHeadingLine1", e)}
              >
                {heroText(config.mainHeadingLine1.text, locale)}
              </h1>
            )}

            {config.mainHeadingLine2.visible && (
              <p
                data-hero-text="mainHeadingLine2"
                className="absolute z-[2] max-w-[46%] font-extrabold"
                style={{ ...textStyle(config.mainHeadingLine2), ...selectionStyle("mainHeadingLine2") }}
                onPointerDown={(e) => startDrag("mainHeadingLine2", e)}
              >
                {heroText(config.mainHeadingLine2.text, locale)}
              </p>
            )}

            {config.badge.visible && (
              <span
                data-hero-text="badge"
                className="absolute z-[2] inline-flex max-w-[85%] items-center gap-1.5 rounded-full border border-orange-400/50 bg-white/80 px-2.5 py-1 backdrop-blur dark:bg-ink/60"
                style={{ ...textStyle(config.badge), ...selectionStyle("badge") }}
                onPointerDown={(e) => startDrag("badge", e)}
              >
                <span className="text-[0.9em] leading-none">🇮🇳</span>
                {heroText(config.badge.text, locale)}
              </span>
            )}

            {config.subtitle.visible && (
              <p
                data-hero-text="subtitle"
                className="absolute z-[2] max-w-[44%]"
                style={{ ...textStyle(config.subtitle), ...selectionStyle("subtitle") }}
                onPointerDown={(e) => startDrag("subtitle", e)}
              >
                {heroText(config.subtitle.text, locale)}
              </p>
            )}

            {config.showFeatureLabels && (
              <div
                data-hero-text="features"
                className="absolute z-[2] flex max-w-[44%] flex-col gap-2"
                style={selectionStyle("features")}
                onPointerDown={(e) => startDrag("features", e)}
              >
                {config.features.map((feature, i) => {
                  const Icon = FEATURE_ICONS[i];
                  if (!feature.visible) return null;
                  return (
                    <div key={i} className="flex items-center gap-1.5" style={textStyle(feature)}>
                      <Icon size={16} className="shrink-0" style={{ color: feature.color }} />
                      <span data-hero-text={`feature-${i}`}>{heroText(feature.text, locale)}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {config.editorialLine1.visible && (
              <h2
                data-hero-text="editorialLine1"
                className="absolute z-[2] max-w-[45%] font-extrabold"
                style={{ ...textStyle(config.editorialLine1), ...selectionStyle("editorialLine1") }}
                onPointerDown={(e) => startDrag("editorialLine1", e)}
              >
                {heroText(config.editorialLine1.text, locale)}
              </h2>
            )}

            {config.editorialLine2.visible && (
              <p
                data-hero-text="editorialLine2"
                className="absolute z-[2] max-w-[45%] font-extrabold"
                style={{ ...textStyle(config.editorialLine2), ...selectionStyle("editorialLine2") }}
                onPointerDown={(e) => startDrag("editorialLine2", e)}
              >
                {heroText(config.editorialLine2.text, locale)}
              </p>
            )}
          </>
        )}
      </div>
      )}

      {/* Mobile-only poster (<640px): a single pre-composited image (badge/
          headline/subtitle/features/message baked in), rendered at its
          natural portrait aspect ratio. */}
      {(editable ? editorShowsMobilePoster : true) && (
        <div
          className={editable ? "relative w-full overflow-hidden" : "relative block w-full overflow-hidden sm:hidden"}
          style={{ aspectRatio: MOBILE_HERO_ASPECT_RATIO }}
        >
          <Image
            src={mobileImageUrl}
            alt={heroAltText}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
      )}

      {/* Tablet-only poster (640-1023px), only when the admin has set a
          dedicated tablet image via the Homepage Sections editor — absent
          that, tablet uses the desktop poster below instead. */}
      {tabletImageUrl && (editable ? editorShowsTabletPoster : true) && (
        <div
          className={editable ? "relative w-full overflow-hidden" : "relative hidden w-full overflow-hidden sm:block lg:hidden"}
          style={{ aspectRatio: "1024 / 1536" }}
        >
          <Image
            src={tabletImageUrl}
            alt={heroAltText}
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
      )}

      {/* Desktop poster (public site only, >=640px — or >=1024px when a
          dedicated tabletImageUrl is set above): a single pre-composited
          image, same model as the mobile poster, at its natural wide/banner
          aspect ratio. Never shown in the admin editor — that always uses
          the live photo+text canvas above instead. */}
      {!editable && (
        <div
          className={tabletImageUrl ? "relative hidden w-full overflow-hidden lg:block" : "relative hidden w-full overflow-hidden sm:block"}
          style={{ aspectRatio: "2021 / 778" }}
        >
          <Image
            src={desktopImageUrl}
            alt={heroAltText}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
      )}

      <div data-section="surveyCta" className="relative z-20 pb-6 sm:pb-0">
        <SurveyEntryCard
          states={surveyStates}
          initialDistricts={initialDistricts}
          heading={config.surveyHeading}
        />
      </div>
    </section>
  );
}
