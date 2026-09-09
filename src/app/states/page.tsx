import Link from "next/link";
import type { Metadata } from "next";
import { getStates } from "@/lib/data";
import { Container } from "@/components/ui/Container";
import { statePath } from "@/lib/routes";
import { MapPin, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "States",
  description: "Browse every state on the India Election Survey platform.",
};

export const revalidate = 60;

export default async function StatesPage() {
  const states = await getStates();

  return (
    <Container className="py-14">
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent">India</p>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">States</h1>
        <p className="mt-2 text-sm text-muted">{states.length} state{states.length === 1 ? "" : "s"} published</p>
      </div>

      {states.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-2 p-10 text-center text-sm text-muted">
          No states published yet.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {states.map((s) => (
            <Link
              key={s.slug}
              href={statePath(s.slug)}
              className="card-surface group flex items-center justify-between rounded-2xl p-4 transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink/10 text-ink">
                  <MapPin size={16} />
                </span>
                <div>
                  <p className="font-semibold group-hover:text-ink">{s.name}</p>
                  <p className="text-xs text-muted">
                    {s._count.districts} districts · {s._count.constituencies} constituencies
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-muted transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}
