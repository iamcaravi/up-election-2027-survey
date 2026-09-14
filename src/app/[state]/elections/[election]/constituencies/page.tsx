import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStateAndElection, getConstituenciesForElection } from "@/lib/data";
import { Container } from "@/components/ui/Container";
import { ConstituencyGrid } from "@/components/district/ConstituencyGrid";
import { ConstituenciesListingText, NoConstituenciesNotice } from "@/components/election/ConstituenciesListingText";
import { electionPath, statePath } from "@/lib/routes";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; election: string }>;
}): Promise<Metadata> {
  const { state: stateSlug, election: electionSlug } = await params;
  const result = await getStateAndElection(stateSlug, electionSlug);
  if (!result?.election) return {};
  return {
    title: `${result.state.name} — All Assembly Constituencies`,
    description: `Every assembly constituency contesting the ${result.election.name}.`,
  };
}

export const revalidate = 60;

export default async function ConstituenciesPage({
  params,
}: {
  params: Promise<{ state: string; election: string }>;
}) {
  const { state: stateSlug, election: electionSlug } = await params;
  const result = await getStateAndElection(stateSlug, electionSlug);
  if (!result?.election) notFound();
  const { state, election } = result;

  const constituencies = await getConstituenciesForElection(election.id);

  return (
    <Container className="py-14">
      <div className="mb-10">
        <ConstituenciesListingText
          stateName={state.name}
          stateHref={statePath(state.slug)}
          electionName={election.name}
          electionHref={electionPath(state.slug, election.slug)}
          constituencyCount={constituencies.length}
        />
      </div>

      {constituencies.length === 0 ? (
        <NoConstituenciesNotice />
      ) : (
        <ConstituencyGrid
          basePath={electionPath(state.slug, election.slug)}
          constituencies={constituencies.map((c) => ({
            id: c.id,
            slug: c.slug,
            number: c.number,
            name: `${c.name} (${c.district.name})`,
            reservedStatus: c.reservedStatus,
            currentMlaName: c.currentMlaName,
            currentMlaParty: c.currentMlaParty,
            responseCount: c._count.surveyResponses,
            candidateCount: c._count.candidates,
          }))}
        />
      )}
    </Container>
  );
}
