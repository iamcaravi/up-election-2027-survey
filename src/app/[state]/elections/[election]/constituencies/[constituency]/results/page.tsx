import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { getStateAndElection, getConstituencyBySlug, getSiteSetting } from "@/lib/data";
import { getPublicSurveyResults } from "@/lib/public-survey-results";
import { getPublicStatewideResults } from "@/lib/public-statewide-results";
import { ResultsTabs } from "@/components/results/ResultsTabs";
import { SurveyHero } from "@/components/survey/SurveyHero";
import { Container } from "@/components/ui/Container";
import { electionPath, districtPath, statePath, constituencyPath } from "@/lib/routes";
import { buildPageMetadata } from "@/lib/seo";
import { getServerLocale } from "@/lib/i18n/locale-cookie";
import {
  SURVEY_HERO_ELEMENTS_KEY,
  surveyHeroElementsOverrideKey,
  normalizeHeroElementsConfig,
  DEFAULT_HERO_ELEMENTS_CONFIG,
} from "@/lib/survey-hero-elements-config";

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
  const statewideResults = await getPublicStatewideResults(scopedElection.election.id);

  const [globalHeroConfigRaw, heroConfigOverrideRaw] = await Promise.all([
    getSiteSetting(SURVEY_HERO_ELEMENTS_KEY, DEFAULT_HERO_ELEMENTS_CONFIG),
    getSiteSetting<unknown>(surveyHeroElementsOverrideKey(constituency.id), null),
  ]);
  const heroConfig = normalizeHeroElementsConfig(heroConfigOverrideRaw ?? globalHeroConfigRaw);

  const basePath = electionPath(scopedElection.state.slug, scopedElection.election.slug);
  return (
    <div>
      <SurveyHero
        stateName={constituency.state.name}
        stateHref={statePath(scopedElection.state.slug)}
        districtName={constituency.district.name}
        districtHref={districtPath(scopedElection.state.slug, scopedElection.election.slug, constituency.district.slug)}
        constituencyName={constituency.name}
        constituencyNumber={constituency.number}
        electionYear={scopedElection.election.year}
        config={heroConfig}
        breadcrumbLabel="सर्वेक्षण परिणाम"
      />
      <Container className="py-6 sm:py-8">
        <Suspense fallback={null}>
          <ResultsTabs
            constituencyResults={results}
            statewideResults={statewideResults}
            surveyHref={`${basePath}/constituencies/${constituency.slug}/survey`}
          />
        </Suspense>
      </Container>
    </div>
  );
}
