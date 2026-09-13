"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ChevronRight, Users } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import type { ConstituencyExplorerItem } from "@/lib/up-analytics";

export function ConstituencyExplorer({
  constituencies,
  districtNames,
  resultsBasePath,
}: {
  constituencies: ConstituencyExplorerItem[];
  districtNames: string[];
  /** Prefix ending in "/constituencies/" — the full results URL is `${resultsBasePath}${slug}/results`. A plain string (not a function) so this Client Component boundary stays serializable. */
  resultsBasePath: string;
}) {
  const { locale } = useLocale();
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale === "hi" ? "hi-IN" : "en-IN"), [locale]);
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return constituencies.filter((c) => {
      if (district && c.districtName !== district) return false;
      if (!q) return true;
      return c.name.toLowerCase().includes(q) || c.districtName.toLowerCase().includes(q) || String(c.number).includes(q);
    });
  }, [constituencies, query, district]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="विधानसभा क्षेत्र या जिला खोजें…"
            className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/30"
          />
        </div>
        <select
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          className="h-11 rounded-xl border border-border bg-surface px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ink/30 sm:w-56"
        >
          <option value="">सभी जिले</option>
          {districtNames.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      <p className="mt-3 text-xs text-muted">
        {numberFormatter.format(filtered.length)} / {numberFormatter.format(constituencies.length)} विधानसभा क्षेत्र
      </p>

      {filtered.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-border bg-surface-2 p-8 text-center text-sm text-muted">
          कोई विधानसभा क्षेत्र नहीं मिला।
        </p>
      ) : (
        <div className="mt-4 grid max-h-[720px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Link
              key={c.id}
              href={`${resultsBasePath}${c.slug}/results`}
              className="card-surface group flex flex-col gap-2 rounded-2xl p-4 transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-display font-bold text-ink">{c.name}</p>
                  <p className="truncate text-xs text-muted">
                    {c.districtName} · AC #{c.number}
                  </p>
                </div>
                <ChevronRight size={16} className="mt-1 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
              </div>
              <div className="mt-1 flex items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-1 font-semibold text-ink">
                  <Users size={13} /> {numberFormatter.format(c.responseCount)}
                </span>
                {c.leadingPartyLabel ? (
                  <span className="truncate rounded-full bg-blue-50 px-2 py-0.5 font-bold text-blue-700">{c.leadingPartyLabel}</span>
                ) : (
                  <span className="text-muted">पर्याप्त डेटा नहीं</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
