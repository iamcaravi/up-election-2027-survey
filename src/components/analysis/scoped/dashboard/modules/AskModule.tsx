"use client";

import { useEffect, useState } from "react";
import { MessageSquareText, SendHorizontal } from "lucide-react";
import type { AskAnswer } from "@/lib/analysis-dimensions";
import { issueStyle, colorOf } from "@/components/scope/charts";
import { cn } from "@/lib/utils";
import { CARD, IconChip } from "../ui";
import { useHub } from "../DeepHub";
import { ModuleState } from "./useModule";

const EXAMPLES_HI = ["25–34 आयु वर्ग में सबसे बड़ा मुद्दा क्या है?", "महिलाओं में सबसे अधिक चुना गया मुद्दा कौन सा है?", "35–44 आयु वर्ग में पार्टी समर्थन कैसा है?", "पिछले सप्ताह और इस सप्ताह के responses में क्या अंतर है?"];
const EXAMPLES_EN = ["What is the biggest issue in the 25–34 age group?", "Which issue do women select most?", "What is party support among the 35–44 age group?", "What is the difference between last week and this week?"];

/** Compact "डेटा से पूछें" card: the answer (and more example questions) opens in the panel under this row. */
export function AskCard({ hi }: { hi: boolean }) {
  const { ask } = useHub();
  const [text, setText] = useState("");
  const submit = (q: string) => {
    const v = q.trim();
    if (v) ask(v);
  };
  return (
    <section id="ask" className={cn(CARD, "flex min-w-0 scroll-mt-24 flex-col p-4")}>
      <div className="flex items-start gap-3">
        <IconChip tone="blue" size="lg">
          <MessageSquareText size={22} />
        </IconChip>
        <div className="min-w-0">
          <h2 className="text-[15.5px] font-extrabold leading-tight text-[#0b1f3a]">{hi ? "डेटा से पूछें" : "Ask the data"}</h2>
          <p className="mt-1 text-[12px] leading-relaxed text-slate-600">{hi ? "अपने सवाल पूछें और सर्वे डेटा से उत्तर पाएं।" : "Ask a question and get an answer from the survey data."}</p>
        </div>
      </div>
      <form
        className="mt-auto flex gap-2 pt-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit(text);
        }}
      >
        <label htmlFor="ask-input" className="sr-only">
          {hi ? "अपना प्रश्न लिखें" : "Type your question"}
        </label>
        <input
          id="ask-input"
          value={text}
          maxLength={300}
          onChange={(e) => setText(e.target.value)}
          placeholder={hi ? "उदाहरण: 25–34 आयु वर्ग में सबसे बड़ा मुद्दा क्या है?" : "e.g. What is the biggest issue in the 25–34 age group?"}
          className="h-10 min-w-0 flex-1 rounded-lg border border-[#dce4f0] bg-white px-3 text-[13px] text-[#0b1f3a] placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          aria-label={hi ? "प्रश्न भेजें" : "Send question"}
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-[#1677ff] text-white hover:bg-[#0f63d8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <SendHorizontal size={17} aria-hidden="true" />
        </button>
      </form>
    </section>
  );
}

