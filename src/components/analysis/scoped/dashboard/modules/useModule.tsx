"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Loader2, RotateCcw } from "lucide-react";

/**
 * Fetches one lazily loaded Analysis module (/api/analysis/module) for the
 * page's scope/filters (`query`, e.g. "?state=uttar-pradesh&district=gonda").
 * `params` null = don't fetch yet. `initial` seeds a server-computed result.
 */
export function useModule<T>(query: string, params: Record<string, string> | null, initial?: { params: Record<string, string>; data: T }) {
  const key = params ? new URLSearchParams(params).toString() : null;
  const [nonce, setNonce] = useState(0);
  const [state, setState] = useState<{ key: string | null; data: T | null; error: string | null }>(() => ({
    key: initial ? new URLSearchParams(initial.params).toString() : null,
    data: initial?.data ?? null,
    error: null,
  }));
  const fetchKey = key ? `${key}#${nonce}` : null;
  const seeded = !!initial && state.key === key && nonce === 0;

  useEffect(() => {
    if (!fetchKey || seeded) return;
    const ctrl = new AbortController();
    const k = fetchKey.split("#")[0];
    fetch(`/api/analysis/module${query}${query ? "&" : "?"}${k}`, { signal: ctrl.signal, headers: { accept: "application/json" } })
      .then(async (r) => {
        const j = (await r.json().catch(() => ({}))) as { data?: T; error?: string };
        if (!r.ok) throw new Error(j.error ?? `http_${r.status}`);
        return j.data ?? null;
      })
      .then((data) => setState({ key: k, data, error: null }))
      .catch((e: Error) => {
        if (e.name !== "AbortError") setState({ key: k, data: null, error: e.message });
      });
    return () => ctrl.abort();
  }, [query, fetchKey, seeded]);

  const settled = state.key === key;
  return {
    data: settled ? state.data : null,
    error: settled ? state.error : null,
    loading: !!key && !settled,
    retry: () => {
      setState((s) => ({ ...s, key: null }));
      setNonce((n) => n + 1);
    },
  };
}

export function ModuleState({ hi, loading, error, onRetry, children }: { hi: boolean; loading: boolean; error: string | null; onRetry: () => void; children: ReactNode }) {
  if (loading)
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm font-semibold text-slate-500" role="status">
        <Loader2 size={18} className="animate-spin text-[#1677ff]" aria-hidden="true" />
        {hi ? "विश्लेषण तैयार हो रहा है…" : "Preparing analysis…"}
      </div>
    );
  if (error)
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center text-sm text-slate-600">
        <p>{error === "rate_limited" ? (hi ? "बहुत अधिक अनुरोध — कृपया थोड़ी देर बाद प्रयास करें।" : "Too many requests — please try again shortly.") : hi ? "यह विश्लेषण अभी लोड नहीं हो सका।" : "This analysis could not be loaded."}</p>
        <button type="button" onClick={onRetry} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
          <RotateCcw size={14} aria-hidden="true" />
          {hi ? "फिर से प्रयास करें" : "Try again"}
        </button>
      </div>
    );
  return <>{children}</>;
}

export function ChoiceChips<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string; disabled?: boolean }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          disabled={o.disabled}
          onClick={() => onChange(o.value)}
          className={
            "cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-40 " +
            (value === o.value ? "border-[#1677ff] bg-[#1677ff] text-white" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50")
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
