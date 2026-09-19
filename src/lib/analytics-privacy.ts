import "server-only";

export { ELIGIBLE_RESPONSE_STATUS, MINIMUM_ANALYTICS_CELL_SIZE } from "./enums";

// ---------------------------------------------------------------------------
// Public analytics minimum response threshold = 1.
// Public survey results and demographic breakdowns are displayed from the very
// first valid response, ensuring immediate transparency for public survey data.
// ---------------------------------------------------------------------------

export async function getMinCellSize(): Promise<number> {
  return 1;
}

export function isSuppressed(count: number, minRequired: number): boolean {
  return count < minRequired;
}

// The one percentage-rounding policy used everywhere: round to one decimal
// place. A breakdown's percentages are NEVER redistributed/adjusted to force
// an exact 100.0 total — doing so would mean silently fabricating a count.
// A harmless ±0.1 rounding artifact is preferable to distorted data.
export function roundPct(count: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((count / total) * 1000) / 10;
}

// Only status this platform treats as eligible for any analytics
// calculation — matches the definition already used throughout
// src/lib/analytics.ts (FLAGGED/REJECTED responses are excluded everywhere).
