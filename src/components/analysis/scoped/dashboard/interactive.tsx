"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CARD } from "./ui";

/** Modal with the detailed view of a compact card ("विस्तृत विश्लेषण →"). */
export function DetailDialog({
  trigger,
  variant = "footer",
  title,
  sub,
  closeLabel,
  children,
}: {
  trigger: string;
  variant?: "footer" | "pill" | "outline";
  title: string;
  sub?: string;
  closeLabel: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const trig = triggerRef.current;
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      trig?.focus();
    };
  }, [open]);

  const button =
    variant === "pill" ? (
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-lg border border-[#d6e4ff] bg-white px-2.5 py-1.5 text-xs font-bold text-[#1677ff] hover:bg-[#f2f7ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
      >
        {trigger}
        <ArrowRight size={13} aria-hidden="true" />
      </button>
    ) : variant === "outline" ? (
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#cfe0ff] bg-white px-3.5 py-2 text-[13px] font-bold text-[#1677ff] hover:bg-[#f2f7ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
      >
        {trigger}
        <ArrowRight size={14} aria-hidden="true" />
      </button>
    ) : (
      <div className="mt-3 border-t border-slate-100 pt-2.5 text-center">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex cursor-pointer items-center gap-1 text-[13px] font-bold text-[#1677ff] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
        >
          {trigger}
          <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>
    );

  return (
    <>
      {button}
      {open &&
        createPortal(
          <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/45 p-0 sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[86vh] sm:max-w-4xl sm:rounded-2xl"
            >
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-6">
                <div className="min-w-0">
                  <h2 id={titleId} className="text-lg font-extrabold text-[#0b1f3a]">
                    {title}
                  </h2>
                  {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
                </div>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={closeLabel}
                  className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
              <div className="overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">{children}</div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

/** Card whose body can be collapsed on mobile (always open on desktop). */
export function CollapsibleCard({ id, header, children, className, toggleLabel }: { id: string; header: ReactNode; children: ReactNode; className?: string; toggleLabel: string }) {
  const [open, setOpen] = useState(true);
  const bodyId = useId();
  return (
    <section id={id} className={cn(CARD, "min-w-0 scroll-mt-24 p-4 sm:p-5", className)}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">{header}</div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={bodyId}
          aria-label={toggleLabel}
          className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-500 hover:bg-slate-50 lg:hidden"
        >
          <ChevronDown size={18} className={cn("transition-transform", open && "rotate-180")} aria-hidden="true" />
        </button>
      </div>
      <div id={bodyId} className={cn(!open && "hidden lg:block")}>
        {children}
      </div>
    </section>
  );
}

/** Small segmented tabs (demographics card, module sub-views). */
export function SegTabs({ tabs, size = "sm", className }: { tabs: { key: string; label: string; content: ReactNode }[]; size?: "sm" | "md"; className?: string }) {
  const [active, setActive] = useState(tabs[0]?.key);
  const current = tabs.find((t) => t.key === active) ?? tabs[0];
  return (
    <div className={className}>
      <div role="tablist" className="mb-3 flex gap-1 overflow-x-auto pb-0.5">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={current?.key === t.key}
            onClick={() => setActive(t.key)}
            className={cn(
              "shrink-0 cursor-pointer rounded-md border font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40",
              size === "sm" ? "px-2.5 py-1 text-[11.5px]" : "px-3 py-1.5 text-xs",
              current?.key === t.key ? "border-[#1677ff] bg-[#eef4ff] text-[#1677ff]" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">{current?.content}</div>
    </div>
  );
}
