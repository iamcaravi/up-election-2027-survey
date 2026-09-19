import type { SVGProps } from "react";
import stateBoundariesData from "@/data/state-boundaries.json";
import { cn } from "@/lib/utils";

export interface StateMapProps extends Omit<SVGProps<SVGSVGElement>, "viewBox"> {
  slug: string;
  className?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number | string;
}

export interface StateBoundaryInfo {
  name: string;
  slug: string;
  viewBox: string;
  svgPath: string;
  aspectRatio: number;
}

const STATE_BOUNDARIES = stateBoundariesData as Record<string, StateBoundaryInfo>;

/**
 * Renders a genuine geographic boundary map for supported Indian states.
 * Boundary data is sourced from Survey of India / Census boundary shapefiles
 * (DataMeet open geospatial dataset).
 *
 * If a state does not have genuine boundary data, it returns null so the
 * surrounding layout reflows naturally without fake or approximate placeholders.
 */
export function StateMap({
  slug,
  className,
  fill = "currentColor",
  stroke = "none",
  strokeWidth = 1,
  ...rest
}: StateMapProps) {
  const boundary = STATE_BOUNDARIES[slug];
  if (!boundary) return null;

  return (
    <svg
      viewBox={boundary.viewBox}
      aria-label={`${boundary.name} geographic boundary`}
      role="img"
      className={cn("overflow-visible", className)}
      {...rest}
    >
      <path
        d={boundary.svgPath}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function hasGenuineStateMap(slug: string): boolean {
  return Boolean(STATE_BOUNDARIES[slug]);
}

export function getStateBoundaryInfo(slug: string): StateBoundaryInfo | null {
  return STATE_BOUNDARIES[slug] ?? null;
}
