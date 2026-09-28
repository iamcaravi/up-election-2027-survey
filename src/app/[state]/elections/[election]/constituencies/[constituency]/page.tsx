import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStateAndElection, getConstituencyBySlug } from "@/lib/data";
import { getCurrentMlaForConstituency } from "@/lib/current-mla";
import { ConstituencyDetailPage } from "@/components/constituency/ConstituencyDetailPage";
import { districtPath, electionPath, statePath, constituencyPath } from "@/lib/routes";
import { buildPageMetadata } from "@/lib/seo";
import { getServerLocale } from "@/lib/i18n/locale-cookie";
import { displayStateName } from "@/lib/utils";
import { getDistrictDisplayName } from "@/lib/district-hindi";

import { getConstituencyDisplayName } from "@/lib/constituency-hindi";
import { resultsPath } from "@/lib/routes";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; election: string; constituency: string }>;
}): Promise<Metadata> {
  const { state: stateSlug, election: electionSlug, constituency: slug } = await params;
  const [c, locale] = await Promise.all([getConstituencyBySlug(stateSlug, slug, electionSlug), getServerLocale()]);
  if (!c) return {};
  const cName = getConstituencyDisplayName(c.slug, c.name, locale);
  return buildPageMetadata({
    title: locale === "hi" ? `${cName} चुनाव सर्वेक्षण` : `${cName} Election Survey`,
    description:
      locale === "hi"
        ? `${cName} विधानसभा क्षेत्र (${c.district.name}, ${c.state.name}) सार्वजनिक सर्वे, उम्मीदवार पसंद, मुख्य मुद्दे और क्षेत्रवार सर्वे रुझान।`
        : `${cName} Assembly constituency (${c.district.name}, ${c.state.name}) public survey, candidate preferences, key issues and constituency-level survey trends.`,
    ogTitle: locale === "hi" ? `${cName} सर्वे` : `${cName} Survey`,
    ogDescription:
      locale === "hi"
        ? `${cName} विधानसभा क्षेत्र, ${c.district.name} जिला, ${c.state.name} के लिए सार्वजनिक सर्वे।`
        : `Public survey for ${cName} assembly constituency, ${c.district.name} district, ${c.state.name}.`,
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

  // Fetch the current MLA via the authoritative resolver (checks DB INCUMBENT
  // candidate → data/up/current-mlas.json → constituency.currentMlaName).
  const currentMlaInfo = await getCurrentMlaForConstituency(constituency, election.id);

  const basePath = electionPath(state.slug, election.slug);
  const locale = await getServerLocale();

  const stateName = displayStateName(state.name, state.slug, locale);
  const districtName = getDistrictDisplayName(constituency.district.slug, constituency.district.name, locale);
  const constituencyName = getConstituencyDisplayName(constituency.slug, constituency.name, locale);

  const hasSurvey = constituency.surveys && constituency.surveys.length > 0;

  return (
    <ConstituencyDetailPage
      stateName={stateName}
      stateHref={statePath(state.slug)}
      districtName={districtName}
      districtHref={districtPath(state.slug, election.slug, constituency.district.slug)}
      constituencyName={constituencyName}
      constituencyNumber={constituency.number}
      reservedStatus={constituency.reservedStatus}
      currentMlaInfo={currentMlaInfo}
      responseCount={constituency._count.surveyResponses}
      surveyHref={`${basePath}/constituencies/${slug}/survey`}
      resultsHref={resultsPath({ state: state.slug, district: constituency.district.slug, constituency: constituency.slug })}
      hasSurvey={hasSurvey}
    />
  );
}
