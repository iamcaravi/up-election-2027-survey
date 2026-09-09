import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStateAndElection, getConstituencyBySlug, getFullSurveyForConstituency } from "@/lib/data";
import { SurveyFlow } from "@/components/survey/SurveyFlow";
import { Container } from "@/components/ui/Container";
import { electionPath } from "@/lib/routes";

export const metadata: Metadata = { title: "Take the Survey" };

export default async function SurveyPage({
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

  const survey = await getFullSurveyForConstituency(constituency.id, election.id);
  if (!survey) notFound();

  return (
    <Container className="max-w-2xl py-10 sm:py-16">
      <SurveyFlow
        surveyId={survey.id}
        constituencyName={constituency.name}
        basePath={electionPath(state.slug, election.slug)}
        constituencySlug={slug}
        candidates={constituency.candidates.map((c) => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
          status: c.status,
          confidenceScore: c.confidenceScore,
          photoUrl: c.photoUrl,
          party: c.party ? { shortName: c.party.shortName, colorHex: c.party.colorHex } : null,
        }))}
        questions={survey.questions.map((q) => ({
          key: q.key,
          label: q.label,
          required: q.required,
          allowSkip: q.allowSkip,
          options: q.options
            .filter((o) => q.key !== "candidate_choice" || o.key === "other")
            .map((o) => ({ key: o.key, label: o.label })),
        }))}
      />
    </Container>
  );
}
