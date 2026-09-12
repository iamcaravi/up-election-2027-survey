"use client";

import { useCallback, useEffect, useRef, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Building2, CalendarDays, MapPin, Users2 } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import {
  DEFAULT_HERO_ELEMENTS_CONFIG,
  HERO_ELEMENT_KEYS,
  type HeroElementBox,
  type HeroElementKey,
  type HeroElementsConfig,
} from "@/lib/survey-hero-elements-config";

export interface SurveyHeroProps {
  stateName: string;
  stateHref: string;
  districtName: string;
  districtHref: string;
  constituencyName: string;
  constituencyNumber: number;
  electionYear: number;
  /** Admin-configurable per-element layout — falls back to the shipped default when omitted. */
  config?: HeroElementsConfig;

  // --- Editor-only props (all optional/no-ops on the public site) ---------
  /** Turns on selection outlines + drag/resize handles. Never set true on the public site. */
  editable?: boolean;
  selectedKey?: HeroElementKey | null;
  onSelect?: (key: HeroElementKey | null) => void;
  /** Called continuously while dragging/resizing (commit=false) and once more at gesture end (commit=true) so the editor can checkpoint undo history only on release. */
  onChangeBox?: (key: HeroElementKey, patch: Partial<HeroElementBox>, commit: boolean) => void;
  /** Current editor zoom factor (1 = 100%) — needed to convert on-screen drag deltas into canvas px/percent correctly. */
  zoom?: number;
}

