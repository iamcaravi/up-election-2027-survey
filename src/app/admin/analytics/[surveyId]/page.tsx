import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSurveyAnalytics, type Distribution, type CrossTab } from "@/lib/premium-analytics";
import { Container } from "@/components/ui/Container";

// Internal engine-verification preview only — NOT the polished premium
// dashboard (that's a later phase). Plain tables, suppressed groups shown
// explicitly rather than hidden, no charts/animations.
export default async function AdminAnalyticsPreviewPage({ params }: { params: Promise<{ surveyId: string }> }) {
  const { surveyId } = await params;

  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
    select: {
      id: true,
      title: true,
      electionId: true,
      constituencyId: true,
      election: { select: { name: true, year: true, state: { select: { name: true } } } },
      constituency: { select: { name: true, number: true } },
    },
  });
  if (!survey || !survey.constituencyId) notFound();

  const analytics = await getSurveyAnalytics({
    id: survey.id,
    title: survey.title,
    electionId: survey.electionId,
    constituencyId: survey.constituencyId,
  });

  return (
    <Container className="max-w-4xl py-10">
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">
        Analytics Engine Preview (internal) · {survey.election.state.name} · {survey.election.name} · AC #{survey.constituency?.number} {survey.constituency?.name}
      </p>
      <h1 className="font-display text-2xl font-extrabold">{survey.title}</h1>
      <p className="mt-1 text-sm text-muted">
        Eligible responses: {analytics.summary.totalEligibleResponses} · Minimum cell size: {analytics.summary.minCellSize}
        {" "}(application privacy threshold, not a legal safe-harbour)
      </p>

      <Section title="Party Preference" distribution={analytics.partyPreference} />
      <Section title="Candidate Preference" distribution={analytics.candidatePreference} />
      <Section title="Gender Distribution" distribution={analytics.demographics.gender} />
      <Section title="Age Group Distribution" distribution={analytics.demographics.ageGroup} />
      <Section title="Social Category Distribution" distribution={analytics.demographics.socialCategory} />
      <Section title="Religion Distribution" distribution={analytics.demographics.religion} />
      <Section title="Top Issues" distribution={analytics.issues} />
      <Section title="MLA Performance" distribution={analytics.mlaPerformance} />
      <Section title="Re-election Preference" distribution={analytics.reelection} />

      <CrossTabSection title="Gender × Party Preference" crossTab={analytics.crossTabs.genderByParty} />
      <CrossTabSection title="Age Group × Party Preference" crossTab={analytics.crossTabs.ageGroupByParty} />
      <CrossTabSection title="Social Category × Party Preference" crossTab={analytics.crossTabs.socialCategoryByParty} />
      <CrossTabSection title="Religion × Party Preference" crossTab={analytics.crossTabs.religionByParty} />
      <CrossTabSection title="Top Issue × Party Preference" crossTab={analytics.crossTabs.issueByParty} />

      <p className="mt-8 rounded-xl border border-border bg-surface-2 p-4 text-xs leading-relaxed text-muted">
        Among survey respondents — this describes survey participants, not the full electorate, and is never an
        official election result or prediction.
      </p>
    </Container>
  );
}

function Section({ title, distribution }: { title: string; distribution: Distribution | null }) {
  return (
    <section className="mt-6 card-surface rounded-2xl p-5">
      <h2 className="font-display text-base font-bold">{title}</h2>
      {!distribution ? (
        <p className="mt-2 text-sm text-muted">This survey has no &quot;{title.toLowerCase()}&quot; question.</p>
      ) : distribution.suppressed ? (
        <p className="mt-2 text-sm text-muted">
          Suppressed — only {distribution.total} answered, below the minimum of {distribution.minRequired}.
        </p>
      ) : (
        <table className="mt-3 w-full text-left text-sm">
          <tbody>
            {distribution.buckets.map((b) => (
              <tr key={b.key} className="border-b border-border/60">
                <td className="py-1.5 pr-4">{b.label}</td>
                {b.suppressed ? (
                  <td className="py-1.5 text-right text-xs text-muted" colSpan={2}>
                    Suppressed (&lt;{distribution.minRequired})
                  </td>
                ) : (
                  <>
                    <td className="py-1.5 pr-4 text-muted">{b.count}</td>
                    <td className="py-1.5 text-right font-medium">{b.pct}%</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function CrossTabSection({ title, crossTab }: { title: string; crossTab: CrossTab | null }) {
  return (
    <section className="mt-6 card-surface rounded-2xl p-5">
      <h2 className="font-display text-base font-bold">{title}</h2>
      {!crossTab ? (
        <p className="mt-2 text-sm text-muted">Not available for this survey.</p>
      ) : crossTab.groups.length === 0 ? (
        <p className="mt-2 text-sm text-muted">No responses yet.</p>
      ) : (
        <div className="mt-3 space-y-4">
          {crossTab.groups.map((g) => (
            <div key={g.groupKey}>
              <p className="text-sm font-semibold">
                {g.groupLabel} <span className="font-normal text-muted">({g.total} respondents)</span>
              </p>
              {g.suppressed ? (
                <p className="mt-1 text-xs text-muted">Suppressed — below the minimum of {g.minRequired}.</p>
              ) : (
                <table className="mt-1 w-full text-left text-xs">
                  <tbody>
                    {g.breakdown.map((b) => (
                      <tr key={b.key} className="border-b border-border/40">
                        <td className="py-1 pr-4">{b.label}</td>
                        {b.suppressed ? (
                          <td className="py-1 text-right text-muted" colSpan={2}>
                            Suppressed (&lt;{g.minRequired})
                          </td>
                        ) : (
                          <>
                            <td className="py-1 pr-4 text-muted">{b.count}</td>
                            <td className="py-1 text-right font-medium">{b.pct}%</td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
