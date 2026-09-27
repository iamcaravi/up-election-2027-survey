import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStateAndElection } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/Container";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { ElectionOverviewHero } from "@/components/election/overview/ElectionOverviewHero";
import { ElectionStats } from "@/components/election/overview/ElectionStats";
import { ElectionMainCard } from "@/components/election/overview/ElectionMainCard";
import { ElectionExploreCards } from "@/components/election/overview/ElectionExploreCards";
import { ElectionAnnouncement } from "@/components/election/overview/ElectionAnnouncement";
import type { ElectionOverviewData } from "@/components/election/overview/shared";
import { districtsPath, electionPath, statePath } from "@/lib/routes";
import { buildPageMetadata } from "@/lib/seo";
import { getServerLocale } from "@/lib/i18n/locale-cookie";
import { displayStateName } from "@/lib/utils";

// The [election] segment accepts either an election slug
// (/uttar-pradesh/elections/assembly-2027) or a bare year
// (/uttar-pradesh/elections/2027). A year resolves to that state's active
// election for that year; every link on the page still uses the canonical
// election slug through src/lib/routes.ts.
async function resolveStateAndElection(stateSlug: string, electionParam: string) {
  const result = await getStateAndElection(stateSlug, electionParam);
  if (!result || result.election || !/^\d{4}$/.test(electionParam)) return result;
  const election = await prisma.election.findFirst({
    where: { stateId: result.state.id, year: Number(electionParam), isActive: true },
    orderBy: { createdAt: "desc" },
  });
  return { state: result.state, election };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; election: string }>;
}): Promise<Metadata> {
  const { state: stateSlug, election: electionParam } = await params;
  const [result, locale] = await Promise.all([resolveStateAndElection(stateSlug, electionParam), getServerLocale()]);
  if (!result?.election) return {};
  const stateName = displayStateName(result.state.name, result.state.slug, locale);
  const year = result.election.year;
  return buildPageMetadata({
    title: locale === "hi" ? `${stateName} विधानसभा चुनाव ${year}` : `${stateName} Assembly Election ${year}`,
    description:
      locale === "hi"
        ? `${stateName} विधानसभा चुनाव ${year} से जुड़ी जानकारी, क्षेत्रवार सर्वेक्षण और चुनाव संबंधित डेटा देखें।`
        : `Information, constituency-wise surveys and election data for the ${stateName} Assembly Election ${year}.`,
    path: electionPath(result.state.slug, result.election.slug),
  });
}

export const revalidate = 60;

export default async function ElectionPage({
  params,
}: {
  params: Promise<{ state: string; election: string }>;
}) {
  const { state: stateSlug, election: electionParam } = await params;
  const [result, locale] = await Promise.all([resolveStateAndElection(stateSlug, electionParam), getServerLocale()]);
  if (!result?.election) notFound();
  const { state, election } = result;
  const hi = locale === "hi";
  const stateName = displayStateName(state.name, state.slug, locale);

  const [electionConstituencyCount, stateConstituencyCount, districtCount, participantCount, respondingAreas] =
    await Promise.all([
      prisma.electionConstituency.count({ where: { electionId: election.id, isActive: true } }),
      prisma.constituency.count({ where: { stateId: state.id } }),
      prisma.district.count({ where: { stateId: state.id } }),
      prisma.surveyResponse.count({ where: { status: "VALID", survey: { electionId: election.id } } }),
      prisma.surveyResponse.groupBy({
        by: ["constituencyId"],
        where: { status: "VALID", survey: { electionId: election.id } },
      }),
    ]);

  const data: ElectionOverviewData = {
    hi,
    stateName,
    electionYear: election.year,
    electionStatus: election.status,
    electionDate: election.electionDate,
    districtCount,
    // Seats linked to this election; falls back to the state's seat count
    // only if the election has no constituency links yet.
    constituencyCount: electionConstituencyCount || stateConstituencyCount,
    surveyedAreaCount: respondingAreas.length,
    participantCount,
    links: {
      constituencies: `${electionPath(state.slug, election.slug)}/constituencies`,
      districts: districtsPath(state.slug, election.slug),
      // The state page's district → constituency selector, which routes
      // into /…/constituencies/[constituency]/survey.
      survey: `${statePath(state.slug)}#survey-selector`,
    },
  };

  return (
    <div className="bg-[#f4f7fb] pb-10 sm:pb-12">
      <Container className="pt-4 sm:pt-5">
        <Breadcrumb
          items={[
            { label: hi ? "राज्य" : "States", href: "/rajya" },
            { label: stateName, href: statePath(state.slug) },
            { label: hi ? `चुनाव ${election.year}` : `Election ${election.year}` },
          ]}
        />

        <div className="mt-3 sm:mt-4">
          <ElectionOverviewHero {...data} />
        </div>
        <div className="mt-6 sm:mt-7">
          <ElectionStats {...data} />
        </div>
        <div className="mt-4 sm:mt-5">
          <ElectionMainCard {...data} ctaHref={data.links.districts} />
        </div>
        <div className="mt-7 sm:mt-8">
          <ElectionExploreCards {...data} />
        </div>
        {!election.electionDate && (
          <div className="mt-4 sm:mt-5">
            <ElectionAnnouncement hi={hi} />
          </div>
        )}
      </Container>
    </div>
  );
}
