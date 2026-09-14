"use client";

import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { InlineState } from "@/components/results/ResultsDashboardParts";
import type { PartyMomentumItem } from "@/lib/state-analysis";

// A compact card grid summarizing, per party, whether support is rising,
// falling or stable month-over-month — derived purely from the same real
// trend data as the line chart above it (state-analysis.ts's
// computePartyMomentum, a pure function over the last two qualifying
// months). This is a description of an already-observed change, never a
// prediction: no "will win"/"leading towards victory" language anywhere.
export function PartyMomentum({ items }: { items: PartyMomentumItem[] }) {
  const { t, locale } = useLocale();

  if (items.length === 0) {
    return <InlineState>{t.analysisHub.notEnoughMomentumData}</InlineState>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => {
        const name = locale === "hi" && item.nameHindi ? item.nameHindi : item.label;
        const Icon = item.direction === "up" ? ArrowUp : item.direction === "down" ? ArrowDown : Minus;
        const toneClass =
          item.direction === "up" ? "text-positive bg-positive/10" : item.direction === "down" ? "text-danger bg-danger/10" : "text-muted bg-surface-2";
        return (
          <div key={item.partyKey} className="card-surface min-w-0 rounded-2xl p-4 text-center">
            <p className="truncate font-display text-sm font-bold text-ink">{name}</p>
            <p className="mt-2 font-display text-2xl font-extrabold tabular-nums text-ink">{item.currentPct}%</p>
            <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${toneClass}`}>
              <Icon size={12} />
              {item.changePp === null ? t.analysisHub.momentumNew : `${item.changePp > 0 ? "+" : ""}${item.changePp} pp`}
            </span>
          </div>
        );
      })}
    </div>
  );
}
