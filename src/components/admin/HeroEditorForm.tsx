"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Hero, type HeroElementKey } from "@/components/home/Hero";
import { Button } from "@/components/ui/Button";
import {
  DEFAULT_HERO_CONFIG,
  HERO_BREAKPOINTS,
  HERO_BREAKPOINT_LABELS,
  HERO_BREAKPOINT_PREVIEW_WIDTH,
  HERO_FONT_FAMILIES,
  HERO_FONT_FAMILY_LABELS,
  HERO_FONT_WEIGHTS,
  HERO_FONT_WEIGHT_LABELS,
  HERO_TEXT_ALIGNS,
  type HeroBreakpoint,
  type HeroConfig,
  type HeroFeature,
  type HeroFontFamily,
  type HeroFontWeight,
  type HeroPoint,
  type HeroTextAlign,
  type HeroTextElement,
} from "@/lib/hero-config";

type TextElementKey =
  | "badge"
  | "mainHeadingLine1"
  | "mainHeadingLine2"
  | "subtitle"
  | "editorialLine1"
  | "editorialLine2"
  | "surveyHeading";

type Feedback = { kind: "success" | "error"; message: string } | null;

const TEXT_ELEMENT_LABELS: Record<TextElementKey, string> = {
  badge: "Badge / Eyebrow",
  mainHeadingLine1: "Main Heading — Line 1",
  mainHeadingLine2: "Main Heading — Line 2",
  subtitle: "Subtitle",
  editorialLine1: "Editorial Text — Line 1",
  editorialLine2: "Editorial Text — Line 2",
  surveyHeading: "Survey Card Heading",
};

function clampPercent(n: number) {
  return Math.min(100, Math.max(0, n));
}

