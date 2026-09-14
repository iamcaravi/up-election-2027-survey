import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { getStateAndElection } from "@/lib/data";
import { getPublicStatewideResults } from "@/lib/public-statewide-results";
import { getUpConstituencyExplorer } from "@/lib/up-analytics";
import { Container } from "@/components/ui/Container";
import { ResultsDashboard } from "@/components/results/ResultsDashboard";
import { ResultsStateHeading, NoElectionForResultsNotice } from "@/components/results/ResultsStateHeader";
import { analysisPath, stateResultsPath } from "@/lib/routes";
import { displayStateName } from "@/lib/utils";
import { buildPageMetadata } from "@/lib/seo";
import { applySeoOverride } from "@/lib/seo-overrides";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state: stateSlug } = await params;
  const result = await getStateAndElection(stateSlug);
  if (!result) return {};
  const stateName = displayStateName(result.state.name, result.state.slug, "hi");
  const path = stateResultsPath(result.state.slug);
  const base = buildPageMetadata({
    title: `${stateName} — परिणाम`,
    description: `${stateName} के जनमत सर्वे के परिणाम — पार्टी समर्थन, मुख्य मुद्दे और जिला/विधानसभा क्षेत्रवार परिणाम।`,
    path,
  });
  return applySeoOverride(base, path);
}

export const revalidate = 60;

// State Result Overview — the second hop of the standalone Results journey
// (Results landing → HERE → district/constituency-scoped result). This is a
// results DASHBOARD, not a constituency directory: the district/constituency
// selectors filter which real, database-backed result set is shown, they
// never link out to a browsable grid of every constituency (that already
// exists at Find Constituency / Explore Districts).
export default async function StateResultsPage({
  params,
}: {
  params: Promise<{ state: string }>;
}) {
  const { state: stateSlug } = await params;
  const result = await getStateAndElection(stateSlug);
  if (!result) notFound();
  const { state, election } = result;

  return (
    <Container className="py-12">
      <ResultsStateHeading
        stateNameRaw={state.name}
        stateSlug={state.slug}
        analysisHref={election ? analysisPath(state.slug, election.slug) : null}
      />

      {!election ? (
        <div className="mt-8">
          <NoElectionForResultsNotice />
        </div>
      ) : (
        <StateResultsBody stateSlug={state.slug} electionSlug={election.slug} electionId={election.id} stateId={state.id} />
      )}
    </Container>
  );
}

async function StateResultsBody({
  stateSlug,
  electionSlug,
  electionId,
  stateId,
}: {
  stateSlug: string;
  electionSlug: string;
  electionId: string;
  stateId: string;
}) {
  const [statewide, explorer] = await Promise.all([
    getPublicStatewideResults(electionId),
    getUpConstituencyExplorer(electionId, stateId),
  ]);

  if (!statewide) return <NoElectionForResultsNotice />;

  const districts = explorer.districts
    .map((d) => ({ slug: d.districtSlug, name: d.districtName }))
    .sort((a, b) => a.name.localeCompare(b.name, "hi"));
  const constituencies = explorer.constituencies.map((c) => ({
    slug: c.slug,
    name: c.name,
    districtSlug: c.districtSlug,
  }));

  return (
    <div className="mt-8">
      <Suspense fallback={null}>
        <ResultsDashboard
          stateSlug={stateSlug}
          electionSlug={electionSlug}
          districts={districts}
          constituencies={constituencies}
          initialStatewide={statewide}
        />
      </Suspense>
    </div>
  );
}
