import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStateAndElection } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ElectionEyebrow, ElectionHeroText, ElectionDisclaimer } from "@/components/election/ElectionHeroText";
import { districtsPath, statePath, stateResultsPath, analysisPath, electionPath } from "@/lib/routes";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; election: string }>;
}): Promise<Metadata> {
  const { state: stateSlug, election: electionSlug } = await params;
  const result = await getStateAndElection(stateSlug, electionSlug);
  if (!result?.election) return {};
  return buildPageMetadata({
    title: result.election.name,
    description: result.election.description ?? `${result.election.name} — public survey and candidate information.`,
    path: electionPath(result.state.slug, result.election.slug),
  });
}

export const revalidate = 60;

export default async function ElectionPage({
  params,
}: {
  params: Promise<{ state: string; election: string }>;
}) {
  const { state: stateSlug, election: electionSlug } = await params;
  const result = await getStateAndElection(stateSlug, electionSlug);
  if (!result?.election) notFound();
  const { state, election } = result;

  const [constituencyCount, districtCount, responseCount] = await Promise.all([
    prisma.electionConstituency.count({ where: { electionId: election.id, isActive: true } }),
    prisma.district.count({ where: { stateId: state.id } }),
    prisma.surveyResponse.count({ where: { status: "VALID", survey: { electionId: election.id } } }),
  ]);

  return (
    <div>
      <div className="border-b border-border bg-surface">
        <Container className="py-12">
          <Breadcrumb items={[{ label: state.name, href: statePath(state.slug) }, { label: election.name }]} />
          <ElectionEyebrow stateName={state.name} electionType={election.electionType} year={election.year} />
          <h1 className="font-display text-3xl font-extrabold sm:text-5xl">{election.name}</h1>
          {election.description && <p className="mt-3 max-w-2xl text-sm text-muted">{election.description}</p>}

          <ElectionHeroText
            status={election.status}
            districtCount={districtCount}
            constituencyCount={constituencyCount}
            responseCount={responseCount}
            districtsHref={districtsPath(state.slug, election.slug)}
            resultsHref={stateResultsPath(state.slug)}
            analysisHref={analysisPath(state.slug, election.slug)}
          />
        </Container>
      </div>

      <Container className="py-12">
        <ElectionDisclaimer />
      </Container>
    </div>
  );
}