export function SurveyHero({
  stateName,
  stateHref,
  districtName,
  districtHref,
  constituencyName,
  constituencyNumber,
  electionYear,
  config = DEFAULT_HERO_ELEMENTS_CONFIG,
  editable = false,
  selectedKey = null,
  onSelect,
  onChangeBox,
  zoom = 1,
}: SurveyHeroProps) {
  const { t } = useLocale();
  const canvasRef = useRef<HTMLDivElement>(null);
  const { elements, background } = config;

  const orderedKeys = [...HERO_ELEMENT_KEYS].sort((a, b) => elements[a].zIndex - elements[b].zIndex);

  const dynamicData = { stateName, districtName, constituencyName, constituencyNumber, electionYear, t };

  return (
    <div className="relative isolate overflow-hidden border-b border-border" onClick={() => editable && onSelect?.(null)}>
      <Image
        src={background.imageUrl}
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover"
        style={{ objectPosition: `${background.x}% ${background.y}%`, transform: `scale(${background.scale})` }}
      />
      {background.overlayOpacity > 0 && (
        <div className="absolute inset-0 -z-10 bg-black" style={{ opacity: background.overlayOpacity / 100 }} aria-hidden="true" />
      )}

      {/* Mobile fallback (<sm): always the original simple stacked flow —
          the per-element canvas below is a desktop/tablet editing surface by
          design and is never applied to narrow viewports, so mobile never
          "blindly" inherits desktop pixel/percentage placement. */}
      <Container className="flex min-h-[280px] flex-col justify-center gap-5 py-4 sm:hidden">
        <MobileHeroContent
          stateName={stateName}
          stateHref={stateHref}
          districtName={districtName}
          districtHref={districtHref}
          constituencyName={constituencyName}
          constituencyNumber={constituencyNumber}
          electionYear={electionYear}
        />
      </Container>

      {/* Desktop/tablet — full per-element canvas driven by `config`. */}
      <div ref={canvasRef} className="relative hidden sm:block" style={{ height: config.height }}>
        {orderedKeys.map((key) => (
          <HeroElement
            key={key}
            elementKey={key}
            box={elements[key]}
            canvasRef={canvasRef}
            editable={editable}
            selected={selectedKey === key}
            onSelect={onSelect}
            onChangeBox={onChangeBox}
            zoom={zoom}
          >
            {renderElementContent(key, elements[key], dynamicData, stateHref, districtHref, editable)}
          </HeroElement>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Generic positioned wrapper: every hero element is an independent,
// absolutely-positioned sibling on the same canvas (a flat "Canva-style"
// object model) rather than nested DOM children — that's what lets each one
// (including the opinion card's icon/heading/subtitle/bars) be dragged,
// resized, hidden and z-ordered completely independently of the others.
// ---------------------------------------------------------------------------
function HeroElement({
  elementKey,
  box: elBox,
  canvasRef,
  editable,
  selected,
  onSelect,
  onChangeBox,
  zoom,
  children,
}: {
  elementKey: HeroElementKey;
  box: HeroElementBox;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  editable: boolean;
  selected: boolean;
  onSelect?: (key: HeroElementKey | null) => void;
  onChangeBox?: (key: HeroElementKey, patch: Partial<HeroElementBox>, commit: boolean) => void;
  zoom: number;
  children: React.ReactNode;
}) {
  const dragState = useRef<{ startClientX: number; startClientY: number; startX: number; startY: number } | null>(null);
  const resizeState = useRef<{ startClientX: number; startClientY: number; startWidth: number; startHeight: number } | null>(null);

  // onChangeBox is recreated every render by the editor (it's not memoized
  // upstream), but the window-level pointermove/pointerup listeners below
  // must stay the SAME function reference for the lifetime of one drag/resize
  // gesture so removeEventListener actually detaches them — reading the
  // latest callback through a ref (instead of a hook dependency) keeps
  // handlePointerMoveDrag/endDrag/etc. stable across re-renders.
  const onChangeBoxRef = useRef(onChangeBox);
  useEffect(() => {
    onChangeBoxRef.current = onChangeBox;
  }, [onChangeBox]);

  const handlePointerMoveDrag = useCallback(
    (e: PointerEvent) => {
      const drag = dragState.current;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!drag || !rect) return;
      const dxPercent = ((e.clientX - drag.startClientX) / rect.width) * 100;
      const dyPercent = ((e.clientY - drag.startClientY) / rect.height) * 100;
      const nextX = Math.min(98, Math.max(0, drag.startX + dxPercent));
      const nextY = Math.min(95, Math.max(0, drag.startY + dyPercent));
      onChangeBoxRef.current?.(elementKey, { x: nextX, y: nextY }, false);
    },
    [canvasRef, elementKey]
  );

  const endDragRef = useRef<(e: PointerEvent) => void>(() => {});
  const endDrag = useCallback(
    (e: PointerEvent) => {
      handlePointerMoveDrag(e);
      dragState.current = null;
      window.removeEventListener("pointermove", handlePointerMoveDrag);
      window.removeEventListener("pointerup", endDragRef.current);
      onChangeBoxRef.current?.(elementKey, {}, true);
    },
    [elementKey, handlePointerMoveDrag]
  );
  useEffect(() => {
    endDragRef.current = endDrag;
  }, [endDrag]);

  const handlePointerMoveResize = useCallback(
    (e: PointerEvent) => {
      const resize = resizeState.current;
      if (!resize) return;
      const dx = (e.clientX - resize.startClientX) / zoom;
      const dy = (e.clientY - resize.startClientY) / zoom;
      const nextWidth = Math.max(20, resize.startWidth + dx);
      const nextHeight = resize.startHeight === 0 ? 0 : Math.max(12, resize.startHeight + dy);
      onChangeBoxRef.current?.(elementKey, { width: nextWidth, ...(resize.startHeight !== 0 ? { height: nextHeight } : {}) }, false);
    },
    [elementKey, zoom]
  );

  const endResizeRef = useRef<(e: PointerEvent) => void>(() => {});
  const endResize = useCallback(
    (e: PointerEvent) => {
      handlePointerMoveResize(e);
      resizeState.current = null;
      window.removeEventListener("pointermove", handlePointerMoveResize);
      window.removeEventListener("pointerup", endResizeRef.current);
      onChangeBoxRef.current?.(elementKey, {}, true);
    },
    [elementKey, handlePointerMoveResize]
  );
  useEffect(() => {
    endResizeRef.current = endResize;
  }, [endResize]);

  useEffect(
    () => () => {
      window.removeEventListener("pointermove", handlePointerMoveDrag);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointermove", handlePointerMoveResize);
      window.removeEventListener("pointerup", endResize);
    },
    [handlePointerMoveDrag, endDrag, handlePointerMoveResize, endResize]
  );

  function startDrag(e: ReactPointerEvent<HTMLDivElement>) {
    if (!editable) return;
    e.stopPropagation();
    onSelect?.(elementKey);
    dragState.current = { startClientX: e.clientX, startClientY: e.clientY, startX: elBox.x, startY: elBox.y };
    window.addEventListener("pointermove", handlePointerMoveDrag);
    window.addEventListener("pointerup", endDrag);
  }

  function startResize(e: ReactPointerEvent<HTMLDivElement>) {
    e.stopPropagation();
    resizeState.current = { startClientX: e.clientX, startClientY: e.clientY, startWidth: elBox.width, startHeight: elBox.height };
    window.addEventListener("pointermove", handlePointerMoveResize);
    window.addEventListener("pointerup", endResize);
  }

  if (!elBox.visible && !editable) return null;

  return (
    <div
      onPointerDown={startDrag}
      onClick={(e) => editable && e.stopPropagation()}
      className={cn(
        "absolute",
        editable && "cursor-move select-none",
        editable && !elBox.visible && "opacity-40",
        editable && selected && "outline outline-2 outline-offset-2 outline-accent"
      )}
      style={{
        left: `${elBox.x}%`,
        top: `${elBox.y}%`,
        width: elBox.width ? `${elBox.width}px` : undefined,
        height: elBox.height ? `${elBox.height}px` : undefined,
        zIndex: elBox.zIndex,
        overflow: "visible",
      }}
    >
      {children}
      {editable && selected && (
        <div
          onPointerDown={startResize}
          className="absolute -bottom-1.5 -right-1.5 h-3.5 w-3.5 cursor-nwse-resize rounded-sm border-2 border-white bg-accent shadow-[0_1px_3px_rgba(0,0,0,0.4)]"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

function textStyle(box: HeroElementBox): CSSProperties {
  return {
    fontSize: box.fontSize,
    fontWeight: box.fontWeight,
    lineHeight: box.lineHeight,
    letterSpacing: box.letterSpacing,
    textAlign: box.textAlign,
    color: box.color,
    opacity: box.opacity / 100,
  };
}

function renderElementContent(
  key: HeroElementKey,
  box: HeroElementBox,
  data: {
    stateName: string;
    districtName: string;
    constituencyName: string;
    constituencyNumber: number;
    electionYear: number;
    t: ReturnType<typeof useLocale>["t"];
  },
  stateHref: string,
  districtHref: string,
  editable: boolean
): React.ReactNode {
  const { stateName, districtName, constituencyName, constituencyNumber, electionYear, t } = data;
  const heading = box.text.trim() || t.surveyFlow.ctaCardTitle;
  const subtitle = box.text.trim() || t.surveyFlow.ctaCardSubtitle;

  switch (key) {
    case "breadcrumb":
      return (
        <StyledText box={box}>
          <BreadcrumbContent
            stateName={stateName}
            stateHref={stateHref}
            districtName={districtName}
            districtHref={districtHref}
            constituencyName={constituencyName}
            breadcrumbSurveyLabel={t.surveyFlow.breadcrumbSurvey}
            editable={editable}
          />
        </StyledText>
      );
    case "constituencyName":
      return (
        <StyledText box={box}>
          <span className="font-display block whitespace-nowrap">{constituencyName}</span>
        </StyledText>
      );
    case "subtitle":
      return (
        <StyledText box={box}>
          <span className="block">{t.surveyFlow.constituencyNumberLabel.replace("{number}", String(constituencyNumber))}</span>
        </StyledText>
      );
    case "stateInfo":
      return (
        <StyledText box={box}>
          <HeroStatContent icon={<MapPin size={15} />} label={t.surveyFlow.statState} value={stateName} />
        </StyledText>
      );
    case "districtInfo":
      return (
        <StyledText box={box}>
          <HeroStatContent icon={<Building2 size={15} />} label={t.surveyFlow.statDistrict} value={districtName} />
        </StyledText>
      );
    case "constituencyNumber":
      return (
        <StyledText box={box}>
          <HeroStatContent icon={<Users2 size={15} />} label={t.surveyFlow.statConstituency} value={String(constituencyNumber)} />
        </StyledText>
      );
    case "electionYear":
      return (
        <StyledText box={box}>
          <HeroStatContent icon={<CalendarDays size={15} />} label={t.surveyFlow.statElection} value={String(electionYear)} />
        </StyledText>
      );
    case "opinionCard":
      return (
        <div
          className="h-full w-full shadow-[var(--shadow-soft)]"
          style={{ backgroundColor: box.backgroundColor, borderRadius: 16, opacity: box.opacity / 100 }}
        />
      );
    case "opinionCardIcon":
      return (
        <span className="flex h-full w-full items-center justify-center rounded-full bg-white/15" style={{ opacity: box.opacity / 100 }}>
          <Users2 size={18} className="text-white" />
        </span>
      );
    case "opinionCardHeading":
      return (
        <StyledText box={box}>
          <span className="font-display block">{heading}</span>
        </StyledText>
      );
    case "opinionCardSubtitle":
      return (
        <StyledText box={box}>
          <span className="block">{subtitle}</span>
        </StyledText>
      );
    case "opinionCardBars":
      return (
        <div className="flex h-full w-full overflow-hidden rounded-full" style={{ opacity: box.opacity / 100 }}>
          <span className="w-1/3 bg-orange-500" />
          <span className="w-1/3 bg-white" />
          <span className="w-1/3 bg-green-600" />
        </div>
      );
    default:
      return null;
  }
}

// Wraps text-content elements with their configured typography — kept
// separate from renderElementContent so opinionCard/opinionCardIcon/Bars
// (non-text, styled via backgroundColor/fill instead) can opt out cleanly.
function StyledText({ box, children }: { box: HeroElementBox; children: React.ReactNode }) {
  return <div style={textStyle(box)}>{children}</div>;
}

function BreadcrumbContent({
  stateName,
  stateHref,
  districtName,
  districtHref,
  constituencyName,
  breadcrumbSurveyLabel,
  editable,
}: {
  stateName: string;
  stateHref: string;
  districtName: string;
  districtHref: string;
  constituencyName: string;
  breadcrumbSurveyLabel: string;
  editable: boolean;
}) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap text-muted">
      {editable ? (
        <span className="shrink-0 hover:text-ink">{stateName}</span>
      ) : (
        <Link href={stateHref} className="shrink-0 hover:text-ink">{stateName}</Link>
      )}
      <ChevronRight size={13} className="shrink-0" aria-hidden="true" />
      {editable ? (
        <span className="shrink-0 hover:text-ink">{districtName}</span>
      ) : (
        <Link href={districtHref} className="shrink-0 hover:text-ink">{districtName}</Link>
      )}
      <ChevronRight size={13} className="shrink-0" aria-hidden="true" />
      <span className="shrink-0 text-foreground">{constituencyName}</span>
      <ChevronRight size={13} className="shrink-0" aria-hidden="true" />
      <span className="shrink-0 font-semibold text-ink">{breadcrumbSurveyLabel}</span>
    </nav>
  );
}

function HeroStatContent({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-1.5 whitespace-nowrap">
      <span className="mt-0.5">{icon}</span>
      <div>
        <p className="font-bold leading-tight">{value}</p>
        <p className="text-[0.8em] font-normal leading-tight opacity-70">{label}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mobile (<sm) fallback — deliberately NOT driven by the per-element config;
// a simple, always-stable stacked layout so the visual editor (a
// desktop/tablet tool) can never break small screens.
// ---------------------------------------------------------------------------
function MobileHeroContent({
  stateName,
  stateHref,
  districtName,
  districtHref,
  constituencyName,
  constituencyNumber,
  electionYear,
}: {
  stateName: string;
  stateHref: string;
  districtName: string;
  districtHref: string;
  constituencyName: string;
  constituencyNumber: number;
  electionYear: number;
}) {
  const { t } = useLocale();
  return (
    <>
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 overflow-x-auto text-xs font-medium text-muted">
        <Link href={stateHref} className="shrink-0 hover:text-ink">{stateName}</Link>
        <ChevronRight size={13} className="shrink-0" aria-hidden="true" />
        <Link href={districtHref} className="shrink-0 hover:text-ink">{districtName}</Link>
        <ChevronRight size={13} className="shrink-0" aria-hidden="true" />
        <span className="shrink-0 text-foreground">{constituencyName}</span>
        <ChevronRight size={13} className="shrink-0" aria-hidden="true" />
        <span className="shrink-0 font-semibold text-ink">{t.surveyFlow.breadcrumbSurvey}</span>
      </nav>

      <div className="flex flex-col gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-extrabold text-ink">{constituencyName}</h1>
          <p className="mt-1 text-sm font-medium text-muted">
            {t.surveyFlow.constituencyNumberLabel.replace("{number}", String(constituencyNumber))}
          </p>
          <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            <HeroStatContent icon={<MapPin size={15} />} label={t.surveyFlow.statState} value={stateName} />
            <HeroStatContent icon={<Building2 size={15} />} label={t.surveyFlow.statDistrict} value={districtName} />
            <HeroStatContent icon={<Users2 size={15} />} label={t.surveyFlow.statConstituency} value={String(constituencyNumber)} />
            <HeroStatContent icon={<CalendarDays size={15} />} label={t.surveyFlow.statElection} value={String(electionYear)} />
          </dl>
        </div>

        <div className="w-full shrink-0 rounded-2xl bg-ink px-5 py-4 text-center shadow-[var(--shadow-soft)]">
          <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
            <Users2 size={18} className="text-white" />
          </span>
          <p className="mt-2 font-display text-lg font-extrabold text-white">{t.surveyFlow.ctaCardTitle}</p>
          <p className="text-xs text-white/75">{t.surveyFlow.ctaCardSubtitle}</p>
          <div className="mx-auto mt-2.5 flex h-1 w-32 overflow-hidden rounded-full">
            <span className="w-1/3 bg-orange-500" />
            <span className="w-1/3 bg-white" />
            <span className="w-1/3 bg-green-600" />
          </div>
        </div>
      </div>
    </>
  );
}
