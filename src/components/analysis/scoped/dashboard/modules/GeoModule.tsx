"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { AREA_UNIT_LABELS, type AreaComparisonResult, type AreaUnit, type CompareOptions, type CrossResult, type Dimension } from "@/lib/analysis-dimensions";
import type { CrossTab } from "@/lib/scoped-survey";
import { HeatTable, StackedCrossTab } from "@/components/scope/charts";
import { CompareTable } from "../charts";
import { Empty } from "../ui";
import { SegTabs } from "../interactive";
import { ChoiceChips, ModuleState, useModule } from "./useModule";

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

function AreaMetric({ hi, query, metric }: { hi: boolean; query: string; metric: Dimension }) {
  const [showAll, setShowAll] = useState(false);
  const { data, loading, error, retry } = useModule<CrossResult>(query, { module: "cross", a: "area", b: metric });
  const rows = data ? (showAll ? data.rows : data.rows.slice(0, ROW_LIMIT)) : [];
  return (
    <ModuleState hi={hi} loading={loading} error={error} onRetry={retry}>
      {!data || !data.meaningful ? (
        <Empty>{hi ? "इस तुलना के लिए पर्याप्त प्रतिक्रियाएं उपलब्ध नहीं हैं।" : "Not enough responses for this comparison."}</Empty>
      ) : (
        <div>
          {data.multiB ? (
            <HeatTable tab={toCrossTab(data, rows)} hi={hi} insufficientLabel={hi ? "प्रतिक्रियाएं कम" : "Too few"} />
          ) : (
            <StackedCrossTab tab={toCrossTab(data, rows)} hi={hi} insufficientLabel={hi ? "प्रतिक्रियाएं कम" : "Too few"} />
          )}
          {data.rows.length > ROW_LIMIT && (
            <button type="button" onClick={() => setShowAll((s) => !s)} className="mt-3 cursor-pointer text-xs font-bold text-[#1677ff] hover:underline">
              {showAll ? (hi ? "कम दिखाएं" : "Show fewer") : hi ? `सभी ${data.rows.length} क्षेत्र दिखाएं` : `Show all ${data.rows.length} areas`}
            </button>
          )}
          <p className="mt-2 text-[11px] text-slate-500">
            {hi ? "क्षेत्रों को प्रतिक्रियाओं की संख्या (N) के क्रम में दिखाया गया है; 5 से कम प्रतिक्रियाओं वाले क्षेत्रों का वितरण नहीं दिखाया जाता।" : "Areas are ordered by number of responses (N); areas with fewer than 5 responses are not drawn."}
          </p>
        </div>
      )}
    </ModuleState>
  );
}

