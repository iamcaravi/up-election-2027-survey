"use client";

import { useState, type ReactNode } from "react";
import { CalendarDays, ChevronDown, X } from "lucide-react";
import { useScopeNav } from "@/components/scope/ScopeNav";
import { ALL_STATES_PARAM, analysisQuery, isIsoDate } from "@/lib/analysis-params";
import type { AnalysisFilters as Filters, ScopeParams } from "@/lib/scoped-survey";
import { cn } from "@/lib/utils";
import { CARD } from "./ui";

// Analysis filters. The URL stays the single source of truth: every change
// navigates to the canonical /analysis?… URL (refresh, share and Back/Forward
// reproduce it). Scope selects apply immediately; the optional date range
// applies with "लागू करें".

type Option = { slug: string; label: string; number?: number };

interface Props {
  hi: boolean;
  variant: "header" | "bar";
  scope: ScopeParams;
  options: { states: Option[]; districts: Option[]; constituencies: Option[] };
  filters: Filters;
  segmentOptions: { value: string; label: string }[];
  today: string;
}

const SELECT =
  "h-10 w-full cursor-pointer appearance-none rounded-lg border border-[#dce4f0] bg-white pl-3 pr-8 text-[13px] font-semibold text-[#0b1f3a] shadow-[0_1px_1px_rgba(15,31,75,0.03)] focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400";

function Field({ label, hideLabelOnMobile, children, className }: { label: string; hideLabelOnMobile?: boolean; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block min-w-0", className)}>
      <span className={cn("mb-1 block text-[12px] font-semibold text-slate-600", hideLabelOnMobile && "sr-only sm:not-sr-only sm:block")}>{label}</span>
      <span className="relative block">
        {children}
        <ChevronDown size={15} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
      </span>
    </label>
  );
}

