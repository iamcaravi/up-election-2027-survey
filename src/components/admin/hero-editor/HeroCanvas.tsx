"use client";

import { SurveyHero } from "@/components/survey/SurveyHero";
import type { HeroElementBox, HeroElementKey, HeroElementsConfig } from "@/lib/survey-hero-elements-config";

// Realistic sample content — the actual public SurveyHero component is
// rendered here (not a separate mock renderer), so tuning the editor shows
// exactly what constituency pages will look like.
const PREVIEW_SAMPLE = {
  stateName: "उत्तर प्रदेश",
  stateHref: "#",
  districtName: "कानपुर नगर",
  districtHref: "#",
  constituencyName: "कानपुर दक्षिण",
  constituencyNumber: 208,
  electionYear: 2027,
};

// Reference width the canvas is designed at — purely a display convention
// for the editor viewport; x/y/width are stored resolution-independently
// (percent for position) so the production page (any real container width)
// renders identically in proportion.
export const HERO_CANVAS_REFERENCE_WIDTH = 1180;

export function HeroCanvas({
  config,
  selectedKey,
  onSelect,
  onChangeBox,
  zoom,
}: {
  config: HeroElementsConfig;
  selectedKey: HeroElementKey | null;
  onSelect: (key: HeroElementKey | null) => void;
  onChangeBox: (key: HeroElementKey, patch: Partial<HeroElementBox>, commit: boolean) => void;
  zoom: number;
}) {
  return (
    <div className="overflow-auto rounded-2xl border border-border bg-surface-2 p-4">
      <div style={{ width: HERO_CANVAS_REFERENCE_WIDTH * zoom }}>
        <div
          style={{
            width: HERO_CANVAS_REFERENCE_WIDTH,
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
          }}
          className="overflow-hidden rounded-xl border border-border shadow-[var(--shadow-soft)]"
        >
          <SurveyHero
            {...PREVIEW_SAMPLE}
            config={config}
            editable
            selectedKey={selectedKey}
            onSelect={onSelect}
            onChangeBox={onChangeBox}
            zoom={zoom}
          />
        </div>
      </div>
    </div>
  );
}