/** Answer panel: POSTs the question with the page's scope/filters; shows numbers only. */
export function AskPanel({ hi, query }: { hi: boolean; query: string }) {
  const { question, ask } = useHub();
  const [state, setState] = useState<{ seq: number; data: AskAnswer | null; error: string | null }>({ seq: 0, data: null, error: null });
  const [nonce, setNonce] = useState(0);
  const seq = question?.seq ?? 0;
  const text = question?.text ?? "";

  useEffect(() => {
    if (!seq) return;
    const ctrl = new AbortController();
    fetch(`/api/analysis/ask${query}`, {
      method: "POST",
      signal: ctrl.signal,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question: text }),
    })
      .then(async (r) => {
        const j = (await r.json().catch(() => ({}))) as { data?: AskAnswer; error?: string };
        if (!r.ok || !j.data) throw new Error(j.error ?? `http_${r.status}`);
        return j.data;
      })
      .then((data) => setState({ seq, data, error: null }))
      .catch((e: Error) => {
        if (e.name !== "AbortError") setState({ seq, data: null, error: e.message });
      });
    return () => ctrl.abort();
  }, [seq, text, query, nonce]);

  if (!seq) return <p className="text-sm text-slate-600">{hi ? "ऊपर प्रश्न लिखें।" : "Type a question above."}</p>;
  const loading = state.seq !== seq;
  const a = state.data;
  return (
    <div className="flex flex-col gap-3">
      <p className="rounded-xl bg-[#f5f9ff] px-3 py-2 text-sm text-[#0b1f3a]">
        <span className="font-bold text-[#1677ff]">{hi ? "प्रश्न: " : "Question: "}</span>
        {text}
      </p>
      <ModuleState hi={hi} loading={loading} error={state.error} onRetry={() => {
          setState((s) => ({ ...s, seq: 0 }));
          setNonce((n) => n + 1);
        }}>
        {a && (
          <div className="flex flex-col gap-3">
            <p
              className={cn(
                "text-base font-extrabold",
                a.status === "ok" ? "text-[#0b1f3a]" : a.status === "refused" ? "text-rose-700" : "text-amber-800"
              )}
            >
              {a.heading}
            </p>
            {a.understood.length > 0 && (
              <ul className="flex flex-wrap gap-1.5" aria-label={hi ? "प्रश्न को ऐसे समझा गया" : "How the question was understood"}>
                {a.understood.map((u) => (
                  <li key={u} className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] text-slate-600">
                    {u}
                  </li>
                ))}
              </ul>
            )}
            {a.lines.length > 0 && (
              <ul className="flex flex-col gap-1.5 text-sm leading-relaxed text-slate-700">
                {a.lines.map((l, i) => (
                  <li key={i}>{l}</li>
                ))}
              </ul>
            )}
            {a.bars && a.bars.length > 0 && (
              <ul className="flex max-w-xl flex-col gap-2">
                {a.bars.map((b, i) => (
                  <li key={b.key} className="grid grid-cols-[minmax(0,110px)_minmax(0,1fr)_64px] items-center gap-2 text-xs">
                    <span className="truncate font-semibold text-slate-700">{b.label}</span>
                    <span className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <span className="block h-full rounded-full" style={{ width: `${b.pct}%`, backgroundColor: b.color ?? (issueStyle(b.key).color !== "#64748b" ? issueStyle(b.key).color : colorOf(b, i)) }} />
                    </span>
                    <span className="text-right font-bold text-[#0b1f3a]">
                      {Math.round(b.pct)}% <span className="font-normal text-slate-500">({b.count})</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {a.table && (
              <div className="-mx-1 overflow-x-auto px-1">
                <table className="w-full min-w-[440px] text-xs">
                  <thead>
                    <tr className="text-slate-500">
                      {a.table.columns.map((c) => (
                        <th key={c} className="py-1.5 pr-2 text-left font-semibold">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {a.table.rows.map((r, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        {r.map((c, j) => (
                          <td key={j} className={cn("py-1.5 pr-2", j >= 2 ? "font-bold text-[#0b1f3a]" : "text-slate-700")}>
                            {c}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {a.basis && <p className="text-[11px] font-semibold text-slate-500">{a.basis}</p>}
            <div className="border-t border-slate-100 pt-3">
              <p className="mb-1.5 text-[11.5px] font-semibold text-slate-500">{hi ? "और प्रश्न आज़माएं" : "Try another question"}</p>
              <div className="flex flex-wrap gap-1.5">
                {(hi ? EXAMPLES_HI : EXAMPLES_EN)
                  .filter((q) => q !== text)
                  .map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => ask(q)}
                      className="max-w-full cursor-pointer truncate rounded-full border border-slate-200 bg-[#fbfcfe] px-2.5 py-1 text-[11px] text-slate-600 hover:bg-slate-50"
                    >
                      {q}
                    </button>
                  ))}
              </div>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              {hi
                ? "उत्तर केवल उपलब्ध सर्वे प्रतिक्रियाओं के समेकित आंकड़ों से बनाए जाते हैं — कोई AI अनुमान, चुनाव पूर्वानुमान या राजनीतिक सलाह नहीं।"
                : "Answers are built only from aggregated survey responses — no AI guesses, election forecasts or political advice."}
            </p>
          </div>
        )}
      </ModuleState>
    </div>
  );
}
