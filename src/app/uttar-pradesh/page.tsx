import Link from "next/link";
import type { Metadata } from "next";
import { getDistricts } from "@/lib/data";
import { Container } from "@/components/ui/Container";
import { MapPin, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Explore Districts",
  description: "Browse all 75 districts of Uttar Pradesh and their assembly constituencies for the 2027 public survey.",
};

export const revalidate = 60;

export default async function DistrictsPage() {
  const districts = await getDistricts();

  return (
    <Container className="py-14">
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">Uttar Pradesh</p>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">सभी जिले</h1>
        <p className="mt-2 text-sm text-muted">75 districts · 403 assembly constituencies</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {districts.map((d) => (
          <Link
            key={d.slug}
            href={`/uttar-pradesh/${d.slug}`}
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
