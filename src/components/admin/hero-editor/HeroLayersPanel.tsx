"use client";

import { Eye, EyeOff, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  HERO_ELEMENT_KEYS,
  HERO_ELEMENT_LABELS,
  HERO_OPINION_CARD_CHILDREN,
  type HeroElementKey,
  type HeroElementsConfig,
} from "@/lib/survey-hero-elements-config";

export type LayerSelection = HeroElementKey | "background" | null;

const TOP_LEVEL_KEYS = HERO_ELEMENT_KEYS.filter((k) => !HERO_OPINION_CARD_CHILDREN.includes(k));

export function HeroLayersPanel({
  config,
  selected,
  onSelect,
  onToggleVisible,
}: {
  config: HeroElementsConfig;
  selected: LayerSelection;
  onSelect: (key: LayerSelection) => void;
  onToggleVisible: (key: HeroElementKey) => void;
}) {
  return (
    <div className="card-surface rounded-2xl p-3">
      <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted">Hero Elements</p>
      <div className="space-y-0.5">
        <LayerRow
          label="Background Image"
          icon={<ImageIcon size={14} />}
          active={selected === "background"}
          onClick={() => onSelect("background")}
        />
        {TOP_LEVEL_KEYS.map((key) => (
          <div key={key}>
            <LayerRow
              label={HERO_ELEMENT_LABELS[key]}
              visible={config.elements[key].visible}
              active={selected === key}
              onClick={() => onSelect(key)}
              onToggleVisible={() => onToggleVisible(key)}
            />
            {key === "opinionCard" &&
              HERO_OPINION_CARD_CHILDREN.map((childKey) => (
                <LayerRow
                  key={childKey}
                  label={HERO_ELEMENT_LABELS[childKey]}
                  visible={config.elements[childKey].visible}
                  active={selected === childKey}
                  onClick={() => onSelect(childKey)}
                  onToggleVisible={() => onToggleVisible(childKey)}
                  indent
                />
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function LayerRow({
  label,
  icon,
  visible,
  active,
  indent,
  onClick,
  onToggleVisible,
}: {
  label: string;
  icon?: React.ReactNode;
  visible?: boolean;
  active: boolean;
  indent?: boolean;
  onClick: () => void;
  onToggleVisible?: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
        indent && "ml-4 border-l border-border pl-3",
        active ? "bg-ink text-white" : "text-ink hover:bg-surface-2"
      )}
    >
      <button type="button" onClick={onClick} className="flex min-w-0 flex-1 items-center gap-2 text-left">
        {icon}
        <span className="truncate">{label}</span>
      </button>
      {onToggleVisible && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisible();
          }}
          className={cn("shrink-0 rounded p-1", active ? "hover:bg-white/20" : "hover:bg-surface")}
          aria-label={visible ? "Hide element" : "Show element"}
        >
          {visible ? <Eye size={14} /> : <EyeOff size={14} className="opacity-60" />}
        </button>
      )}
    </div>
  );
}
