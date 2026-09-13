"use client";

import { motion } from "framer-motion";
import { ArrowRight, Landmark } from "lucide-react";
import Link from "next/link";
import { displayStateName } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/LocaleProvider";

interface StateItem {
  slug: string;
  name: string;
  elections: Array<{ slug: string; name: string; status: string; year: number }>;
  _count: { districts: number; constituencies: number };
}

// Every genuinely configured state (from the DB, via getStates()) gets an
// equal card here — no hand-drawn per-state map glyph to maintain, and no
// hardcoded "coming soon" list unrelated to what's actually seeded. Adding a
// state to the platform is enough for it to show up here automatically.
export function StatesSection({ states }: { states: StateItem[] }) {
  const { locale, t } = useLocale();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">{t.statesSection.heading}</h2>
        <Link href="/states" className="hidden items-center gap-1.5 text-sm font-semibold text-accent sm:flex">
          {t.statesSection.viewAll} <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {states.map((state, i) => {
          const isOngoing = state.elections[0]?.status === "ONGOING";
          return (
            <motion.div
              key={state.slug}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              className={
                isOngoing
                  ? "flex items-center gap-3 rounded-2xl border-2 border-orange-300 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950/30"
                  : "flex items-center gap-3 rounded-2xl border border-border bg-surface-2 p-4"
              }
            >
              <span
                className={
                  isOngoing
                    ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-900/40"
                    : "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface text-muted"
                }
              >
                <Landmark size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-base font-bold text-foreground">
                  {displayStateName(state.name, state.slug, locale)}
                </p>
                <p className="text-xs text-muted">
                  {state.elections[0] ? `${t.statesSection.assemblyElection} ${state.elections[0].year}` : t.statesSection.comingSoon}
                </p>
                <Link
                  href={`/${state.slug}`}
                  className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:text-accent-2"
                >
                  {t.statesSection.viewNow} <ArrowRight size={12} />
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
