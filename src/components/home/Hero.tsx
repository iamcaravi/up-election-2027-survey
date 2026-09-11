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

const FEATURE_ICONS = [Users, CheckCircle2, Shield];

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
    rules.push(
      `[data-hero-card]{position:relative;margin-top:1.25rem;margin-left:auto;margin-right:auto;width:calc(100% - 2rem);}`
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
}: {
  surveyStates: SurveyEntryState[];
  config?: HeroConfig;
} & HeroEditableProps) {
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

      <div
        ref={bannerRef}
        data-hero-viewport
        className="relative w-full overflow-hidden bg-ink"
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
            alt="भारत का सबसे बड़ा जनमत सर्वे प्लेटफॉर्म — राज्यों का चुनाव, जनता का मूड"
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
                {config.mainHeadingLine1.text}
              </h1>
            )}

            {config.mainHeadingLine2.visible && (
              <p
                data-hero-text="mainHeadingLine2"
                className="absolute z-[2] max-w-[46%] font-extrabold"
                style={{ ...textStyle(config.mainHeadingLine2), ...selectionStyle("mainHeadingLine2") }}
                onPointerDown={(e) => startDrag("mainHeadingLine2", e)}
              >
                {config.mainHeadingLine2.text}
              </p>
            )}

            {config.badge.visible && (
              <span
                data-hero-text="badge"
                className="absolute z-[2] inline-flex max-w-[85%] items-center gap-1.5 rounded-full border border-orange-400/50 bg-white/80 px-2.5 py-1 backdrop-blur dark:bg-black/40"
                style={{ ...textStyle(config.badge), ...selectionStyle("badge") }}
                onPointerDown={(e) => startDrag("badge", e)}
              >
                <span className="text-[0.9em] leading-none">🇮🇳</span>
                {config.badge.text}
              </span>
            )}

            {config.subtitle.visible && (
              <p
                data-hero-text="subtitle"
                className="absolute z-[2] max-w-[44%]"
                style={{ ...textStyle(config.subtitle), ...selectionStyle("subtitle") }}
                onPointerDown={(e) => startDrag("subtitle", e)}
              >
                {config.subtitle.text}
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
                      <span data-hero-text={`feature-${i}`}>{feature.text}</span>
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
                {config.editorialLine1.text}
              </h2>
            )}

            {config.editorialLine2.visible && (
              <p
                data-hero-text="editorialLine2"
                className="absolute z-[2] max-w-[45%] font-extrabold"
                style={{ ...textStyle(config.editorialLine2), ...selectionStyle("editorialLine2") }}
                onPointerDown={(e) => startDrag("editorialLine2", e)}
              >
                {config.editorialLine2.text}
              </p>
            )}
          </>
        )}
      </div>

      <SurveyEntryCard states={surveyStates} heading={config.surveyHeading} />
    </section>
  );
}
