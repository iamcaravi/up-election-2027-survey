"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cn, formatNumber } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/LocaleProvider";

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
}: {
  districts: DistrictNode[];
  basePath: string;
  stateName: string;
}) {
  const { t } = useLocale();
  const router = useRouter();
  const [hovered, setHovered] = useState<DistrictNode | null>(null);

  const maxResponses = useMemo(() => Math.max(1, ...districts.map((d) => d.responseCount)), [districts]);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-6 sm:p-10">
      {/* soft ambient glow, purely decorative */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full opacity-70 blur-3xl"
        style={{ background: "radial-gradient(closest-side, var(--map-glow), transparent)" }}
      />

      <div className="relative flex flex-col gap-1 pb-6 text-center">
        <h3 className="font-display text-2xl font-extrabold sm:text-3xl">{stateName} {t.map.titleSuffix}</h3>
        <p className="text-sm text-muted">{t.map.subtitle} · {districts.length} {t.stats.districts.toLowerCase()}</p>
      </div>

      <div className="relative grid grid-cols-5 gap-2.5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12">
        {districts.map((d, i) => {
          const intensity = d.responseCount / maxResponses;
          return (
            <motion.button
              key={d.slug}
              initial={{ opacity: 0, scale: 0.6 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ delay: (i % 40) * 0.012, duration: 0.35, ease: "easeOut" }}
              onMouseEnter={() => setHovered(d)}
              onMouseLeave={() => setHovered((h) => (h?.slug === d.slug ? null : h))}
              onClick={() => router.push(`${basePath}/districts/${d.slug}`)}
              className={cn(
                "group relative aspect-square rounded-lg border transition-all duration-200",
                "hover:scale-110 hover:z-10 hover:shadow-[var(--shadow-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40"
              )}
              style={{
                borderColor: "color-mix(in oklab, var(--ink) 18%, var(--border))",
                background:
                  d.responseCount > 0
                    ? `color-mix(in oklab, var(--ink) ${8 + intensity * 55}%, var(--surface))`
                    : "color-mix(in oklab, var(--ink) 5%, var(--surface-2))",
              }}
              aria-label={`${d.name}: ${d.constituencyCount} constituencies`}
            >
              {d.responseCount > 0 && (
                <span
                  className="absolute inset-0 rounded-lg animate-pulse"
                  style={{
                    boxShadow: `0 0 0 2px color-mix(in oklab, var(--accent) ${intensity * 70}%, transparent)`,
                  }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="relative mt-6 flex min-h-14 items-center justify-center rounded-xl border border-border bg-surface-2 px-4 text-center">
        {hovered ? (
          <div>
            <p className="font-display text-base font-bold">{hovered.name}</p>
            <p className="text-xs text-muted">
              {hovered.constituencyCount} {t.district.constituencies.toLowerCase()} ·{" "}
              {hovered.responseCount > 0
                ? `${formatNumber(hovered.responseCount)} ${t.stats.responses.toLowerCase()}`
                : "No responses yet"}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted">Hover or tap a tile to preview a district, click to explore.</p>
        )}
      </div>
    </div>
  );
}
