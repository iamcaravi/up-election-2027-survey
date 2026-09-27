import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStateAndElection, getConstituencyBySlug } from "@/lib/data";
import { getPublicSurveyResults } from "@/lib/public-survey-results";
import { ApprovedConstituencyResultsView } from "@/components/results/ApprovedConstituencyResultsView";
import { analysisPath, constituencyPath } from "@/lib/routes";
import { buildPageMetadata } from "@/lib/seo";
import { getServerLocale } from "@/lib/i18n/locale-cookie";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; election: string; constituency: string }>;
}): Promise<Metadata> {
  const { state: stateSlug, election: electionSlug, constituency: slug } = await params;
  const [c, locale] = await Promise.all([getConstituencyBySlug(stateSlug, slug, electionSlug), getServerLocale()]);
  if (!c) return {};
  return buildPageMetadata({
    title: locale === "hi" ? `सर्वे परिणाम — ${c.name}` : `Survey Results — ${c.name}`,
    description:
      locale === "hi"
        ? `${c.name} विधानसभा क्षेत्र, ${c.district.name}, ${c.state.name} के लिए सार्वजनिक सर्वे परिणाम।`
        : `Public survey results for ${c.name} assembly constituency, ${c.district.name}, ${c.state.name}.`,
    path: `${constituencyPath(c.state.slug, electionSlug, c.slug)}/results`,
  });
}

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

  const analysisHref = analysisPath(scopedElection.state.slug, scopedElection.election.slug);

  return (
    <ApprovedConstituencyResultsView
      data={results}
      stateSlug={stateSlug}
      electionSlug={electionSlug}
      districtSlug={constituency.district.slug}
      constituencySlug={constituency.slug}
      constituencyNumber={constituency.number}
      constituencyNameEn={constituency.name}
      districtNameEn={constituency.district.name}
      stateNameEn={constituency.state.name}
      electionYear={scopedElection.election.year}
      analysisHref={analysisHref}
    />
  );
}
