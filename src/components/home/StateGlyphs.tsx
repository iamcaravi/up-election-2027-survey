// Genuine state boundary silhouettes derived from Survey of India / Census
// boundary GeoJSON (DataMeet open geospatial dataset).
// Replaces previous manual/stylised approximations with authoritative boundary geometry.
import type { SVGProps } from "react";
import stateBoundariesData from "@/data/state-boundaries.json";

type GlyphProps = Omit<SVGProps<SVGSVGElement>, "viewBox" | "children">;

const data = stateBoundariesData as Record<string, { viewBox: string; svgPath: string; name: string }>;

function createGenuineGlyph(slug: string) {
  const item = data[slug];
  if (!item) throw new Error(`Missing boundary data for ${slug}`);
  return function GenuineStateGlyph(props: GlyphProps): React.ReactElement {
    return (
      <svg viewBox={item.viewBox} aria-hidden="true" role="img" {...props}>
        <path fill="currentColor" d={item.svgPath} />
      </svg>
    );
  };
}

export const PunjabGlyph = createGenuineGlyph("punjab");
export const UttarakhandGlyph = createGenuineGlyph("uttarakhand");
export const GoaGlyph = createGenuineGlyph("goa");
export const ManipurGlyph = createGenuineGlyph("manipur");
export const HimachalGlyph = createGenuineGlyph("himachal-pradesh");
export const GujaratGlyph = createGenuineGlyph("gujarat");
export const UPGlyph = createGenuineGlyph("uttar-pradesh");
