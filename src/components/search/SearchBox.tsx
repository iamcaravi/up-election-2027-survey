"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, MapPin, Building2, User } from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { cn } from "@/lib/utils";
import { districtPath, constituencyPath } from "@/lib/routes";

interface SearchResults {
  districts: { type: "district"; slug: string; name: string; stateSlug: string; electionSlug: string | null }[];
  constituencies: {
    type: "constituency";
    slug: string;
    name: string;
    districtName: string;
    stateSlug: string;
    electionSlug: string | null;
    number: number;
  }[];
  candidates: {
    type: "candidate";
    slug: string;
    name: string;
    partyShortName?: string;
    constituencySlug: string;
    stateSlug: string;
    electionSlug: string | null;
    constituencyName: string;
  }[];
}

export function SearchBox({ className, autoFocus }: { className?: string; autoFocus?: boolean }) {
  const { t } = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const hasResults =
    results && (results.districts.length || results.constituencies.length || results.candidates.length);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={17} />
        <input
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder={t.common.search}
          className="h-12 w-full rounded-xl border border-border bg-surface pl-10 pr-10 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ink/30"
        />
        {loading && (
          <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-muted" size={16} />
        )}
      </div>

      {open && query.length >= 2 && (
        <div className="absolute z-50 mt-2 max-h-96 w-full overflow-y-auto rounded-xl border border-border bg-surface shadow-[var(--shadow-soft)]">
          {!hasResults && !loading && (
            <div className="px-4 py-6 text-center text-sm text-muted">No matches found.</div>
          )}

          {results && results.districts.length > 0 && (
            <div className="border-b border-border p-2">
              <p className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
                {t.nav.districts}
              </p>
              {results.districts.map((d) => (
                <button
                  key={d.slug}
                  onClick={() => {
                    if (d.electionSlug) router.push(districtPath(d.stateSlug, d.electionSlug, d.slug));
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm hover:bg-surface-2"
                >
                  <MapPin size={15} className="text-ink" />
                  {d.name}
                </button>
              ))}
            </div>
          )}

          {results && results.constituencies.length > 0 && (
            <div className="border-b border-border p-2">
              <p className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
                Constituencies
              </p>
              {results.constituencies.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => {
                    if (c.electionSlug) router.push(constituencyPath(c.stateSlug, c.electionSlug, c.slug));
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm hover:bg-surface-2"
                >
                  <Building2 size={15} className="text-ink" />
                  <span>{c.name}</span>
                  <span className="ml-auto text-xs text-muted">{c.districtName}</span>
                </button>
              ))}
            </div>
          )}

          {results && results.candidates.length > 0 && (
            <div className="p-2">
              <p className="px-2 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
                Candidates
              </p>
              {results.candidates.map((c) => (
                <button
                  key={c.slug + c.constituencySlug}
                  onClick={() => {
                    if (c.electionSlug) router.push(constituencyPath(c.stateSlug, c.electionSlug, c.constituencySlug));
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm hover:bg-surface-2"
                >
                  <User size={15} className="text-ink" />
                  <span>{c.name}</span>
                  {c.partyShortName && <span className="text-xs text-muted">{c.partyShortName}</span>}
                  <span className="ml-auto text-xs text-muted">{c.constituencyName}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
