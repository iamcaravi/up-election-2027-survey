// Uttar Pradesh silhouette, derived from real district-boundary data (2011
// Census district shapefiles, union of all UP districts, simplified) — not a
// hand-drawn blob. Clean navy silhouette, no political branding, no labels.
export function UPMapGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 86.51" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M0 10.76 L6.14 28.6 L3.04 37.02 L8.95 44.97 L4.58 48.14 L15.07 45.78 L27.12 52.52 L22.83 63.34 L16.16 66.54 L18.06 69.91 L14.36 73.29 L17.24 81.32 L24.96 80.2 L17.86 67.79 L24.55 64.2 L22.53 67.64 L27.08 70.11 L29.31 67.09 L30.71 70.15 L36.75 70.28 L42.09 65.94 L44.26 69.27 L42.08 71.23 L50.31 69.08 L49.35 72.59 L53.69 73.05 L59.48 69.04 L69.07 76.77 L75.34 76.31 L73.89 83.12 L79.55 86.51 L85.6 76.56 L82.98 69.1 L92.77 62.11 L100 61.92 L91.71 55.94 L94.06 54.16 L91.1 49.98 L97.15 50.02 L90.67 40.9 L74.61 38.89 L74.48 35.48 L63.56 33.71 L46.41 22.8 L30.98 20.32 L16.54 8.01 L11.65 10.87 L8.33 6.84 L11.56 2.1 L7.51 0 L0 10.76 Z"
      />
    </svg>
  );
}
