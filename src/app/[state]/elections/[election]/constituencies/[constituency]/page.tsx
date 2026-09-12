import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStateAndElection, getConstituencyBySlug } from "@/lib/data";
import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";
import { CandidateCard } from "@/components/candidate/CandidateCard";
import { formatNumber } from "@/lib/utils";
import { electionPath } from "@/lib/routes";
import { Users } from "lucide-react";

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

      <Container className="py-12">
        <h2 className="font-display text-2xl font-bold">आप किसे विधायक देखना चाहते हैं?</h2>
        <p className="mt-1 text-sm text-muted">
          Candidate status reflects publicly available information at the time of listing. &quot;Potential
          Contender&quot; does not mean officially nominated.
        </p>

        {constituency.candidates.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface-2 p-10 text-center">
            <Users className="mx-auto mb-3 text-muted" size={28} />
            <p className="font-medium">No candidates listed yet for this constituency</p>
            <p className="mt-1 text-sm text-muted">
              Candidates are added once sourced and verified. You can still take the survey — an &quot;Other&quot;
              option is always available.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {constituency.candidates.map((c, i) => (
              <CandidateCard
                key={c.id}
                index={i}
                candidate={{
                  id: c.id,
                  name: c.name,
                  status: c.status,
                  confidenceScore: c.confidenceScore,
                  photoUrl: c.photoUrl,
                  photoVerified: c.photoVerified,
                  currentOffice: c.currentOffice,
                  background: c.background,
                  party: c.party ? { name: c.party.name, shortName: c.party.shortName, colorHex: c.party.colorHex } : null,
                }}
              />
            ))}
          </div>
        )}
      </Container>
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
