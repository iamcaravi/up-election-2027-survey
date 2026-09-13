"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Landmark } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { displayStateName, cn } from "@/lib/utils";
import { statePath } from "@/lib/routes";
import {
  PunjabGlyph,
  UttarakhandGlyph,
  GoaGlyph,
  ManipurGlyph,
  HimachalGlyph,
  GujaratGlyph,
} from "@/components/home/StateGlyphs";
import { UPMapGlyph } from "@/components/home/UPMapGlyph";

export interface StatesGridItem {
  slug: string;
  name: string;
  _count: { districts: number; constituencies: number };
}

// Reused, already-existing state silhouettes (src/components/home/StateGlyphs.tsx
// + UPMapGlyph.tsx) — no new icon assets invented. A state slug without a
// dedicated silhouette yet falls back to a generic Landmark icon rather than
// an invented/unrecognizable shape.
const STATE_GLYPHS: Record<string, (props: { className?: string }) => React.ReactElement> = {
  "uttar-pradesh": UPMapGlyph,
  punjab: PunjabGlyph,
  uttarakhand: UttarakhandGlyph,
  goa: GoaGlyph,
  manipur: ManipurGlyph,
  "himachal-pradesh": HimachalGlyph,
  gujarat: GujaratGlyph,
};

// One consistent, professional pastel/accent pair per card — assigned by
// POSITION (cycling through this fixed palette), not by hardcoding any
// individual state's name, so a newly-added state automatically gets a
// harmonious color without touching this component. Since getStates()
// already orders states alphabetically, this happens to line up with the
// reference design's exact per-state colors for the 7 states seeded today —
// that's a byproduct of alphabetical + palette order, not a special case.
const CARD_PALETTE = [
  { bg: "bg-blue-50", border: "border-blue-200", hoverBorder: "hover:border-blue-400", icon: "bg-white text-blue-600", accent: "bg-blue-600 text-white", text: "text-blue-900" },
  { bg: "bg-orange-50", border: "border-orange-200", hoverBorder: "hover:border-orange-400", icon: "bg-white text-orange-600", accent: "bg-orange-600 text-white", text: "text-orange-900" },
  { bg: "bg-emerald-50", border: "border-emerald-200", hoverBorder: "hover:border-emerald-400", icon: "bg-white text-emerald-600", accent: "bg-emerald-600 text-white", text: "text-emerald-900" },
  { bg: "bg-violet-50", border: "border-violet-200", hoverBorder: "hover:border-violet-400", icon: "bg-white text-violet-600", accent: "bg-violet-600 text-white", text: "text-violet-900" },
  { bg: "bg-rose-50", border: "border-rose-200", hoverBorder: "hover:border-rose-400", icon: "bg-white text-rose-600", accent: "bg-rose-600 text-white", text: "text-rose-900" },
  { bg: "bg-amber-50", border: "border-amber-200", hoverBorder: "hover:border-amber-400", icon: "bg-white text-amber-700", accent: "bg-amber-600 text-white", text: "text-amber-900" },
  { bg: "bg-cyan-50", border: "border-cyan-200", hoverBorder: "hover:border-cyan-400", icon: "bg-white text-cyan-600", accent: "bg-cyan-600 text-white", text: "text-cyan-900" },
] as const;

export function StatesGrid({ states }: { states: StatesGridItem[] }) {
  const { t, locale } = useLocale();
  const count = states.length;
  const subtitleTemplate = count === 1 ? t.statesPage.subtitleOne : t.statesPage.subtitleMany;
  const subtitle = subtitleTemplate.replace("{count}", String(count));

  return (
    <div>
      <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">{t.statesPage.eyebrow}</p>
          <h1 className="font-display text-4xl font-extrabold sm:text-5xl">{t.statesPage.heading}</h1>
          <p className="mt-2 text-sm text-muted">{subtitle}</p>
        </div>

        {/* Extremely light India-themed watermark — decorative only, no
            heavy image asset, kept subtle enough to never fight with the
            heading's readability. */}
        <div className="hidden shrink-0 items-center gap-5 lg:flex" aria-hidden="true">
          <svg viewBox="0 0 260 140" className="h-28 w-52 text-ink opacity-[0.08]">
            <circle cx="150" cy="60" r="46" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="150" cy="60" r="5" fill="currentColor" />
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i * Math.PI * 2) / 24;
              const x2 = 150 + Math.cos(angle) * 46;
              const y2 = 60 + Math.sin(angle) * 46;
              return <line key={i} x1={150} y1={60} x2={x2} y2={y2} stroke="currentColor" strokeWidth="1.5" />;
            })}
            <path d="M0 120 L20 95 L35 108 L55 80 L70 100 L95 70 L110 92 L130 78 L145 96 L165 82 L185 104 L205 88 L230 110 L260 92 L260 140 L0 140 Z" fill="currentColor" opacity="0.6" />
          </svg>
          <div className="flex items-center gap-3">
            <span className="h-14 w-1 rounded-full bg-gradient-to-b from-orange-500 via-transparent to-green-600 opacity-40" />
            <p className="font-display text-base font-bold leading-snug text-ink/70">
              {t.statesPage.decorativeLine1}
              <br />
              {t.statesPage.decorativeLine2}
            </p>
          </div>
        </div>
      </div>

      {states.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface-2 p-10 text-center text-sm text-muted">
          {t.statesPage.empty}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {states.map((s, i) => {
            const palette = CARD_PALETTE[i % CARD_PALETTE.length];
            const Glyph = STATE_GLYPHS[s.slug];
            return (
              <motion.div
                key={s.slug}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.35, delay: (i % 12) * 0.04 }}
              >
                <Link
                  href={statePath(s.slug)}
                  className={cn(
                    "group flex h-full items-center gap-4 rounded-2xl border p-5 shadow-sm transition-all duration-200",
                    "hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/40",
                    palette.bg,
                    palette.border,
                    palette.hoverBorder
                  )}
                >
                  <span className={cn("flex h-16 w-16 shrink-0 items-center justify-center rounded-xl shadow-sm", palette.icon)}>
                    {Glyph ? <Glyph className="h-9 w-9" /> : <Landmark size={30} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate font-display text-lg font-bold", palette.text)}>
                      {displayStateName(s.name, s.slug, locale)}
                    </p>
                    <p className="mt-0.5 text-sm leading-snug text-muted">
                      {s._count.districts} {t.stats.districts.toLowerCase()} · {s._count.constituencies} {t.district.assemblySeatsUnit}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110",
                      palette.accent
                    )}
                  >
                    <ChevronRight size={18} />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
