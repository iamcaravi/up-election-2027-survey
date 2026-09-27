"use client";

import { useState, useMemo, type CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  MapPin,
  Landmark,
  ArrowRight,
  LayoutGrid,
  List,
  Users,
  BarChart2,
  TrendingUp,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { cn, formatNumber } from "@/lib/utils";
import { statePath } from "@/lib/routes";
import { matchesCrossLanguage } from "@/lib/search-normalization";
import {
  UPGlyph,
  PunjabGlyph,
  UttarakhandGlyph,
  GoaGlyph,
  ManipurGlyph,
  HimachalGlyph,
  GujaratGlyph,
} from "@/components/home/StateGlyphs";

export interface StatesGridItem {
  slug: string;
  name: string;
  _count: { districts: number; constituencies: number };
}

interface StateCardConfig {
  slug: string;
  hiName: string;
  enName: string;
  /** Genuine boundary silhouette (src/data/state-boundaries.json). */
  glyph: (props: { className?: string }) => React.ReactElement;
  /** Single accent color — drives the silhouette, border, tint and arrow. */
  accent: string;
  defaultDistricts: number;
  defaultConstituencies: number;
}

const STATE_CONFIGS: StateCardConfig[] = [
  { slug: "uttar-pradesh", hiName: "उत्तर प्रदेश", enName: "Uttar Pradesh", glyph: UPGlyph, accent: "#ea580c", defaultDistricts: 75, defaultConstituencies: 403 },
  { slug: "punjab", hiName: "पंजाब", enName: "Punjab", glyph: PunjabGlyph, accent: "#e11d48", defaultDistricts: 23, defaultConstituencies: 117 },
  { slug: "uttarakhand", hiName: "उत्तराखंड", enName: "Uttarakhand", glyph: UttarakhandGlyph, accent: "#0284c7", defaultDistricts: 13, defaultConstituencies: 70 },
  { slug: "goa", hiName: "गोवा", enName: "Goa", glyph: GoaGlyph, accent: "#2563eb", defaultDistricts: 2, defaultConstituencies: 40 },
  { slug: "manipur", hiName: "मणिपुर", enName: "Manipur", glyph: ManipurGlyph, accent: "#7c3aed", defaultDistricts: 11, defaultConstituencies: 60 },
  { slug: "himachal-pradesh", hiName: "हिमाचल प्रदेश", enName: "Himachal Pradesh", glyph: HimachalGlyph, accent: "#059669", defaultDistricts: 12, defaultConstituencies: 68 },
  { slug: "gujarat", hiName: "गुजरात", enName: "Gujarat", glyph: GujaratGlyph, accent: "#f4511e", defaultDistricts: 33, defaultConstituencies: 182 },
];

// Card surface shared by grid + list views. Everything color-specific reads
// from the --accent custom property set per card, so there is exactly one
// place (STATE_CONFIGS) that decides a state's color.
const CARD_BASE =
  "group relative overflow-hidden rounded-[18px] border bg-white transition-all duration-200 cursor-pointer " +
  "border-[color-mix(in_srgb,var(--accent)_26%,transparent)] hover:border-[color-mix(in_srgb,var(--accent)_55%,transparent)] " +
  "shadow-[0_1px_2px_rgba(15,31,75,0.04),0_6px_18px_-8px_rgba(15,31,75,0.10)] hover:shadow-[0_2px_4px_rgba(15,31,75,0.05),0_14px_30px_-12px_color-mix(in_srgb,var(--accent)_45%,transparent)] hover:-translate-y-0.5 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50";

const cardStyle = (accent: string): CSSProperties =>
  ({
    "--accent": accent,
    backgroundImage: `linear-gradient(135deg, #ffffff 0%, #ffffff 42%, color-mix(in srgb, ${accent} 7%, #ffffff) 100%)`,
  }) as CSSProperties;

const FEATURES = [
  { icon: Users, tone: "bg-orange-100/90 text-orange-600", hi: ["जनता की राय", "सीधे स्थानीय लोगों से"], en: ["Public Opinion", "Directly from local people"] },
  { icon: BarChart2, tone: "bg-blue-100/90 text-blue-600", hi: ["वास्तविक डेटा", "जमीनी हकीकत पर आधारित"], en: ["Real-time Data", "Grounded in field reality"] },
  { icon: TrendingUp, tone: "bg-emerald-100/90 text-emerald-600", hi: ["बेहतर कल के लिए", "जागरूक और जिम्मेदार मतदान"], en: ["For a Better Tomorrow", "Informed & responsible voting"] },
] as const;

export function RajyaPageContent({ states }: { states: StatesGridItem[] }) {
  const { locale } = useLocale();
  const hi = locale === "hi";
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Merge database counts with visual configs
  const mergedStates = useMemo(() => {
    const dbMap = new Map(states.map((s) => [s.slug, s]));
    return STATE_CONFIGS.map((cfg) => {
      const dbItem = dbMap.get(cfg.slug);
      return {
        ...cfg,
        districts: dbItem?._count.districts ?? cfg.defaultDistricts,
        constituencies: dbItem?._count.constituencies ?? cfg.defaultConstituencies,
      };
    });
  }, [states]);

  // Real-time search filter matching Hindi, English, and slug cross-language
  const filteredStates = useMemo(() => {
    if (!searchTerm.trim()) return mergedStates;
    return mergedStates.filter((s) =>
      matchesCrossLanguage(
        {
          name: s.enName,
          nameHi: s.hiName,
          slug: s.slug,
        },
        searchTerm
      )
    );
  }, [searchTerm, mergedStates]);

  return (
    <div className="w-full overflow-x-hidden bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-100/70 bg-[linear-gradient(180deg,#d9eefe_0%,#e8f5ff_38%,#f5faff_72%,#ffffff_100%)] pt-4 pb-5 sm:pt-5 lg:pt-4 lg:pb-5">
        {/* Soft tricolor ribbons on the left edge — decorative only */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 top-[38%] hidden h-40 w-72 -rotate-[28deg] rounded-full bg-gradient-to-r from-orange-400/25 via-orange-300/10 to-transparent blur-2xl lg:block"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 bottom-0 hidden h-40 w-72 -rotate-[28deg] rounded-full bg-gradient-to-r from-emerald-500/20 via-emerald-300/10 to-transparent blur-2xl lg:block"
        />

        <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-2.5 flex items-center gap-1.5 text-xs text-slate-500 sm:text-sm lg:mb-2">
            <Link href="/" className="transition-colors hover:text-slate-900">
              {hi ? "होम" : "Home"}
            </Link>
            <span className="text-slate-400">&gt;</span>
            <span className="font-semibold text-slate-900">{hi ? "राज्य" : "States"}</span>
          </nav>

          {/* Desktop: one compact band. Left column = heading block + search
              (rows 1–2); right column = artwork with the feature tiles sharing
              the same grid cell, aligned to its faded bottom edge. */}
          <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-x-6">
            {/* Heading block */}
            <div className="relative z-10 flex flex-col items-start lg:col-span-5 lg:row-start-1">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600 sm:text-sm">
                {hi ? "भारत" : "INDIA"}
              </span>
              <h1 className="mt-1 font-display text-[44px] font-black leading-none tracking-tight text-[#0f1f4b] sm:text-5xl lg:text-[52px]">
                {hi ? "राज्य" : "States"}
              </h1>
              <p className="mt-1.5 text-base font-semibold text-slate-600 sm:text-lg">
                {hi ? `${mergedStates.length} राज्य उपलब्ध हैं` : `${mergedStates.length} States Available`}
              </p>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-600 lg:max-w-md xl:max-w-lg">
                {hi
                  ? "भारत के विभिन्न राज्यों में होने वाले विधानसभा चुनावों से जुड़ी जनता की राय, स्थानीय मुद्दों और विकास से जुड़े महत्वपूर्ण तथ्यों को जानें और सर्वे में भाग लें।"
                  : "Explore public opinions, local issues, and developmental facts for assembly elections across Indian states, and participate in live surveys."}
              </p>
            </div>

            {/* Approved hero artwork — full-bleed banner on mobile; on desktop
                a capped-width 3:1 visual (max 690px ≈ 230px tall) so its
                height no longer scales with the viewport. Edges are masked so
                the artwork melts into the hero background instead of reading
                as a framed photo. */}
            <div
              className={cn(
                "relative -mx-4 mt-3 aspect-[13/5] sm:-mx-6 sm:aspect-[5/2]",
                "[mask-image:linear-gradient(to_bottom,transparent_0%,#000_10%,#000_84%,transparent_100%)]",
                "lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1 lg:mx-0 lg:mt-0 lg:aspect-[3/1] lg:w-full lg:max-w-[640px] lg:self-start xl:max-w-[690px]",
                "lg:[mask-image:linear-gradient(to_right,transparent_0%,#000_8%,#000_90%,transparent_100%),linear-gradient(to_bottom,transparent_0%,#000_6%,#000_78%,transparent_100%)] lg:[mask-composite:intersect]"
              )}
            >
              <Image
                src="/images/states/hero-states-4k.webp"
                alt={hi ? "भारत का मानचित्र और संसद भवन — हर राज्य, हर आवाज़" : "Map of India and the Parliament of India — every state, every voice"}
                fill
                priority
                sizes="(max-width: 1023px) 100vw, 690px"
                className="select-none object-cover object-[50%_45%] lg:object-contain"
              />
            </div>

            {/* Search */}
            <div className="relative z-10 mt-3 w-full lg:col-span-5 lg:row-start-2 lg:mt-4 lg:self-start">
              <label htmlFor="state-search" className="sr-only">
                {hi ? "राज्य का नाम खोजें" : "Search state name"}
              </label>
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="state-search"
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={hi ? "राज्य का नाम खोजें..." : "Search state name..."}
                className="w-full rounded-2xl border border-slate-200/90 bg-white py-3 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 shadow-[0_4px_14px_-6px_rgba(15,31,75,0.12)] transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 lg:max-w-md lg:py-2.5 xl:max-w-lg"
              />
            </div>

            {/* Feature highlights */}
            <div className="relative z-10 mt-3 grid grid-cols-3 divide-x divide-slate-200/70 rounded-2xl border border-slate-100 bg-white/90 p-2 shadow-xs backdrop-blur-sm sm:p-2.5 lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:self-end lg:py-2">
              {FEATURES.map(({ icon: Icon, tone, hi: hiCopy, en: enCopy }) => {
                const [title, sub] = hi ? hiCopy : enCopy;
                return (
                  <div key={enCopy[0]} className="flex min-w-0 flex-col items-start gap-1 px-2 sm:flex-row sm:items-center sm:gap-2.5 sm:px-3">
                    <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full sm:h-9 sm:w-9", tone)}>
                      <Icon size={18} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-bold leading-tight text-slate-900 sm:text-sm">{title}</span>
                      <span className="mt-0.5 block text-[10.5px] leading-snug text-slate-500 sm:text-xs">{sub}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* "हमारे राज्य" Section */}
      <section className="bg-white py-8 sm:py-10">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-5 flex items-end justify-between gap-4 sm:mb-6">
            <div className="min-w-0">
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-[#0f1f4b] sm:text-3xl">
                {hi ? "हमारे राज्य" : "Our States"}
              </h2>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                {hi
                  ? "किसी राज्य पर क्लिक करके वहाँ की विधानसभा चुनाव सर्वे, जिले, मुद्दे और विश्लेषण देखें।"
                  : "Click any state to explore its assembly election survey, districts, issues and analytics."}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <span className="hidden text-sm font-semibold text-slate-500 sm:inline" aria-live="polite">
                {filteredStates.length} {hi ? "राज्य" : "States"}
              </span>
              <div className="flex items-center gap-1 rounded-xl border border-slate-200/60 bg-slate-100/90 p-1">
                {(["grid", "list"] as const).map((mode) => {
                  const Icon = mode === "grid" ? LayoutGrid : List;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setViewMode(mode)}
                      aria-label={mode === "grid" ? "Grid view" : "List view"}
                      aria-pressed={viewMode === mode}
                      className={cn(
                        "cursor-pointer rounded-lg p-1.5 transition-colors",
                        viewMode === mode ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      <Icon size={16} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {filteredStates.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-12 text-center">
              <p className="text-sm font-medium text-slate-600">
                {hi ? `"${searchTerm}" से संबंधित कोई राज्य नहीं मिला।` : `No states found matching "${searchTerm}".`}
              </p>
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="mt-3 cursor-pointer text-xs font-semibold text-blue-600 hover:underline"
              >
                {hi ? "सभी राज्य देखें" : "View all states"}
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 lg:gap-5">
              {filteredStates.map((state) => {
                const Glyph = state.glyph;
                return (
                  <Link
                    key={state.slug}
                    href={statePath(state.slug)}
                    style={cardStyle(state.accent)}
                    className={cn(CARD_BASE, "flex min-h-[156px] flex-col p-3.5 sm:min-h-[128px] sm:flex-row sm:items-center sm:gap-4 sm:p-5")}
                  >
                    {/* Oversized, very faint silhouette as the card's backdrop */}
                    <Glyph
                      className="pointer-events-none absolute -bottom-6 -right-5 h-32 w-32 text-[var(--accent)] opacity-[0.07] transition-transform duration-300 group-hover:scale-105 sm:-bottom-8 sm:h-40 sm:w-40"
                    />

                    <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_2px_10px_-2px_rgba(15,31,75,0.14)] ring-1 ring-slate-100 sm:h-[72px] sm:w-[72px]">
                      <Glyph className="h-9 w-9 text-[var(--accent)] sm:h-12 sm:w-12" />
                    </span>

                    <span className="relative mt-2.5 block min-w-0 pr-1 sm:mt-0 sm:pr-10">
                      <span className="block truncate font-display text-[15px] font-bold leading-tight text-[#0f1f4b] sm:text-lg">
                        {hi ? state.hiName : state.enName}
                      </span>
                      <span className="mt-1.5 flex flex-col gap-1 text-[11.5px] text-slate-600 sm:text-[13px]">
                        <span className="flex items-center gap-1.5 leading-tight">
                          <MapPin size={13} className="shrink-0 text-[var(--accent)]" />
                          {formatNumber(state.districts)} {hi ? "जिले" : "Districts"}
                        </span>
                        <span className="flex items-center gap-1.5 leading-tight">
                          <Landmark size={13} className="shrink-0 text-[var(--accent)]" />
                          <span className="truncate">
                            {formatNumber(state.constituencies)} {hi ? "विधानसभा क्षेत्र" : "Assembly Seats"}
                          </span>
                        </span>
                      </span>
                    </span>

                    <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-[0_4px_10px_-3px_var(--accent)] transition-transform duration-200 group-hover:scale-110 sm:bottom-4 sm:right-4 sm:top-auto sm:h-9 sm:w-9">
                      <ArrowRight size={16} />
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="mx-auto flex max-w-4xl flex-col gap-3">
              {filteredStates.map((state) => {
                const Glyph = state.glyph;
                return (
                  <Link
                    key={state.slug}
                    href={statePath(state.slug)}
                    style={cardStyle(state.accent)}
                    className={cn(CARD_BASE, "flex items-center justify-between gap-3 p-3.5 sm:p-4")}
                  >
                    <span className="relative flex min-w-0 items-center gap-3 sm:gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_2px_10px_-2px_rgba(15,31,75,0.14)] ring-1 ring-slate-100 sm:h-14 sm:w-14">
                        <Glyph className="h-8 w-8 text-[var(--accent)] sm:h-9 sm:w-9" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-display text-base font-bold text-[#0f1f4b] sm:text-lg">
                          {hi ? state.hiName : state.enName}
                        </span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-slate-600">
                          <span className="flex items-center gap-1">
                            <MapPin size={13} className="text-[var(--accent)]" />
                            {formatNumber(state.districts)} {hi ? "जिले" : "Districts"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Landmark size={13} className="text-[var(--accent)]" />
                            {formatNumber(state.constituencies)} {hi ? "विधानसभा क्षेत्र" : "Assembly Constituencies"}
                          </span>
                        </span>
                      </span>
                    </span>
                    <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white transition-transform duration-200 group-hover:scale-110">
                      <ArrowRight size={16} />
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
