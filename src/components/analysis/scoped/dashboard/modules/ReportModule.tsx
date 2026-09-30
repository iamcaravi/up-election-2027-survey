"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, SlidersHorizontal } from "lucide-react";
import { REPORT_MODULES, REPORT_MODULE_LABELS, type ReportModule } from "@/lib/analysis-params";
import { cn } from "@/lib/utils";
import { CARD, IconChip } from "../ui";
import { useHub } from "../DeepHub";

const withModules = (query: string, modules?: ReportModule[]) =>
  modules && modules.length < REPORT_MODULES.length ? `${query}${query ? "&" : "?"}modules=${modules.join(",")}` : query;

const BTN = "inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 text-[13px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2";

function Links({ hi, query, modules, disabled }: { hi: boolean; query: string; modules?: ReportModule[]; disabled: boolean }) {
  const q = withModules(query, modules);
  if (disabled)
    return (
      <div className="flex gap-2">
        <span aria-disabled="true" className={cn(BTN, "cursor-not-allowed border-slate-200 text-slate-400")}>
          <FileText size={16} aria-hidden="true" /> {hi ? "PDF रिपोर्ट" : "PDF report"}
        </span>
        <span aria-disabled="true" className={cn(BTN, "cursor-not-allowed border-slate-200 text-slate-400")}>
          <FileSpreadsheet size={16} aria-hidden="true" /> {hi ? "Excel रिपोर्ट" : "Excel report"}
        </span>
      </div>
    );
  return (
    <div className="flex gap-2">
      <a href={`/analysis/report${q}`} target="_blank" rel="noopener" className={cn(BTN, "border-[#f5c2c7] bg-white text-[#dc2626] hover:bg-[#fff5f5] focus-visible:ring-red-500/40")}>
        <FileText size={16} aria-hidden="true" /> {hi ? "PDF रिपोर्ट" : "PDF report"}
      </a>
      <a href={`/api/analysis/export${q}`} download className={cn(BTN, "border-[#bfe5cc] bg-white text-[#15803d] hover:bg-[#f2fbf5] focus-visible:ring-emerald-500/40")}>
        <FileSpreadsheet size={16} aria-hidden="true" /> {hi ? "Excel रिपोर्ट" : "Excel report"}
      </a>
    </div>
  );
}

export function ReportCard({ hi, query, disabled }: { hi: boolean; query: string; disabled: boolean }) {
  const { open } = useHub();
  return (
    <section id="report" className={cn(CARD, "flex min-w-0 scroll-mt-24 flex-col p-4")}>
      <div className="flex items-start gap-3">
        <IconChip tone="red" size="lg">
          <Download size={22} />
        </IconChip>
        <div className="min-w-0">
          <h2 className="text-[15.5px] font-extrabold leading-tight text-[#0b1f3a]">{hi ? "रिपोर्ट डाउनलोड" : "Report download"}</h2>
          <p className="mt-1 text-[12px] leading-relaxed text-slate-600">{hi ? "विस्तृत PDF और Excel रिपोर्ट डाउनलोड करें।" : "Download a detailed PDF or Excel report."}</p>
        </div>
      </div>
      <div className="mt-auto pt-3">
        <Links hi={hi} query={query} disabled={disabled} />
        {!disabled && (
          <button type="button" onClick={() => open("report-builder")} className="mt-2 inline-flex cursor-pointer items-center gap-1.5 text-xs font-bold text-[#1677ff] hover:underline">
            <SlidersHorizontal size={13} aria-hidden="true" />
            {hi ? "रिपोर्ट अनुकूलित करें (मॉड्यूल चुनें)" : "Customise report (choose modules)"}
          </button>
        )}
      </div>
    </section>
  );
}

export function ReportBuilder({ hi, query, scopeSummary }: { hi: boolean; query: string; scopeSummary: string[] }) {
  const [picked, setPicked] = useState<ReportModule[]>([...REPORT_MODULES]);
  const toggle = (m: ReportModule) => setPicked((p) => (p.includes(m) ? p.filter((x) => x !== m) : REPORT_MODULES.filter((x) => p.includes(x) || x === m)));
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border border-slate-100 bg-[#fbfcfe] p-3 text-xs text-slate-600">
        <p className="mb-1 font-bold text-[#0b1f3a]">{hi ? "रिपोर्ट का दायरा (ऊपर चुने गए फ़िल्टर)" : "Report scope (filters selected above)"}</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {scopeSummary.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>
      <fieldset>
        <legend className="mb-2 text-[13px] font-extrabold text-[#0b1f3a]">{hi ? "रिपोर्ट में शामिल करें" : "Include in the report"}</legend>
        <div className="mb-2 flex gap-3 text-xs font-bold">
          <button type="button" className="cursor-pointer text-[#1677ff] hover:underline" onClick={() => setPicked([...REPORT_MODULES])}>
            {hi ? "सभी चुनें" : "Select all"}
          </button>
          <button type="button" className="cursor-pointer text-[#1677ff] hover:underline" onClick={() => setPicked([])}>
            {hi ? "सभी हटाएं" : "Clear all"}
          </button>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {REPORT_MODULES.map((m, i) => (
            <label key={m} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 has-[:checked]:border-[#9ec2ff] has-[:checked]:bg-[#f5f9ff]">
              <input type="checkbox" checked={picked.includes(m)} onChange={() => toggle(m)} className="h-4 w-4 accent-[#1677ff]" />
              <span className="text-slate-400">{i + 1}.</span> {hi ? REPORT_MODULE_LABELS[m].hi : REPORT_MODULE_LABELS[m].en}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="max-w-md">
        <Links hi={hi} query={query} modules={picked} disabled={picked.length === 0} />
      </div>
      <p className="text-[11px] text-slate-500">
        {hi
          ? "रिपोर्ट में केवल वही मॉड्यूल शामिल होंगे जिनके लिए डेटा उपलब्ध है। सभी आंकड़े समेकित हैं — कोई व्यक्तिगत पहचान योग्य जानकारी शामिल नहीं होती। PDF के लिए प्रिंट विंडो में “PDF के रूप में सहेजें” चुनें।"
          : "Only modules with available data are included. All figures are aggregated — no personally identifiable information. For PDF, choose “Save as PDF” in the print dialog."}
      </p>
    </div>
  );
}
