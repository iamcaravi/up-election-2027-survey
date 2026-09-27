"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Landmark, Search, SlidersHorizontal, UserRound, Users } from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { Pagination } from "@/components/ui/Pagination";
import { matchesCrossLanguage } from "@/lib/search-normalization";
import { getConstituencyDisplayName } from "@/lib/constituency-hindi";

export interface DistrictConstituencyItem {
  slug: string;
  number: number;
  name: string;
  reservedStatus: string;
  mlaName: string | null;
  mlaParty: string | null;
  responseCount: number;
  href: string;
}

type SortKey = "az" | "za" | "number" | "responses";

const PAGE_SIZE = 12;
const NAVY = "text-[#0b1f3a]";
const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40";

// Very light pastel per card, keyed to AC-number order so a constituency
// keeps its color regardless of search/sort.
const TONES = [
  { card: "border-violet-100 from-violet-50/90 to-white", badge: "bg-violet-100 text-violet-700", icon: "bg-violet-100/80 text-violet-600", meta: "text-violet-500" },
  { card: "border-orange-100 from-orange-50/90 to-white", badge: "bg-orange-100 text-orange-700", icon: "bg-orange-100/80 text-orange-500", meta: "text-orange-500" },
  { card: "border-blue-100 from-blue-50/90 to-white", badge: "bg-blue-100 text-blue-700", icon: "bg-blue-100/80 text-blue-600", meta: "text-blue-500" },
  { card: "border-emerald-100 from-emerald-50/90 to-white", badge: "bg-emerald-100 text-emerald-700", icon: "bg-emerald-100/80 text-emerald-600", meta: "text-emerald-500" },
  { card: "border-pink-100 from-pink-50/90 to-white", badge: "bg-pink-100 text-pink-700", icon: "bg-pink-100/80 text-pink-500", meta: "text-pink-500" },
  { card: "border-amber-100 from-amber-50/90 to-white", badge: "bg-amber-100 text-amber-700", icon: "bg-amber-100/80 text-orange-500", meta: "text-amber-600" },
  { card: "border-blue-100 from-sky-50/90 to-white", badge: "bg-sky-100 text-blue-700", icon: "bg-sky-100/80 text-blue-600", meta: "text-blue-500" },
] as const;

