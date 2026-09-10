import "server-only";
import { getSiteSetting } from "./data";
import { ELIGIBLE_RESPONSE_STATUS, MINIMUM_ANALYTICS_CELL_SIZE } from "./enums";

export { ELIGIBLE_RESPONSE_STATUS } from "./enums";

// ---------------------------------------------------------------------------
// The ONE central definition of this platform's minimum-cell privacy
// suppression policy. Every analytics function — public results (analytics.ts)
// and the premium analytics engine (premium-analytics.ts) — must call this
// instead of hard-coding 30 (or any other number) locally.
//
// IMPORTANT: 30 respondents is an application-level privacy suppression
// threshold chosen by this platform. It is NOT a claim that Indian law
// provides any legal "safe harbour" at 30 — it is simply the point below
// which we judge a breakdown too small to publish without risking
// re-identification of individual respondents. Paid/premium access never
// overrides this: suppression is applied before the payment/entitlement
// layer even exists, so there is no code path that can bypass it.
// ---------------------------------------------------------------------------

export async function getMinCellSize(): Promise<number> {
  return getSiteSetting("MIN_ANALYTICS_GROUP_SIZE", MINIMUM_ANALYTICS_CELL_SIZE);
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
