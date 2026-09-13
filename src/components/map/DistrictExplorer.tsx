"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export interface DistrictNode {
  slug: string;
  name: string;
  constituencyCount: number;
  responseCount: number;
}

// A small, fixed rotation of soft-pastel/strong-accent pairs — deterministic
// per district (by position), not random, so the same district always gets
// the same color and the palette reads as one consistent design system
// rather than an arbitrary rainbow. Every entry uses only Tailwind's
// standard palette (already used elsewhere in this app, e.g. the results
// dashboard's banners) so this introduces no new design language.
const DISTRICT_COLORS = [
  { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-800", icon: "bg-blue-100 text-blue-600", hoverBorder: "hover:border-blue-400" },
  { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", icon: "bg-emerald-100 text-emerald-600", hoverBorder: "hover:border-emerald-400" },
  { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-900", icon: "bg-amber-100 text-amber-700", hoverBorder: "hover:border-amber-400" },
  { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-800", icon: "bg-rose-100 text-rose-600", hoverBorder: "hover:border-rose-400" },
  { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-800", icon: "bg-violet-100 text-violet-600", hoverBorder: "hover:border-violet-400" },
  { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-800", icon: "bg-teal-100 text-teal-600", hoverBorder: "hover:border-teal-400" },
  { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-900", icon: "bg-orange-100 text-orange-700", hoverBorder: "hover:border-orange-400" },
  { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-800", icon: "bg-indigo-100 text-indigo-600", hoverBorder: "hover:border-indigo-400" },
] as const;

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

      {districts.length === 0 ? (
        <p className="relative py-10 text-center text-sm text-muted">No districts configured for this state yet.</p>
      ) : (
        <div className="relative flex flex-wrap justify-center gap-3 sm:gap-4">
          {districts.map((d, i) => {
            const palette = DISTRICT_COLORS[i % DISTRICT_COLORS.length];
            return (
              <motion.button
                key={d.slug}
                type="button"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ delay: (i % 40) * 0.02, duration: 0.3, ease: "easeOut" }}
                onClick={() => router.push(`${basePath}/districts/${d.slug}`)}
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
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
