"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CARD, IconChip, type Tone } from "./ui";

// The deep-analysis area below the summary dashboard. Compact tiles open one
// full interactive module at a time in a panel right under their row, so the
// page stays a dashboard rather than a wall of charts. Modules mount (and
// therefore fetch their data) only when opened. In-page links such as
// "#cross" — from the sidebar or a card's "सभी देखें →" — open the matching
// module and scroll to it; the hash stays in the URL, so refresh re-opens it.

interface HubState {
  active: string | null;
  open: (id: string) => void;
  close: () => void;
  question: { text: string; seq: number } | null;
  ask: (text: string) => void;
}

const HubContext = createContext<HubState | null>(null);

export function useHub() {
  const ctx = useContext(HubContext);
  if (!ctx) throw new Error("useHub must be used inside DeepHubProvider");
  return ctx;
}

function scrollToPanel(id: string) {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => document.getElementById(`${id}-panel`)?.scrollIntoView({ behavior: "smooth", block: "start" }))
  );
}

export function DeepHubProvider({ panelIds, children }: { panelIds: string[]; children: ReactNode }) {
  const [active, setActive] = useState<string | null>(null);
  const [question, setQuestion] = useState<HubState["question"]>(null);
  const idsKey = panelIds.join("|");

  const open = useCallback((id: string) => {
    setActive(id);
    if (window.location.hash !== `#${id}`) window.history.replaceState(window.history.state, "", `#${id}`);
    scrollToPanel(id);
  }, []);
  const close = useCallback(() => {
    setActive(null);
    if (window.location.hash) window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
  }, []);
  const ask = useCallback(
    (text: string) => {
      setQuestion((q) => ({ text, seq: (q?.seq ?? 0) + 1 }));
      open("ask-answer");
    },
    [open]
  );

  useEffect(() => {
    const ids = idsKey.split("|");
    const fromHash = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (ids.includes(id)) open(id);
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a[href^="#"]');
      const id = a?.getAttribute("href")?.slice(1);
      if (!id || !ids.includes(id)) return;
      e.preventDefault();
      open(id);
    };
    const t = setTimeout(fromHash, 0);
    window.addEventListener("hashchange", fromHash);
    document.addEventListener("click", onClick);
    return () => {
      clearTimeout(t);
      window.removeEventListener("hashchange", fromHash);
      document.removeEventListener("click", onClick);
    };
  }, [idsKey, open]);

  const value = useMemo(() => ({ active, open, close, question, ask }), [active, open, close, question, ask]);
  return <HubContext.Provider value={value}>{children}</HubContext.Provider>;
}

export function Tile({ id, icon, tone, title, desc, meta, cta }: { id: string; icon: ReactNode; tone: Tone; title: string; desc: string; meta?: string; cta: string }) {
  const { active, open, close } = useHub();
  const isOpen = active === id;
  return (
    <section id={id} className={cn(CARD, "flex min-w-0 scroll-mt-24 flex-col p-4 transition-shadow", isOpen && "border-[#9ec2ff] ring-2 ring-[#1677ff]/20")}>
      <div className="flex items-start gap-3">
        <IconChip tone={tone} size="lg">
          {icon}
        </IconChip>
        <div className="min-w-0">
          <h2 className="text-[15.5px] font-extrabold leading-tight text-[#0b1f3a]">{title}</h2>
          <p className="mt-1 text-[12px] leading-relaxed text-slate-600">{desc}</p>
        </div>
      </div>
      <div className="mt-auto flex items-end justify-between gap-2 pt-3">
        <p className="min-w-0 truncate text-[11.5px] font-semibold text-slate-500">{meta}</p>
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={`${id}-panel`}
          onClick={() => (isOpen ? close() : open(id))}
          className={cn(
            "inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40",
            isOpen ? "border-[#1677ff] bg-[#1677ff] text-white" : "border-[#d6e4ff] bg-white text-[#1677ff] hover:bg-[#f2f7ff]"
          )}
        >
          {cta}
          <ArrowRight size={13} className={cn("transition-transform", isOpen && "rotate-90")} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

export interface PanelDef {
  title: string;
  sub?: string;
  node: ReactNode;
}

/** Renders the open module (if it belongs to this row) directly under the row. */
export function PanelSlot({ panels, closeLabel }: { panels: Record<string, PanelDef>; closeLabel: string }) {
  const { active, close } = useHub();
  const def = active ? panels[active] : undefined;
  if (!active || !def) return null;
  return (
    <section id={`${active}-panel`} aria-label={def.title} className={cn(CARD, "mt-4 min-w-0 scroll-mt-24 p-4 sm:p-5")}>
      <div className="mb-4 flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="min-w-0">
          <h2 className="text-lg font-extrabold leading-tight text-[#0b1f3a] sm:text-xl">{def.title}</h2>
          {def.sub && <p className="mt-0.5 text-xs text-slate-500">{def.sub}</p>}
        </div>
        <button
          type="button"
          onClick={close}
          aria-label={closeLabel}
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      {def.node}
    </section>
  );
}
