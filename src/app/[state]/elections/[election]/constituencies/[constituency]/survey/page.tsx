import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStateAndElection, getConstituencyBySlug, getFullSurveyForConstituency, getSiteSetting } from "@/lib/data";
import { SurveyHero } from "@/components/survey/SurveyHero";
import { SurveyExperience, type SurveyOptionItem } from "@/components/survey/SurveyExperience";
import { SurveyTrustStrip } from "@/components/survey/SurveyTrustStrip";
import { Container } from "@/components/ui/Container";
import { electionPath, districtPath, statePath } from "@/lib/routes";
import { getPartyLogoUrl, getPartyDisplayName, getPartyDisplayPriority } from "@/lib/party-logos";
import { getIssueIcon } from "@/lib/survey-issue-icons";
import {
  SURVEY_HERO_ELEMENTS_KEY,
  surveyHeroElementsOverrideKey,
  normalizeHeroElementsConfig,
  DEFAULT_HERO_ELEMENTS_CONFIG,
} from "@/lib/survey-hero-elements-config";

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

  const [globalHeroConfigRaw, heroConfigOverrideRaw] = await Promise.all([
    getSiteSetting(SURVEY_HERO_ELEMENTS_KEY, DEFAULT_HERO_ELEMENTS_CONFIG),
    getSiteSetting<unknown>(surveyHeroElementsOverrideKey(constituency.id), null),
  ]);
  const heroConfig = normalizeHeroElementsConfig(heroConfigOverrideRaw ?? globalHeroConfigRaw);

  const basePath = electionPath(state.slug, election.slug);
  const questionByKey = new Map(survey.questions.map((q) => [q.key, q]));

  const partyOptions = [...(questionByKey.get("party_preference")?.options ?? [])].sort(
    (a, b) =>
      getPartyDisplayPriority(a.party?.slug ?? a.key) - getPartyDisplayPriority(b.party?.slug ?? b.key)
  );
  const parties: SurveyOptionItem[] = partyOptions.map((option) => {
    const shortName = option.party?.shortName ?? option.label;
    const slugForLogo = option.party?.slug ?? option.key;
    // "Other"/"Undecided" are meta options rather than real contesting
    // parties — shown with a short generic abbreviation instead of their
    // full DB shortName, matching how the real party cards read (BJP, SP…).
    const abbreviation = slugForLogo === "other" ? "OTH" : slugForLogo === "undecided" ? "N/A" : shortName;
    return {
      key: option.key,
      label: abbreviation,
      subLabel: getPartyDisplayName(slugForLogo, option.party?.name ?? option.label),
      logoUrl: getPartyLogoUrl(shortName, slugForLogo),
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
