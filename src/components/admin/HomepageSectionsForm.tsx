"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Hero } from "@/components/home/Hero";
import { StatisticsStrip } from "@/components/home/StatisticsStrip";
import { FeatureCards } from "@/components/home/FeatureCards";
import { HomeIssuesHeading } from "@/components/home/HomeIssuesHeading";
import { IssuesSection } from "@/components/home/IssuesSection";
import { LowerCardsSection } from "@/components/home/LowerCardsSection";
import { StatesSection } from "@/components/home/StatesSection";
import { Container } from "@/components/ui/Container";
import { DEFAULT_HERO_CONFIG, type HeroConfig } from "@/lib/hero-config";
import {
  DEFAULT_HOMEPAGE_SECTIONS_CONFIG,
  HOMEPAGE_DEVICES,
  HOMEPAGE_DEVICE_LABELS,
  HOMEPAGE_DEVICE_PREVIEW_WIDTH,
  HOMEPAGE_SECTION_KEYS,
  HOMEPAGE_SECTION_LABELS,
  type HomepageDevice,
  type HomepageSectionKey,
  type HomepageSectionsConfig,
} from "@/lib/homepage-sections-config";

// Sections whose `visible` toggle is intentionally inert here — see
// homepage-sections-config.ts's top comment (Header/Footer render site-wide
// from the root layout, not just the homepage, so hiding them per-device
// would hide site navigation/footer on every page).
const VISIBILITY_LOCKED: ReadonlySet<HomepageSectionKey> = new Set(["header", "footer"]);

type Feedback = { kind: "success" | "error"; message: string } | null;

interface PreviewStateItem {
  id: string;
  slug: string;
  name: string;
  elections: Array<{ id: string; slug: string; name: string; status: string; year: number }>;
  _count: { districts: number; constituencies: number };
}

interface HomepageSectionsFormProps {
  initialConfig: HomepageSectionsConfig;
  heroConfig: HeroConfig;
  previewStates: PreviewStateItem[];
  previewStats: { responses: number; constituencies: number; parties: number };
  surveyHref: string;
  resultsHref: string;
}