export function DistrictConstituencyBrowser({
  hi,
  districtName,
  constituencies,
}: {
  hi: boolean;
  districtName: string;
  constituencies: DistrictConstituencyItem[];
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("az");
  const [page, setPage] = useState(1);
  const listRef = useRef<HTMLDivElement>(null);

  const toneBySlug = useMemo(() => {
    const byNumber = [...constituencies].sort((a, b) => a.number - b.number);
    return new Map(byNumber.map((c, i) => [c.slug, TONES[i % TONES.length]]));
  }, [constituencies]);

  const visible = useMemo(() => {
    const q = query.trim();
    const filtered = q
      ? constituencies.filter((c) =>
          matchesCrossLanguage(
            {
              name: c.name,
              slug: c.slug,
              number: c.number,
              nameHi: getConstituencyDisplayName(c.slug, c.name, "hi"),
              nameEn: c.name,
            },
            q
          )
        )
      : constituencies;
    return [...filtered].sort((a, b) => {
      if (sort === "number") return a.number - b.number;
      if (sort === "responses") return b.responseCount - a.responseCount || a.number - b.number;
      const cmp = a.name.localeCompare(b.name, "en");
      return sort === "za" ? -cmp : cmp;
    });
  }, [constituencies, query, sort]);

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function goTo(p: number) {
    setPage(Math.min(Math.max(1, p), totalPages));
    const top = listRef.current?.getBoundingClientRect().top;
    if (top !== undefined && top < 80) listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const responsesLabel = (n: number) =>
    hi ? `${formatNumber(n)} ${n === 1 ? "प्रतिक्रिया" : "प्रतिक्रियाएं"}` : `${formatNumber(n)} ${n === 1 ? "response" : "responses"}`;

  return (
    <section
      id="district-constituencies"
      aria-labelledby="district-constituencies-title"
      className="scroll-mt-20 rounded-3xl border border-[#e3e9f4] bg-white/95 p-3.5 shadow-[0_10px_30px_-22px_rgba(15,31,75,0.35)] sm:p-5 lg:p-6"
    >
      {/* Heading + controls */}
      <div className="flex flex-col gap-3.5 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
        <div className="flex min-w-0 gap-3">
          <span aria-hidden="true" className="mt-1 h-8 w-1.5 shrink-0 rounded-full bg-[#146ef5] sm:h-9" />
          <div className="min-w-0">
            <h2 id="district-constituencies-title" className={cn("font-display text-[22px] sm:text-[28px] lg:text-[30px] font-extrabold leading-tight", NAVY)}>
              {hi ? `${districtName} की विधानसभा क्षेत्र` : `Constituencies of ${districtName}`}
            </h2>
            <p className="mt-1 text-xs sm:text-sm leading-snug text-slate-500">
              {hi
                ? "जिले के सभी विधानसभा क्षेत्रों की सूची देखें और अपने क्षेत्र से जुड़ी सर्वेक्षण जानकारी प्राप्त करें।"
                : "See every constituency in the district and find survey information for your area."}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2.5 sm:gap-3 sm:flex-row lg:pt-1">
          <div className="relative sm:flex-1 lg:w-[280px] xl:w-[320px]">
            <label htmlFor="constituency-search" className="sr-only">
              {hi ? "विधानसभा क्षेत्र खोजें" : "Search constituencies"}
            </label>
            <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              id="constituency-search"
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder={hi ? "विधानसभा क्षेत्र खोजें..." : "Search constituency..."}
              autoComplete="off"
              className="h-10 sm:h-11 w-full rounded-xl border border-[#dfe6f0] bg-white pl-10 pr-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 shadow-[0_1px_2px_rgba(15,31,75,0.04)] focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/15"
            />
          </div>
          <div className="relative sm:w-[175px]">
            <label htmlFor="constituency-sort" className="sr-only">
              {hi ? "क्रम चुनें" : "Sort constituencies"}
            </label>
            <SlidersHorizontal size={16} className={cn("pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2", NAVY)} aria-hidden="true" />
            <select
              id="constituency-sort"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as SortKey);
                setPage(1);
              }}
              className={cn(
                "h-10 sm:h-11 w-full cursor-pointer appearance-none rounded-xl border border-[#dfe6f0] bg-white pl-10 pr-8 text-xs sm:text-sm font-semibold shadow-[0_1px_2px_rgba(15,31,75,0.04)] focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/15",
                NAVY
              )}
            >
              <option value="az">{hi ? "क्रम (A - Z)" : "Order (A - Z)"}</option>
              <option value="za">{hi ? "क्रम (Z - A)" : "Order (Z - A)"}</option>
              <option value="number">{hi ? "AC संख्या" : "AC number"}</option>
              <option value="responses">{hi ? "सर्वाधिक प्रतिक्रियाएं" : "Most responses"}</option>
            </select>
            <ChevronDown size={16} className={cn("pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400", NAVY)} aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Cards: 2-column mobile, 3-column tablet, 4-column desktop */}
      <div ref={listRef} className="scroll-mt-20 pt-3.5 sm:pt-5">
        {pageItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#dfe6f0] px-6 py-10 text-center">
            <p className={cn("text-base font-bold", NAVY)}>{hi ? "कोई विधानसभा क्षेत्र नहीं मिला" : "No constituency found"}</p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setPage(1);
              }}
              className={cn("mt-2 cursor-pointer rounded-lg text-sm font-semibold text-blue-600 hover:underline", FOCUS)}
            >
              {hi ? "सभी विधानसभा क्षेत्र देखें" : "Show all constituencies"}
            </button>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-2.5 sm:gap-3.5 md:grid-cols-3 lg:grid-cols-4 lg:gap-4">
            {pageItems.map((c) => {
              const tone = toneBySlug.get(c.slug) ?? TONES[0];
              const reserved = c.reservedStatus && c.reservedStatus !== "None" ? c.reservedStatus : null;
              return (
                <li key={c.slug} className="h-full">
                  <Link
                    href={c.href}
                    className={cn(
                      "group relative flex h-full flex-col justify-between rounded-xl sm:rounded-2xl border bg-gradient-to-br p-3 sm:p-3.5 lg:p-4 shadow-[0_1px_2px_rgba(15,31,75,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                      tone.card,
                      FOCUS
                    )}
                  >
                    {/* Top Row: AC Badge + Reservation + Navigation Arrow */}
                    <div className="flex items-center justify-between gap-1.5 mb-2 sm:mb-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        {/* AC Number: ~12-13px */}
                        <span className={cn("rounded-md px-2 py-0.5 text-xs sm:text-[12.5px] font-bold tracking-tight shrink-0", tone.badge)}>
                          AC #{c.number}
                        </span>
                        {reserved && (
                          <span className="rounded-md bg-amber-100/90 px-1.5 sm:px-2 py-0.5 text-[11px] sm:text-xs font-bold text-amber-800 shrink-0">
                            {reserved}
                          </span>
                        )}
                      </div>
                      <span
                        aria-hidden="true"
                        className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full bg-white/90 text-blue-600 shadow-2xs ring-1 ring-blue-100 transition-colors group-hover:bg-blue-600 group-hover:text-white"
                      >
                        <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>
                    </div>

                    {/* Middle: Title with compact icon (Prominent Constituency Name: 17-19px mobile, 20-22px desktop) */}
                    <div className="min-w-0 mb-2.5 sm:mb-3">
                      <div className="flex items-center gap-2">
                        <span className={cn("flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg", tone.icon)}>
                          <Landmark className="h-4 w-4 sm:h-4.5 sm:w-4.5" strokeWidth={1.7} aria-hidden="true" />
                        </span>
                        <span className={cn("font-display text-[17px] sm:text-[19px] lg:text-[21px] font-bold leading-snug line-clamp-1 sm:line-clamp-2", NAVY)}>
                          {getConstituencyDisplayName(c.slug, c.name, hi ? "hi" : "en")}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Metadata: Responses + MLA (13-14px mobile, 14-15px desktop) */}
                    <div className="space-y-1.5 pt-2 sm:pt-2.5 border-t border-slate-100/80 text-[13px] sm:text-[13.5px] lg:text-[14px]">
                      {/* Responses */}
                      <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <Users size={15} className={cn("shrink-0", tone.meta)} aria-hidden="true" />
                        <span className="truncate">{responsesLabel(c.responseCount)}</span>
                      </div>

                      {/* Current MLA */}
                      <div className="flex items-start gap-1.5">
                        <UserRound size={15} className={cn("mt-0.5 shrink-0", tone.meta)} aria-hidden="true" />
                        <span className={cn("line-clamp-2 leading-tight font-medium", !c.mlaName && "text-slate-400 italic")}>
                          {c.mlaName ? (
                            <>
                              <span className="font-bold text-slate-800">{c.mlaName}</span>
                              {c.mlaParty && <span className="text-slate-600 font-normal"> ({c.mlaParty})</span>}
                            </>
                          ) : (
                            hi ? "विधायक दर्ज नहीं" : "MLA not recorded"
                          )}
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Pagination + total */}
      {visible.length > 0 && (
        <div className={cn("mt-4 flex flex-col items-center gap-2.5", totalPages === 1 && "lg:hidden")}>
          <Pagination page={currentPage} totalPages={totalPages} onChange={goTo} hi={hi} />
          <p className="text-xs sm:text-sm text-slate-600" aria-live="polite">
            {query.trim()
              ? hi
                ? `${formatNumber(visible.length)} / ${formatNumber(constituencies.length)} विधानसभा क्षेत्र`
                : `${formatNumber(visible.length)} of ${formatNumber(constituencies.length)} constituencies`
              : hi
                ? `कुल ${formatNumber(constituencies.length)} विधानसभा क्षेत्र`
                : `Total ${formatNumber(constituencies.length)} constituencies`}
          </p>
        </div>
      )}
    </section>
  );
}
