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
import { electionPath, statePath } from "@/lib/routes";

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

  const primary = states[0] ?? null;
  const primaryElection = primary?.elections[0] ?? null;

  const surveyHref = primary ? statePath(primary.slug) : "/states";
  const resultsHref = primary && primaryElection ? electionPath(primary.slug, primaryElection.slug) : surveyHref;

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
        <FeatureCards surveyHref={surveyHref} resultsHref={resultsHref} analyticsHref={resultsHref} />
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
