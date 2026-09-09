import Link from "next/link";
import { getHomeStats, getStates } from "@/lib/data";
import { Hero } from "@/components/home/Hero";
import { SectionHeading } from "@/components/home/SectionHeading";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Container } from "@/components/ui/Container";
import { ArrowRight, MapPin } from "lucide-react";
import { statePath } from "@/lib/routes";

export const revalidate = 60;

export default async function Home() {
  const [stats, states] = await Promise.all([getHomeStats(), getStates()]);

  const stateItems = states.map((s) => ({
    slug: s.slug,
    name: s.name,
    shortName: s.shortName,
    districtCount: s._count.districts,
    constituencyCount: s._count.constituencies,
    activeElectionName: s.elections[0]?.name ?? null,
  }));

  return (
    <div>
      <Hero stats={stats} states={stateItems} />

      <Container className="py-16 sm:py-20">
        <SectionHeading
          eyebrow="States"
          title="Explore Elections by State"
          subtitle="Pick a state to see its districts, assembly constituencies, candidates and public survey."
        />
        {stateItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface-2 p-10 text-center text-sm text-muted">
            No states published yet.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stateItems.map((s) => (
              <Link
                key={s.slug}
                href={statePath(s.slug)}
                className="card-surface group flex flex-col rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink/10 text-ink">
                    <MapPin size={16} />
                  </span>
                  <p className="font-display text-lg font-bold group-hover:text-ink">{s.name}</p>
                </div>
                <p className="mt-3 text-sm text-muted">
                  {s.districtCount} districts · {s.constituencyCount} constituencies
                </p>
                {s.activeElectionName && (
                  <p className="mt-1 text-xs font-medium text-accent">{s.activeElectionName}</p>
                )}
                <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-ink opacity-0 transition-opacity group-hover:opacity-100">
                  Explore <ArrowRight size={14} />
                </div>
              </Link>
            ))}
          </div>
        )}
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
