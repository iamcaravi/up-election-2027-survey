import { getHomeStats, getSiteSetting, getStates } from "@/lib/data";
import { getTopIssuesOverall } from "@/lib/analytics";
import { DEFAULT_HERO_CONFIG, normalizeHeroConfig } from "@/lib/hero-config";
import { Hero } from "@/components/home/Hero";
import { StatisticsStrip } from "@/components/home/StatisticsStrip";
import { FeatureCards } from "@/components/home/FeatureCards";
import { IssuesSection } from "@/components/home/IssuesSection";
import { MissionSection } from "@/components/home/MissionSection";
import { ResponsibleInitiative } from "@/components/home/ResponsibleInitiative";
import { StatesSection } from "@/components/home/StatesSection";
import { Container } from "@/components/ui/Container";
import { electionPath, statePath } from "@/lib/routes";
import Link from "next/link";

export const revalidate = 60;

export default async function Home() {
  const [stats, states, topIssues, heroConfig] = await Promise.all([
    getHomeStats(),
    getStates(),
    getTopIssuesOverall(6),
    getSiteSetting("HERO_CONFIG", DEFAULT_HERO_CONFIG),
  ]);

  const primary = states[0] ?? null;
  const primaryElection = primary?.elections[0] ?? null;

  const surveyHref = primary ? statePath(primary.slug) : "/states";
  const resultsHref = primary && primaryElection ? electionPath(primary.slug, primaryElection.slug) : surveyHref;

  return (
    <div>
      <Hero surveyStates={states} config={normalizeHeroConfig(heroConfig)} />

      <StatisticsStrip stats={stats} />

      <FeatureCards surveyHref={surveyHref} resultsHref={resultsHref} analyticsHref={resultsHref} />

      <Container className="py-10" id="issues">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">मुद्दे जो मायने रखते हैं</h2>
          <Link href="/methodology" className="text-sm font-semibold text-accent">
            देखें कि मुद्दों का डेटा कैसे मापा जाता है →
          </Link>
        </div>
        <IssuesSection issues={topIssues.issues} sufficientSample={topIssues.sufficientSample} />
      </Container>

      <MissionSection />

      <ResponsibleInitiative />

      <Container className="py-12" id="elections">
        <StatesSection states={states} />
      </Container>
    </div>
  );
}
