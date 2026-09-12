import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getStateAndElection, getDistrictsWithResponseCounts, getTrendingConstituencies } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";
import { DistrictExplorer } from "@/components/map/DistrictExplorer";
import { TrendingConstituencies } from "@/components/home/TrendingConstituencies";
import { SectionHeading } from "@/components/home/SectionHeading";
import { electionPath, districtsPath } from "@/lib/routes";
import { formatNumber } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state: slug } = await params;
  const result = await getStateAndElection(slug);
  if (!result) return {};
  return {
    title: `${result.state.name} Election Survey`,
    description: `${result.state.name}: districts, assembly constituencies, candidates and public survey${
      result.election ? ` for the ${result.election.name}` : ""
    }.`,
  };
}

export const revalidate = 60;

export default async function StatePage({ params }: { params: Promise<{ state: string }> }) {
  const { state: slug } = await params;
  const result = await getStateAndElection(slug);
  if (!result) notFound();
  const { state, election } = result;

  const [{ districts }, constituencyCount, responseCount, trending] = await Promise.all([
    getDistrictsWithResponseCounts(slug),
    prisma.constituency.count({ where: { stateId: state.id } }),
    prisma.surveyResponse.count({ where: { status: "VALID", constituency: { stateId: state.id } } }),
    getTrendingConstituencies(state.id, 6),
  ]);

  return (
    <div>
      <div className="border-b border-border bg-surface">
        <Container className="py-12">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">State</p>
          <h1 className="font-display text-3xl font-extrabold sm:text-5xl">{state.name}</h1>
          {election && (
            <p className="mt-2 text-sm text-muted">
              Current election: <span className="font-medium text-foreground">{election.name}</span> ({election.status.toLowerCase()})
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-6">
            <Stat label="Districts" value={districts.length} />
            <Stat label="Assembly Constituencies" value={constituencyCount} />
            <Stat label="Survey Responses" value={responseCount} />
          </div>

          {election && (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LinkButton href={districtsPath(state.slug, election.slug)} size="lg" variant="cta">
                Explore Districts
              </LinkButton>
              <LinkButton href={electionPath(state.slug, election.slug)} size="lg" variant="outline">
                Election Overview
              </LinkButton>
            </div>
          )}
        </Container>
      </div>

      <Container className="py-12">
        {election ? (
          <DistrictExplorer
            basePath={electionPath(state.slug, election.slug)}
            districts={districts}
            stateName={state.name}
          />
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-surface-2 p-10 text-center text-sm text-muted">
            No active election configured for this state yet.
          </div>
        )}
      </Container>

      {trending.length > 0 && (
        <Container className="pb-16">
          <SectionHeading
            eyebrow="Explore"
            title="Trending Constituencies"
            subtitle="Ranked by real survey participation in this state — never fabricated."
          />
          <TrendingConstituencies
            items={trending.map((c) => ({
              slug: c.slug,
              name: c.name,
              districtName: c.district.name,
              stateSlug: c.state.slug,
              electionSlug: c.electionSlug,
              responseCount: c._count.surveyResponses,
            }))}
          />
        </Container>
      )}

      <Container className="pb-16">
        <p className="text-sm text-muted">
          <Link href="/methodology" className="font-medium text-ink underline underline-offset-4">
            How survey results are collected and validated
          </Link>
        </p>
      </Container>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-display text-2xl font-extrabold">{formatNumber(value)}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
