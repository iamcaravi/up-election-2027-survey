import { notFound, redirect } from "next/navigation";
import { getStateAndElection } from "@/lib/data";
import { analysisPath } from "@/lib/routes";
import { Container } from "@/components/ui/Container";
import { AnalysisStateHeading, NoElectionForAnalysisNotice } from "@/components/analysis/AnalysisStateHeading";

// Thin redirect: resolves the state's current active election server-side,
// then forwards to the real analysis dashboard (analysisPath). This is what
// lets the Analysis landing page's state cards link to a stable
// `/analysis/[state]` URL without needing an election slug up front — the
// same reasoning as the legacy-bridge redirect elsewhere in this app.
export default async function AnalysisStateRedirect({
  params,
}: {
  params: Promise<{ state: string }>;
}) {
  const { state: stateSlug } = await params;
  const result = await getStateAndElection(stateSlug);
  if (!result) notFound();

  if (!result.election) {
    return (
      <Container className="py-12">
        <AnalysisStateHeading stateNameRaw={result.state.name} stateSlug={result.state.slug} />
        <div className="mt-8">
          <NoElectionForAnalysisNotice />
        </div>
      </Container>
    );
  }

  redirect(analysisPath(result.state.slug, result.election.slug));
}
