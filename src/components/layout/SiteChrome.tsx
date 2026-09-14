"use client";

import { usePathname } from "next/navigation";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { analysisPath, analysisLandingPath, resultsLandingPath, stateResultsPath } from "@/lib/routes";
import type { SocialLinksConfig } from "@/lib/social-links";

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
// state — a visitor browsing /punjab/... sees Punjab's Results/Analysis
// links; a visitor on a state-agnostic page (home, /about) sees a
// neutral landing page instead of the site guessing a state for them.
// This is what keeps a user's chosen state from ever silently resetting to
// whichever state happens to sort first (see multi-state migration notes).
export function SiteChrome({
  states,
  socialLinks,
  children,
}: {
  states: NavState[];
  socialLinks: SocialLinksConfig;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) return <>{children}</>;

  const currentSlug = pathname?.split("/")[1];
  const currentState = states.find((s) => s.slug === currentSlug) ?? null;

  // Results is a standalone journey (src/app/results/**), independent of the
  // State/Election/District hierarchy — it never routes through Election
  // Overview. Browsing a specific state deep-links straight into that
  // state's Result Overview; a state-agnostic page (home, /about) goes to
  // the Results landing page to pick a state first.
  const resultsHref = currentState?.electionSlug ? stateResultsPath(currentState.slug) : resultsLandingPath();
  // Analysis is likewise its own standalone journey (src/app/analysis/**) —
  // a state-agnostic page goes to the Analysis landing page to pick a state
  // first, matching the same pattern Results already uses.
  const analysisHref = currentState?.electionSlug ? analysisPath(currentState.slug, currentState.electionSlug) : analysisLandingPath();

  return (
    <>
      <div data-section="header">
        <SiteHeader resultsHref={resultsHref} analysisHref={analysisHref} />
      </div>
      <main className="flex-1">{children}</main>
      <div data-section="footer">
        <SiteFooter resultsHref={resultsHref} analysisHref={analysisHref} socialLinks={socialLinks} />
      </div>
    </>
  );
}
