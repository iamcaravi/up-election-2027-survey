import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getStateAndElection, getDistricts } from "@/lib/data";
import { Container } from "@/components/ui/Container";
import { districtPath } from "@/lib/routes";
import { MapPin, ChevronRight } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; election: string }>;
}): Promise<Metadata> {
  const { state: stateSlug } = await params;
  const result = await getStateAndElection(stateSlug);
  if (!result) return {};
  return {
    title: `${result.state.name} — Explore Districts`,
    description: `Browse all districts of ${result.state.name} and their assembly constituencies.`,
  };
}

export const revalidate = 60;

export default async function DistrictsPage({
  params,
}: {
  params: Promise<{ state: string; election: string }>;
}) {
  const { state: stateSlug, election: electionSlug } = await params;
  const result = await getStateAndElection(stateSlug, electionSlug);
  if (!result?.election) notFound();
  const { state, election } = result;

  const { districts } = await getDistricts(stateSlug);

  return (
    <Container className="py-14">
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">{state.name}</p>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">सभी जिले</h1>
        <p className="mt-2 text-sm text-muted">
          {districts.length} districts · {districts.reduce((s, d) => s + d._count.constituencies, 0)} assembly constituencies
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {districts.map((d) => (
          <Link
            key={d.slug}
            href={districtPath(state.slug, election.slug, d.slug)}
            className="card-surface group flex items-center justify-between rounded-2xl p-4 transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink/10 text-ink">
                <MapPin size={16} />
              </span>
              <div>
                <p className="font-semibold group-hover:text-ink">{d.name}</p>
                <p className="text-xs text-muted">{d._count.constituencies} constituencies</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-muted transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </Container>
  );
}
