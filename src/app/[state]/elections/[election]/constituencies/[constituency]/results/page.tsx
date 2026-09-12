import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStateAndElection, getConstituencyBySlug } from "@/lib/data";
import { getPublicSurveyResults } from "@/lib/public-survey-results";
import { getPublicStatewideResults } from "@/lib/public-statewide-results";
import { ResultsTabs } from "@/components/results/ResultsTabs";
import { Container } from "@/components/ui/Container";
import { electionPath } from "@/lib/routes";

export const metadata: Metadata = { title: "Survey Results" };
export const dynamic = "force-dynamic";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ state: string; election: string; constituency: string }>;
}) {
  const { state: stateSlug, election: electionSlug, constituency: slug } = await params;
  const scopedElection = await getStateAndElection(stateSlug, electionSlug);
  if (!scopedElection?.election) notFound();

  const constituency = await getConstituencyBySlug(stateSlug, slug, electionSlug);
  if (!constituency) notFound();

  const results = await getPublicSurveyResults(scopedElection.election.id, constituency.id);
  if (!results) notFound();
  const statewideResults = await getPublicStatewideResults(scopedElection.election.id);

  const basePath = electionPath(scopedElection.state.slug, scopedElection.election.slug);
  return (
    <Container className="max-w-5xl py-10 sm:py-14">
      <ResultsTabs
        constituencyResults={results}
        statewideResults={statewideResults}
        surveyHref={`${basePath}/constituencies/${constituency.slug}/survey`}
      />
    </Container>
  );
}
