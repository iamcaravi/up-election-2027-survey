import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStateAndElection, getConstituencyBySlug } from "@/lib/data";
import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";
import { formatNumber } from "@/lib/utils";
import { electionPath } from "@/lib/routes";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; election: string; constituency: string }>;
}): Promise<Metadata> {
  const { state: stateSlug, election: electionSlug, constituency: slug } = await params;
  const c = await getConstituencyBySlug(stateSlug, slug, electionSlug);
  if (!c) return {};
  return {
    title: `${c.name} Election Survey`,
    description: `${c.name} Assembly constituency (${c.district.name}, ${c.state.name}) public survey, candidate preferences, key issues and constituency-level survey trends.`,
    openGraph: {
      title: `${c.name} Survey`,
      description: `Public survey for ${c.name} assembly constituency, ${c.district.name} district, ${c.state.name}.`,
    },
  };
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
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Assembly Constituency #{constituency.number} · {constituency.district.name}, {constituency.state.name}
          </p>
          <h1 className="font-display text-3xl font-extrabold sm:text-5xl">{constituency.name}</h1>

          <div className="mt-6 flex flex-wrap gap-6">
            <InfoStat label="Reservation" value={constituency.reservedStatus === "None" ? "Unreserved" : constituency.reservedStatus} />
            <InfoStat label="Current MLA" value={constituency.currentMlaName ?? "Not on record"} />
            <InfoStat
              label="2022 Result"
              value={
                constituency.result2022WinnerName
                  ? `${constituency.result2022WinnerName} (${constituency.result2022WinnerParty ?? "—"})`
                  : "Not verified"
              }
            />
            <InfoStat label="Survey Responses" value={formatNumber(constituency._count.surveyResponses)} />
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <LinkButton href={`${basePath}/constituencies/${slug}/survey`} size="lg" variant="cta">
              सर्वे में भाग लें
            </LinkButton>
            <LinkButton href={`${basePath}/constituencies/${slug}/results`} size="lg" variant="outline">
              परिणाम देखें
            </LinkButton>
          </div>
        </Container>
      </div>
    </div>
  );
}

function InfoStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-display text-lg font-bold">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
