import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStateAndElection, getConstituenciesForElection } from "@/lib/data";
import { Container } from "@/components/ui/Container";
import { ConstituencyGrid } from "@/components/district/ConstituencyGrid";
import { electionPath } from "@/lib/routes";

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
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">{state.name} · {election.name}</p>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">All Assembly Constituencies</h1>
        <p className="mt-2 text-sm text-muted">{constituencies.length} constituencies contesting this election</p>
      </div>

      {constituencies.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-2 p-10 text-center text-sm text-muted">
          No constituencies linked to this election yet.
        </div>
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
