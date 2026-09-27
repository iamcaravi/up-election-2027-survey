import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStateAndElection, getDistrictBySlug, getSiteSetting } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { DistrictDetailHero } from "@/components/district/detail/DistrictDetailHero";
import {
  DistrictConstituencyBrowser,
  type DistrictConstituencyItem,
} from "@/components/district/detail/DistrictConstituencyBrowser";
import { DistrictInfoStrip } from "@/components/district/detail/DistrictInfoStrip";
import { constituencyPath, statePath, districtPath, stateResultsPath } from "@/lib/routes";
import { ELIGIBLE_RESPONSE_STATUS } from "@/lib/enums";
import { REAL_DATA_SOURCE, SYNTHETIC_DATA_MODE_KEY, SYNTHETIC_DATA_SOURCE } from "@/lib/synthetic-data";
import { buildPageMetadata } from "@/lib/seo";
import { getServerLocale } from "@/lib/i18n/locale-cookie";
import { getDistrictDisplayName } from "@/lib/district-hindi";
import { displayStateName } from "@/lib/utils";
import { getCurrentMlaForConstituency } from "@/lib/current-mla";
import { getConstituencyDisplayName } from "@/lib/constituency-hindi";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; election: string; district: string }>;
}): Promise<Metadata> {
  const { state: stateSlug, election: electionSlug, district: districtSlug } = await params;
  const [result, locale] = await Promise.all([getStateAndElection(stateSlug, electionSlug), getServerLocale()]);
  if (!result?.election) return {};
  const district = await getDistrictBySlug(stateSlug, districtSlug, result.election.id);
  if (!district) return {};
  const name = getDistrictDisplayName(district.slug, district.name, locale);
  return buildPageMetadata({
    title: locale === "hi" ? `${name} — विधानसभा क्षेत्र` : `${name} — Assembly Constituencies`,
    description:
      locale === "hi"
        ? `${name} जिला: ${district.constituencies.length} विधानसभा क्षेत्र, उम्मीदवार और सार्वजनिक सर्वे परिणाम।`
        : `${name} district: ${district.constituencies.length} assembly constituencies, candidates and public survey results.`,
    path: districtPath(result.state.slug, result.election.slug, districtSlug),
  });
}

export const revalidate = 30;

export default async function DistrictPage({
  params,
}: {
  params: Promise<{ state: string; election: string; district: string }>;
}) {
  const { state: stateSlug, election: electionSlug, district: districtSlug } = await params;
  const [result, locale] = await Promise.all([getStateAndElection(stateSlug, electionSlug), getServerLocale()]);
  if (!result?.election) notFound();
  const { state, election } = result;

  const district = await getDistrictBySlug(stateSlug, districtSlug, election.id);
  if (!district) notFound();

  const hi = locale === "hi";
  const stateName = displayStateName(state.name, state.slug, locale);
  const districtName = getDistrictDisplayName(district.slug, district.name, locale);
  const constituencyIds = district.constituencies.map((c) => c.id);

  // Same response filter the public results pages use (eligible status +
  // the site's active real/demo data source), so the numbers here agree
  // with what a constituency's results page shows.
  const isSynthetic = await getSiteSetting<boolean>(SYNTHETIC_DATA_MODE_KEY, false);
  const [responseGroups, activeSurveyCount, mlaList] = await Promise.all([
    prisma.surveyResponse.groupBy({
      by: ["constituencyId"],
      where: {
        status: ELIGIBLE_RESPONSE_STATUS,
        dataSource: isSynthetic ? SYNTHETIC_DATA_SOURCE : REAL_DATA_SOURCE,
        survey: { electionId: election.id },
        constituencyId: { in: constituencyIds },
      },
      _count: { _all: true },
    }),
    prisma.survey.count({
      where: { electionId: election.id, constituencyId: { in: constituencyIds }, status: "ACTIVE", isActive: true },
    }),
    Promise.all(
      district.constituencies.map((c) =>
        getCurrentMlaForConstituency(
          {
            id: c.id,
            number: c.number,
            name: c.name,
            slug: c.slug,
            stateId: c.stateId,
            state: { slug: state.slug, name: state.name },
            currentMlaName: c.currentMlaName,
            currentMlaParty: c.currentMlaParty,
          },
          election.id
        )
      )
    ),
  ]);
  const responsesById = new Map(responseGroups.map((g) => [g.constituencyId, g._count._all]));
  const totalResponses = responseGroups.reduce((sum, g) => sum + g._count._all, 0);

  const constituencies: DistrictConstituencyItem[] = district.constituencies.map((c, i) => {
    const mla = mlaList[i];
    return {
      slug: c.slug,
      number: c.number,
      name: getConstituencyDisplayName(c.slug, c.name, locale),
      reservedStatus: c.reservedStatus,
      mlaName: mla?.name ?? c.currentMlaName ?? null,
      mlaParty: mla?.partyShortName ?? mla?.party ?? c.currentMlaParty ?? null,
      responseCount: responsesById.get(c.id) ?? 0,
      href: constituencyPath(state.slug, election.slug, c.slug),
    };
  });

  return (
    <div className="relative overflow-hidden bg-[#f4f7fd] pb-8 sm:pb-10">
      {/* Decorative CSS-only backdrop: faint dot grid + soft color blobs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute left-[30%] top-6 hidden h-40 w-72 bg-[radial-gradient(#c9d6ee_1.2px,transparent_1.2px)] [background-size:16px_16px] [mask-image:radial-gradient(closest-side,#000,transparent)] lg:block" />
        <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-violet-200/35 blur-3xl" />
        <div className="absolute right-4 top-40 h-24 w-24 rounded-full bg-orange-200/40 blur-2xl lg:hidden" />
        <div className="absolute -left-32 top-[420px] h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" />
      </div>

      <Container className="relative pt-4 sm:pt-5">
        <Breadcrumb
          items={[
            { label: hi ? "राज्य" : "States", href: "/rajya" },
            { label: stateName, href: statePath(state.slug) },
            // "जिले" → the district grid on the state page (the separate district
            // listing page is no longer part of the navigation flow).
            { label: hi ? "जिले" : "Districts", href: `${statePath(state.slug)}#district-explorer` },
            { label: districtName },
          ]}
        />

        <div className="mt-2 sm:mt-3">
          <DistrictDetailHero
            hi={hi}
            stateName={stateName}
            districtName={districtName}
            electionYear={election.year}
            constituencyCount={constituencies.length}
            responseCount={totalResponses}
            activeSurveyCount={activeSurveyCount}
          />
        </div>

        <div className="mt-5 sm:mt-6">
          <DistrictConstituencyBrowser hi={hi} districtName={districtName} constituencies={constituencies} />
        </div>

        <div className="mt-4 sm:mt-5">
          <DistrictInfoStrip hi={hi} resultsHref={stateResultsPath(state.slug)} participateHref="#district-constituencies" />
        </div>
      </Container>
    </div>
  );
}
