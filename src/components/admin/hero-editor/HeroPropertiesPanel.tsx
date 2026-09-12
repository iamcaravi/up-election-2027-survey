"use client";

import { useRef, useState } from "react";
import { ArrowUp, ArrowDown, ChevronsUp, ChevronsDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  HERO_ELEMENT_LABELS,
  HERO_TEXT_ALIGNS,
  HERO_TEXT_OVERRIDABLE_KEYS,
  type HeroElementBox,
  type HeroElementKey,
  type HeroElementsBackground,
  type HeroTextAlign,
} from "@/lib/survey-hero-elements-config";
import type { LayerSelection } from "./HeroLayersPanel";

// Elements that are pure containers/graphics rather than text — the
// typography controls (font size/weight/line height/letter spacing/align)
// are hidden for these since they have nothing to apply to.
const NON_TEXT_KEYS: HeroElementKey[] = ["opinionCard", "opinionCardIcon", "opinionCardBars"];

export function HeroPropertiesPanel({
  selection,
  box,
  background,
  onChangeBox,
  onChangeBackground,
  onResetElement,
  onLayerAction,
}: {
  selection: LayerSelection;
  box: HeroElementBox | null;
  background: HeroElementsBackground;
  onChangeBox: (patch: Partial<HeroElementBox>) => void;
  onChangeBackground: (patch: Partial<HeroElementsBackground>) => void;
  onResetElement: () => void;
  onLayerAction: (action: "front" | "forward" | "backward" | "back") => void;
}) {
  if (selection === "background") {
    return <BackgroundProperties background={background} onChange={onChangeBackground} />;
  }

  if (!selection || !box) {
    return (
      <div className="card-surface rounded-2xl p-5 text-center text-sm text-muted">
        Select an element on the canvas or from the Hero Elements list to edit its position and style.
      </div>
    );
  }

  const isTextElement = !NON_TEXT_KEYS.includes(selection);
  const canOverrideText = HERO_TEXT_OVERRIDABLE_KEYS.includes(selection);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-ink">{HERO_ELEMENT_LABELS[selection]}</p>
        <label className="flex items-center gap-1.5 text-xs font-medium text-muted">
          <input type="checkbox" checked={box.visible} onChange={(e) => onChangeBox({ visible: e.target.checked })} />
          Visible
        </label>
      </div>

      <Section title="Position &amp; Size">
        <div className="grid grid-cols-2 gap-2">
          <NumberField label="X (%)" value={box.x} min={0} max={100} step={0.5} onChange={(v) => onChangeBox({ x: v })} />
          <NumberField label="Y (%)" value={box.y} min={0} max={100} step={0.5} onChange={(v) => onChangeBox({ y: v })} />
          <NumberField label="Width (px)" value={box.width} min={4} max={2000} onChange={(v) => onChangeBox({ width: v })} />
          <NumberField
            label="Height (px, 0 = auto)"
            value={box.height}
            min={0}
            max={2000}
            onChange={(v) => onChangeBox({ height: v })}
          />
        </div>
      </Section>

      <Section title="Layer Order">
        <div className="flex flex-wrap gap-1.5">
          <IconButton label="Bring to Front" onClick={() => onLayerAction("front")}><ChevronsUp size={14} /></IconButton>
          <IconButton label="Bring Forward" onClick={() => onLayerAction("forward")}><ArrowUp size={14} /></IconButton>
          <IconButton label="Send Backward" onClick={() => onLayerAction("backward")}><ArrowDown size={14} /></IconButton>
          <IconButton label="Send to Back" onClick={() => onLayerAction("back")}><ChevronsDown size={14} /></IconButton>
        </div>
      </Section>

      {selection === "opinionCard" && (
        <Section title="Fill">
          <ColorField label="Background Color" value={box.backgroundColor === "transparent" ? "#0b2457" : box.backgroundColor} onChange={(v) => onChangeBox({ backgroundColor: v })} />
          <SliderField label="Opacity" value={box.opacity} onChange={(v) => onChangeBox({ opacity: v })} />
        </Section>
      )}

      {NON_TEXT_KEYS.includes(selection) && selection !== "opinionCard" && (
        <Section title="Appearance">
          <SliderField label="Opacity" value={box.opacity} onChange={(v) => onChangeBox({ opacity: v })} />
        </Section>
      )}

      {isTextElement && (
        <Section title="Text Style">
          {canOverrideText && (
            <TextField
              label="Text override (leave blank to use default copy)"
              value={box.text}
              onChange={(v) => onChangeBox({ text: v })}
            />
          )}
          <div className="grid grid-cols-2 gap-2">
            <NumberField label="Font Size (px)" value={box.fontSize} min={6} max={160} onChange={(v) => onChangeBox({ fontSize: v })} />
            <SelectField
              label="Font Weight"
              value={box.fontWeight}
              options={[400, 500, 600, 700, 800, 900]}
              onChange={(v) => onChangeBox({ fontWeight: v })}
            />
            <NumberField
              label="Line Height"
              value={box.lineHeight}
              min={0.5}
              max={3}
              step={0.05}
              onChange={(v) => onChangeBox({ lineHeight: v })}
            />
            <NumberField
              label="Letter Spacing (px)"
              value={box.letterSpacing}
              min={-10}
              max={20}
              step={0.5}
              onChange={(v) => onChangeBox({ letterSpacing: v })}
            />
          </div>
          <AlignField value={box.textAlign} onChange={(v) => onChangeBox({ textAlign: v })} />
          <ColorField label="Text Color" value={box.color} onChange={(v) => onChangeBox({ color: v })} />
          <SliderField label="Opacity" value={box.opacity} onChange={(v) => onChangeBox({ opacity: v })} />
        </Section>
      )}

      <button
        type="button"
        onClick={onResetElement}
        className="w-full rounded-full border border-border px-4 py-2 text-sm font-bold text-ink transition-colors hover:bg-surface-2"
      >
        Reset Element
      </button>
    </div>
  );
}

