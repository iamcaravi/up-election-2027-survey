import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStateAndElection } from "@/lib/data";
import { PremiumAnalyticsLanding } from "@/components/premium/PremiumAnalyticsLanding";
import { statePath } from "@/lib/routes";

export const metadata: Metadata = { title: "Premium Analytics" };
export const dynamic = "force-dynamic";

export default async function PremiumAnalyticsPage({
  params,
}: {
  params: Promise<{ state: string; election: string }>;
}) {
  const { state: stateSlug, election: electionSlug } = await params;
  const scopedElection = await getStateAndElection(stateSlug, electionSlug);
  if (!scopedElection?.election) notFound();

  const { state, election } = scopedElection;

  return (
    <PremiumAnalyticsLanding
      stateName={state.name}
      stateHref={statePath(state.slug)}
      electionLabel={`${election.year}`}
      ctaHref={statePath(state.slug)}
    />
  );
}
