import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getStateAndElection, getDistricts } from "@/lib/data";
import { Container } from "@/components/ui/Container";
import { DistrictsListingText, DistrictCardCount } from "@/components/district/DistrictsListingText";
import { districtPath, electionPath, statePath } from "@/lib/routes";
import { DISTRICT_COLORS } from "@/lib/district-colors";
import { cn } from "@/lib/utils";
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
        <DistrictsListingText
          stateName={state.name}
          stateHref={statePath(state.slug)}
          electionName={election.name}
          electionHref={electionPath(state.slug, election.slug)}
          districtCount={districts.length}
          constituencyCount={districts.reduce((s, d) => s + d._count.constituencies, 0)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {districts.map((d, i) => {
          const palette = DISTRICT_COLORS[i % DISTRICT_COLORS.length];
          return (
            <Link
              key={d.slug}
              href={districtPath(state.slug, election.slug, d.slug)}
              className={cn(
                "group flex items-center justify-between rounded-2xl border p-4 shadow-sm transition-all duration-200",
                "hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40",
                palette.bg,
                palette.border,
                palette.hoverBorder
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", palette.icon)}>
                  <MapPin size={16} />
                </span>
                <div className="min-w-0">
                  <p className={cn("truncate font-semibold", palette.text)}>{d.name}</p>
                  <DistrictCardCount count={d._count.constituencies} />
                </div>
              </div>
              <ChevronRight size={16} className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
            </Link>
          );
        })}
      </div>
    </Container>
  );
}
