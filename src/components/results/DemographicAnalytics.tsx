"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Dimension = "age_group" | "gender" | "social_category" | "religion";
type Target = "candidate_choice" | "party_preference";

const DIMENSIONS: { key: Dimension; label: string }[] = [
  { key: "age_group", label: "Age Group" },
  { key: "gender", label: "Gender" },
  { key: "social_category", label: "Social Category" },
  { key: "religion", label: "Religion" },
];

interface GroupData {
  groupKey: string;
  groupLabel: string;
  total: number;
  sufficientSample: boolean;
  minRequired: number;
  candidateOptions: { key: string; label: string; count: number; pct: number; colorHex?: string }[];
  partyOptions: { key: string; label: string; count: number; pct: number; colorHex?: string }[];
}

export function DemographicAnalytics({ constituencySlug }: { constituencySlug: string }) {
  const [dimension, setDimension] = useState<Dimension>("age_group");
  const [target, setTarget] = useState<Target>("candidate_choice");
  const [data, setData] = useState<{ groups: GroupData[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/constituencies/${constituencySlug}/analytics?dimension=${dimension}&target=${target}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [constituencySlug, dimension, target]);

  return (
    <div className="card-surface rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {DIMENSIONS.map((d) => (
            <button
              key={d.key}
              onClick={() => setDimension(d.key)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                dimension === d.key ? "bg-ink text-white" : "bg-surface-2 text-muted hover:text-foreground"
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {(["candidate_choice", "party_preference"] as const).map((tg) => (
            <button
              key={tg}
              onClick={() => setTarget(tg)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                target === tg ? "border-ink text-ink" : "border-border text-muted hover:text-foreground"
              )}
            >
              {tg === "candidate_choice" ? "Candidate" : "Party"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 space-y-5">
        {loading && <p className="text-sm text-muted">Loading...</p>}
        {!loading && (!data || data.groups.length === 0) && (
          <p className="rounded-xl border border-dashed border-border bg-surface-2 p-6 text-center text-sm text-muted">
            No responses yet for this breakdown.
          </p>
        )}
        {!loading &&
          data?.groups.map((g) => {
            const options = target === "candidate_choice" ? g.candidateOptions : g.partyOptions;
            return (
              <div key={g.groupKey}>
                <p className="mb-2 text-sm font-semibold">{g.groupLabel}</p>
                {!g.sufficientSample ? (
                  <p className="rounded-lg bg-surface-2 px-3 py-2 text-xs text-muted">
                    Insufficient responses to display this breakdown (minimum {g.minRequired}).
                  </p>
                ) : (
                  <div className="space-y-2">
                    {options.slice(0, 4).map((o, i) => (
                      <div key={o.key}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span>{o.label}</span>
                          <span className="text-muted">{o.pct}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${o.pct}%` }}
                            transition={{ duration: 0.6, delay: i * 0.05 }}
                            className="h-full rounded-full"
                            style={{ background: o.colorHex ?? "var(--ink)" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
