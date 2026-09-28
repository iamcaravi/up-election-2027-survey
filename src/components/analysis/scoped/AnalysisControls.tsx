"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { CalendarRange, ChevronDown, Download, FileSpreadsheet, FileText, UsersRound } from "lucide-react";
import { QueryParamSelect } from "@/components/scope/ScopeNav";
import { analysisQuery } from "@/lib/analysis-params";
import type { AnalysisFilters, ScopeParams } from "@/lib/scoped-survey";
import { cn } from "@/lib/utils";

export function AnalysisFiltersRow({
  hi,
  scope,
  filters,
  segmentOptions,
  exportDisabled,
}: {
  hi: boolean;
  scope: ScopeParams;
  filters: AnalysisFilters;
  segmentOptions: { value: string; label: string }[];
  exportDisabled: boolean;
}) {
  const q = analysisQuery(scope, filters);
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
      <QueryParamSelect
        key={`seg-${q}`}
        ariaLabel={hi ? "उत्तरदाता समूह" : "Respondent group"}
        icon={<UsersRound size={16} />}
        value={filters.segment}
        options={segmentOptions}
        href={(v) => `/analysis${analysisQuery(scope, { ...filters, segment: v })}`}
      />
      <QueryParamSelect
        key={`per-${q}`}
        ariaLabel={hi ? "समय अवधि" : "Time period"}
        icon={<CalendarRange size={16} />}
        value={filters.period}
        options={[
          { value: "all", label: hi ? "सभी समय" : "All time" },
          { value: "30d", label: hi ? "पिछले 30 दिन" : "Last 30 days" },
          { value: "7d", label: hi ? "पिछले 7 दिन" : "Last 7 days" },
        ]}
        href={(v) => `/analysis${analysisQuery(scope, { ...filters, period: v })}`}
      />
      <ExportMenu hi={hi} query={q} disabled={exportDisabled} />
    </div>
  );
}

export function ExportMenu({ hi, query, disabled, block }: { hi: boolean; query: string; disabled: boolean; block?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn("relative", block && "w-full")}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1677ff] px-4 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#0f63d8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Download size={16} aria-hidden="true" />
        {hi ? "डेटा एक्सपोर्ट करें" : "Export data"}
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-30 mt-2 w-full min-w-[240px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
          <MenuLink
            href={`/api/analysis/export${query}`}
            download
            icon={<FileSpreadsheet size={18} className="text-emerald-600" />}
            title={hi ? "Excel में डाउनलोड करें" : "Download as Excel"}
            sub={hi ? "विस्तृत डेटा — .xlsx" : "Detailed data — .xlsx"}
            onDone={() => setOpen(false)}
          />
          <MenuLink
            href={`/analysis/report${query}`}
            newTab
            icon={<FileText size={18} className="text-red-600" />}
            title={hi ? "PDF में डाउनलोड करें" : "Download as PDF"}
            sub={hi ? "प्रिंट योग्य रिपोर्ट — PDF के रूप में सहेजें" : "Printable report — save as PDF"}
            onDone={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon,
  title,
  sub,
  download,
  newTab,
  onDone,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  sub: string;
  download?: boolean;
  newTab?: boolean;
  onDone: () => void;
}) {
  return (
    <a
      role="menuitem"
      href={href}
      download={download || undefined}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener" : undefined}
      onClick={onDone}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none"
    >
      <span aria-hidden="true">{icon}</span>
      <span>
        <span className="block text-sm font-bold text-slate-800">{title}</span>
        <span className="block text-[11px] text-slate-500">{sub}</span>
      </span>
    </a>
  );
}

/** Lightweight tabs for server-rendered panels (cross-analysis, profile). */
export function PanelTabs({ tabs, printMode }: { tabs: { key: string; label: string; content: ReactNode }[]; printMode?: boolean }) {
  const [active, setActive] = useState(tabs[0]?.key);
  if (printMode)
    return (
      <div className="flex flex-col gap-5">
        {tabs.map((t) => (
          <div key={t.key}>
            <p className="mb-2 text-sm font-bold text-slate-700">{t.label}</p>
            {t.content}
          </div>
        ))}
      </div>
    );
  return (
    <div>
      <div role="tablist" className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active === t.key}
            onClick={() => setActive(t.key)}
            className={cn(
              "shrink-0 cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40",
              active === t.key ? "border-[#1677ff] bg-[#1677ff] text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.key} role="tabpanel" hidden={active !== t.key}>
          {t.content}
        </div>
      ))}
    </div>
  );
}

/** Opens the browser's print dialog (Save as PDF) once the report has rendered. */
export function PrintOnLoad({ hi }: { hi: boolean }) {
  useEffect(() => {
    const t = setTimeout(() => window.print(), 600);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900 print:hidden">
      <span>{hi ? "प्रिंट विंडो में “PDF के रूप में सहेजें” चुनें।" : "Choose “Save as PDF” in the print dialog."}</span>
      <button
        type="button"
        onClick={() => window.print()}
        className="cursor-pointer rounded-lg bg-[#1677ff] px-4 py-2 font-semibold text-white hover:bg-[#0f63d8]"
      >
        {hi ? "PDF सहेजें / प्रिंट करें" : "Save PDF / Print"}
      </button>
    </div>
  );
}