function BackgroundProperties({
  background,
  onChange,
}: {
  background: HeroElementsBackground;
  onChange: (patch: Partial<HeroElementsBackground>) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/hero/background-image", { method: "POST", body: form });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? "Upload failed.");
      onChange({ imageUrl: body.url });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-bold text-ink">Background Image</p>

      <Section title="Image">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="rounded-full border border-border px-4 py-2 text-xs font-bold text-ink transition-colors hover:bg-surface-2 disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Upload Image"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
        </div>
        {uploadError && <p className="text-xs text-danger">{uploadError}</p>}
        <TextField label="Image URL" value={background.imageUrl} onChange={(v) => onChange({ imageUrl: v })} />
      </Section>

      <Section title="Position &amp; Zoom">
        <SliderField label="Position X" value={background.x} onChange={(v) => onChange({ x: v })} />
        <SliderField label="Position Y" value={background.y} onChange={(v) => onChange({ y: v })} />
        <NumberField label="Scale" value={background.scale} min={0.5} max={3} step={0.05} onChange={(v) => onChange({ scale: v })} />
      </Section>

      <Section title="Overlay">
        <SliderField label="Dark Overlay Opacity" value={background.overlayOpacity} onChange={(v) => onChange({ overlayOpacity: v })} />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-surface space-y-2.5 rounded-2xl p-3.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
      {children}
    </div>
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
  onChange: (value: number) => void;
  min?: number;
  max?: number;
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
          const v = Number(e.target.value);
          if (Number.isFinite(v)) onChange(v);
        }}
        className="h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/30"
      />
    </div>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-muted">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/30"
      />
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-muted">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-10 rounded-lg border border-border" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 flex-1 rounded-lg border border-border bg-surface px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/30"
        />
      </div>
    </div>
  );
}

function SliderField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div>
      <label className="mb-1 flex items-center justify-between text-[11px] font-medium text-muted">
        <span>{label}</span>
        <span className="font-mono text-ink">{value.toFixed(0)}%</span>
      </label>
      <input type="range" min={0} max={100} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-accent" />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: number;
  options: number[];
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-muted">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/30"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function AlignField({ value, onChange }: { value: HeroTextAlign; onChange: (value: HeroTextAlign) => void }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-muted">Text Alignment</label>
      <div className="flex gap-1.5">
        {HERO_TEXT_ALIGNS.map((align) => (
          <button
            key={align}
            type="button"
            onClick={() => onChange(align)}
            className={cn(
              "flex-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold capitalize transition-colors",
              value === align ? "border-ink bg-ink text-white" : "border-border text-muted hover:bg-surface-2"
            )}
          >
            {align}
          </button>
        ))}
      </div>
    </div>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-ink transition-colors hover:bg-surface-2"
    >
      {children}
    </button>
  );
}
