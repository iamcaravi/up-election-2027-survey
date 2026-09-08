"use client";

import { motion } from "framer-motion";
import type { OptionTally } from "@/lib/analytics";

export function ResultBars({ options, showLeaderNote }: { options: OptionTally[]; showLeaderNote?: boolean }) {
  const leader = options[0];
  return (
    <div>
      {showLeaderNote && leader && leader.count > 0 && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3">
          <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase text-[#241a04]">
            Survey Leader
          </span>
          <p className="text-sm">
            <strong>{leader.label}</strong> currently leads among survey respondents.
          </p>
        </div>
      )}
      <ul className="space-y-4">
        {options.map((o, i) => (
          <li key={o.key}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-medium">
                {o.colorHex && <span className="h-2 w-2 rounded-full" style={{ background: o.colorHex }} />}
                {o.label}
              </span>
              <span className="tabular-nums text-muted">
                {o.pct}% · {o.count}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${o.pct}%` }}
                transition={{ duration: 0.9, delay: i * 0.06, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: o.colorHex ?? "var(--ink)" }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
