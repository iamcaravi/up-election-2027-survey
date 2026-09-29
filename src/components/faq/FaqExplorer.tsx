"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  ClipboardList,
  ChartColumn,
  Shield,
  Settings,
  CircleQuestionMark,
  Scale,
  ArrowRight,
} from "lucide-react";
import type { FaqCategory } from "@/lib/faq-data";
import type { Locale } from "@/lib/i18n/LocaleProvider";

const CATEGORY_META: Record<string, { icon: typeof ClipboardList; color: string; labelHi: string; labelEn: string }> = {
  survey: { icon: ClipboardList, color: "bg-orange-50 text-orange-600", labelHi: "सर्वेक्षण", labelEn: "Survey" },
  results: { icon: ChartColumn, color: "bg-green-50 text-green-600", labelHi: "परिणाम", labelEn: "Results" },
  privacy: { icon: Shield, color: "bg-purple-50 text-purple-600", labelHi: "डेटा और गोपनीयता", labelEn: "Data & Privacy" },
  technical: { icon: Settings, color: "bg-rose-50 text-rose-600", labelHi: "तकनीकी सहायता", labelEn: "Technical Support" },
  "election-regulatory": { icon: Scale, color: "bg-blue-50 text-blue-600", labelHi: "चुनाव / नियामक", labelEn: "Election / Regulatory" },
  general: { icon: CircleQuestionMark, color: "bg-sky-50 text-sky-600", labelHi: "अन्य प्रश्न", labelEn: "Other Questions" },
};

const DEFAULT_META = { icon: CircleQuestionMark, color: "bg-slate-100 text-slate-600" };

// Display order only — loadPublishedFaqCategories orders alphabetically by
// category id for the underlying data/JSON-LD, but the tiles read better
// starting with Survey/Results (what most visitors look for first) rather
// than an alphabetical "Election / Regulatory" leading the page.
const CATEGORY_ORDER = ["survey", "results", "privacy", "technical", "election-regulatory", "general"];

function sortByDisplayOrder(categories: FaqCategory[]): FaqCategory[] {
  return [...categories].sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a.id);
    const bi = CATEGORY_ORDER.indexOf(b.id);
    return (ai === -1 ? CATEGORY_ORDER.length : ai) - (bi === -1 ? CATEGORY_ORDER.length : bi);
  });
}

const COPY = {
  hi: {
    searchPlaceholder: "सवाल खोजें... (जैसे: सर्वे, परिणाम, डेटा, गोपनीयता)",
    searchButton: "खोजें",
    categoriesHeading: "विषय के अनुसार प्रश्न",
    questionsSuffix: "प्रश्न",
    popularHeading: "लोकप्रिय विषय",
    popularSubtitle: "सबसे अधिक पूछे जाने वाले प्रश्न",
    stillNeedHelp: "अभी भी मदद चाहिए?",
    stillNeedHelpBody: "हमारी मदद टीम आपकी सहायता के लिए तैयार है।",
    contactCta: "संपर्क करें",
    noMatch: (q: string) => `कोई प्रश्न "${q}" से मेल नहीं खाता।`,
    relatedSuffix: "से जुड़े प्रश्न",
  },
  en: {
    searchPlaceholder: "Search a question... (e.g. survey, results, data, privacy)",
    searchButton: "Search",
    categoriesHeading: "Questions by Topic",
    questionsSuffix: "questions",
    popularHeading: "Popular Topics",
    popularSubtitle: "The most frequently asked questions",
    stillNeedHelp: "Still need help?",
    stillNeedHelpBody: "Our support team is ready to help you.",
    contactCta: "Contact Us",
    noMatch: (q: string) => `No question matches "${q}".`,
    relatedSuffix: "questions",
  },
} satisfies Record<Locale, unknown>;