export function AnalysisFilters({ hi, variant, scope, options, filters, segmentOptions, today }: Props) {
  const { navigate } = useScopeNav();
  const [local, setLocal] = useState(scope);
  const [period, setPeriod] = useState(filters.period);
  const [from, setFrom] = useState(filters.from ?? "");
  const [to, setTo] = useState(filters.to ?? "");
  const isAll = local.state === ALL_STATES_PARAM;

  const go = (next: ScopeParams, f: Partial<Filters> = filters) => navigate(`/analysis${analysisQuery(next, { ...filters, ...f })}`);
  const changeScope = (next: ScopeParams) => {
    setLocal(next);
    go(next);
  };
  const changePeriod = (v: string) => {
    setPeriod(v);
    if (v === "custom") {
      if (variant === "header") document.getElementById("analysis-date-from")?.focus();
      return;
    }
    go(scope, { period: v, from: undefined, to: undefined });
  };
  const validRange = isIsoDate(from) && isIsoDate(to) && from <= to;
  const apply = () => validRange && go(scope, { period: "custom", from, to });
  const clearRange = () => {
    setFrom("");
    setTo("");
    setPeriod("all");
    go(scope, { period: "all", from: undefined, to: undefined });
  };

  const periodSelect = (
    <select aria-label={hi ? "अवधि" : "Period"} className={SELECT} value={period} onChange={(e) => changePeriod(e.target.value)}>
      <option value="all">{hi ? "सभी समय" : "All time"}</option>
      <option value="30d">{hi ? "पिछले 30 दिन" : "Last 30 days"}</option>
      <option value="7d">{hi ? "पिछले 7 दिन" : "Last 7 days"}</option>
      <option value="custom">{hi ? "कस्टम तिथि" : "Custom dates"}</option>
    </select>
  );
  const segmentSelect = (
    <select aria-label={hi ? "उत्तरदाता समूह" : "Respondent group"} className={SELECT} value={filters.segment} onChange={(e) => go(scope, { segment: e.target.value })}>
      {segmentOptions.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );

  if (variant === "header")
    return (
      <div className="grid grid-cols-1 gap-2">
        <Field label={hi ? "अवधि" : "Period"}>{periodSelect}</Field>
        <Field label={hi ? "उत्तरदाता समूह" : "Respondent group"}>{segmentSelect}</Field>
      </div>
    );

  const showDates = period === "custom";
  return (
    <div className={cn(CARD, "p-3 sm:p-4")}>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.7fr)] xl:items-end">
        <Field label={hi ? "राज्य" : "State"} hideLabelOnMobile>
          <select
            aria-label={hi ? "राज्य चुनें" : "Select state"}
            className={SELECT}
            value={local.state ?? ""}
            onChange={(e) => changeScope({ state: e.target.value || undefined })}
          >
            {options.states.map((o) => (
              <option key={o.slug} value={o.slug}>
                {o.label}
              </option>
            ))}
            <option value={ALL_STATES_PARAM}>{hi ? "सभी राज्य (समग्र)" : "All states (combined)"}</option>
          </select>
        </Field>
        <Field label={hi ? "जिला" : "District"} hideLabelOnMobile>
          <select
            aria-label={hi ? "जिला चुनें" : "Select district"}
            className={SELECT}
            value={local.district ?? ""}
            disabled={isAll || !local.state || options.districts.length === 0}
            onChange={(e) => changeScope({ state: local.state, district: e.target.value || undefined })}
          >
            <option value="">{hi ? "सभी जिले" : "All districts"}</option>
            {options.districts.map((o) => (
              <option key={o.slug} value={o.slug}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label={hi ? "विधानसभा क्षेत्र" : "Constituency"} hideLabelOnMobile>
          <select
            aria-label={hi ? "विधानसभा क्षेत्र चुनें" : "Select constituency"}
            className={SELECT}
            value={local.constituency ?? ""}
            disabled={isAll || !local.district || options.constituencies.length === 0}
            onChange={(e) => changeScope({ state: local.state, district: local.district, constituency: e.target.value || undefined })}
          >
            <option value="">{hi ? "सभी विधानसभा क्षेत्र" : "All constituencies"}</option>
            {options.constituencies.map((o) => (
              <option key={o.slug} value={o.slug}>
                {o.label}
                {o.number ? ` (${o.number})` : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label={hi ? "अवधि" : "Period"} hideLabelOnMobile className="xl:hidden">
          {periodSelect}
        </Field>
        <Field label={hi ? "उत्तरदाता समूह" : "Respondent group"} hideLabelOnMobile className="col-span-2 xl:hidden">
          {segmentSelect}
        </Field>
        <div className={cn("col-span-2 min-w-0 xl:col-span-1 xl:block", !showDates && "hidden")}>
          <p className="mb-1 block text-[12px] font-semibold text-slate-600">{hi ? "तारीख सीमा (वैकल्पिक)" : "Date range (optional)"}</p>
          <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
            <DateInput id="analysis-date-from" label={hi ? "शुरू दिनांक" : "Start date"} value={from} max={to || today} onChange={setFrom} />
            <DateInput id="analysis-date-to" label={hi ? "अंतिम दिनांक" : "End date"} value={to} min={from || undefined} max={today} onChange={setTo} />
            <button
              type="button"
              onClick={apply}
              disabled={!validRange}
              className="h-10 shrink-0 cursor-pointer rounded-lg bg-[#1677ff] px-4 text-[13px] font-bold text-white shadow-sm hover:bg-[#0f63d8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {hi ? "लागू करें" : "Apply"}
            </button>
            {filters.period === "custom" && (
              <button
                type="button"
                onClick={clearRange}
                aria-label={hi ? "तारीख सीमा हटाएं" : "Clear date range"}
                className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              >
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DateInput({ id, label, value, min, max, onChange }: { id: string; label: string; value: string; min?: string; max?: string; onChange: (v: string) => void }) {
  return (
    <label className="relative min-w-0 flex-1 basis-[120px]">
      <span className="sr-only">{label}</span>
      <CalendarDays size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <input
        id={id}
        type="date"
        value={value}
        min={min}
        max={max}
        title={label}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "peer h-10 w-full min-w-0 rounded-lg border border-[#dce4f0] bg-white pl-8 pr-2 text-[13px] font-semibold text-[#0b1f3a] focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
          !value && "text-transparent focus:text-[#0b1f3a]"
        )}
      />
      {!value && (
        <span className="pointer-events-none absolute left-8 top-1/2 -translate-y-1/2 text-[13px] font-medium text-slate-400 peer-focus:hidden" aria-hidden="true">
          {label}
        </span>
      )}
    </label>
  );
}
