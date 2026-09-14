import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStateAndElection, getDistrictsWithResponseCounts, getTrendingConstituencies } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { DistrictExplorer } from "@/components/map/DistrictExplorer";
import { TrendingConstituencies } from "@/components/home/TrendingConstituencies";
import { StateEyebrow, StateHeroText, NoElectionNotice, TrendingSectionHeading, MethodologyLink } from "@/components/state/StateHeroText";
import { electionPath, districtsPath, stateResultsPath, statePath } from "@/lib/routes";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state: slug } = await params;
  const result = await getStateAndElection(slug);
  if (!result) return {};
  return buildPageMetadata({
    title: `${result.state.name} Election Survey`,
    description: `${result.state.name}: districts, assembly constituencies, candidates and public survey${
      result.election ? ` for the ${result.election.name}` : ""
    }.`,
    path: statePath(result.state.slug),
  });
}

export const revalidate = 60;

export default async function StatePage({ params }: { params: Promise<{ state: string }> }) {
  const { state: slug } = await params;
  const result = await getStateAndElection(slug);
  if (!result) notFound();
  const { state, election } = result;

  const [{ districts }, constituencyCount, responseCount, trending] = await Promise.all([
    getDistrictsWithResponseCounts(slug),
    prisma.constituency.count({ where: { stateId: state.id } }),
    prisma.surveyResponse.count({ where: { status: "VALID", constituency: { stateId: state.id } } }),
    getTrendingConstituencies(state.id, 6),
  ]);

  return (
    <div>
      <div className="border-b border-border bg-surface">
        <Container className="py-12">
          <Breadcrumb items={[{ label: state.name }]} />
          <StateEyebrow />
          <h1 className="font-display text-3xl font-extrabold sm:text-5xl">{state.name}</h1>
          <StateHeroText
            election={election}
            districtCount={districts.length}
            constituencyCount={constituencyCount}
            responseCount={responseCount}
            districtsHref={election ? districtsPath(state.slug, election.slug) : "#"}
            electionHref={election ? electionPath(state.slug, election.slug) : "#"}
            resultsHref={election ? stateResultsPath(state.slug) : "#"}
          />
        </Container>
      </div>

      <Container className="py-12">
        {election ? (
          <DistrictExplorer
            basePath={electionPath(state.slug, election.slug)}
            districts={districts}
            stateName={state.name}
          />
        ) : (
          <NoElectionNotice />
        )}
      </Container>

      {trending.length > 0 && (
        <Container className="pb-16">
          <TrendingSectionHeading />
          <TrendingConstituencies
            items={trending.map((c) => ({
              slug: c.slug,
              name: c.name,
              districtName: c.district.name,
              stateSlug: c.state.slug,
              electionSlug: c.electionSlug,
              responseCount: c._count.surveyResponses,
            }))}
          />
        </Container>
      )}

      <Container className="pb-16">
        <p className="text-sm text-muted">
          <MethodologyLink />
        </p>
      </Container>
    </div>
  );
}