export function FaqExplorer({ categories: categoriesProp, locale }: { categories: FaqCategory[]; locale: Locale }) {
  const c = COPY[locale];
  const categories = useMemo(() => sortByDisplayOrder(categoriesProp), [categoriesProp]);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? "");

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

  const popular = useMemo(() => categories.flatMap((cat) => cat.items.slice(0, 1)).slice(0, 5), [categories]);

  // The admin-managed FaqItem table stores English category labels by
  // default and only has a Hindi label once an admin fills one in — this
  // keeps the Hindi UI from falling back to raw English category names for
  // the categories we know about, without touching the underlying data.
  function displayLabel(cat: FaqCategory) {
    const meta = CATEGORY_META[cat.id];
    if (!meta) return cat.label;
    return locale === "hi" ? meta.labelHi : meta.labelEn;
  }

  const isSearching = query.trim().length > 0;
  const shownCategories = isSearching ? filtered : categories.filter((cat) => cat.id === activeCategory);

  return (
    <div>
      {/* Search — filters live as you type; the button just confirms/submits */}
      <form className="flex flex-col gap-2.5 sm:flex-row" onSubmit={(e) => e.preventDefault()}>
        <div className="relative flex-1">
          <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={c.searchPlaceholder}
            aria-label={c.searchPlaceholder}
            className="w-full rounded-xl border border-border bg-surface py-3.5 pl-11 pr-4 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-[50px] shrink-0 items-center justify-center gap-2 rounded-xl bg-ink px-6 text-sm font-bold text-white transition-colors hover:bg-ink-2"
        >
          <Search size={16} />
          {c.searchButton}
        </button>
      </form>

      {/* Category tiles */}
      {!isSearching && (
        <div className="mt-8">
          <h2 className="font-display text-lg font-bold text-ink">{c.categoriesHeading}</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categories.map((cat) => {
              const meta = CATEGORY_META[cat.id] ?? DEFAULT_META;
              const Icon = meta.icon;
              const isActive = cat.id === activeCategory;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`rounded-xl border p-3.5 text-left shadow-[var(--shadow-card)] transition-colors ${
                    isActive ? "border-accent bg-accent/5" : "border-border bg-surface hover:border-accent/40"
                  }`}
                >
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${meta.color}`}>
                    <Icon size={17} />
                  </span>
                  <p className="mt-2 font-display text-xs font-bold text-foreground">{displayLabel(cat)}</p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    ({cat.items.length} {c.questionsSuffix})
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Content: accordion + sidebar */}
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          {shownCategories.length === 0 ? (
            <p className="text-sm text-muted">{c.noMatch(query)}</p>
          ) : (
            <div className="space-y-8">
              {shownCategories.map((category) => (
                <section key={category.id} aria-labelledby={`faq-cat-${category.id}`}>
                  <h2 id={`faq-cat-${category.id}`} className="font-display text-base font-bold text-ink">
                    {displayLabel(category)} {c.relatedSuffix}
                  </h2>
                  <div className="mt-3 space-y-2">
                    {category.items.map((item, i) => (
                      <details
                        key={item.q}
                        className="group rounded-xl border border-border bg-surface px-4 py-3 open:shadow-[var(--shadow-card)]"
                      >
                        <summary className="flex cursor-pointer list-none items-start gap-3 font-display text-sm font-bold text-foreground marker:content-none">
                          <span className="shrink-0 text-xs font-bold text-muted">{String(i + 1).padStart(2, "0")}</span>
                          <span className="flex-1">{item.q}</span>
                          <span
                            aria-hidden="true"
                            className="shrink-0 text-lg leading-none text-muted transition-transform group-open:rotate-45"
                          >
                            +
                          </span>
                        </summary>
                        <p className="mt-2.5 pl-7 text-sm leading-relaxed text-foreground/90">{item.a}</p>
                      </details>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">{c.popularHeading}</p>
            <p className="mt-0.5 text-xs text-muted">{c.popularSubtitle}</p>
            <div className="mt-3 space-y-1">
              {popular.map((item, i) => (
                <button
                  key={item.q}
                  type="button"
                  onClick={() => setQuery(item.q)}
                  className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-medium text-foreground/85 transition-colors hover:bg-surface-2"
                >
                  <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent">
                    {i + 1}
                  </span>
                  <span className="leading-snug">{item.q}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-blue-50/60 p-4">
            <p className="font-display text-sm font-bold text-ink">{c.stillNeedHelp}</p>
            <p className="mt-1 text-xs leading-relaxed text-foreground/80">{c.stillNeedHelpBody}</p>
            <Link
              href="/contact"
              className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-lg bg-orange-600 px-4 text-xs font-bold text-white transition-colors hover:bg-orange-700"
            >
              {c.contactCta}
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
