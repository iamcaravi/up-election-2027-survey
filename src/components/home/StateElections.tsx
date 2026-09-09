"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Calendar, Landmark, Building2 } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { statePath, electionPath, districtsPath } from "@/lib/routes";
import { displayStateName, formatNumber } from "@/lib/utils";
import { SectionHeading } from "@/components/home/SectionHeading";

export interface StateElectionItem {
  slug: string;
  name: string;
  districtCount: number;
  constituencyCount: number;
  activeElection: { slug: string; name: string; year: number; status: string } | null;
}

const STATUS_LABEL: Record<string, string> = {
  UPCOMING: "Upcoming",
  ONGOING: "Ongoing",
  COMPLETED: "Completed",
};

export function StateElections({ items }: { items: StateElectionItem[] }) {
  const { t, locale } = useLocale();

  if (items.length === 0) {
    return (
      <>
        <SectionHeading eyebrow={t.home.stateElections.eyebrow} title={t.home.stateElections.title} subtitle={t.home.stateElections.subtitle} />
        <div className="rounded-2xl border border-dashed border-border bg-surface-2 p-10 text-center text-sm text-muted">
          {t.home.stateElections.empty}
        </div>
      </>
    );
  }

  // Single-state (UP-first) launch: one focused block rather than a card
  // grid. Once more states are configured this automatically falls back to
  // the general grid below — no code change needed when that happens.
  if (items.length === 1) {
    const s = items[0];
    const stateName = displayStateName(s.name, s.slug, locale);
    const districtsHref = s.activeElection ? districtsPath(s.slug, s.activeElection.slug) : statePath(s.slug);
    const constituenciesHref = s.activeElection
      ? `${electionPath(s.slug, s.activeElection.slug)}/constituencies`
      : statePath(s.slug);

    return (
      <>
        <SectionHeading
          eyebrow={t.home.stateElections.eyebrow}
          title={`${stateName} ${s.activeElection ? s.activeElection.year : ""}`.trim()}
          subtitle={t.home.stateElections.focusSubtitle}
        />
        <div className="card-surface rounded-2xl p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ink/10 text-ink">
                <MapPin size={22} />
              </span>
              <div>
                <p className="font-display text-xl font-bold">{stateName}</p>
                {s.activeElection && (
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
                    <Calendar size={13} />
                    {s.activeElection.name} · {s.activeElection.year}
                    <span className="ml-1 rounded-full border border-border bg-surface-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                      {STATUS_LABEL[s.activeElection.status] ?? s.activeElection.status}
                    </span>
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-6 sm:gap-8">
              <div>
                <p className="font-display text-2xl font-extrabold">{formatNumber(s.districtCount)}</p>
                <p className="text-xs text-muted">{t.home.stateElections.districtsLabel}</p>
              </div>
              <div>
                <p className="font-display text-2xl font-extrabold">{formatNumber(s.constituencyCount)}</p>
                <p className="text-xs text-muted">{t.home.stateElections.constituenciesLabel}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row">
            <Link
              href={districtsHref}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-surface-2"
            >
              <Landmark size={14} /> {t.home.stateElections.districtsCta}
            </Link>
            <Link
              href={constituenciesHref}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-surface-2"
            >
              <Building2 size={14} /> {t.home.stateElections.constituenciesCta}
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SectionHeading eyebrow={t.home.stateElections.eyebrow} title={t.home.stateElections.title} subtitle={t.home.stateElections.subtitle} />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((s, i) => {
          const stateName = displayStateName(s.name, s.slug, locale);
          const href = s.activeElection ? electionPath(s.slug, s.activeElection.slug) : statePath(s.slug);
          return (
            <motion.div
              key={s.slug}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <Link
                href={href}
                className="card-surface group flex h-full flex-col rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink/10 text-ink">
                      <MapPin size={18} />
                    </span>
                    <div>
                      <p className="font-display text-lg font-bold group-hover:text-ink">{stateName}</p>
                      {s.activeElection ? (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                          <Calendar size={11} />
                          {s.activeElection.name} · {s.activeElection.year}
                        </p>
                      ) : (
                        <p className="mt-0.5 text-xs text-muted">No active election configured</p>
                      )}
                    </div>
                  </div>
                  {s.activeElection && (
                    <span className="shrink-0 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
                      {STATUS_LABEL[s.activeElection.status] ?? s.activeElection.status}
                    </span>
                  )}
                </div>

                <div className="mt-5 flex items-center gap-5 text-sm text-muted">
                  <span>
                    <span className="font-semibold text-foreground">{formatNumber(s.districtCount)}</span>{" "}
                    {t.home.stateElections.districtsLabel}
                  </span>
                  <span>
                    <span className="font-semibold text-foreground">{formatNumber(s.constituencyCount)}</span>{" "}
                    {t.home.stateElections.constituenciesLabel}
                  </span>
                </div>

                <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-ink opacity-80 transition-opacity group-hover:opacity-100">
                  {t.home.stateElections.cta} <ArrowRight size={14} />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}
