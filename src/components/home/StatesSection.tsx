"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { displayStateName } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { UPMapGlyph } from "./UPMapGlyph";

interface StateItem {
  slug: string;
  name: string;
  elections: Array<{ slug: string; name: string; status: string; year: number }>;
  _count: { districts: number; constituencies: number };
}

const COMING_SOON_STATES = [
  "पंजाब",
  "उत्तराखंड",
  "गोवा",
  "मणिपुर",
  "हिमाचल प्रदेश",
  "गुजरात",
];

function StateGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M9 6 L25 5 L29 10 L36 11 L35 19 L30 21 L31 27 L25 30 L22 36 L14 34 L11 28 L5 25 L6 16 L4 11 Z"
      />
    </svg>
  );
}

export function StatesSection({ states }: { states: StateItem[] }) {
  const { locale } = useLocale();
  const activeState = states.find((s) => s.elections[0]?.status === "ONGOING") ?? states[0] ?? null;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-foreground sm:text-3xl">वर्तमान में उपलब्ध राज्य</h2>
        <Link href="/states" className="hidden items-center gap-1.5 text-sm font-semibold text-accent sm:flex">
          सभी राज्य देखें <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr]">
        {activeState && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45 }}
            className="flex items-center gap-4 rounded-2xl border-2 border-orange-300 bg-orange-50 p-5 dark:border-orange-800 dark:bg-orange-950/30"
          >
            <UPMapGlyph className="h-14 w-20 shrink-0 text-orange-600" />
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-bold text-foreground">
                {displayStateName(activeState.name, activeState.slug, locale)}
              </p>
              <p className="text-sm text-muted">
                विधानसभा चुनाव {activeState.elections[0]?.year ?? ""}
              </p>
              <Link
                href={`/${activeState.slug}`}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-4 py-2 text-xs font-bold text-white hover:bg-orange-700"
              >
                अभी देखें <ArrowRight size={13} />
              </Link>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {COMING_SOON_STATES.map((name, i) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-surface-2 p-4 text-center opacity-70"
            >
              <StateGlyph className="h-9 w-9 text-muted" />
              <p className="text-sm font-semibold text-foreground">{name}</p>
              <p className="text-[11px] text-muted">जल्द आ रहा है</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
