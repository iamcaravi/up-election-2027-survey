"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
import type { FaqCategory } from "@/lib/faq-data";
import type { Locale } from "@/lib/i18n/LocaleProvider";
import { getHelpTopics } from "./topics";

const COPY = {
  hi: {
    placeholder: "मदद खोजें... (जैसे: सर्वे कैसे करें, विधानसभा क्षेत्र, परिणाम)",
    button: "खोजें",
    topicsMatched: "मिलते-जुलते विषय",
    questionsMatched: "मिलते-जुलते प्रश्न",
    noMatch: (q: string) => `"${q}" से मेल खाता कुछ नहीं मिला।`,
    noMatchCta: "हमसे संपर्क करें",
  },
  en: {
    placeholder: "Search for help... (e.g. how to survey, constituency, results)",
    button: "Search",
    topicsMatched: "Matching Topics",
    questionsMatched: "Matching Questions",
    noMatch: (q: string) => `Nothing matched "${q}".`,
    noMatchCta: "Contact Us",
  },
} satisfies Record<Locale, unknown>;

// `topics` is resolved here (client-side) rather than accepted as a prop —
// Lucide icon components in HelpTopic can't be serialized across the
// server → client boundary, so the server page passes only the locale and
// this component derives the same topic list itself from that.
export function HelpSearch({ faqCategories, locale }: { faqCategories: FaqCategory[]; locale: Locale }) {
  const c = COPY[locale];
  const topics = useMemo(() => getHelpTopics(locale), [locale]);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const matchedTopics = useMemo(() => {
    if (!q) return [];
    return topics.filter((t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
  }, [topics, q]);

  const matchedQuestions = useMemo(() => {
    if (!q) return [];
    return faqCategories.flatMap((cat) => cat.items.filter((item) => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q))).slice(0, 8);
  }, [faqCategories, q]);

  return (
    <div>
      <form className="flex flex-col gap-2.5 sm:flex-row" onSubmit={(e) => e.preventDefault()}>
        <div className="relative flex-1">
          <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={c.placeholder}
            aria-label={c.placeholder}
            className="w-full rounded-xl border border-border bg-surface py-3.5 pl-11 pr-4 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-[50px] shrink-0 items-center justify-center gap-2 rounded-xl bg-ink px-6 text-sm font-bold text-white transition-colors hover:bg-ink-2"
        >
          <Search size={16} />
          {c.button}
        </button>
      </form>

      {q && (
        <div className="mt-5 space-y-5">
          {matchedTopics.length === 0 && matchedQuestions.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface p-4 text-sm text-muted">
              {c.noMatch(query)}{" "}
              <Link href="/contact" className="font-semibold text-accent hover:underline">
                {c.noMatchCta}
              </Link>
            </div>
          ) : (
            <>
              {matchedTopics.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">{c.topicsMatched}</p>
                  <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
                    {matchedTopics.map((t) => {
                      const Icon = t.icon;
                      return (
                        <Link
                          key={t.title}
                          href={t.href}
                          className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3.5 shadow-[var(--shadow-card)] transition-colors hover:border-accent/40"
                        >
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${t.color}`}>
                            <Icon size={17} />
                          </span>
                          <span className="min-w-0 flex-1 font-display text-sm font-bold text-foreground">{t.title}</span>
                          <ArrowRight size={15} className="shrink-0 text-muted" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {matchedQuestions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">{c.questionsMatched}</p>
                  <div className="mt-2 space-y-2">
                    {matchedQuestions.map((item) => (
                      <details key={item.q} className="group rounded-xl border border-border bg-surface px-4 py-3 open:shadow-[var(--shadow-card)]">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-display text-sm font-bold text-foreground marker:content-none">
                          {item.q}
                          <span aria-hidden="true" className="shrink-0 text-lg leading-none text-muted transition-transform group-open:rotate-45">
                            +
                          </span>
                        </summary>
                        <p className="mt-2.5 text-sm leading-relaxed text-foreground/90">{item.a}</p>
                      </details>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
