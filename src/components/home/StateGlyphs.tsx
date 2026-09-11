// Simplified but shape-distinct state silhouettes for the "upcoming states"
// cards. Each path is a stylised approximation of that state's real outline
// (not the UP-grade Census-derived silhouette used for the active state) —
// good enough to be visually distinguishable from one another at small icon
// size, while clearly not a single reused generic blob.
import type { SVGProps } from "react";

type GlyphProps = Omit<SVGProps<SVGSVGElement>, "viewBox" | "children">;

export function PunjabGlyph(props: GlyphProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" {...props}>
      <path fill="currentColor" d="M18 12 L58 6 L74 20 L70 34 L86 40 L78 58 L84 70 L62 78 L52 94 L34 86 L30 68 L14 62 L20 44 L8 30 Z" />
    </svg>
  );
}

export function UttarakhandGlyph(props: GlyphProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" {...props}>
      <path fill="currentColor" d="M4 30 L20 14 L38 22 L52 10 L68 16 L64 28 L84 24 L96 38 L88 48 L94 58 L78 60 L74 74 L58 70 L48 82 L38 68 L20 66 L22 52 L6 46 Z" />
    </svg>
  );
}

export function GoaGlyph(props: GlyphProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" {...props}>
      <path fill="currentColor" d="M42 4 L58 8 L54 22 L64 34 L56 46 L66 58 L58 70 L62 82 L48 96 L38 84 L44 72 L34 60 L42 48 L32 36 L40 24 Z" />
    </svg>
  );
}

export function ManipurGlyph(props: GlyphProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" {...props}>
      <path fill="currentColor" d="M50 4 L70 12 L86 28 L92 50 L84 72 L66 88 L44 92 L24 80 L10 60 L12 36 L28 16 Z" />
    </svg>
  );
}

export function HimachalGlyph(props: GlyphProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" {...props}>
      <path fill="currentColor" d="M6 20 L26 8 L40 18 L58 6 L74 16 L68 28 L88 26 L96 42 L80 46 L86 62 L70 60 L72 76 L54 72 L48 88 L32 78 L34 62 L18 58 L22 40 L4 36 Z" />
    </svg>
  );
}

export function GujaratGlyph(props: GlyphProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M22 6 L40 4 L44 16 L58 10 L70 20 L64 30 L80 32 L86 44 L74 50 L82 58 L70 66 L72 80 L56 78 L52 92 L40 84 L42 70 L28 74 L24 60 L10 62 L14 48 L4 40 L16 30 L10 18 Z"
      />
    </svg>
  );
}
