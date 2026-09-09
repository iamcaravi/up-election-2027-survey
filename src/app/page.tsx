import {
  getHomeStats,
  getStates,
  getFeaturedActiveSurveys,
  getHistoricalWinnersSummary,
} from "@/lib/data";
import { getTopIssuesOverall } from "@/lib/analytics";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { StateElections } from "@/components/home/StateElections";
import { ActiveSurveys } from "@/components/home/ActiveSurveys";
import { IssuesSection } from "@/components/home/IssuesSection";
import { ElectionExplorer } from "@/components/home/ElectionExplorer";
import { HistoricalElections } from "@/components/home/HistoricalElections";
import { TrustSection } from "@/components/home/TrustSection";
import { Container } from "@/components/ui/Container";

export const revalidate = 60;

export default async function Home() {
  const [stats, states, activeSurveys, topIssues, historicalByState] = await Promise.all([
    getHomeStats(),
    getStates(),
    getFeaturedActiveSurveys(6),
    getTopIssuesOverall(6),
    getHistoricalWinnersSummary(),
  ]);

  // "Primary" state for this UP-first launch phase: the first (and today,
  // only) configured state. When more states are added this naturally
  // becomes "the first one alphabetically" rather than a hardcoded pick —
  // the sections below already fall back to a general multi-state layout
  // once states.length > 1.
  const primary = states[0] ?? null;
  const primaryElection = primary?.elections[0] ?? null;
  const primaryState = primary
    ? {
        slug: primary.slug,
        name: primary.name,
        districtCount: primary._count.districts,
        constituencyCount: primary._count.constituencies,
        surveyCount: stats.activeSurveys,
        election: primaryElection
          ? { slug: primaryElection.slug, name: primaryElection.name, year: primaryElection.year, status: primaryElection.status }
          : null,
      }
    : null;

  const stateElectionItems = states.map((s) => ({
    slug: s.slug,
    name: s.name,
    districtCount: s._count.districts,
    constituencyCount: s._count.constituencies,
    activeElection: s.elections[0]
      ? {
          slug: s.elections[0].slug,
          name: s.elections[0].name,
          year: s.elections[0].year,
          status: s.elections[0].status,
        }
      : null,
  }));

  const historicalItems = states
    .map((s) => {
      const summary = historicalByState.get(s.id);
      if (!summary) return null;
      return { stateName: s.name, totalSeats: summary.totalSeats, parties: summary.parties };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return (
    <div>
      <Hero stats={stats} primaryState={primaryState} />

      {/* राज्यों के चुनाव — primary section */}
      <Container className="py-14 sm:py-16" id="elections">
        <StateElections items={stateElectionItems} />
      </Container>

      {/* जनता का मूड — primary section */}
      <div className="border-y border-border bg-surface-2">
        <Container className="py-14 sm:py-16" id="surveys">
          <ActiveSurveys items={activeSurveys} primaryState={primaryState} />
        </Container>
      </div>

      {/* चुनावी मुद्दे — supporting section */}
      <Container className="py-10 sm:py-12" id="issues">
        <IssuesSection issues={topIssues.issues} sufficientSample={topIssues.sufficientSample} />
      </Container>

      {/* Election Explorer — supporting section */}
      <div className="border-y border-border bg-surface-2">
        <Container className="py-10 sm:py-12">
          <ElectionExplorer primaryState={primaryState} />
        </Container>
      </div>

      {/* आपकी राय, आंकड़ों में — supporting section */}
      <Container className="py-10 sm:py-12">
        <HowItWorks />
      </Container>

      {/* पारदर्शिता / Methodology — supporting, slim */}
      <Container>
        <TrustSection />
      </Container>

      {/* पिछले चुनाव — supporting, compact */}
      <div className="border-t border-border bg-surface-2">
        <Container className="py-10 sm:py-12">
          <HistoricalElections items={historicalItems} />
        </Container>
      </div>
    </div>
  );
}
