"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { displayStateName } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { UPMapGlyph } from "./UPMapGlyph";
import {
  PunjabGlyph,
  UttarakhandGlyph,
  GoaGlyph,
  ManipurGlyph,
  HimachalGlyph,
  GujaratGlyph,
} from "./StateGlyphs";

interface StateItem {
  slug: string;
  name: string;
  elections: Array<{ slug: string; name: string; status: string; year: number }>;
  _count: { districts: number; constituencies: number };
}

const COMING_SOON_STATES = [
  { hi: "पंजाब", en: "Punjab", Glyph: PunjabGlyph },
  { hi: "उत्तराखंड", en: "Uttarakhand", Glyph: UttarakhandGlyph },
  { hi: "गोवा", en: "Goa", Glyph: GoaGlyph },
  { hi: "मणिपुर", en: "Manipur", Glyph: ManipurGlyph },
  { hi: "हिमाचल प्रदेश", en: "Himachal Pradesh", Glyph: HimachalGlyph },
  { hi: "गुजरात", en: "Gujarat", Glyph: GujaratGlyph },
];

export function StatesSection({ states }: { states: StateItem[] }) {
  const { locale, t } = useLocale();
  const activeState = states.find((s) => s.elections[0]?.status === "ONGOING") ?? states[0] ?? null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">{t.statesSection.heading}</h2>
        <Link href="/states" className="hidden items-center gap-1.5 text-sm font-semibold text-accent sm:flex">
          {t.statesSection.viewAll} <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_1.6fr]">
        {activeState && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45 }}
            className="flex items-center gap-3 rounded-2xl border-2 border-orange-300 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950/30"
          >
            <UPMapGlyph className="h-12 w-16 shrink-0 text-orange-600" />
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-bold text-foreground">
                {displayStateName(activeState.name, activeState.slug, locale)}
              </p>
              <p className="text-sm text-muted">
                {t.statesSection.assemblyElection} {activeState.elections[0]?.year ?? ""}
              </p>
              <Link
                href={`/${activeState.slug}`}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-700"
              >
                {t.statesSection.viewNow} <ArrowRight size={13} />
              </Link>
            </div>
          </motion.div>
        )}

        <div className="flex gap-2.5 overflow-x-auto pb-2 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0 lg:grid-cols-6">
          {COMING_SOON_STATES.map((state, i) => {
            const Glyph = state.Glyph;
            const name = locale === "hi" ? state.hi : state.en;
            return (
              <motion.div
                key={state.en}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                className="flex w-[130px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-surface-2 p-3 text-center opacity-70 sm:w-auto sm:shrink"
              >
                <Glyph className="h-8 w-8 text-muted" />
                <p className="text-sm font-semibold text-foreground">{name}</p>
                <p className="text-[11px] text-muted">{t.statesSection.comingSoon}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
