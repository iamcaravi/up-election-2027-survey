import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStateAndElection, getConstituencyBySlug, getFullSurveyForConstituency } from "@/lib/data";
import { getCurrentMlaForConstituency } from "@/lib/current-mla";
import { SurveyExperience, type SurveyOptionItem } from "@/components/survey/SurveyExperience";
import { electionPath, constituencyPath } from "@/lib/routes";
import { getPartyLogoUrl, getPartyDisplayName } from "@/lib/party-logos";
import { getIssueIcon } from "@/lib/survey-issue-icons";
import { buildPageMetadata } from "@/lib/seo";
import { getServerLocale } from "@/lib/i18n/locale-cookie";
import { prisma } from "@/lib/prisma";
import { displayStateName } from "@/lib/utils";
import { getDistrictDisplayName } from "@/lib/district-hindi";
import { getConstituencyDisplayName } from "@/lib/constituency-hindi";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; election: string; constituency: string }>;
}): Promise<Metadata> {
  const { state: stateSlug, election: electionSlug, constituency: slug } = await params;
  const [c, locale] = await Promise.all([getConstituencyBySlug(stateSlug, slug, electionSlug), getServerLocale()]);
  if (!c) return {};
  return buildPageMetadata({
    title: locale === "hi" ? `सर्वे में भाग लें — ${c.name}` : `Take the Survey — ${c.name}`,
    description:
      locale === "hi"
        ? `${c.name} विधानसभा क्षेत्र, ${c.district.name}, ${c.state.name} के लिए अपनी मतदाता पसंद साझा करें — एक 2-मिनट का सार्वजनिक राय सर्वे।`
        : `Share your voter preference for ${c.name} assembly constituency, ${c.district.name}, ${c.state.name} — a 2-minute public opinion survey.`,
    path: `${constituencyPath(c.state.slug, electionSlug, c.slug)}/survey`,
  });
}

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

  const locale = await getServerLocale();
  const [survey, currentMla, validResponseCount] = await Promise.all([
    getFullSurveyForConstituency(constituency.id, election.id),
    getCurrentMlaForConstituency(constituency, election.id),
    prisma.surveyResponse.count({
      where: { constituencyId: constituency.id, status: "VALID" },
    }),
  ]);
  if (!survey) notFound();

  const basePath = electionPath(state.slug, election.slug);
  const questionByKey = new Map(survey.questions.map((q) => [q.key, q]));

  // Already ordered correctly by the DB query (options are stored in the
  // order syncPartyPreferenceOptions gave them: this state's featured
  // parties, then Other/NOTA/Undecided last).
  const rawPartyOptions = questionByKey.get("party_preference")?.options ?? [];
  const partyOptions = rawPartyOptions.filter((option) => {
    const s = (option.party?.slug ?? option.key).toLowerCase();
    const shortName = (option.party?.shortName ?? option.label).toLowerCase();
    if (state.slug === "uttar-pradesh") {
      if (s === "ncp" || s.includes("nationalist-congress") || shortName === "ncp") {
        return false;
      }
    }
    return true;
  });
  const parties: SurveyOptionItem[] = partyOptions.map((option) => {
    const shortName = option.party?.shortName ?? option.label;
    const slugForLogo = option.party?.slug ?? option.key;
    const abbreviation =
      slugForLogo === "other" ? "OTH" : slugForLogo === "nota" ? "NOTA" : slugForLogo === "undecided" ? "N/A" : shortName;
    return {
      key: option.key,
      label: getPartyDisplayName(option.party, option.party?.nameEnglish ?? option.label, "en"),
      labelHi: getPartyDisplayName(option.party, option.party?.nameEnglish ?? option.label, "hi"),
      abbreviation,
      logoUrl: getPartyLogoUrl(option.party),
      colorHex: option.party?.colorHex ?? null,
    };
  });

  const issues: SurveyOptionItem[] = (questionByKey.get("top_issue")?.options ?? []).map((option) => ({
    key: option.key,
    label: option.label,
    icon: getIssueIcon(option.key),
  }));

  const ageGroups: SurveyOptionItem[] = (questionByKey.get("age_group")?.options ?? []).map((option) => ({
    key: option.key,
    label: option.label,
  }));
  const genders: SurveyOptionItem[] = (questionByKey.get("gender")?.options ?? []).map((option) => ({
    key: option.key,
    label: option.label,
  }));
  const socialCategories: SurveyOptionItem[] = (questionByKey.get("social_category")?.options ?? []).map((option) => ({
    key: option.key,
    label: option.label,
  }));
  const religions: SurveyOptionItem[] = (questionByKey.get("religion")?.options ?? []).map((option) => ({
    key: option.key,
    label: option.label,
  }));

  return (
    <div className="min-h-screen bg-[#f4f7fa] dark:bg-slate-950">
      <SurveyExperience
        surveyId={survey.id}
        constituencyName={getConstituencyDisplayName(constituency.slug, constituency.name, locale)}
        constituencyNumber={constituency.number}
        districtName={getDistrictDisplayName(constituency.district.slug, constituency.district.name, locale)}
        districtSlug={constituency.district.slug}
        stateName={displayStateName(constituency.state.name, state.slug, locale)}
        stateSlug={state.slug}
        electionYear={election.year}
        validResponseCount={validResponseCount}
        basePath={basePath}
        constituencySlug={slug}
        parties={parties}
        issues={issues}
        ageGroups={ageGroups}
        genders={genders}
        socialCategories={socialCategories}
        religions={religions}
        currentMla={currentMla}
      />
    </div>
  );
}
