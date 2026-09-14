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
import { applySeoOverride } from "@/lib/seo-overrides";
import { getServerLocale } from "@/lib/i18n/locale-cookie";
import { displayStateName } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state: slug } = await params;
  const [result, locale] = await Promise.all([getStateAndElection(slug), getServerLocale()]);
  if (!result) return {};
  const stateName = displayStateName(result.state.name, result.state.slug, locale);
  const path = statePath(result.state.slug);
  const base = buildPageMetadata({
    title: locale === "hi" ? `${stateName} चुनाव सर्वेक्षण` : `${stateName} Election Survey`,
    description:
      locale === "hi"
        ? `${stateName}: जिले, विधानसभा क्षेत्र, उम्मीदवार और सार्वजनिक सर्वे${result.election ? ` — ${result.election.name}` : ""}।`
        : `${stateName}: districts, assembly constituencies, candidates and public survey${
            result.election ? ` for the ${result.election.name}` : ""
          }.`,
    path,
  });
  return applySeoOverride(base, path);
}

export const revalidate = 60;

export default async function StatePage({ params }: { params: Promise<{ state: string }> }) {
  const { state: slug } = await params;
  const [result, locale] = await Promise.all([getStateAndElection(slug), getServerLocale()]);
  if (!result) notFound();
  const { state, election } = result;
  const stateName = displayStateName(state.name, state.slug, locale);

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
          <Breadcrumb items={[{ label: stateName }]} />
          <StateEyebrow />
          <h1 className="font-display text-3xl font-extrabold sm:text-5xl">{stateName}</h1>
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
            stateName={stateName}
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
