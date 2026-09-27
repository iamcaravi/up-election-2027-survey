"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import indiaMapData from "@/data/india-map.json";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export interface ActiveStateConfig {
  slug: string;
  nameHi: string;
  nameEn: string;
  constituencies: number;
  color: string;
  hoverColor: string;
}

const ACTIVE_STATES: Record<string, ActiveStateConfig> = {
  up: {
    slug: "uttar-pradesh",
    nameHi: "उत्तर प्रदेश",
    nameEn: "Uttar Pradesh",
    constituencies: 403,
    color: "#3b82f6", // Vibrant Blue
    hoverColor: "#1d4ed8",
  },
  pb: {
    slug: "punjab",
    nameHi: "पंजाब",
    nameEn: "Punjab",
    constituencies: 117,
    color: "#f43f5e", // Vibrant Rose
    hoverColor: "#be123c",
  },
  ut: {
    slug: "uttarakhand",
    nameHi: "उत्तराखंड",
    nameEn: "Uttarakhand",
    constituencies: 70,
    color: "#10b981", // Vibrant Emerald
    hoverColor: "#047857",
  },
  ga: {
    slug: "goa",
    nameHi: "गोवा",
    nameEn: "Goa",
    constituencies: 40,
    color: "#f59e0b", // Vibrant Amber
    hoverColor: "#b45309",
  },
  mn: {
    slug: "manipur",
    nameHi: "मणिपुर",
    nameEn: "Manipur",
    constituencies: 60,
    color: "#8b5cf6", // Vibrant Purple
    hoverColor: "#6d28d9",
  },
  hp: {
    slug: "himachal-pradesh",
    nameHi: "हिमाचल प्रदेश",
    nameEn: "Himachal Pradesh",
    constituencies: 68,
    color: "#06b6d4", // Vibrant Cyan
    hoverColor: "#0e7490",
  },
  gj: {
    slug: "gujarat",
    nameHi: "गुजरात",
    nameEn: "Gujarat",
    constituencies: 182,
    color: "#f97316", // Vibrant Orange
    hoverColor: "#c2410c",
  },
};

interface TooltipState {
  name: string;
  subtitle: string;
  isActive: boolean;
  x: number;
  y: number;
}

export function IndiaFullMap({ className = "", maxHeight = "max-h-[190px] sm:max-h-[220px]" }: { className?: string; maxHeight?: string }) {
  const router = useRouter();
  const { locale } = useLocale();
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const handleMouseMove = (e: React.MouseEvent<SVGPathElement>, loc: { id: string; name: string }) => {
    const active = ACTIVE_STATES[loc.id];
    const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (!rect) return;

    setTooltip({
      name: active ? (locale === "hi" ? active.nameHi : active.nameEn) : loc.name,
      subtitle: active
        ? locale === "hi"
          ? `${active.constituencies} विधानसभा क्षेत्र · सर्वेक्षण सक्रिय`
          : `${active.constituencies} Constituencies · Active Survey`
        : locale === "hi"
        ? "आगामी सर्वेक्षण"
        : "Upcoming Survey",
      isActive: Boolean(active),
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseLeave = () => {
    setHoveredLocation(null);
    setTooltip(null);
  };

  const handleClick = (id: string) => {
    const active = ACTIVE_STATES[id];
    if (active) {
      router.push(`/${active.slug}`);
    }
  };

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      {/* Interactive Complete Map of India SVG */}
      <svg
        viewBox={indiaMapData.viewBox}
        aria-label="Complete Map of India with Survey States"
        role="img"
        className={`w-full h-auto ${maxHeight} select-none transition-all`}
      >
        <g strokeLinejoin="round" strokeLinecap="round">
          {indiaMapData.locations.map((loc) => {
            const active = ACTIVE_STATES[loc.id];
            const isHovered = hoveredLocation === loc.id;

            // Inactive states: very light soft cool-gray with subtle borders
            let fill = "#edf2f7"; // soft cool gray
            let stroke = "#d6e0ea"; // subtle border
            let strokeWidth = 0.75;
            let cursor = "default";

            if (isHovered && !active) {
              fill = "#e2e8f0";
            }

            // Active 7 states: vibrant theme color, white border, pointer cursor
            if (active) {
              fill = isHovered ? active.hoverColor : active.color;
              stroke = "#ffffff";
              strokeWidth = isHovered ? 2 : 1.2;
              cursor = "pointer";
            }

            return (
              <path
                key={loc.id}
                id={loc.id}
                name={loc.name}
                d={loc.path}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeWidth}
                style={{ cursor, transition: "fill 0.15s ease, stroke 0.15s ease, stroke-width 0.15s ease" }}
                onMouseEnter={() => setHoveredLocation(loc.id)}
                onMouseMove={(e) => handleMouseMove(e, loc)}
                onMouseLeave={handleMouseLeave}
                onClick={() => handleClick(loc.id)}
              />
            );
          })}
        </g>
      </svg>

      {/* Floating Hover Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-30 transform -translate-x-1/2 -translate-y-full -top-2 rounded-xl bg-[#101A3A] px-3 py-1.5 text-center shadow-lg border border-slate-700"
          style={{
            left: `${Math.min(Math.max(tooltip.x, 80), 320)}px`,
            top: `${Math.max(tooltip.y - 12, 10)}px`,
          }}
        >
          <p className="text-xs font-bold text-white leading-tight">{tooltip.name}</p>
          <p
            className={`text-[10px] font-semibold leading-tight mt-0.5 ${
              tooltip.isActive ? "text-emerald-400" : "text-slate-400"
            }`}
          >
            {tooltip.subtitle}
          </p>
        </div>
      )}
    </div>
  );
}
