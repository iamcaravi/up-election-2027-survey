"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { DISTRICT_COLORS } from "@/lib/district-colors";
import { StateMap } from "@/components/map/StateMap";

export interface DistrictNode {
  slug: string;
  name: string;
  constituencyCount: number;
  responseCount: number;
}

export function DistrictExplorer({
  districts,
  basePath,
  stateName,
  stateSlug,
}: {
  districts: DistrictNode[];
  basePath: string;
  stateName: string;
  stateSlug?: string;
}) {
  const { t } = useLocale();

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 sm:p-10">
      {/* soft ambient glow, purely decorative */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full opacity-70 blur-3xl"
        style={{ background: "radial-gradient(closest-side, var(--map-glow), transparent)" }}
      />

      <div className="relative flex flex-col items-center gap-1 pb-6 text-center">
        {stateSlug && (
          <div className="mb-2 flex items-center justify-center">
            <StateMap
              slug={stateSlug}
              className="h-28 sm:h-36 w-auto max-w-[220px] text-ink/80 dark:text-white/80 drop-shadow-sm transition-transform duration-300 hover:scale-105"
            />
          </div>
        )}
        <h3 className="font-display text-2xl font-extrabold sm:text-3xl">{stateName} {t.map.titleSuffix}</h3>
        <p className="text-sm text-muted">{t.map.subtitle} · {districts.length} {t.stats.districts.toLowerCase()}</p>
      </div>

      {districts.length === 0 ? (
        <p className="relative py-10 text-center text-sm text-muted">{t.hierarchy.noDistrictsYet}</p>
      ) : (
        <div className="relative flex flex-wrap justify-center gap-3 sm:gap-4">
          {districts.map((d, i) => {
            const palette = DISTRICT_COLORS[i % DISTRICT_COLORS.length];
            return (
              <motion.div
                key={d.slug}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ delay: (i % 40) * 0.02, duration: 0.3, ease: "easeOut" }}
              >
                <Link
                  href={`${basePath}/districts/${d.slug}`}
                  className={cn(
                    "group flex w-[148px] flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all duration-200 sm:w-[168px]",
                    "hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40",
                    palette.bg,
                    palette.border,
                    palette.hoverBorder
                  )}
                >
                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", palette.icon)}>
                    <MapPin size={16} />
                  </span>
                  <div className="min-w-0">
                    <p className={cn("truncate font-display text-sm font-bold leading-tight", palette.text)}>{d.name}</p>
                    <p className="mt-1 text-xs text-muted">
                      {formatNumber(d.constituencyCount)} {t.district.assemblySeatsUnit}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
