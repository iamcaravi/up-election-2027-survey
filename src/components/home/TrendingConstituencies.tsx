"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface TrendingItem {
  slug: string;
  name: string;
  districtSlug: string;
  districtName: string;
  responseCount: number;
}

export function TrendingConstituencies({ items }: { items: TrendingItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface-2 p-10 text-center">
        <TrendingUp className="mx-auto mb-3 text-muted" size={28} />
        <p className="font-medium">No survey data yet</p>
        <p className="mt-1 text-sm text-muted">Be the first person to participate.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((c, i) => (
        <motion.div
          key={c.slug}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.4, delay: i * 0.05 }}
        >
          <Link
            href={`/uttar-pradesh/${c.districtSlug}/${c.slug}`}
            className="card-surface group block rounded-2xl p-5 transition-transform duration-200 hover:-translate-y-1"
          >
            <div className="flex items-center gap-1.5 text-xs font-semibold text-positive">
              <TrendingUp size={13} /> Trending
            </div>
            <p className="mt-2 font-display text-lg font-bold group-hover:text-ink">{c.name}</p>
            <p className="text-sm text-muted">{c.districtName}</p>
            <p className="mt-3 text-sm font-medium">{formatNumber(c.responseCount)} responses</p>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
