// Uttar Pradesh genuine silhouette, derived from Survey of India / Census
// district boundary data (DataMeet open geospatial dataset).
import type { SVGProps } from "react";
import stateBoundariesData from "@/data/state-boundaries.json";

type GlyphProps = Omit<SVGProps<SVGSVGElement>, "viewBox" | "children">;

const data = stateBoundariesData as Record<string, { viewBox: string; svgPath: string; name: string }>;

export function UPMapGlyph(props: GlyphProps): React.ReactElement {
  const item = data["uttar-pradesh"];
  if (!item) throw new Error("Missing boundary data for uttar-pradesh");
  return (
    <svg viewBox={item.viewBox} aria-hidden="true" role="img" {...props}>
      <path fill="currentColor" d={item.svgPath} />
    </svg>
  );
}
