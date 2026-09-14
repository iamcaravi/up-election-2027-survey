"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { FaqCategory } from "@/lib/faq-data";

// Native <details>/<summary> — accessible expand/collapse (keyboard, screen
// reader, and "find in page" all work for free) without a custom
// ARIA-disclosure implementation. The search box filters by substring across
// question + answer text; it never changes the underlying FAQ_CATEGORIES
// data, so the FAQPage JSON-LD (built server-side from that same array in
// src/app/faq/page.tsx) always matches what a visitor can find here.
export function FaqAccordion({ categories }: { categories: FaqCategory[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories
      .map((category) => ({
        ...category,
        items: category.items.filter((item) => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)),
      }))
      .filter((category) => category.items.length > 0);
  }, [categories, query]);

  return (
    <div>
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search FAQs…"
          aria-label="Search frequently asked questions"
          className="w-full rounded-xl border border-border bg-surface py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-sm text-muted">No questions match &quot;{query}&quot;.</p>
      ) : (
        <div className="mt-8 space-y-10">
          {filtered.map((category) => (
            <section key={category.id} aria-labelledby={`faq-${category.id}`}>
              <h2 id={`faq-${category.id}`} className="font-display text-lg font-bold text-foreground">
                {category.label}
              </h2>
              <div className="mt-3 space-y-2">
                {category.items.map((item) => (
                  <details
                    key={item.q}
                    className="group rounded-xl border border-border bg-surface px-4 py-3 open:shadow-[var(--shadow-card)]"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-display text-sm font-bold text-foreground marker:content-none">
                      {item.q}
                      <span
                        aria-hidden="true"
                        className="shrink-0 text-lg leading-none text-muted transition-transform group-open:rotate-45"
                      >
                        +
                      </span>
                    </summary>
                    <p className="mt-2.5 text-sm leading-relaxed text-foreground/90">{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
