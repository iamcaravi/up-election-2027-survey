"use client";

import { useState } from "react";
import { ArrowLeftRight, ChevronDown } from "lucide-react";
import { AREA_UNIT_LABELS, CROSS_PRESETS, DIMENSIONS, DIMENSION_LABELS, type AreaUnit, type CrossResult, type Dimension } from "@/lib/analysis-dimensions";
import type { CrossTab } from "@/lib/scoped-survey";
import { HeatTable, StackedCrossTab } from "@/components/scope/charts";
import { Empty } from "../ui";
import { ModuleState, useModule } from "./useModule";

const ROW_LIMIT = 12;

function toCrossTab(r: CrossResult, rows: CrossResult["rows"]): CrossTab {
  return {
    columns: r.columns,
    meaningful: r.meaningful,
    rows: rows.map((row) => ({
      key: row.key,
      label: row.label,
      n: row.n,
      sufficient: row.sufficient,
      cells: row.cells.map((c, i) => ({ key: c.key, label: r.columns[i]?.label ?? c.key, count: c.count, pct: c.pct, color: r.columns[i]?.color })),
    })),
  };
}

export function CrossModule({ hi, query, unit, initial }: { hi: boolean; query: string; unit: AreaUnit | null; initial?: CrossResult | null }) {
  const [a, setA] = useState<Dimension>("age_group");
  const [b, setB] = useState<Dimension>("party_preference");
  const [showAll, setShowAll] = useState(false);
  const { data, loading, error, retry } = useModule<CrossResult>(
    query,
    { module: "cross", a, b },
    initial ? { params: { module: "cross", a: "age_group", b: "party_preference" }, data: initial } : undefined
  );

  const label = (d: Dimension) => (d === "area" && unit ? (hi ? AREA_UNIT_LABELS[unit].hi : AREA_UNIT_LABELS[unit].en) : hi ? DIMENSION_LABELS[d].hi : DIMENSION_LABELS[d].en);
  const pick = (na: Dimension, nb: Dimension) => {
    setShowAll(false);
    setA(na);
    setB(na === nb ? (na === "party_preference" ? "top_issue" : "party_preference") : nb);
  };
  const presets = CROSS_PRESETS.filter((p) => unit || (p.a !== "area" && p.b !== "area"));
  const notEnough = hi ? "इस तुलना के लिए पर्याप्त प्रतिक्रियाएं उपलब्ध नहीं हैं।" : "Not enough responses for this comparison.";

  const select = (value: Dimension, onChange: (d: Dimension) => void, id: string, text: string, exclude?: Dimension) => (
    <label htmlFor={id} className="block min-w-0">
      <span className="mb-1 block text-[12px] font-semibold text-slate-600">{text}</span>
      <span className="relative block">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value as Dimension)}
          className="h-10 w-full cursor-pointer appearance-none rounded-lg border border-[#dce4f0] bg-white pl-3 pr-8 text-[13px] font-semibold text-[#0b1f3a] focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          {DIMENSIONS.map((d) => (
            <option key={d} value={d} disabled={d === exclude || (d === "area" && !unit)}>
              {label(d)}
              {d === "area" && !unit ? (hi ? " (इस स्तर पर उपलब्ध नहीं)" : " (not available at this level)") : ""}
            </option>
          ))}
        </select>
        <ChevronDown size={15} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
      </span>
    </label>
  );

  const rows = data ? (showAll ? data.rows : data.rows.slice(0, ROW_LIMIT)) : [];
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-end">
        {select(a, (d) => pick(d, b), "cross-a", hi ? "पहला आयाम (समूह)" : "First dimension (groups)")}
        <button
          type="button"
          onClick={() => pick(b, a)}
          aria-label={hi ? "दोनों आयाम आपस में बदलें" : "Swap dimensions"}
          className="flex h-10 w-10 cursor-pointer items-center justify-center justify-self-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        >
          <ArrowLeftRight size={16} aria-hidden="true" />
        </button>
        {select(b, (d) => pick(a, d), "cross-b", hi ? "दूसरा आयाम (किसका वितरण)" : "Second dimension (distribution of)", a)}
      </div>
      <div>
        <p className="mb-1.5 text-[11.5px] font-semibold text-slate-500">{hi ? "तैयार संयोजन" : "Ready-made combinations"}</p>
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p) => {
            const on = p.a === a && p.b === b;
            return (
              <button
                key={`${p.a}-${p.b}`}
                type="button"
                aria-pressed={on}
                onClick={() => pick(p.a, p.b)}
                className={
                  "cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold transition-colors " +
                  (on ? "border-[#1677ff] bg-[#1677ff] text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")
                }
              >
                {label(p.a)} × {label(p.b)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-w-0 rounded-xl border border-slate-100 bg-[#fbfcfe] p-3 sm:p-4">
        <p className="mb-3 text-sm font-extrabold text-[#0b1f3a]">
          {label(a)} × {label(b)}
        </p>
        <ModuleState hi={hi} loading={loading} error={error} onRetry={retry}>
          {!data || !data.meaningful ? (
            <Empty>{notEnough}</Empty>
          ) : (
            <>
              {data.multiB ? (
                <HeatTable tab={toCrossTab(data, rows)} hi={hi} insufficientLabel={hi ? "प्रतिक्रियाएं कम" : "Too few"} />
              ) : (
                <StackedCrossTab tab={toCrossTab(data, rows)} hi={hi} insufficientLabel={hi ? "प्रतिक्रियाएं कम" : "Too few"} />
              )}
              {data.rows.length > ROW_LIMIT && (
                <button type="button" onClick={() => setShowAll((s) => !s)} className="mt-3 cursor-pointer text-xs font-bold text-[#1677ff] hover:underline">
                  {showAll ? (hi ? "कम दिखाएं" : "Show fewer") : hi ? `सभी ${data.rows.length} पंक्तियां दिखाएं` : `Show all ${data.rows.length} rows`}
                </button>
              )}
            </>
          )}
        </ModuleState>
      </div>
      <ul className="flex list-disc flex-col gap-1 pl-4 text-[11px] leading-relaxed text-slate-500">
        <li>{hi ? "प्रत्येक पंक्ति = उस समूह के उत्तरदाता (N); 5 से कम प्रतिक्रियाओं वाले समूह का वितरण नहीं दिखाया जाता।" : "Each row = respondents in that group (N); groups with fewer than 5 responses are not drawn."}</li>
        {data?.multiA && <li>{hi ? "मुद्दे बहुविकल्पीय हैं — एक उत्तरदाता एक से अधिक पंक्तियों में गिना जा सकता है।" : "Issues are multi-select — a respondent can appear in more than one row."}</li>}
        {data?.multiB && <li>{hi ? "मुद्दे बहुविकल्पीय हैं — पंक्ति का कुल 100% से अधिक हो सकता है।" : "Issues are multi-select — a row can add up to more than 100%."}</li>}
        {data && data.hiddenColumns > 0 && (
          <li>
            {data.multiB
              ? hi
                ? `केवल शीर्ष ${data.columns.length} विकल्प दिखाए गए।`
                : `Only the top ${data.columns.length} options are shown.`
              : hi
                ? "कम चुने गए विकल्प “शेष (संयुक्त)” में जोड़े गए हैं।"
                : "Less-chosen options are combined into “Rest (combined)”."}
          </li>
        )}
        <li>{hi ? "यह केवल वर्णनात्मक है; इससे कारण-परिणाम का निष्कर्ष नहीं निकाला जाना चाहिए।" : "Descriptive only; does not imply cause and effect."}</li>
      </ul>
    </div>
  );
}
