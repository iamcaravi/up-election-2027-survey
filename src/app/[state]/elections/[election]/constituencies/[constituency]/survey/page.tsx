import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStateAndElection, getConstituencyBySlug, getFullSurveyForConstituency, getSiteSetting } from "@/lib/data";
import { SurveyHero } from "@/components/survey/SurveyHero";
import { SurveyExperience, type SurveyOptionItem } from "@/components/survey/SurveyExperience";
import { SurveyTrustStrip } from "@/components/survey/SurveyTrustStrip";
import { Container } from "@/components/ui/Container";
import { electionPath, districtPath, statePath, constituencyPath } from "@/lib/routes";
import { getPartyLogoUrl, getPartyDisplayName } from "@/lib/party-logos";
import { getIssueIcon } from "@/lib/survey-issue-icons";
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

  const survey = await getFullSurveyForConstituency(constituency.id, election.id);
  if (!survey) notFound();

  const [globalHeroConfigRaw, heroConfigOverrideRaw] = await Promise.all([
    getSiteSetting(SURVEY_HERO_ELEMENTS_KEY, DEFAULT_HERO_ELEMENTS_CONFIG),
    getSiteSetting<unknown>(surveyHeroElementsOverrideKey(constituency.id), null),
  ]);
  const heroConfig = normalizeHeroElementsConfig(heroConfigOverrideRaw ?? globalHeroConfigRaw);

  const basePath = electionPath(state.slug, election.slug);
  const questionByKey = new Map(survey.questions.map((q) => [q.key, q]));

  // Already ordered correctly by the DB query (options are stored in the
  // order syncPartyPreferenceOptions gave them: this state's featured
  // parties, then Other/NOTA/Undecided last).
  const rawPartyOptions = questionByKey.get("party_preference")?.options ?? [];
  const partyOptions = rawPartyOptions.filter((option) => {
    const slug = (option.party?.slug ?? option.key).toLowerCase();
    const shortName = (option.party?.shortName ?? option.label).toLowerCase();
    if (state.slug === "uttar-pradesh") {
      if (slug === "ncp" || slug.includes("nationalist-congress") || shortName === "ncp") {
        return false;
      }
    }
    return true;
  });
  const parties: SurveyOptionItem[] = partyOptions.map((option) => {
    const shortName = option.party?.shortName ?? option.label;
    const slugForLogo = option.party?.slug ?? option.key;
    // "Other"/"NOTA"/"Undecided" are meta options rather than real contesting
    // parties — shown with a short generic abbreviation instead of their
    // full DB shortName, matching how the real party cards read (BJP, SP…).
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
    <div>
      <SurveyHero
        stateName={constituency.state.name}
        stateHref={statePath(state.slug)}
        districtName={constituency.district.name}
        districtHref={districtPath(state.slug, election.slug, constituency.district.slug)}
        constituencyName={constituency.name}
        constituencyNumber={constituency.number}
        electionYear={election.year}
        config={heroConfig}
      />
      <Container className="py-4 sm:py-5">
        <SurveyExperience
          surveyId={survey.id}
          constituencyName={constituency.name}
          stateName={constituency.state.name}
          stateSlug={state.slug}
          basePath={basePath}
          constituencySlug={slug}
          parties={parties}
          issues={issues}
          ageGroups={ageGroups}
          genders={genders}
          socialCategories={socialCategories}
          religions={religions}
        />
        <SurveyTrustStrip />
      </Container>
    </div>
  );
}