export function HomepageSectionsForm({
  initialConfig,
  heroConfig,
  previewStates,
  previewStats,
  surveyHref,
  resultsHref,
}: HomepageSectionsFormProps) {
  const router = useRouter();
  const [sections, setSections] = useState<HomepageSectionsConfig>(initialConfig);
  const [device, setDevice] = useState<HomepageDevice>("desktop");
  const [fullscreen, setFullscreen] = useState(false);
  const [expanded, setExpanded] = useState<HomepageSectionKey | null>("hero");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    if (!fullscreen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setFullscreen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [fullscreen]);

  function updateVisible(key: HomepageSectionKey, dev: HomepageDevice, value: boolean) {
    setSections((prev) => ({ ...prev, [key]: { ...prev[key], visible: { ...prev[key].visible, [dev]: value } } }));
  }

  function updatePadding(key: HomepageSectionKey, dev: HomepageDevice, value: number) {
    setSections((prev) => ({ ...prev, [key]: { ...prev[key], paddingY: { ...prev[key].paddingY, [dev]: value } } }));
  }

  function updateHeroImage(patch: Partial<{ mobileImageUrl: string; tabletImageUrl: string | null }>) {
    setSections((prev) => ({ ...prev, hero: { ...prev.hero, ...patch } }));
  }

  function updateAboutImage(patch: Partial<{ mobileImageUrl: string; tabletImageUrl: string | null }>) {
    setSections((prev) => ({ ...prev, about: { ...prev.about, ...patch } }));
  }

  function resetSection(key: HomepageSectionKey) {
    if (!window.confirm(`Reset "${HOMEPAGE_SECTION_LABELS[key]}" to its default settings? This discards unsaved changes to this section only.`)) {
      return;
    }
    setSections((prev) => ({ ...prev, [key]: DEFAULT_HOMEPAGE_SECTIONS_CONFIG[key] }));
  }

  function resetAll() {
    if (!window.confirm("Reset ALL homepage sections to their defaults? This discards every unsaved change on this page.")) {
      return;
    }
    setSections(DEFAULT_HOMEPAGE_SECTIONS_CONFIG);
    setFeedback(null);
  }

  async function save() {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/homepage-sections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sections),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? `Save failed (${res.status})`);
      setFeedback({ kind: "success", message: "Homepage sections saved. The public homepage now reflects these settings." });
      router.refresh();
    } catch (err) {
      setFeedback({ kind: "error", message: err instanceof Error ? err.message : "Save failed." });
    } finally {
      setSaving(false);
    }
  }

  const preview = (
    <HomepagePreview
      sections={sections}
      device={device}
      heroConfig={heroConfig}
      previewStates={previewStates}
      previewStats={previewStats}
      surveyHref={surveyHref}
      resultsHref={resultsHref}
      compact={!fullscreen}
    />
  );

  return (
    <div className="space-y-6">
      {/* Device switcher + Fullscreen toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
          {HOMEPAGE_DEVICES.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDevice(d)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                device === d ? "bg-ink text-white" : "text-foreground/70 hover:bg-surface-2"
              }`}
            >
              {HOMEPAGE_DEVICE_LABELS[d]}
            </button>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setFullscreen(true)}>
          <Maximize2 size={14} className="mr-1.5 inline" /> Fullscreen Preview
        </Button>
      </div>

      {/* Compact sticky preview */}
      <div className="lg:sticky lg:top-[76px] lg:z-10">
        <div className="card-surface rounded-2xl border border-border p-3">
          <p className="mb-2 text-xs text-muted">
            Live preview — {HOMEPAGE_DEVICE_LABELS[device]} ({HOMEPAGE_DEVICE_PREVIEW_WIDTH[device]}px). Scroll inside the
            frame to see the rest of the page. Unsaved — click Save Changes below to publish.
          </p>
          {preview}
        </div>
      </div>

      {/* Section list */}
      <div className="space-y-3">
        {HOMEPAGE_SECTION_KEYS.map((key) => (
          <SectionRow
            key={key}
            sectionKey={key}
            config={sections[key]}
            device={device}
            expanded={expanded === key}
            onToggleExpanded={() => setExpanded((prev) => (prev === key ? null : key))}
            onVisibleChange={(dev, value) => updateVisible(key, dev, value)}
            onPaddingChange={(dev, value) => updatePadding(key, dev, value)}
            onReset={() => resetSection(key)}
            visibilityLocked={VISIBILITY_LOCKED.has(key)}
            heroExtra={
              key === "hero" ? (
                <ImageOverrideFields
                  mobileImageUrl={sections.hero.mobileImageUrl}
                  tabletImageUrl={sections.hero.tabletImageUrl}
                  onChange={updateHeroImage}
                />
              ) : key === "about" ? (
                <ImageOverrideFields
                  mobileImageUrl={sections.about.mobileImageUrl}
                  tabletImageUrl={sections.about.tabletImageUrl}
                  onChange={updateAboutImage}
                />
              ) : null
            }
          />
        ))}
      </div>

      <div className="card-surface flex items-center gap-3 rounded-2xl border border-border p-4">
        <Button variant="primary" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </Button>
        <Button variant="outline" onClick={resetAll} disabled={saving} type="button">
          Reset All to Defaults
        </Button>
        {feedback && (
          <p className={`text-sm font-medium ${feedback.kind === "success" ? "text-green-600 dark:text-green-400" : "text-danger"}`}>
            {feedback.message}
          </p>
        )}
      </div>

      {fullscreen && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-background p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
              {HOMEPAGE_DEVICES.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDevice(d)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                    device === d ? "bg-ink text-white" : "text-foreground/70 hover:bg-surface-2"
                  }`}
                >
                  {HOMEPAGE_DEVICE_LABELS[d]}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted">Fullscreen editor preview — does not affect the live website. Press Esc to exit.</p>
            <Button type="button" variant="outline" size="sm" onClick={() => setFullscreen(false)}>
              <X size={14} className="mr-1.5 inline" /> Exit Fullscreen
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            <HomepagePreview
              sections={sections}
              device={device}
              heroConfig={heroConfig}
              previewStates={previewStates}
              previewStats={previewStats}
              surveyHref={surveyHref}
              resultsHref={resultsHref}
              compact={false}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function HomepagePreview({
  sections,
  device,
  heroConfig,
  previewStates,
  previewStats,
  surveyHref,
  resultsHref,
  compact,
}: {
  sections: HomepageSectionsConfig;
  device: HomepageDevice;
  heroConfig: HeroConfig;
  previewStates: PreviewStateItem[];
  previewStats: { responses: number; constituencies: number; parties: number };
  surveyHref: string;
  resultsHref: string;
  compact: boolean;
}) {
  const deviceWidth = HOMEPAGE_DEVICE_PREVIEW_WIDTH[device];
  // Compact mode fits the preview into a fixed, modest box (matches "Preview
  // is too large" feedback); fullscreen mode scales up to fill most of the
  // viewport instead, while both keep the device's own aspect/width intact
  // via the same scale-a-fixed-width-frame technique (see the wrapper below).
  const boxHeight = compact ? 340 : undefined;
  const availableWidth = compact ? 900 : 1600; // generous ceiling; actual element is responsive via CSS below
  const scale = Math.min(1, availableWidth / deviceWidth);

  function visibleFor(key: HomepageSectionKey) {
    return sections[key].visible[device];
  }
  function paddingFor(key: HomepageSectionKey) {
    return sections[key].paddingY[device];
  }
  function sectionStyle(key: HomepageSectionKey): CSSProperties {
    const p = paddingFor(key);
    return { display: visibleFor(key) ? undefined : "none", paddingTop: p || undefined, paddingBottom: p || undefined };
  }

  return (
    <div
      className="relative mx-auto overflow-hidden rounded-xl border border-border bg-background"
      style={{ width: "100%", maxWidth: deviceWidth * scale, height: compact ? boxHeight : "100%" }}
    >
      <div className={compact ? "h-full overflow-y-auto" : "h-full overflow-y-auto"}>
        <div style={{ width: deviceWidth, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          <div style={sectionStyle("hero")}>
            <Hero
              surveyStates={previewStates}
              config={heroConfig ?? DEFAULT_HERO_CONFIG}
              editable
              activeTier={device}
              mobileImageUrl={sections.hero.mobileImageUrl}
              tabletImageUrl={sections.hero.tabletImageUrl}
            />
          </div>
          <div style={sectionStyle("stats")}>
            <StatisticsStrip stats={previewStats} />
          </div>
          <div style={sectionStyle("featureCards")}>
            <FeatureCards surveyHref={surveyHref} resultsHref={resultsHref} analyticsHref={resultsHref} />
          </div>
          <div style={sectionStyle("issues")}>
            <Container className="py-6">
              <HomeIssuesHeading />
              <IssuesSection />
            </Container>
          </div>
          <div style={sectionStyle("about")}>
            <Container className="py-6">
              <LowerCardsSection
                mobileImageUrl={sections.about.mobileImageUrl}
                tabletImageUrl={sections.about.tabletImageUrl}
                previewDevice={device}
              />
            </Container>
          </div>
          <div style={sectionStyle("states")}>
            <Container className="py-6">
              <StatesSection states={previewStates} />
            </Container>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionRow({
  sectionKey,
  config,
  device,
  expanded,
  onToggleExpanded,
  onVisibleChange,
  onPaddingChange,
  onReset,
  visibilityLocked,
  heroExtra,
}: {
  sectionKey: HomepageSectionKey;
  config: HomepageSectionsConfig[HomepageSectionKey];
  device: HomepageDevice;
  expanded: boolean;
  onToggleExpanded: () => void;
  onVisibleChange: (dev: HomepageDevice, value: boolean) => void;
  onPaddingChange: (dev: HomepageDevice, value: number) => void;
  onReset: () => void;
  visibilityLocked: boolean;
  heroExtra: ReactNode;
}) {
  return (
    <fieldset className="card-surface overflow-hidden rounded-2xl border border-border">
      <button
        type="button"
        onClick={onToggleExpanded}
        className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left"
      >
        <span className="flex items-center gap-2">
          <ChevronDown size={16} className={`text-muted transition-transform ${expanded ? "rotate-180" : ""}`} />
          <legend className="font-display text-base font-bold">{HOMEPAGE_SECTION_LABELS[sectionKey]}</legend>
        </span>
        <span className="flex items-center gap-3 text-xs text-muted">
          {HOMEPAGE_DEVICES.map((dev) => (
            <label key={dev} className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={config.visible[dev]}
                disabled={visibilityLocked}
                onChange={(e) => onVisibleChange(dev, e.target.checked)}
                className="h-3.5 w-3.5 rounded border-border accent-[var(--ink)] disabled:opacity-40"
              />
              {HOMEPAGE_DEVICE_LABELS[dev][0]}
            </label>
          ))}
        </span>
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-border px-5 py-4">
          {visibilityLocked && (
            <p className="text-xs text-muted">
              This section renders on every page of the site (not just the homepage), so hiding it per-device isn&apos;t
              supported here — that would also hide it site-wide. Spacing below still applies.
            </p>
          )}

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Visible per device</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {HOMEPAGE_DEVICES.map((dev) => (
                <label
                  key={dev}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
                    dev === device ? "border-accent" : "border-border"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={config.visible[dev]}
                    disabled={visibilityLocked}
                    onChange={(e) => onVisibleChange(dev, e.target.checked)}
                    className="h-4 w-4 rounded border-border accent-[var(--ink)] disabled:opacity-40"
                  />
                  {HOMEPAGE_DEVICE_LABELS[dev]}
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
              Extra vertical spacing (px, added on top of today&apos;s existing spacing — 0 = unchanged)
            </p>
            <div className="grid grid-cols-3 gap-3">
              {HOMEPAGE_DEVICES.map((dev) => (
                <div key={dev}>
                  <label className="mb-1 block text-[11px] font-medium text-muted">{HOMEPAGE_DEVICE_LABELS[dev]}</label>
                  <input
                    type="number"
                    min={0}
                    max={200}
                    value={config.paddingY[dev]}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      if (Number.isFinite(n)) onPaddingChange(dev, Math.min(200, Math.max(0, n)));
                    }}
                    className="h-9 w-full rounded-lg border border-border bg-surface px-2 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {heroExtra}

          <button type="button" onClick={onReset} className="text-xs font-semibold text-accent hover:underline">
            Reset this section to defaults
          </button>
        </div>
      )}
    </fieldset>
  );
}

function ImageOverrideFields({
  mobileImageUrl,
  tabletImageUrl,
  onChange,
}: {
  mobileImageUrl: string;
  tabletImageUrl: string | null;
  onChange: (patch: Partial<{ mobileImageUrl: string; tabletImageUrl: string | null }>) => void;
}) {
  const [tabletOverrideEnabled, setTabletOverrideEnabled] = useState(tabletImageUrl !== null);

  return (
    <div className="space-y-3 rounded-xl border border-border p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Per-device image</p>
      <div>
        <label className="mb-1 block text-[11px] font-medium text-muted">Mobile image path (public/…)</label>
        <input
          type="text"
          value={mobileImageUrl}
          onChange={(e) => onChange({ mobileImageUrl: e.target.value })}
          className="h-9 w-full rounded-lg border border-border bg-surface px-2 text-sm"
        />
      </div>
      <label className="flex items-center gap-2 text-xs font-medium">
        <input
          type="checkbox"
          checked={tabletOverrideEnabled}
          onChange={(e) => {
            setTabletOverrideEnabled(e.target.checked);
            onChange({ tabletImageUrl: e.target.checked ? mobileImageUrl : null });
          }}
          className="h-4 w-4 rounded border-border accent-[var(--ink)]"
        />
        Use a dedicated tablet image (unchecked = tablet shows the same desktop composition it does today)
      </label>
      {tabletOverrideEnabled && (
        <div>
          <label className="mb-1 block text-[11px] font-medium text-muted">Tablet image path (public/…)</label>
          <input
            type="text"
            value={tabletImageUrl ?? ""}
            onChange={(e) => onChange({ tabletImageUrl: e.target.value })}
            className="h-9 w-full rounded-lg border border-border bg-surface px-2 text-sm"
          />
        </div>
      )}
    </div>
  );
}
