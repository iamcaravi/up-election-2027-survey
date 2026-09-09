import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStateAndElection } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";
import { districtsPath } from "@/lib/routes";
import { formatNumber } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; election: string }>;
}): Promise<Metadata> {
  const { state: stateSlug, election: electionSlug } = await params;
  const result = await getStateAndElection(stateSlug, electionSlug);
  if (!result?.election) return {};
  return {
    title: result.election.name,
    description: result.election.description ?? `${result.election.name} — public survey and candidate information.`,
  };
}

export const revalidate = 60;

export default async function ElectionPage({
  params,
}: {
  params: Promise<{ state: string; election: string }>;
}) {
  const { state: stateSlug, election: electionSlug } = await params;
  const result = await getStateAndElection(stateSlug, electionSlug);
  if (!result?.election) notFound();
  const { state, election } = result;

  const [constituencyCount, districtCount, responseCount] = await Promise.all([
    prisma.electionConstituency.count({ where: { electionId: election.id, isActive: true } }),
    prisma.district.count({ where: { stateId: state.id } }),
    prisma.surveyResponse.count({ where: { status: "VALID", survey: { electionId: election.id } } }),
  ]);

  return (
    <div>
      <div className="border-b border-border bg-surface">
        <Container className="py-12">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            {state.name} · {election.electionType.replace("_", " ")} · {election.year}
          </p>
          <h1 className="font-display text-3xl font-extrabold sm:text-5xl">{election.name}</h1>
          {election.description && <p className="mt-3 max-w-2xl text-sm text-muted">{election.description}</p>}

          <div className="mt-6 flex flex-wrap gap-6">
            <Stat label="Status" value={election.status} />
            <Stat label="Districts" value={String(districtCount)} />
            <Stat label="Constituencies" value={String(constituencyCount)} />
            <Stat label="Survey Responses" value={formatNumber(responseCount)} />
          </div>

          <div className="mt-8">
            <LinkButton href={districtsPath(state.slug, election.slug)} size="lg" variant="primary">
              Explore Districts &amp; Take the Survey
            </LinkButton>
          </div>
        </Container>
      </div>

      <Container className="py-12">
        <p className="rounded-xl border border-border bg-surface-2 p-4 text-xs leading-relaxed text-muted">
          Survey results shown for this election reflect voluntary respondent participation only. They are not an
          official election result and must not be read as a prediction of the actual outcome.
        </p>
      </Container>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-display text-2xl font-extrabold">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
