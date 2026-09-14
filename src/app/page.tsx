import { getHomeStats, getSiteSetting, getStates } from "@/lib/data";
import { getHomepageIssueStats } from "@/lib/analytics";
import { DEFAULT_HERO_CONFIG, normalizeHeroConfig } from "@/lib/hero-config";
import {
  DEFAULT_HOMEPAGE_SECTIONS_CONFIG,
  buildHomepageSectionsStyleCss,
  normalizeHomepageSectionsConfig,
} from "@/lib/homepage-sections-config";
import { Hero } from "@/components/home/Hero";
import { StatisticsStrip } from "@/components/home/StatisticsStrip";
import { FeatureCards } from "@/components/home/FeatureCards";
import { IssuesSection } from "@/components/home/IssuesSection";
import { HomeIssuesHeading } from "@/components/home/HomeIssuesHeading";
import { LowerCardsSection } from "@/components/home/LowerCardsSection";
import { StatesSection } from "@/components/home/StatesSection";
import { Container } from "@/components/ui/Container";

export const revalidate = 60;

export default async function Home() {
  const [stats, states, heroConfig, sectionsConfigRaw, issueStats] = await Promise.all([
    getHomeStats(),
    getStates(),
    getSiteSetting("HERO_CONFIG", DEFAULT_HERO_CONFIG),
    getSiteSetting("HOMEPAGE_SECTIONS_CONFIG", DEFAULT_HOMEPAGE_SECTIONS_CONFIG),
    // A failure here must not take down the rest of the homepage — fall back
    // to the section's own empty state (total: 0) rather than throwing.
    getHomepageIssueStats().catch(() => ({ total: 0, percentages: {} })),
  ]);

  // Feature cards below have no state context yet (the visitor hasn't
  // picked one) — always send them to browse/pick a state rather than
  // guessing one, so the homepage never silently favors whichever state
  // happens to sort first (see SiteChrome for the equivalent header/footer
  // fix once a state IS in context).
  // "Take the Survey" needs a specific constituency, so it goes to the
  // dedicated Find Constituency flow (State → District → Constituency →
  // Take Survey), not the generic state browser.
  const takeSurveyHref = "/find-constituency";
  // Results and Analysis are their own standalone journeys (src/app/results/**,
  // src/app/analysis/**) — each homepage card picks a state there, not on
  // the generic /states browser.
  const browseResultsHref = "/results";
  const browseAnalysisHref = "/analysis";

  const sections = normalizeHomepageSectionsConfig(sectionsConfigRaw);
  // Aggregated per-device visibility/padding CSS for every homepage section
  // (see src/lib/homepage-sections-config.ts) — one small <style> tag, no
  // client JS, so a section hidden for e.g. mobile is genuinely never shown
  // there without any hydration/flash risk.
  const sectionsStyleCss = buildHomepageSectionsStyleCss(sections);

  return (
    <div>
      {/* numeric/path values only, sourced from homepageSectionsConfigSchema-validated config */}
      <style dangerouslySetInnerHTML={{ __html: sectionsStyleCss }} />

      <div data-section="hero">
        <Hero
          surveyStates={states}
          config={normalizeHeroConfig(heroConfig)}
          mobileImageUrl={sections.hero.mobileImageUrl}
          tabletImageUrl={sections.hero.tabletImageUrl}
        />
      </div>

      <div data-section="stats">
        <StatisticsStrip stats={stats} />
      </div>

      <div data-section="featureCards">
        <FeatureCards surveyHref={takeSurveyHref} resultsHref={browseResultsHref} analyticsHref={browseAnalysisHref} />
      </div>

      <div data-section="issues">
        <Container className="py-6" id="issues">
          <HomeIssuesHeading />
          <IssuesSection stats={issueStats} />
        </Container>
      </div>

      <div data-section="about">
        <Container className="py-6">
          <LowerCardsSection mobileImageUrl={sections.about.mobileImageUrl} tabletImageUrl={sections.about.tabletImageUrl} />
        </Container>
      </div>

      <div data-section="states">
        <Container className="py-6" id="elections">
          <StatesSection states={states} />
        </Container>
      </div>
    </div>
  );
}
