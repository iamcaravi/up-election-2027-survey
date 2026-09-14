import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStateAndElection, getConstituencyBySlug } from "@/lib/data";
import { Container } from "@/components/ui/Container";
import { ConstituencyHeroText } from "@/components/election/ConstituencyHeroText";
import { districtPath, electionPath, statePath, constituencyPath } from "@/lib/routes";
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
    title: locale === "hi" ? `${c.name} चुनाव सर्वेक्षण` : `${c.name} Election Survey`,
    description:
      locale === "hi"
        ? `${c.name} विधानसभा क्षेत्र (${c.district.name}, ${c.state.name}) सार्वजनिक सर्वे, उम्मीदवार पसंद, मुख्य मुद्दे और क्षेत्रवार सर्वे रुझान।`
        : `${c.name} Assembly constituency (${c.district.name}, ${c.state.name}) public survey, candidate preferences, key issues and constituency-level survey trends.`,
    ogTitle: locale === "hi" ? `${c.name} सर्वे` : `${c.name} Survey`,
    ogDescription:
      locale === "hi"
        ? `${c.name} विधानसभा क्षेत्र, ${c.district.name} जिला, ${c.state.name} के लिए सार्वजनिक सर्वे।`
        : `Public survey for ${c.name} assembly constituency, ${c.district.name} district, ${c.state.name}.`,
    path: constituencyPath(c.state.slug, electionSlug, c.slug),
  });
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
