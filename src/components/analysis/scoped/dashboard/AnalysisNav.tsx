"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChartLine,
  Clock,
  Download,
  Flag,
  House,
  Lightbulb,
  Map,
  MessageSquareText,
  Network,
  ShieldCheck,
  Target,
  UserCheck,
  UserRound,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Analysis section navigation: a compact sticky sidebar on desktop and a
// horizontally scrolling chip strip on mobile. Every item is an in-page link
// to a section that exists on the page (the server passes the list); items
// for the deep modules are picked up by the DeepHub, which opens the module.

export const ANALYSIS_NAV = [
  { id: "summary", hi: "सारांश", en: "Summary", Icon: House },
  { id: "profile", hi: "क्षेत्र प्रोफ़ाइल", en: "Area profile", Icon: UserRound },
  { id: "findings", hi: "मुख्य निष्कर्ष", en: "Key findings", Icon: Lightbulb },
  { id: "trend", hi: "प्रतिक्रिया ट्रेंड", en: "Response trend", Icon: ChartLine },
  { id: "party", hi: "पार्टी समर्थन", en: "Party support", Icon: Flag },
  { id: "mla", hi: "विधायक पर राय", en: "MLA opinion", Icon: UserCheck },
  { id: "issues", hi: "मुद्दा विश्लेषण", en: "Issue analysis", Icon: Target },
  { id: "demographics", hi: "जनसांख्यिकीय", en: "Demographics", Icon: Users },
  { id: "cross", hi: "क्रॉस विश्लेषण", en: "Cross-analysis", Icon: Network },
  { id: "geo", hi: "भौगोलिक तुलना", en: "Geography", Icon: Map },
  { id: "time", hi: "समय तुलना", en: "Time comparison", Icon: Clock },
  { id: "quality", hi: "डेटा गुणवत्ता", en: "Data quality", Icon: ShieldCheck },
  { id: "ask", hi: "डेटा से पूछें", en: "Ask the data", Icon: MessageSquareText },
  { id: "report", hi: "रिपोर्ट डाउनलोड", en: "Report download", Icon: Download },
] as const;

/**
 * Keeps a navigation element in view while the page scrolls. (The site's
 * global overflow-x rule on <body> stops CSS `position: sticky` from ever
 * engaging, so the element is pinned with `position: fixed` instead, inside
 * its in-flow holder and never past the end of its container.)
 */
function usePinned(gap: number) {
  const holder = useRef<HTMLDivElement>(null);
  const pinned = useRef<HTMLElement>(null);
  useEffect(() => {
    const reset = (h: HTMLDivElement, el: HTMLElement) => {
      h.style.height = "";
      el.style.position = el.style.top = el.style.left = el.style.width = "";
    };
    const place = () => {
      const h = holder.current;
      const el = pinned.current;
      if (!h || !el) return;
      if (getComputedStyle(h).display === "none") return reset(h, el);
      const header = document.querySelector("header")?.getBoundingClientRect().bottom ?? 0;
      const offset = Math.max(header, 0) + gap;
      const box = h.getBoundingClientRect();
      if (box.top >= offset) return reset(h, el);
      const height = el.offsetHeight;
      const limit = (h.parentElement?.getBoundingClientRect().bottom ?? Infinity) - height;
      h.style.height = `${height}px`;
      el.style.position = "fixed";
      el.style.top = `${Math.min(offset, limit)}px`;
      el.style.left = `${box.left}px`;
      el.style.width = `${box.width}px`;
    };
    // A handful of layout reads per scroll event — cheap enough to run directly.
    place();
    window.addEventListener("scroll", place, { passive: true });
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place);
      window.removeEventListener("resize", place);
    };
  }, [gap]);
  return { holder, pinned };
}

function useActiveSection(sectionIds: string[]) {
  const [active, setActive] = useState(sectionIds[0]);
  const clicked = useRef<string | null>(null);
  const idsKey = sectionIds.join("|");
  useEffect(() => {
    const ids = idsKey.split("|");
    const update = () => {
      const line = 150;
      let best: { id: string; top: number }[] = [];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top > line) continue;
        if (!best.length || top > best[0].top + 4) best = [{ id, top }];
        else if (Math.abs(top - best[0].top) <= 4) best.push({ id, top });
      }
      if (!best.length) return setActive(ids[0]);
      const pick = best.find((b) => b.id === clicked.current) ?? best[0];
      setActive(pick.id);
    };
    const first = setTimeout(update, 0);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      clearTimeout(first);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [idsKey]);
  const mark = (id: string) => {
    clicked.current = id;
    setActive(id);
  };
  return { active, mark };
}

export function AnalysisSideNav({ hi, ids }: { hi: boolean; ids: string[] }) {
  const items = ANALYSIS_NAV.filter((n) => ids.includes(n.id));
  const { active, mark } = useActiveSection(items.map((i) => i.id));
  const { holder, pinned } = usePinned(16);
  return (
    <div ref={holder} className="hidden lg:block">
      <nav
        ref={pinned}
        aria-label={hi ? "विश्लेषण अनुभाग" : "Analysis sections"}
        className="z-20 max-h-[calc(100vh-32px)] overflow-y-auto rounded-2xl border border-[#e3e9f3] bg-white p-2 shadow-[0_1px_3px_rgba(15,31,75,0.05)]"
      >
        <ul className="flex flex-col gap-0.5">
          {items.map(({ id, hi: h, en, Icon }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                onClick={() => mark(id)}
                aria-current={active === id ? "location" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40",
                  active === id ? "bg-[#eaf2ff] text-[#1677ff]" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                <Icon size={17} className="shrink-0" aria-hidden="true" />
                <span className="truncate">{hi ? h : en}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export function AnalysisMobileNav({ hi, ids }: { hi: boolean; ids: string[] }) {
  const items = ANALYSIS_NAV.filter((n) => ids.includes(n.id));
  const { active, mark } = useActiveSection(items.map((i) => i.id));
  const strip = useRef<HTMLUListElement>(null);
  const { holder, pinned } = usePinned(0);
  useEffect(() => {
    const el = strip.current?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    if (el && strip.current) strip.current.scrollTo({ left: el.offsetLeft - 16, behavior: "smooth" });
  }, [active]);
  return (
    <div ref={holder} className="-mx-3 mb-3 sm:-mx-5 lg:hidden">
      <nav
        ref={pinned}
        aria-label={hi ? "विश्लेषण अनुभाग" : "Analysis sections"}
        className="z-30 w-full border-b border-[#e3e9f3] bg-[#f4f7fc]/95 py-2 backdrop-blur"
      >
        <ul ref={strip} className="flex gap-1.5 overflow-x-auto px-3 [scrollbar-width:none] sm:px-5 [&::-webkit-scrollbar]:hidden">
          {items.map(({ id, hi: h, en, Icon }) => (
            <li key={id} data-id={id} className="shrink-0">
              <a
                href={`#${id}`}
                onClick={() => mark(id)}
                aria-current={active === id ? "location" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold",
                  active === id ? "border-[#1677ff] bg-[#1677ff] text-white" : "border-[#dfe6f1] bg-white text-slate-600",
                )}
              >
                <Icon size={13} aria-hidden="true" />
                {hi ? h : en}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
