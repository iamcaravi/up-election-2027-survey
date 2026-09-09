"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, MapPin, ArrowRight } from "lucide-react";
import { statePath } from "@/lib/routes";

interface StateItem {
  slug: string;
  name: string;
  shortName: string | null;
  districtCount: number;
  constituencyCount: number;
  activeElectionName: string | null;
}

export function StateSelector({ states }: { states: StateItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative mx-auto w-full max-w-md">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-5 py-4 text-left shadow-[var(--shadow-soft)] transition-colors hover:bg-surface-2"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink/10 text-ink">
            <MapPin size={16} />
          </span>
          <span>
            <span className="block text-xs text-muted">Select a state</span>
            <span className="block font-display text-base font-bold">Browse elections by state</span>
          </span>
        </span>
        <ChevronDown size={18} className={`text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-[var(--shadow-soft)]"
          >
            {states.length === 0 && (
              <p className="px-5 py-6 text-center text-sm text-muted">No states published yet.</p>
            )}
            {states.map((s) => (
              <button
                key={s.slug}
                onClick={() => {
                  setOpen(false);
                  router.push(statePath(s.slug));
                }}
                className="flex w-full items-center justify-between gap-3 border-b border-border/60 px-5 py-3.5 text-left transition-colors last:border-b-0 hover:bg-surface-2"
              >
                <span>
                  <span className="block font-semibold">{s.name}</span>
                  <span className="block text-xs text-muted">
                    {s.districtCount} districts · {s.constituencyCount} constituencies
                    {s.activeElectionName ? ` · ${s.activeElectionName}` : ""}
                  </span>
                </span>
                <ArrowRight size={15} className="shrink-0 text-muted" />
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
