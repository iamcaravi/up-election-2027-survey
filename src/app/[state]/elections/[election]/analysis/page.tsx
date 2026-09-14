import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStateAndElection, getStates } from "@/lib/data";
import { getStateAnalysis } from "@/lib/state-analysis";
import { getUpConstituencyExplorer } from "@/lib/up-analytics";
import { Container } from "@/components/ui/Container";
import { AnalysisStateHeading } from "@/components/analysis/AnalysisStateHeading";
import { AnalysisResultsView } from "@/components/analysis/AnalysisResultsView";
import { SurveyResponseOverview } from "@/components/analysis/SurveyResponseOverview";
import { SurveyTrustStrip } from "@/components/survey/SurveyTrustStrip";
import { statePath, analysisPath } from "@/lib/routes";
import { displayStateName } from "@/lib/utils";
import { buildPageMetadata } from "@/lib/seo";
import { applySeoOverride } from "@/lib/seo-overrides";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; election: string }>;
}): Promise<Metadata> {
  const { state: stateSlug, election: electionSlug } = await params;
  const result = await getStateAndElection(stateSlug, electionSlug);
  if (!result?.election) return {};
  const stateName = displayStateName(result.state.name, result.state.slug, "hi");
  const path = analysisPath(result.state.slug, result.election.slug);
  const base = buildPageMetadata({
    title: `${stateName} चुनाव विश्लेषण`,
    description: `${stateName} के जनमत सर्वेक्षण का विस्तृत विश्लेषण — पार्टी समर्थन, मुख्य मुद्दे और मतदाता प्रोफ़ाइल।`,
    path,
  });
  return applySeoOverride(base, path);
}

export const dynamic = "force-dynamic";

// The state Analysis dashboard — a standalone journey (Analysis → State →
// HERE), independent of Find Constituency, Results and Election Overview.
// Fully data-driven: nothing here branches on which state this is, so the
// exact same page renders Uttar Pradesh's 403-constituency dashboard or
// Goa's 2-district one from the same code path.
export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ state: string; election: string }>;
}) {
  const { state: stateSlug, election: electionSlug } = await params;
  const result = await getStateAndElection(stateSlug, electionSlug);
  if (!result?.election) notFound();
  const { state, election } = result;

  const [analysisData, explorer, allStates] = await Promise.all([
    getStateAnalysis(election.id),
    getUpConstituencyExplorer(election.id, state.id),
    getStates(),
  ]);
  if (!analysisData) notFound();

  const stateOptions = allStates.map((s) => ({ slug: s.slug, name: s.name }));
  const constituencyOptions = explorer.constituencies
    .map((c) => ({ slug: c.slug, name: c.name }))
    .sort((a, b) => a.name.localeCompare(b.name, "hi"));

  return (
    <div>
      <Container className="py-8 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_300px] lg:items-center">
          <div>
            <AnalysisStateHeading
              stateNameRaw={state.name}
              stateSlug={state.slug}
              electionName={`${election.name} · ${election.year}`}
              validResponseCount={analysisData.statewide.sample.validResponseCount}
              respondingConstituencyCount={analysisData.statewide.respondingConstituencyCount}
              totalConstituencies={analysisData.statewide.totalConstituencies}
              historicalMonthsAvailable={analysisData.historicalMonthsAvailable}
              lastUpdated={analysisData.statewide.sample.lastResponseAt}
            />
          </div>
          <div>
            <SurveyResponseOverview
              validResponseCount={analysisData.statewide.sample.validResponseCount}
              respondingConstituencyCount={analysisData.statewide.respondingConstituencyCount}
              totalConstituencies={analysisData.statewide.totalConstituencies}
            />
          </div>
        </div>

        <div className="mt-6">
          <AnalysisResultsView
            data={analysisData}
            currentStateSlug={state.slug}
            currentElectionSlug={election.slug}
            states={stateOptions}
            constituencies={constituencyOptions}
            electionName={`${election.name} · ${election.year}`}
            surveyHref={statePath(state.slug)}
          />
        </div>
      </Container>

      <Container>
        <SurveyTrustStrip />
      </Container>
    </div>
  );
}
