"use client";

import { useState } from "react";
import type { Granularity, PeriodComparisonResult, PeriodPreset, TimeMetric, TimeSeriesResult } from "@/lib/analysis-dimensions";
import { isIsoDate } from "@/lib/analysis-params";
import { CompareTable, TimeTable } from "../charts";
import { Empty } from "../ui";
import { SegTabs } from "../interactive";
import { ChoiceChips, ModuleState, useModule } from "./useModule";

function fmt(date: string, hi: boolean, year = true) {
  const [y, m, d] = date.split("-").map(Number);
  return new Intl.DateTimeFormat(hi ? "hi-IN" : "en-IN", { day: "numeric", month: "short", ...(year ? { year: "numeric" } : {}), timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
}

function DateBox({ label, value, onChange, max }: { label: string; value: string; onChange: (v: string) => void; max: string }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-[11px] font-semibold text-slate-500">{label}</span>
      <input
        type="date"
        value={value}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full min-w-0 rounded-lg border border-[#dce4f0] bg-white px-2 text-[12.5px] font-semibold text-[#0b1f3a] focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      />
    </label>
  );
}

function ChangeOverTime({ hi, query, today }: { hi: boolean; query: string; today: string }) {
  const [metric, setMetric] = useState<TimeMetric>("issues");
  const [g, setG] = useState<Granularity>("auto");
  const [draft, setDraft] = useState({ from: "", to: "" });
  const [range, setRange] = useState<{ from: string; to: string } | null>(null);
  const params: Record<string, string> = { module: "time", metric, granularity: g, ...(range ?? {}) };
  const { data, loading, error, retry } = useModule<TimeSeriesResult>(query, params);
  const valid = isIsoDate(draft.from) && isIsoDate(draft.to) && draft.from <= draft.to;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2.5 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
        <ChoiceChips
          label={hi ? "विषय" : "Topic"}
          value={metric}
          onChange={setMetric}
          options={[
            { value: "issues", label: hi ? "मुख्य मुद्दे" : "Main issues" },
            { value: "party", label: hi ? "पार्टी समर्थन" : "Party support" },
            { value: "mla", label: hi ? "विधायक पर राय" : "MLA opinion" },
          ]}
        />
        <ChoiceChips
          label={hi ? "अवधि इकाई" : "Period unit"}
          value={g}
          onChange={setG}
          options={[
            { value: "auto", label: hi ? "स्वतः" : "Auto" },
            { value: "day", label: hi ? "दिन" : "Day" },
            { value: "week", label: hi ? "सप्ताह" : "Week" },
            { value: "month", label: hi ? "माह" : "Month" },
          ]}
        />
      </div>
      <div className="grid grid-cols-2 items-end gap-2 sm:grid-cols-[minmax(0,160px)_minmax(0,160px)_auto_auto]">
        <DateBox label={hi ? "कस्टम: शुरू" : "Custom: from"} value={draft.from} max={draft.to || today} onChange={(v) => setDraft((d) => ({ ...d, from: v }))} />
        <DateBox label={hi ? "कस्टम: अंत" : "Custom: to"} value={draft.to} max={today} onChange={(v) => setDraft((d) => ({ ...d, to: v }))} />
        <button type="button" disabled={!valid} onClick={() => setRange({ ...draft })} className="h-9 cursor-pointer rounded-lg bg-[#1677ff] px-3 text-xs font-bold text-white hover:bg-[#0f63d8] disabled:cursor-not-allowed disabled:opacity-50">
          {hi ? "लागू करें" : "Apply"}
        </button>
        {range && (
          <button
            type="button"
            onClick={() => {
              setRange(null);
              setDraft({ from: "", to: "" });
            }}
            className="h-9 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            {hi ? "पूरी अवधि" : "Full period"}
          </button>
        )}
      </div>
      <ModuleState hi={hi} loading={loading} error={error} onRetry={retry}>
        {!data || !data.enough ? (
          <Empty>{hi ? "समय के साथ तुलना के लिए पर्याप्त प्रतिक्रियाएं उपलब्ध नहीं हैं (कम से कम दो अवधियों में 5 या अधिक प्रतिक्रियाएं आवश्यक)।" : "Not enough responses to compare over time (at least two periods with 5 or more responses are needed)."}</Empty>
        ) : (
          <>
            <TimeTable series={data} hi={hi} />
            {data.truncated && <p className="text-[11px] text-slate-500">{hi ? "केवल हाल की 60 अवधियां दिखाई गई हैं।" : "Only the latest 60 periods are shown."}</p>}
          </>
        )}
      </ModuleState>
      <p className="text-[11px] leading-relaxed text-slate-500">
        {hi
          ? "प्रतिशत उस अवधि में प्रश्न का उत्तर देने वाले उत्तरदाताओं (N) के आधार पर है; 5 से कम प्रतिक्रियाओं वाली अवधि “—” दिखती है। यह सर्वे प्रतिक्रियाओं की समय के अनुसार तुलना है, कोई पूर्वानुमान नहीं। ऊपर का समय-फ़िल्टर यहां लागू नहीं होता; उत्तरदाता समूह फ़िल्टर लागू रहता है।"
          : "Percentages use respondents answering the question in that period (N); periods with fewer than 5 responses show “—”. This compares survey responses over time and is not a forecast. The page's time filter does not apply here; the respondent-group filter does."}
      </p>
    </div>
  );
}

function PeriodCompare({ hi, query, today }: { hi: boolean; query: string; today: string }) {
  const [preset, setPreset] = useState<PeriodPreset>("last7");
  const [draft, setDraft] = useState({ aFrom: "", aTo: "", bFrom: "", bTo: "" });
  const [custom, setCustom] = useState<typeof draft | null>(null);
  const params = preset === "custom" ? (custom ? { module: "period", preset, ...custom } : null) : { module: "period", preset };
  const { data, loading, error, retry } = useModule<PeriodComparisonResult>(query, params);
  const valid = [draft.aFrom, draft.aTo, draft.bFrom, draft.bTo].every(isIsoDate) && draft.aFrom <= draft.aTo && draft.bFrom <= draft.bTo;
  const side = (s: PeriodComparisonResult["a"]) => `${fmt(s.from, hi, false)} – ${fmt(s.to, hi)}`;

  return (
    <div className="flex flex-col gap-3">
      <ChoiceChips
        label={hi ? "अवधि तुलना" : "Period comparison"}
        value={preset}
        onChange={setPreset}
        options={[
          { value: "last7", label: hi ? "पिछले 7 दिन बनाम उससे पहले के 7 दिन" : "Last 7 days vs previous 7" },
          { value: "week", label: hi ? "इस सप्ताह बनाम पिछला सप्ताह" : "This week vs last week" },
          { value: "month", label: hi ? "इस माह बनाम पिछला माह" : "This month vs last month" },
          { value: "custom", label: hi ? "कस्टम अवधि" : "Custom periods" },
        ]}
      />
      {preset === "custom" && (
        <div className="grid grid-cols-2 items-end gap-2 md:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
          <DateBox label={hi ? "अवधि A: शुरू" : "Period A: from"} value={draft.aFrom} max={today} onChange={(v) => setDraft((d) => ({ ...d, aFrom: v }))} />
          <DateBox label={hi ? "अवधि A: अंत" : "Period A: to"} value={draft.aTo} max={today} onChange={(v) => setDraft((d) => ({ ...d, aTo: v }))} />
          <DateBox label={hi ? "अवधि B: शुरू" : "Period B: from"} value={draft.bFrom} max={today} onChange={(v) => setDraft((d) => ({ ...d, bFrom: v }))} />
          <DateBox label={hi ? "अवधि B: अंत" : "Period B: to"} value={draft.bTo} max={today} onChange={(v) => setDraft((d) => ({ ...d, bTo: v }))} />
          <button type="button" disabled={!valid} onClick={() => setCustom({ ...draft })} className="col-span-2 h-9 cursor-pointer rounded-lg bg-[#1677ff] px-3 text-xs font-bold text-white hover:bg-[#0f63d8] disabled:cursor-not-allowed disabled:opacity-50 md:col-span-1">
            {hi ? "तुलना करें" : "Compare"}
          </button>
        </div>
      )}
      {!params ? (
        <Empty>{hi ? "दोनों अवधियों की तारीखें चुनें।" : "Choose the dates of both periods."}</Empty>
      ) : (
        <ModuleState hi={hi} loading={loading} error={error} onRetry={retry}>
          {data && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2.5">
                {(["a", "b"] as const).map((k) => (
                  <div key={k} className="min-w-0 rounded-xl border border-[#dbe7fb] bg-[#f5f9ff] p-3">
                    <p className="text-[11px] font-bold text-[#1677ff]">{k === "a" ? (hi ? "अवधि A (पहले)" : "Period A (earlier)") : hi ? "अवधि B (बाद में)" : "Period B (later)"}</p>
                    <p className="text-[13px] font-black text-[#0b1f3a]">{side(data[k])}</p>
                    <p className="text-xs text-slate-600">{hi ? `${data[k].n} प्रतिक्रियाएं` : `${data[k].n} responses`}</p>
                  </div>
                ))}
              </div>
              {!data.enough ? (
                <Empty>{hi ? "इस तुलना के लिए पर्याप्त प्रतिक्रियाएं उपलब्ध नहीं हैं (दोनों अवधियों में कम से कम 5 आवश्यक)।" : "Not enough responses for this comparison (at least 5 in each period)."}</Empty>
              ) : (
                <>
                  <p className="text-[13px] font-extrabold text-[#0b1f3a]">{hi ? "सर्वे प्रतिक्रियाओं में बदलाव" : "Change in survey responses"}</p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {data.metrics.map((m) => (
                      <CompareTable key={m.key} metric={m} aLabel="A" bLabel="B" diffLabel={hi ? "बदलाव (B−A)" : "Change (B−A)"} hi={hi} />
                    ))}
                  </div>
                </>
              )}
              <p className="text-[11px] leading-relaxed text-slate-500">
                {hi
                  ? "बदलाव प्रतिशत अंकों में है और केवल इन अवधियों में मिली सर्वे प्रतिक्रियाओं का अंतर दर्शाता है — इसे वास्तविक जनमत में बदलाव नहीं माना जाना चाहिए।"
                  : "Changes are in percentage points and only reflect differences between the survey responses received in these periods — not a change in actual public opinion."}
              </p>
            </div>
          )}
        </ModuleState>
      )}
    </div>
  );
}

export function TimeModule({ hi, query, today }: { hi: boolean; query: string; today: string }) {
  return (
    <SegTabs
      size="md"
      tabs={[
        { key: "change", label: hi ? "समय के साथ बदलाव" : "Change over time", content: <ChangeOverTime hi={hi} query={query} today={today} /> },
        { key: "period", label: hi ? "अवधि तुलना" : "Period comparison", content: <PeriodCompare hi={hi} query={query} today={today} /> },
      ]}
    />
  );
}