export function CompareAreas({ hi, query, defaultRef }: { hi: boolean; query: string; defaultRef?: string }) {
  const opts = useModule<CompareOptions>(query, { module: "compare-options" });
  const levels = opts.data?.levels ?? [];
  const defaultLevel = (defaultRef?.split(":")[0] as AreaUnit | undefined) ?? undefined;
  const [level, setLevel] = useState<AreaUnit | null>(null);
  const current = level ?? (levels.find((l) => l.level === defaultLevel) ? defaultLevel! : levels[0]?.level) ?? null;
  const [picked, setPicked] = useState<{ a: string; b: string } | null>(null);
  const options = levels.find((l) => l.level === current)?.options ?? [];
  const a = picked?.a ?? (defaultRef && options.some((o) => o.ref === defaultRef) ? defaultRef : "");
  const b = picked?.b ?? "";
  const cmp = useModule<AreaComparisonResult>(query, a && b && a !== b ? { module: "compare", x: a, y: b } : null);
  const unitLabel = (l: AreaUnit) => (hi ? AREA_UNIT_LABELS[l].hi : AREA_UNIT_LABELS[l].en);

  const select = (value: string, onChange: (v: string) => void, id: string, text: string, exclude: string) => {
    const groups = new Map<string, typeof options>();
    options.forEach((o) => (groups.get(o.group ?? "") ?? groups.set(o.group ?? "", []).get(o.group ?? "")!).push(o));
    return (
      <label htmlFor={id} className="block min-w-0">
        <span className="mb-1 block text-[12px] font-semibold text-slate-600">{text}</span>
        <span className="relative block">
          <select
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 w-full cursor-pointer appearance-none rounded-lg border border-[#dce4f0] bg-white pl-3 pr-8 text-[13px] font-semibold text-[#0b1f3a] focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">{hi ? `${unitLabel(current!)} चुनें` : `Choose ${unitLabel(current!).toLowerCase()}`}</option>
            {[...groups.entries()].map(([g, list]) =>
              g ? (
                <optgroup key={g} label={g}>
                  {list.map((o) => (
                    <option key={o.ref} value={o.ref} disabled={o.ref === exclude}>
                      {o.label} (N={o.n})
                    </option>
                  ))}
                </optgroup>
              ) : (
                list.map((o) => (
                  <option key={o.ref} value={o.ref} disabled={o.ref === exclude}>
                    {o.label} (N={o.n})
                  </option>
                ))
              )
            )}
          </select>
          <ChevronDown size={15} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
        </span>
      </label>
    );
  };

  return (
    <ModuleState hi={hi} loading={opts.loading} error={opts.error} onRetry={opts.retry}>
      {!current || options.length < 2 ? (
        <Empty>{hi ? "तुलना के लिए प्रतिक्रियाओं वाले कम से कम दो क्षेत्र आवश्यक हैं।" : "At least two areas with responses are needed to compare."}</Empty>
      ) : (
        <div className="flex flex-col gap-4">
          {levels.length > 1 && (
            <ChoiceChips
              label={hi ? "तुलना का स्तर" : "Comparison level"}
              value={current}
              onChange={(l) => {
                setLevel(l);
                setPicked({ a: "", b: "" });
              }}
              options={levels.map((l) => ({ value: l.level, label: hi ? `${AREA_UNIT_LABELS[l.level].hi} बनाम ${AREA_UNIT_LABELS[l.level].hi}` : `${AREA_UNIT_LABELS[l.level].en} vs ${AREA_UNIT_LABELS[l.level].en}` }))}
            />
          )}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {select(a, (v) => setPicked({ a: v, b }), "compare-a", hi ? "क्षेत्र A" : "Area A", b)}
            {select(b, (v) => setPicked({ a, b: v }), "compare-b", hi ? "क्षेत्र B" : "Area B", a)}
          </div>
          {!a || !b ? (
            <Empty>{hi ? "तुलना देखने के लिए दोनों क्षेत्र चुनें।" : "Choose both areas to compare."}</Empty>
          ) : (
            <ModuleState hi={hi} loading={cmp.loading} error={cmp.error} onRetry={cmp.retry}>
              {cmp.data &&
                (!cmp.data.enough ? (
                  <Empty>
                    {hi ? "इस तुलना के लिए पर्याप्त प्रतिक्रियाएं उपलब्ध नहीं हैं।" : "Not enough responses for this comparison."} ({cmp.data.a.label}: N={cmp.data.a.n} · {cmp.data.b.label}: N={cmp.data.b.n})
                  </Empty>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-2.5">
                      {[cmp.data.a, cmp.data.b].map((s, i) => (
                        <div key={s.ref} className="min-w-0 rounded-xl border border-[#dbe7fb] bg-[#f5f9ff] p-3">
                          <p className="text-[11px] font-bold text-[#1677ff]">{i === 0 ? "A" : "B"}</p>
                          <p className="truncate text-sm font-black text-[#0b1f3a]">{s.label}</p>
                          <p className="text-xs text-slate-600">{hi ? `${s.n} प्रतिक्रियाएं` : `${s.n} responses`}</p>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {cmp.data.metrics.map((m) => (
                        <CompareTable key={m.key} metric={m} aLabel="A" bLabel="B" diffLabel={hi ? "अंतर (A−B)" : "Diff (A−B)"} hi={hi} />
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {hi ? "अंतर प्रतिशत अंकों में है। यह केवल दोनों क्षेत्रों की उपलब्ध सर्वे प्रतिक्रियाओं की तुलना है।" : "Differences are in percentage points. This only compares the available survey responses of the two areas."}
                    </p>
                  </div>
                ))}
            </ModuleState>
          )}
        </div>
      )}
    </ModuleState>
  );
}

export function GeoModule({
  hi,
  query,
  unit,
  summary,
  levels,
  defaultRef,
}: {
  hi: boolean;
  query: string;
  unit: AreaUnit | null;
  summary: ReactNode | null;
  levels: ReactNode | null;
  defaultRef?: string;
}) {
  const metric = (key: string, label: string, dim: Dimension) => ({ key, label, content: <AreaMetric hi={hi} query={query} metric={dim} /> });
  const tabs = [
    ...(unit && summary
      ? [
          { key: "summary", label: hi ? "सारांश" : "Summary", content: summary },
          metric("party", hi ? "पार्टी समर्थन" : "Party support", "party_preference"),
          metric("mla", hi ? "विधायक पर राय" : "MLA opinion", "mla_satisfaction"),
          metric("issues", hi ? "मुख्य मुद्दे" : "Main issues", "top_issue"),
          metric("gender", hi ? "लिंग" : "Gender", "gender"),
          metric("age", hi ? "आयु" : "Age", "age_group"),
          metric("category", hi ? "सामाजिक श्रेणी" : "Social category", "social_category"),
        ]
      : []),
    { key: "compare", label: hi ? "दो क्षेत्रों की तुलना" : "Compare two areas", content: <CompareAreas hi={hi} query={query} defaultRef={defaultRef} /> },
    ...(levels ? [{ key: "levels", label: hi ? "राज्य बनाम जिला बनाम विधानसभा" : "State vs district vs AC", content: levels }] : []),
  ];
  return <SegTabs tabs={tabs} size="md" />;
}