export function HeroEditorForm({ initialConfig }: { initialConfig: HeroConfig }) {
  const router = useRouter();
  const [config, setConfig] = useState<HeroConfig>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [activeTier, setActiveTier] = useState<HeroBreakpoint>("desktop");
  const [selectedKey, setSelectedKey] = useState<HeroElementKey | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<Feedback>(null);

  function updateElement(key: TextElementKey, patch: Partial<HeroTextElement>) {
    setConfig((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  function updateElementPosition(key: TextElementKey, tier: HeroBreakpoint, point: HeroPoint) {
    setConfig((prev) => ({
      ...prev,
      [key]: { ...prev[key], position: { ...prev[key].position, [tier]: point } },
    }));
  }

  function resetElementPosition(key: TextElementKey) {
    setConfig((prev) => ({ ...prev, [key]: { ...prev[key], position: DEFAULT_HERO_CONFIG[key].position } }));
  }

  function resetElementTypography(key: TextElementKey) {
    setConfig((prev) => {
      const def = DEFAULT_HERO_CONFIG[key];
      return {
        ...prev,
        [key]: {
          ...prev[key],
          fontFamily: def.fontFamily,
          fontSize: def.fontSize,
          fontWeight: def.fontWeight,
          color: def.color,
          lineHeight: def.lineHeight,
          letterSpacing: def.letterSpacing,
          textAlign: def.textAlign,
        },
      };
    });
  }

  function updateFeature(index: number, patch: Partial<HeroFeature>) {
    setConfig((prev) => {
      const features = [...prev.features] as HeroConfig["features"];
      features[index] = { ...features[index], ...patch };
      return { ...prev, features };
    });
  }

  function resetFeatureTypography(index: number) {
    setConfig((prev) => {
      const features = [...prev.features] as HeroConfig["features"];
      const def = DEFAULT_HERO_CONFIG.features[index];
      features[index] = { ...features[index], ...def, text: features[index].text };
      return { ...prev, features };
    });
  }

  function updateFeaturesPosition(tier: HeroBreakpoint, point: HeroPoint) {
    setConfig((prev) => ({ ...prev, featuresPosition: { ...prev.featuresPosition, [tier]: point } }));
  }

  function resetFeaturesPosition() {
    setConfig((prev) => ({ ...prev, featuresPosition: DEFAULT_HERO_CONFIG.featuresPosition }));
  }

  function updateBackground(patch: Partial<HeroConfig["background"]>) {
    setConfig((prev) => ({ ...prev, background: { ...prev.background, ...patch } }));
  }

  function onDragBackground(delta: { dx: number; dy: number }) {
    setConfig((prev) => ({
      ...prev,
      background: {
        ...prev.background,
        x: clampPercent(prev.background.x + delta.dx),
        y: clampPercent(prev.background.y + delta.dy),
      },
    }));
  }

  function resetBackgroundPosition() {
    setConfig((prev) => ({
      ...prev,
      background: { ...prev.background, x: DEFAULT_HERO_CONFIG.background.x, y: DEFAULT_HERO_CONFIG.background.y },
    }));
  }

  function resetBackgroundTransform() {
    setConfig((prev) => ({ ...prev, background: DEFAULT_HERO_CONFIG.background }));
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadFeedback(null);
    try {
      const allowed = ["image/png", "image/jpeg", "image/webp"];
      if (!allowed.includes(file.type)) throw new Error("Use a PNG, JPG, or WebP image.");
      if (file.size > 8 * 1024 * 1024) throw new Error("File is too large. Maximum size is 8MB.");
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/hero/background-image", { method: "POST", body: formData });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? `Upload failed (${res.status})`);
      // Only updates the unsaved draft + preview — the previous background stays live
      // on the public site (and in HERO_CONFIG) until this is confirmed with Save.
      setConfig((prev) => ({ ...prev, backgroundImageUrl: body.url }));
      setUploadFeedback({ kind: "success", message: "Image uploaded and shown in the preview. Click Save Changes to publish it." });
    } catch (err) {
      setUploadFeedback({ kind: "error", message: err instanceof Error ? err.message : "Upload failed." });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function updateViewport(tier: HeroBreakpoint, value: number) {
    setConfig((prev) => ({ ...prev, viewport: { ...prev.viewport, [tier]: value } }));
  }

  function resetToDefaults() {
    setConfig(DEFAULT_HERO_CONFIG);
    setSelectedKey(null);
    setFeedback(null);
  }

  async function save() {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/hero", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.error ?? `Save failed (${res.status})`);
      }
      setFeedback({ kind: "success", message: "Hero content saved." });
      router.refresh();
    } catch (err) {
      setFeedback({ kind: "error", message: err instanceof Error ? err.message : "Save failed." });
    } finally {
      setSaving(false);
    }
  }

  const previewWidth = HERO_BREAKPOINT_PREVIEW_WIDTH[activeTier];

  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      {/* LEFT column — the live preview. `lg:sticky` keeps it on screen while the RIGHT
          column (the actual editor form, which is much taller than one viewport) scrolls
          past it. `top-[76px]` clears the site's own sticky header (69px tall) with a
          small gap, rather than `top-0`, which would otherwise render the header on top
          of the preview once both are "stuck" simultaneously. Below `lg` there's no room
          for two columns side by side, so it just falls back to plain in-flow stacking
          (preview, then controls) with no sticky/scroll tricks — exactly the same
          structure that already fixed the "controls hidden behind preview" bug, just
          also applied at the narrower breakpoints where a 50/50 split isn't practical.
          `lg:max-h-[...] lg:overflow-y-auto` gives this column its OWN scroll region
          (mirroring the right column) — without it, a configured Hero taller than the
          browser window (e.g. a large desktop-tier viewport height on a short screen)
          had no way to become fully visible: the column doesn't grow the page's own
          scroll height once sticky, so its overflow was simply unreachable. Now hovering
          the preview and scrolling reveals the rest, instead of clipping it.
          `top-[200px]`/`calc(100vh-200px)` (not the site header's own 69px): this page
          never actually scrolls the *document* — both columns absorb their own overflow
          internally — so this element sits at its normal in-flow position (below the
          site header + this page's own "Hero Editor" title/description block) rather
          than ever truly reaching a "stuck" state, and 200px is that block's real
          measured height. If that title/description block's content changes
          meaningfully, remeasure and update this constant (and the matching one on the
          RIGHT column below) to match. Renders the exact same <Hero> component used on the public
          homepage, just in `editable` mode (drag-to-reposition + selection outlines;
          never enabled on the public site). */}
      <div className="pb-6 lg:sticky lg:top-[200px] lg:max-h-[calc(100vh-200px)] lg:overflow-y-auto lg:pb-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
            {HERO_BREAKPOINTS.map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => setActiveTier(tier)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeTier === tier ? "bg-ink text-white" : "text-foreground/70 hover:bg-surface-2"
                }`}
              >
                {HERO_BREAKPOINT_LABELS[tier]}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted">
            {selectedKey
              ? `Selected: ${selectedKey === "background" ? "Background" : selectedKey === "features" ? "Trust items" : TEXT_ELEMENT_LABELS[selectedKey as TextElementKey] ?? selectedKey}. Drag inside the preview to move it.`
              : "Click any element in the preview to select it, or drag it directly."}
          </p>
        </div>
        <div className="mx-auto overflow-hidden rounded-2xl border border-border shadow-sm" style={{ width: `min(100%, ${previewWidth}px)` }}>
          <Hero
            surveyStates={[]}
            config={config}
            editable
            activeTier={activeTier}
            selectedKey={selectedKey}
            onSelect={setSelectedKey}
            onDragText={updateElementPosition}
            onDragFeatures={updateFeaturesPosition}
            onDragBackground={onDragBackground}
          />
        </div>
      </div>

      {/* RIGHT column — the editor form. Scrolls independently of the preview at `lg:`
          widths (its own overflow-y, capped to the same 200px top offset as the preview
          column — see that column's comment); below `lg` it's just normal page flow. */}
      <div className="space-y-6 lg:max-h-[calc(100vh-200px)] lg:overflow-y-auto lg:pr-1">
        <Section title="Hero Background" onReset={resetBackgroundTransform} resetLabel="Reset transform">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- small thumbnail of a dynamic (possibly just-uploaded) path, next/image adds no value here */}
            <img
              src={config.backgroundImageUrl}
              alt="Current Hero background"
              className="h-16 w-28 shrink-0 rounded-lg border border-border object-cover"
            />
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleFileSelected}
              />
              <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                {uploading ? "Uploading…" : "Upload Hero Image"}
              </Button>
              <p className="mt-1 text-[11px] text-muted">PNG, JPG, or WebP · up to 8MB. public/hero-bg.png itself is never overwritten.</p>
            </div>
          </div>
          {uploadFeedback && (
            <p className={`text-xs font-medium ${uploadFeedback.kind === "success" ? "text-green-600 dark:text-green-400" : "text-danger"}`}>
              {uploadFeedback.message}
            </p>
          )}

          <p className="border-t border-border pt-3 text-xs text-muted">
            Drag the photo directly in the preview above to pan it, or use the sliders below.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <SliderField label={`X position (${config.background.x.toFixed(0)}%)`} min={0} max={100} value={config.background.x} onChange={(v) => updateBackground({ x: v })} />
            <SliderField label={`Y position (${config.background.y.toFixed(0)}%)`} min={0} max={100} value={config.background.y} onChange={(v) => updateBackground({ y: v })} />
          </div>
          <Button variant="outline" size="sm" onClick={resetBackgroundPosition} type="button">
            Reset position only
          </Button>
          <div className="grid grid-cols-3 gap-3 border-t border-border pt-3">
            <SliderField label={`Zoom (${config.background.scale.toFixed(2)}×)`} min={0.5} max={3} step={0.01} value={config.background.scale} onChange={(v) => updateBackground({ scale: v })} />
            <SliderField label={`Width scale (${config.background.scaleX.toFixed(2)}×)`} min={0.7} max={1.6} step={0.01} value={config.background.scaleX} onChange={(v) => updateBackground({ scaleX: v })} />
            <SliderField label={`Height scale (${config.background.scaleY.toFixed(2)}×)`} min={0.7} max={1.6} step={0.01} value={config.background.scaleY} onChange={(v) => updateBackground({ scaleY: v })} />
          </div>
        </Section>

        <Section title="Hero Viewport Height" onReset={() => setConfig((prev) => ({ ...prev, viewport: DEFAULT_HERO_CONFIG.viewport }))} resetLabel="Reset heights">
          <p className="text-xs text-muted">How tall the Hero is on each screen size, in pixels. The background image always fills this exactly (via the crop/zoom above) — changing height never stretches or letterboxes it.</p>
          <div className="grid grid-cols-3 gap-3">
            <NumberField label="Desktop px" value={config.viewport.desktop} min={200} max={900} onChange={(v) => updateViewport("desktop", v)} />
            <NumberField label="Tablet px" value={config.viewport.tablet} min={180} max={800} onChange={(v) => updateViewport("tablet", v)} />
            <NumberField label="Mobile px" value={config.viewport.mobile} min={160} max={700} onChange={(v) => updateViewport("mobile", v)} />
          </div>
        </Section>

        <Section title="Hero General Settings">
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={config.showHero}
              onChange={(e) => setConfig((prev) => ({ ...prev, showHero: e.target.checked }))}
              className="h-4 w-4 rounded border-border accent-[var(--ink)]"
            />
            Show Hero text layer
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={config.showFeatureLabels}
              onChange={(e) => setConfig((prev) => ({ ...prev, showFeatureLabels: e.target.checked }))}
              className="h-4 w-4 rounded border-border accent-[var(--ink)]"
            />
            Show trust items
          </label>
        </Section>

        <Section title="Badge / Eyebrow">
          <TextElementEditor
            elementKey="badge"
            element={config.badge}
            activeTier={activeTier}
            onChange={(patch) => updateElement("badge", patch)}
            onPositionChange={(tier, point) => updateElementPosition("badge", tier, point)}
            onResetPosition={() => resetElementPosition("badge")}
            onResetTypography={() => resetElementTypography("badge")}
          />
        </Section>

        <Section title="Main Heading">
          <div className="space-y-4">
            <div>
              <p className="mb-1 text-xs font-semibold text-muted">Line 1</p>
              <TextElementEditor
                elementKey="mainHeadingLine1"
                element={config.mainHeadingLine1}
                activeTier={activeTier}
                onChange={(patch) => updateElement("mainHeadingLine1", patch)}
                onPositionChange={(tier, point) => updateElementPosition("mainHeadingLine1", tier, point)}
                onResetPosition={() => resetElementPosition("mainHeadingLine1")}
                onResetTypography={() => resetElementTypography("mainHeadingLine1")}
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-muted">Line 2</p>
              <TextElementEditor
                elementKey="mainHeadingLine2"
                element={config.mainHeadingLine2}
                activeTier={activeTier}
                onChange={(patch) => updateElement("mainHeadingLine2", patch)}
                onPositionChange={(tier, point) => updateElementPosition("mainHeadingLine2", tier, point)}
                onResetPosition={() => resetElementPosition("mainHeadingLine2")}
                onResetTypography={() => resetElementTypography("mainHeadingLine2")}
              />
            </div>
          </div>
        </Section>

        <Section title="Subtitle">
          <TextElementEditor
            elementKey="subtitle"
            element={config.subtitle}
            activeTier={activeTier}
            onChange={(patch) => updateElement("subtitle", patch)}
            onPositionChange={(tier, point) => updateElementPosition("subtitle", tier, point)}
            onResetPosition={() => resetElementPosition("subtitle")}
            onResetTypography={() => resetElementTypography("subtitle")}
          />
        </Section>

        <Section title="Editorial Text">
          <div className="space-y-4">
            <div>
              <p className="mb-1 text-xs font-semibold text-muted">Line 1</p>
              <TextElementEditor
                elementKey="editorialLine1"
                element={config.editorialLine1}
                activeTier={activeTier}
                onChange={(patch) => updateElement("editorialLine1", patch)}
                onPositionChange={(tier, point) => updateElementPosition("editorialLine1", tier, point)}
                onResetPosition={() => resetElementPosition("editorialLine1")}
                onResetTypography={() => resetElementTypography("editorialLine1")}
              />
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold text-muted">Line 2</p>
              <TextElementEditor
                elementKey="editorialLine2"
                element={config.editorialLine2}
                activeTier={activeTier}
                onChange={(patch) => updateElement("editorialLine2", patch)}
                onPositionChange={(tier, point) => updateElementPosition("editorialLine2", tier, point)}
                onResetPosition={() => resetElementPosition("editorialLine2")}
                onResetTypography={() => resetElementTypography("editorialLine2")}
              />
            </div>
          </div>
        </Section>

        <Section title="Trust Items" onReset={resetFeaturesPosition} resetLabel="Reset shared position">
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-border p-3">
            <p className="col-span-2 text-xs font-semibold text-muted">
              Shared {HERO_BREAKPOINT_LABELS[activeTier]} position (applies to all three items as a group)
            </p>
            <SliderField
              label={`X (${config.featuresPosition[activeTier].x.toFixed(0)}%)`}
              min={0}
              max={100}
              value={config.featuresPosition[activeTier].x}
              onChange={(v) => updateFeaturesPosition(activeTier, { x: v, y: config.featuresPosition[activeTier].y })}
            />
            <SliderField
              label={`Y (${config.featuresPosition[activeTier].y.toFixed(0)}%)`}
              min={0}
              max={100}
              value={config.featuresPosition[activeTier].y}
              onChange={(v) => updateFeaturesPosition(activeTier, { x: config.featuresPosition[activeTier].x, y: v })}
            />
          </div>

          {config.features.map((feature, i) => (
            <div key={i}>
              <p className="mb-1 text-xs font-semibold text-muted">Trust Item {i + 1}</p>
              <FeatureEditor feature={feature} onChange={(patch) => updateFeature(i, patch)} onResetTypography={() => resetFeatureTypography(i)} />
            </div>
          ))}
        </Section>

        <Section title="Survey Card Heading">
          <TextElementEditor
            elementKey="surveyHeading"
            element={config.surveyHeading}
            activeTier={activeTier}
            hidePosition
            onChange={(patch) => updateElement("surveyHeading", patch)}
            onPositionChange={() => {}}
            onResetPosition={() => {}}
            onResetTypography={() => resetElementTypography("surveyHeading")}
          />
        </Section>

        {/* Only sticky at `lg:`, where it's confined to this column's own independent
            scroll region (see the column's `lg:overflow-y-auto` above) and so can never
            visually reach the sibling preview column. Below `lg`, preview and controls
            share the single page scroll, and a page-relative sticky-bottom bar there
            would end up floating on top of whatever happens to be at the bottom of the
            viewport — including the preview, if it's tall — so it's a plain in-flow
            block there instead. */}
        <div className="card-surface flex items-center gap-3 rounded-2xl border border-border p-4 lg:sticky lg:bottom-0">
          <Button variant="primary" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
          <Button variant="outline" onClick={resetToDefaults} disabled={saving} type="button">
            Reset Everything to Defaults
          </Button>
          {feedback && (
            <p className={`text-sm font-medium ${feedback.kind === "success" ? "text-green-600 dark:text-green-400" : "text-danger"}`}>
              {feedback.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  onReset,
  resetLabel = "Reset",
}: {
  title: string;
  children: React.ReactNode;
  onReset?: () => void;
  resetLabel?: string;
}) {
  return (
    <fieldset className="card-surface space-y-3 rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between gap-3">
        <legend className="font-display text-base font-bold">{title}</legend>
        {onReset && (
          <button type="button" onClick={onReset} className="text-xs font-semibold text-accent hover:underline">
            {resetLabel}
          </button>
        )}
      </div>
      {children}
    </fieldset>
  );
}

function FontFamilySelect({ value, onChange }: { value: HeroFontFamily; onChange: (v: HeroFontFamily) => void }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-muted">Font family</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as HeroFontFamily)}
        className="h-9 w-full rounded-lg border border-border bg-surface px-2 text-sm"
      >
        {HERO_FONT_FAMILIES.map((f) => (
          <option key={f} value={f}>
            {HERO_FONT_FAMILY_LABELS[f]}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextElementEditor({
  element,
  activeTier,
  onChange,
  onPositionChange,
  onResetPosition,
  onResetTypography,
  hidePosition,
}: {
  elementKey: TextElementKey;
  element: HeroTextElement;
  activeTier: HeroBreakpoint;
  onChange: (patch: Partial<HeroTextElement>) => void;
  onPositionChange: (tier: HeroBreakpoint, point: HeroPoint) => void;
  onResetPosition: () => void;
  onResetTypography: () => void;
  hidePosition?: boolean;
}) {
  const tierPos = element.position[activeTier];
  return (
    <fieldset className="space-y-3 rounded-xl border border-border p-3">
      <div className="flex items-center justify-between gap-3">
        <label className="text-xs font-medium text-muted">Text</label>
        <label className="flex shrink-0 items-center gap-1.5 text-xs font-medium">
          <input
            type="checkbox"
            checked={element.visible}
            onChange={(e) => onChange({ visible: e.target.checked })}
            className="h-4 w-4 rounded border-border accent-[var(--ink)]"
          />
          Show
        </label>
      </div>
      <input
        type="text"
        value={element.text}
        maxLength={200}
        onChange={(e) => onChange({ text: e.target.value })}
        className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"
      />

      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Typography</p>
        <button type="button" onClick={onResetTypography} className="text-[11px] font-semibold text-accent hover:underline">
          Reset typography
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <NumberField label="Desktop px" value={element.fontSize.desktop} min={8} max={160} onChange={(v) => onChange({ fontSize: { ...element.fontSize, desktop: v } })} />
        <NumberField label="Tablet px" value={element.fontSize.tablet} min={8} max={160} onChange={(v) => onChange({ fontSize: { ...element.fontSize, tablet: v } })} />
        <NumberField label="Mobile px" value={element.fontSize.mobile} min={8} max={160} onChange={(v) => onChange({ fontSize: { ...element.fontSize, mobile: v } })} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <FontFamilySelect value={element.fontFamily} onChange={(v) => onChange({ fontFamily: v })} />
        <div>
          <label className="mb-1 block text-[11px] font-medium text-muted">Weight</label>
          <select
            value={element.fontWeight}
            onChange={(e) => onChange({ fontWeight: Number(e.target.value) as HeroFontWeight })}
            className="h-9 w-full rounded-lg border border-border bg-surface px-2 text-sm"
          >
            {HERO_FONT_WEIGHTS.map((w) => (
              <option key={w} value={w}>
                {HERO_FONT_WEIGHT_LABELS[w]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-medium text-muted">Color</label>
        <input
          type="color"
          value={element.color}
          onChange={(e) => onChange({ color: e.target.value })}
          className="h-9 w-full cursor-pointer rounded-lg border border-border bg-surface px-1"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <NumberField label="Line height" value={element.lineHeight} min={0.5} max={3} step={0.05} onChange={(v) => onChange({ lineHeight: v })} />
        <NumberField label="Letter spacing" value={element.letterSpacing} min={-10} max={20} step={0.1} onChange={(v) => onChange({ letterSpacing: v })} />
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-medium text-muted">Alignment</label>
        <select
          value={element.textAlign}
          onChange={(e) => onChange({ textAlign: e.target.value as HeroTextAlign })}
          className="h-9 w-full rounded-lg border border-border bg-surface px-2 text-sm"
        >
          {HERO_TEXT_ALIGNS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      {!hidePosition && (
        <div className="space-y-2 border-t border-border pt-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              {HERO_BREAKPOINT_LABELS[activeTier]} position
            </p>
            <button type="button" onClick={onResetPosition} className="text-[11px] font-semibold text-accent hover:underline">
              Reset position (all sizes)
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <SliderField label={`X (${tierPos.x.toFixed(0)}%)`} min={0} max={100} value={tierPos.x} onChange={(v) => onPositionChange(activeTier, { x: v, y: tierPos.y })} />
            <SliderField label={`Y (${tierPos.y.toFixed(0)}%)`} min={0} max={100} value={tierPos.y} onChange={(v) => onPositionChange(activeTier, { x: tierPos.x, y: v })} />
          </div>
        </div>
      )}
    </fieldset>
  );
}

function FeatureEditor({
  feature,
  onChange,
  onResetTypography,
}: {
  feature: HeroFeature;
  onChange: (patch: Partial<HeroFeature>) => void;
  onResetTypography: () => void;
}) {
  return (
    <fieldset className="space-y-3 rounded-xl border border-border p-3">
      <div className="flex items-center justify-between gap-3">
        <label className="text-xs font-medium text-muted">Text</label>
        <label className="flex shrink-0 items-center gap-1.5 text-xs font-medium">
          <input
            type="checkbox"
            checked={feature.visible}
            onChange={(e) => onChange({ visible: e.target.checked })}
            className="h-4 w-4 rounded border-border accent-[var(--ink)]"
          />
          Show
        </label>
      </div>
      <input
        type="text"
        value={feature.text}
        maxLength={80}
        onChange={(e) => onChange({ text: e.target.value })}
        className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"
      />

      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Typography</p>
        <button type="button" onClick={onResetTypography} className="text-[11px] font-semibold text-accent hover:underline">
          Reset typography
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <NumberField label="Desktop px" value={feature.fontSize.desktop} min={8} max={160} onChange={(v) => onChange({ fontSize: { ...feature.fontSize, desktop: v } })} />
        <NumberField label="Tablet px" value={feature.fontSize.tablet} min={8} max={160} onChange={(v) => onChange({ fontSize: { ...feature.fontSize, tablet: v } })} />
        <NumberField label="Mobile px" value={feature.fontSize.mobile} min={8} max={160} onChange={(v) => onChange({ fontSize: { ...feature.fontSize, mobile: v } })} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <FontFamilySelect value={feature.fontFamily} onChange={(v) => onChange({ fontFamily: v })} />
        <div>
          <label className="mb-1 block text-[11px] font-medium text-muted">Weight</label>
          <select
            value={feature.fontWeight}
            onChange={(e) => onChange({ fontWeight: Number(e.target.value) as HeroFontWeight })}
            className="h-9 w-full rounded-lg border border-border bg-surface px-2 text-sm"
          >
            {HERO_FONT_WEIGHTS.map((w) => (
              <option key={w} value={w}>
                {HERO_FONT_WEIGHT_LABELS[w]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-medium text-muted">Color</label>
        <input
          type="color"
          value={feature.color}
          onChange={(e) => onChange({ color: e.target.value })}
          className="h-9 w-full cursor-pointer rounded-lg border border-border bg-surface px-1"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <NumberField label="Line height" value={feature.lineHeight} min={0.5} max={3} step={0.05} onChange={(v) => onChange({ lineHeight: v })} />
        <NumberField label="Letter spacing" value={feature.letterSpacing} min={-10} max={20} step={0.1} onChange={(v) => onChange({ letterSpacing: v })} />
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-medium text-muted">Alignment</label>
        <select
          value={feature.textAlign}
          onChange={(e) => onChange({ textAlign: e.target.value as HeroTextAlign })}
          className="h-9 w-full rounded-lg border border-border bg-surface px-2 text-sm"
        >
          {HERO_TEXT_ALIGNS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>
    </fieldset>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-muted">{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
        }}
        className="h-9 w-full rounded-lg border border-border bg-surface px-2 text-sm"
      />
    </div>
  );
}

function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-muted">{label}</label>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
    </div>
  );
}
