"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { electionPath, analysisPath, premiumPath } from "@/lib/routes";

interface NavState {
  slug: string;
  electionSlug: string | null;
}

// The admin dashboard (/admin/**) has its own header+sidebar shell
// (AdminShell) and the login screen has its own full-bleed split layout —
// neither should ever show the public site's nav/footer. Keeping this check
// here (rather than duplicating <SiteHeader>/<SiteFooter> into every public
// layout) means the root layout stays the single place that decides when
// the public chrome appears.
//
// Nav hrefs are resolved from the CURRENT URL, not one hardcoded "primary"
// state — a visitor browsing /punjab/... sees Punjab's Results/Analysis/
// Premium links; a visitor on a state-agnostic page (home, /about) sees a
// neutral "/states" link instead of the site guessing a state for them.
// This is what keeps a user's chosen state from ever silently resetting to
// whichever state happens to sort first (see multi-state migration notes).
export function SiteChrome({ states, children }: { states: NavState[]; children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) return <>{children}</>;

  const currentSlug = pathname?.split("/")[1];
  const currentState = states.find((s) => s.slug === currentSlug) ?? null;

  const resultsHref = currentState?.electionSlug ? electionPath(currentState.slug, currentState.electionSlug) : "/states";
  const analysisHref = currentState?.electionSlug ? analysisPath(currentState.slug, currentState.electionSlug) : "/states";
  const premiumHref = currentState?.electionSlug ? premiumPath(currentState.slug, currentState.electionSlug) : "/states";

  return (
    <>
      <div data-section="header">
        <SiteHeader resultsHref={resultsHref} analysisHref={analysisHref} premiumHref={premiumHref} />
      </div>
      <main className="flex-1">{children}</main>
      <div data-section="footer">
        <SiteFooter resultsHref={resultsHref} analysisHref={analysisHref} premiumHref={premiumHref} />
      </div>
    </>
  );
}
