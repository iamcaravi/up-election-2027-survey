import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getConstituencyBySlug } from "@/lib/data";
import { getConstituencyResults } from "@/lib/analytics";
import { Container } from "@/components/ui/Container";
import { ResultBars } from "@/components/results/ResultBars";
import { DemographicAnalytics } from "@/components/results/DemographicAnalytics";
import { formatNumber, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Survey Results" };
export const revalidate = 10;

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ district: string; constituency: string }>;
}) {
  const { district: districtSlug, constituency: slug } = await params;
  const constituency = await getConstituencyBySlug(slug);
  if (!constituency || constituency.district.slug !== districtSlug) notFound();

  const results = await getConstituencyResults(constituency.id);

  return (
    <Container className="max-w-3xl py-12">
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">{constituency.district.name}</p>
      <h1 className="font-display text-3xl font-extrabold sm:text-4xl">{constituency.name} — सर्वे परिणाम</h1>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted">
        <span>Total valid responses: <strong className="text-foreground">{formatNumber(constituency._count.surveyResponses)}</strong></span>
        {results?.lastUpdated && <span>Last updated: {timeAgo(results.lastUpdated)}</span>}
        <Link href="/methodology" className="font-medium text-ink underline underline-offset-4">
          View methodology
        </Link>
      </div>

      <section className="mt-8 card-surface rounded-2xl p-6">
        <h2 className="font-display text-lg font-bold">Candidate Preference</h2>
        {results?.candidateResult && results.candidateResult.sufficientSample ? (
          <div className="mt-4">
            <ResultBars options={results.candidateResult.options} showLeaderNote />
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-border bg-surface-2 p-6 text-center text-sm text-muted">
            Not enough responses yet to show a reliable survey comparison.
          </p>
        )}
      </section>

      <section className="mt-6 card-surface rounded-2xl p-6">
        <h2 className="font-display text-lg font-bold">Party Preference</h2>
        {results?.partyResult && results.partyResult.sufficientSample ? (
          <div className="mt-4">
            <ResultBars options={results.partyResult.options} />
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-border bg-surface-2 p-6 text-center text-sm text-muted">
            Not enough responses yet to show a reliable survey comparison.
          </p>
        )}
      </section>

      <section className="mt-6 card-surface rounded-2xl p-6">
        <h2 className="font-display text-lg font-bold">Top Issues in this Constituency</h2>
        {results?.issueResult && results.issueResult.sufficientSample ? (
          <div className="mt-4">
            <ResultBars options={results.issueResult.options} />
          </div>
        ) : (
          <p className="mt-4 rounded-xl border border-dashed border-border bg-surface-2 p-6 text-center text-sm text-muted">
            Not enough responses yet to show a reliable survey comparison.
          </p>
        )}
      </section>

      <section className="mt-6">
        <h2 className="font-display text-lg font-bold">Demographic Analytics</h2>
        <p className="mt-1 text-sm text-muted">
          Among survey respondents in each group. This describes survey participants, not the full electorate.
        </p>
        <div className="mt-4">
          <DemographicAnalytics constituencySlug={slug} />
        </div>
      </section>
    </Container>
  );
}
