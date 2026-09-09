import { redirect, notFound } from "next/navigation";
import { getStateAndElection } from "@/lib/data";
import { districtPath, constituencyPath } from "@/lib/routes";

// Bridge target for legacy pre-migration UP URLs (see the `redirects()` in
// next.config.ts, which routes here after excluding the "elections" literal
// segment so this can never collide with the canonical
// /uttar-pradesh/elections/[election] route tree). Resolves the state's
// current election dynamically — not hard-coded — then redirects to the
// real state/election-aware URL.
export default async function LegacyBridge({ params }: { params: Promise<{ legacy: string[] }> }) {
  const { legacy } = await params;
  const result = await getStateAndElection("uttar-pradesh");
  if (!result?.election) notFound();
  const { election } = result;

  const [district, constituency, action] = legacy;

  if (legacy.length === 1) {
    redirect(districtPath("uttar-pradesh", election.slug, district));
  }

  if (legacy.length === 2) {
    redirect(constituencyPath("uttar-pradesh", election.slug, constituency));
  }

  if (legacy.length === 3 && (action === "survey" || action === "results")) {
    redirect(`${constituencyPath("uttar-pradesh", election.slug, constituency)}/${action}`);
  }

  notFound();
}
