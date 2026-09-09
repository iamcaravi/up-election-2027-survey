"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { History } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { formatNumber } from "@/lib/utils";
import { SectionHeading } from "@/components/home/SectionHeading";

export interface HistoricalStateSummary {
  stateName: string;
  totalSeats: number;
  parties: Array<{ party: string; seats: number }>;
}

export function HistoricalElections({ items }: { items: HistoricalStateSummary[] }) {
  const { t } = useLocale();

  return (
    <>
      <SectionHeading eyebrow="Historical" title={t.home.historical.title} subtitle={t.home.historical.subtitle} />
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface-2 px-6 py-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <span className="flex items-center gap-2 text-sm text-muted">
            <History size={16} className="shrink-0" />
            {t.home.historical.empty}
          </span>
          <Link href="/methodology" className="shrink-0 text-sm font-semibold text-ink hover:underline underline-offset-4">
            {t.home.historical.emptyCta}
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((s, i) => (
            <motion.div
              key={s.stateName}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              className="rounded-2xl border border-border bg-surface-2 p-5"
            >
              <div className="flex items-center justify-between">
                <p className="font-display text-sm font-bold">{s.stateName}</p>
                <span className="text-xs text-muted">
                  {formatNumber(s.totalSeats)} {t.home.historical.seatsLabel}
                </span>
              </div>
              <ul className="mt-3 space-y-2">
                {s.parties.slice(0, 4).map((p) => {
                  const pct = s.totalSeats > 0 ? Math.round((p.seats / s.totalSeats) * 100) : 0;
                  return (
                    <li key={p.party}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium">{p.party}</span>
                        <span className="text-muted">{formatNumber(p.seats)}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-border/60">
                        <div className="h-full rounded-full bg-muted" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          ))}
        </div>
      )}
      <p className="mt-3 text-xs text-muted">{t.home.historical.note}</p>
    </>
  );
}
