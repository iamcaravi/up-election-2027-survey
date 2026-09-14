import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStateAndElection, getDistrictBySlug } from "@/lib/data";
import { Container } from "@/components/ui/Container";
import { ConstituencyGrid } from "@/components/district/ConstituencyGrid";
import { DistrictHeroText } from "@/components/district/DistrictHeroText";
import { districtsPath, electionPath, statePath, districtPath } from "@/lib/routes";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; election: string; district: string }>;
}): Promise<Metadata> {
  const { state: stateSlug, election: electionSlug, district: districtSlug } = await params;
  const result = await getStateAndElection(stateSlug, electionSlug);
  if (!result?.election) return {};
  const district = await getDistrictBySlug(stateSlug, districtSlug, result.election.id);
  if (!district) return {};
  return buildPageMetadata({
    title: `${district.name} — Assembly Constituencies`,
    description: `${district.name} district: ${district.constituencies.length} assembly constituencies, candidates and public survey results.`,
    path: districtPath(result.state.slug, result.election.slug, districtSlug),
  });
}

export const revalidate = 30;

export default async function DistrictPage({
  params,
}: {
  params: Promise<{ state: string; election: string; district: string }>;
}) {
  const { state: stateSlug, election: electionSlug, district: districtSlug } = await params;
  const result = await getStateAndElection(stateSlug, electionSlug);
  if (!result?.election) notFound();
  const { state, election } = result;

  const district = await getDistrictBySlug(stateSlug, districtSlug, election.id);
  if (!district) notFound();

  const totalResponses = district.constituencies.reduce((sum, c) => sum + c._count.surveyResponses, 0);
  const activeSurveys = district.constituencies.length;

  return (
    <div>
      <div className="border-b border-border bg-surface">
        <Container className="py-12">
          <DistrictHeroText
            stateName={state.name}
            stateHref={statePath(state.slug)}
            electionName={election.name}
            electionHref={electionPath(state.slug, election.slug)}
            districtsHref={districtsPath(state.slug, election.slug)}
            districtName={district.name}
            constituencyCount={district.constituencies.length}
            totalResponses={totalResponses}
            activeSurveys={activeSurveys}
          />
        </Container>
      </div>

      <Container className="py-12">
        <ConstituencyGrid
          basePath={electionPath(state.slug, election.slug)}
          constituencies={district.constituencies.map((c) => ({
            id: c.id,
            slug: c.slug,
            number: c.number,
            name: c.name,
            reservedStatus: c.reservedStatus,
            currentMlaName: c.currentMlaName,
            currentMlaParty: c.currentMlaParty,
            responseCount: c._count.surveyResponses,
            candidateCount: c._count.candidates,
          }))}
        />
      </Container>
    </div>
  );
}
