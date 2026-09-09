"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Users, ArrowRight } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/LocaleProvider";

interface ConstituencyItem {
  id: string;
  slug: string;
  number: number;
  name: string;
  reservedStatus: string;
  currentMlaName: string | null;
  currentMlaParty: string | null;
  responseCount: number;
  candidateCount: number;
}

export function ConstituencyGrid({
  basePath,
  constituencies,
}: {
  basePath: string;
  constituencies: ConstituencyItem[];
}) {
  const { t } = useLocale();
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {constituencies.map((c, i) => (
        <motion.div
          key={c.id}
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4, delay: (i % 9) * 0.06 }}
        >
          <Link
            href={`${basePath}/constituencies/${c.slug}`}
            className="card-surface group flex h-full flex-col rounded-2xl p-5 transition-all duration-200 hover:-translate-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold text-muted">
                AC #{c.number}
              </span>
              {c.reservedStatus !== "None" && (
                <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-[#8a6a15] dark:text-accent-2">
                  {c.reservedStatus}
                </span>
              )}
            </div>

            <p className="mt-3 font-display text-lg font-bold group-hover:text-ink">{c.name}</p>

            <p className="mt-1 text-sm text-muted">
              {c.currentMlaName ? `${t.district.currentMla}: ${c.currentMlaName}` : "MLA not yet on record"}
              {c.currentMlaParty ? ` (${c.currentMlaParty})` : ""}
            </p>

            <div className="mt-auto flex items-center justify-between pt-4 text-sm">
              <span className="inline-flex items-center gap-1.5 text-muted">
                <Users size={14} /> {c.candidateCount} candidates
              </span>
              <span className="font-medium">
                {c.responseCount > 0 ? `${formatNumber(c.responseCount)} responses` : "No responses yet"}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-ink opacity-0 transition-opacity group-hover:opacity-100">
              {t.district.viewConstituency} <ArrowRight size={14} />
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
