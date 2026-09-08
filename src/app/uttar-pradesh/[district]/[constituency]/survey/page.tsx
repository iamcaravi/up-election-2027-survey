import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getConstituencyBySlug, getFullSurveyForConstituency } from "@/lib/data";
import { SurveyFlow } from "@/components/survey/SurveyFlow";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = { title: "Take the Survey" };

export default async function SurveyPage({
  params,
}: {
  params: Promise<{ district: string; constituency: string }>;
}) {
  const { district: districtSlug, constituency: slug } = await params;
  const constituency = await getConstituencyBySlug(slug);
  if (!constituency || constituency.district.slug !== districtSlug) notFound();

  const survey = await getFullSurveyForConstituency(constituency.id);
  if (!survey) notFound();

  return (
    <Container className="max-w-2xl py-10 sm:py-16">
      <SurveyFlow
        surveyId={survey.id}
        constituencyName={constituency.name}
        districtSlug={districtSlug}
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
