"use client";

import { useState } from "react";
import { AREA_UNIT_LABELS, DIMENSION_LABELS, type AreaUnit, type IssueDeepDive } from "@/lib/analysis-dimensions";
import { issueStyle } from "@/components/scope/charts";
import { cn } from "@/lib/utils";
import { ShareRows } from "../charts";
import { Empty } from "../ui";
import { ModuleState, useModule } from "./useModule";

type IssueItem = { key: string; label: string; count: number; pct: number };

export function IssueModule({
  hi,
  query,
  issues,
  answered,
  categories,
}: {
  hi: boolean;
  query: string;
  issues: IssueItem[];
  answered: number;
  categories: IssueItem[] | null;
}) {
  const [selected, setSelected] = useState(issues[0]?.key ?? "");
  const [allAreas, setAllAreas] = useState(false);
  const { data, loading, error, retry } = useModule<IssueDeepDive | null>(query, selected ? { module: "issue", issue: selected } : null);

  if (!issues.length) return <Empty>{hi ? "इस विश्लेषण के लिए अभी पर्याप्त डेटा उपलब्ध नहीं है।" : "Not enough data for this analysis yet."}</Empty>;

  const dimTitle = (dim: IssueDeepDive["breakdowns"][number]["dim"], u: AreaUnit | null) =>
    dim === "area" && u
      ? hi
        ? `${AREA_UNIT_LABELS[u].hiOblique} के अनुसार`
        : `By ${AREA_UNIT_LABELS[u].en.toLowerCase()}`
      : dim === "party_preference"
        ? hi
          ? "पार्टी समर्थन के अनुसार"
          : "By party support"
        : hi
          ? `${DIMENSION_LABELS[dim].hi} के अनुसार`
          : `By ${DIMENSION_LABELS[dim].en.toLowerCase()}`;

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[290px_minmax(0,1fr)]">
      <div className="min-w-0">
        <p className="mb-2 text-[13px] font-extrabold text-[#0b1f3a]">
          {hi ? "सभी मुद्दे" : "All issues"} <span className="font-normal text-slate-500">({hi ? "आधार" : "base"}: {answered})</span>
        </p>
        <ul className="flex flex-col gap-1">
          {issues.map((it, i) => {
            const s = issueStyle(it.key);
            const on = it.key === selected;
            return (
              <li key={it.key}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setSelected(it.key);
                    setAllAreas(false);
                  }}
                  className={cn(
                    "grid w-full cursor-pointer grid-cols-[18px_minmax(0,1fr)_minmax(0,1fr)_38px] items-center gap-2 rounded-lg border px-2 py-1.5 text-left text-xs transition-colors",
                    on ? "border-[#9ec2ff] bg-[#eef4ff]" : "border-transparent hover:bg-slate-50"
                  )}
                >
                  <span className="font-bold text-slate-400">{i + 1}</span>
                  <span className="truncate font-semibold text-slate-800">{it.label}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <span className="block h-full rounded-full" style={{ width: `${it.pct}%`, backgroundColor: s.color }} />
                  </span>
                  <span className="text-right font-extrabold text-[#0b1f3a]">{Math.round(it.pct)}%</span>
                </button>
              </li>
            );
          })}
        </ul>
        {categories && categories.length > 0 && (
          <div className="mt-4 rounded-xl border border-slate-100 bg-[#fbfcfe] p-3">
            <p className="mb-2 text-[12.5px] font-extrabold text-[#0b1f3a]">{hi ? "मुद्दों का वर्गीकरण" : "Issue categories"}</p>
            <ul className="flex flex-col gap-1.5">
              {categories.map((c) => (
                <li key={c.key} className="grid grid-cols-[minmax(0,1fr)_38px] gap-2 text-xs">
                  <span className="truncate text-slate-700">{c.label}</span>
                  <span className="text-right font-bold text-[#0b1f3a]">{Math.round(c.pct)}%</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[10.5px] text-slate-500">{hi ? "किसी भी श्रेणी का कोई मुद्दा चुनने वाले उत्तरदाता" : "Respondents selecting any issue in the category"}</p>
          </div>
        )}
      </div>

      <div className="min-w-0">
        <ModuleState hi={hi} loading={loading} error={error} onRetry={retry}>
          {!data ? (
            <Empty>{hi ? "इस मुद्दे के लिए डेटा उपलब्ध नहीं है।" : "No data for this issue."}</Empty>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-end justify-between gap-2 rounded-xl border border-[#dbe7fb] bg-[#f5f9ff] p-3">
                <div>
                  <p className="text-lg font-black text-[#0b1f3a]">{data.issue.label}</p>
                  <p className="text-xs text-slate-600">
                    {hi
                      ? `मुद्दों का उत्तर देने वाले ${data.overall.answered} में से ${data.overall.count} उत्तरदाताओं ने चुना`
                      : `Chosen by ${data.overall.count} of ${data.overall.answered} respondents who answered`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-[#1677ff]">{Math.round(data.overall.pct)}%</p>
                  <p className="text-[11px] font-semibold text-slate-500">{hi ? `रैंक ${data.overall.rank}/${data.overall.totalIssues}` : `Rank ${data.overall.rank}/${data.overall.totalIssues}`}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {data.breakdowns.map((b) => {
                  const areaRows = b.dim === "area" && !allAreas ? b.rows.slice(0, 8) : b.rows;
                  return (
                    <div key={b.dim} className="min-w-0 rounded-xl border border-slate-100 bg-[#fbfcfe] p-3">
                      <p className="mb-2 text-[12.5px] font-extrabold text-[#0b1f3a]">{dimTitle(b.dim, b.unit)}</p>
                      {b.rows.length === 0 ? (
                        <p className="text-[11px] text-slate-500">{hi ? "इस आयाम की जानकारी उपलब्ध नहीं।" : "No information for this dimension."}</p>
                      ) : (
                        <>
                          <ShareRows rows={areaRows} hi={hi} color={issueStyle(data.issue.key).color} />
                          {b.dim === "area" && b.rows.length > 8 && (
                            <button type="button" onClick={() => setAllAreas((v) => !v)} className="mt-2 cursor-pointer text-[11.5px] font-bold text-[#1677ff] hover:underline">
                              {allAreas ? (hi ? "कम दिखाएं" : "Show fewer") : hi ? `सभी ${b.rows.length} दिखाएं` : `Show all ${b.rows.length}`}
                            </button>
                          )}
                          {!b.meaningful && <p className="mt-2 text-[10.5px] text-slate-500">{hi ? "तुलना के लिए पर्याप्त प्रतिक्रियाएं नहीं।" : "Not enough responses to compare."}</p>}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-500">
                {hi
                  ? "प्रत्येक पंक्ति: उस समूह के उत्तरदाताओं (N) में से कितने प्रतिशत ने यह मुद्दा चुना। 5 से कम प्रतिक्रियाओं वाले समूह का प्रतिशत नहीं दिखाया जाता।"
                  : "Each row: share of that group's respondents (N) who chose this issue. Groups with fewer than 5 responses are not shown as a percentage."}
              </p>
            </div>
          )}
        </ModuleState>
      </div>
    </div>
  );
}
