import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStateAndElection, getConstituencyBySlug } from "@/lib/data";
import { Container } from "@/components/ui/Container";
import { ConstituencyHeroText } from "@/components/election/ConstituencyHeroText";
import { districtPath, electionPath, statePath } from "@/lib/routes";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; election: string; constituency: string }>;
}): Promise<Metadata> {
  const { state: stateSlug, election: electionSlug, constituency: slug } = await params;
  const c = await getConstituencyBySlug(stateSlug, slug, electionSlug);
  if (!c) return {};
  return {
    title: `${c.name} Election Survey`,
    description: `${c.name} Assembly constituency (${c.district.name}, ${c.state.name}) public survey, candidate preferences, key issues and constituency-level survey trends.`,
    openGraph: {
      title: `${c.name} Survey`,
      description: `Public survey for ${c.name} assembly constituency, ${c.district.name} district, ${c.state.name}.`,
    },
  };
}

export const revalidate = 15;

export default async function ConstituencyPage({
  params,
}: {
  params: Promise<{ state: string; election: string; constituency: string }>;
}) {
  const { state: stateSlug, election: electionSlug, constituency: slug } = await params;
  const result = await getStateAndElection(stateSlug, electionSlug);
  if (!result?.election) notFound();
  const { state, election } = result;

  const constituency = await getConstituencyBySlug(stateSlug, slug, electionSlug);
  if (!constituency) notFound();

  const basePath = electionPath(state.slug, election.slug);

  return (
    <div>
      <div className="border-b border-border bg-surface">
        <Container className="py-12">
          <ConstituencyHeroText
            stateName={state.name}
            stateHref={statePath(state.slug)}
            electionName={election.name}
            electionHref={electionPath(state.slug, election.slug)}
            districtName={constituency.district.name}
            districtHref={districtPath(state.slug, election.slug, constituency.district.slug)}
            constituencyName={constituency.name}
            constituencyNumber={constituency.number}
            reservedStatus={constituency.reservedStatus}
            currentMlaName={constituency.currentMlaName}
            result2022WinnerName={constituency.result2022WinnerName}
            result2022WinnerParty={constituency.result2022WinnerParty}
            responseCount={constituency._count.surveyResponses}
            surveyHref={`${basePath}/constituencies/${slug}/survey`}
            resultsHref={`${basePath}/constituencies/${slug}/results`}
          />
        </Container>
      </div>
    </div>
  );
}
