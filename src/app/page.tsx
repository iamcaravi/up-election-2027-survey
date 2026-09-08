import Link from "next/link";
import { getHomeStats, getDistricts, getTrendingConstituencies } from "@/lib/data";
import { getStatewideTopIssues } from "@/lib/analytics";
import { Hero } from "@/components/home/Hero";
import { DistrictExplorer } from "@/components/map/DistrictExplorer";
import { SectionHeading } from "@/components/home/SectionHeading";
import { TrendingConstituencies } from "@/components/home/TrendingConstituencies";
import { TopIssues } from "@/components/home/TopIssues";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Container } from "@/components/ui/Container";

export const revalidate = 60;

export default async function Home() {
  const [stats, districts, trending, topIssues] = await Promise.all([
    getHomeStats(),
    getDistricts(),
    getTrendingConstituencies(6),
    getStatewideTopIssues(6),
  ]);

  const districtNodes = districts.map((d) => ({
    slug: d.slug,
    name: d.name,
    constituencyCount: d._count.constituencies,
    responseCount: 0,
  }));

  return (
    <div>
      <Hero stats={stats} />

      <Container className="py-16 sm:py-20">
        <DistrictExplorer districts={districtNodes} />
      </Container>

      <Container className="py-16 sm:py-20">
        <SectionHeading
          eyebrow="Explore"
          title="Trending Constituencies"
          subtitle="Ranked by real survey participation — never fabricated."
        />
        <TrendingConstituencies
          items={trending.map((c) => ({
            slug: c.slug,
            name: c.name,
            districtSlug: c.district.slug,
            districtName: c.district.name,
            responseCount: c._count.surveyResponses,
          }))}
        />
      </Container>

      <Container className="py-16 sm:py-20">
        <SectionHeading
          eyebrow="Issues"
          title="Top Issues Across UP"
          subtitle="What survey respondents say matters most in their constituency."
        />
        <TopIssues
          issues={topIssues.issues}
          sufficientSample={topIssues.sufficientSample}
          minRequired={topIssues.minRequired}
        />
      </Container>

      <Container className="py-16 sm:py-20">
        <SectionHeading eyebrow="How it works" title="सर्वे कैसे काम करता है" />
        <HowItWorks />
      </Container>

      <Container className="py-16 sm:py-20">
        <div className="grid gap-6 rounded-2xl border border-border bg-surface-2 p-8 sm:grid-cols-2">
          <div>
            <h3 className="font-display text-xl font-bold">Methodology</h3>
            <p className="mt-2 text-sm text-muted">
              Learn how responses are collected, validated, and how we protect against manipulation and small-sample
              disclosure.
            </p>
            <Link href="/methodology" className="mt-3 inline-block text-sm font-semibold text-ink underline underline-offset-4">
              Read the methodology →
            </Link>
          </div>
          <div>
            <h3 className="font-display text-xl font-bold">Disclaimer</h3>
            <p className="mt-2 text-sm text-muted">
              This platform presents results from voluntary online survey responses. Survey results are not official
              election results.
            </p>
            <Link href="/disclaimer" className="mt-3 inline-block text-sm font-semibold text-ink underline underline-offset-4">
              Full disclaimer →
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
