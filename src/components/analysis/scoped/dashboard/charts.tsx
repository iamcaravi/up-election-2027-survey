import Image from "next/image";
import type { CompareRow, GroupShare, MetricCompare, TimeSeriesResult } from "@/lib/analysis-dimensions";
import { COMPARE_METRIC_LABELS } from "@/lib/analysis-dimensions";
import { Donut, colorOf, issueStyle } from "@/components/scope/charts";
import { cn, formatNumber } from "@/lib/utils";

// Analysis-only chart primitives (pure SVG/CSS, server- and client-safe).
// Every chart also prints its numbers as text; nothing relies on colour alone.

const r0 = (n: number) => Math.round(n);

type Item = {
  key: string;
  label: string;
  count: number;
  pct: number;
  color?: string | null;
  logoUrl?: string | null;
};

/** Vertical party columns with logo + short name under each bar (reference "पार्टी समर्थन"). */
export function PartyColumns({ items, limit = 5 }: { items: Item[]; limit?: number }) {
  const shown = items.filter((i) => i.count > 0).slice(0, limit);
  const max = Math.max(1, ...shown.map((i) => i.pct));
  return (
    <div role="img" aria-label={shown.map((i) => `${i.label} ${r0(i.pct)}%`).join(", ")}>
      <div className="flex h-[128px] items-end justify-around gap-2 border-b border-slate-200 px-1 sm:gap-3">
        {shown.map((it, i) => (
          <div key={it.key} className="flex h-full min-w-0 max-w-[52px] flex-1 flex-col items-center justify-end">
            <span className="mb-1 text-xs font-black text-[#0b1f3a] sm:text-[13px]">{r0(it.pct)}%</span>
            <span
              className="w-full rounded-t-md"
              style={{
                height: `${Math.max((it.pct / max) * 78, it.pct > 0 ? 3 : 0)}%`,
                backgroundColor: colorOf(it, i),
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-around gap-2 px-1 sm:gap-3">
        {shown.map((it, i) => (
          <div key={it.key} className="flex min-w-0 max-w-[52px] flex-1 flex-col items-center gap-1">
            <span
              className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border bg-white"
              style={{ borderColor: `${colorOf(it, i)}66` }}
            >
              {it.logoUrl ? (
                <Image src={it.logoUrl} alt="" width={18} height={18} className="object-contain" />
              ) : (
                <span className="text-[8px] font-bold" style={{ color: colorOf(it, i) }}>
                  {it.label.slice(0, 3)}
                </span>
              )}
            </span>
            <span className="max-w-[64px] truncate whitespace-nowrap text-center text-[10px] font-bold tracking-tight text-slate-700" title={it.label}>
              {it.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Compact issue bars: label · bar · % (reference "मुख्य मुद्दे"). */
export function IssueRows({ items, limit = 5 }: { items: Item[]; limit?: number }) {
  const shown = items.slice(0, limit);
  return (
    <ul className="flex flex-col gap-3" role="list">
      {shown.map((it) => (
        <li key={it.key} className="grid grid-cols-[64px_minmax(0,1fr)_38px] items-center gap-2.5 text-[12.5px]">
          <span className="truncate font-semibold text-slate-700">{it.label}</span>
          <span className="h-3 overflow-hidden rounded-sm bg-slate-100">
            <span
              className="block h-full rounded-sm"
              style={{
                width: `${Math.max(it.pct, it.pct > 0 ? 3 : 0)}%`,
                backgroundColor: issueStyle(it.key).color,
              }}
            />
          </span>
          <span className="text-right font-extrabold text-[#0b1f3a]">{r0(it.pct)}%</span>
        </li>
      ))}
    </ul>
  );
}

/** Vertical blue columns (demographic distribution). */
export function ColumnChart({ items, color = "#4f8ef7" }: { items: Item[]; color?: string }) {
  const max = Math.max(1, ...items.map((i) => i.pct));
  return (
    <div role="img" aria-label={items.map((i) => `${i.label} ${r0(i.pct)}%`).join(", ")}>
      <div className="flex h-[112px] items-end gap-1.5 border-b border-slate-200 sm:gap-2">
        {items.map((it) => (
          <div key={it.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
            <span className="mb-1 text-[10.5px] font-extrabold text-[#0b1f3a]">{r0(it.pct)}%</span>
            <span
              className="w-full max-w-[34px] rounded-t"
              style={{
                height: `${Math.max((it.pct / max) * 76, it.pct > 0 ? 3 : 0)}%`,
                backgroundColor: color,
              }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5 sm:gap-2">
        {items.map((it) => (
          <span key={it.key} className="min-w-0 flex-1 truncate text-center text-[9.5px] font-semibold tracking-tight text-slate-600" title={it.label}>
            {it.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Blue response-trend line with light area fill and labelled axis. */
export function TrendLine({
  points,
  hi,
  width = 340,
  height = 200,
}: {
  points: { label: string; count: number }[];
  hi: boolean;
  width?: number;
  height?: number;
}) {
  const W = width;
  const H = height;
  const P = { l: 34, r: 10, t: 12, b: 26 };
  const max = Math.max(1, ...points.map((p) => p.count));
  const nice = max <= 4 ? max : Math.ceil(max / 4) * 4;
  const x = (i: number) => P.l + (points.length === 1 ? (W - P.l - P.r) / 2 : (i / (points.length - 1)) * (W - P.l - P.r));
  const y = (v: number) => P.t + (1 - v / nice) * (H - P.t - P.b);
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.count).toFixed(1)}`).join(" ");
  const area = `${path} L${x(points.length - 1).toFixed(1)},${H - P.b} L${x(0).toFixed(1)},${H - P.b} Z`;
  const step = Math.max(1, Math.ceil(points.length / (W < 400 ? 4 : 7)));
  const ticks = nice <= 4 ? Array.from({ length: nice + 1 }, (_, i) => i) : [0, nice / 4, nice / 2, (3 * nice) / 4, nice];
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label={(hi ? "समय के अनुसार प्रतिक्रियाएं: " : "Responses over time: ") + points.map((p) => `${p.label} ${p.count}`).join(", ")}
    >
      <defs>
        <linearGradient id="analysisTrendFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#2f6fed" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#2f6fed" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((v) => (
        <g key={v}>
          <line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} stroke="#e8edf5" />
          <text x={P.l - 7} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#7b8794">
            {Math.round(v)}
          </text>
        </g>
      ))}
      <path d={area} fill="url(#analysisTrendFill)" />
      <path d={path} fill="none" stroke="#2f6fed" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.count)} r="3.2" fill="#fff" stroke="#2f6fed" strokeWidth="2">
            <title>{`${p.label}: ${p.count}`}</title>
          </circle>
          {/* First/last labels hug the chart edges; a regular label too close to the last one is skipped. */}
          {i === points.length - 1 || (i % step === 0 && points.length - 1 - i >= step * 0.75) ? (
            <text
              x={x(i)}
              y={H - 7}
              textAnchor={points.length > 1 && i === points.length - 1 ? "end" : i === 0 && points.length > 1 ? "start" : "middle"}
              fontSize="11"
              fill="#7b8794"
            >
              {p.label}
            </text>
          ) : null}
        </g>
      ))}
    </svg>
  );
}

/** Compact donut + short legend (label · %) for a narrow dashboard card. */
export function MiniDonut({
  items,
  total,
  centerLabel,
  size = 116,
  shortLabels,
}: {
  items: Item[];
  total: number;
  centerLabel: string;
  size?: number;
  /** Optional compact legend text per option key (the full label stays in the tooltip). */
  shortLabels?: Record<string, string>;
}) {
  return (
    <div className="flex items-center gap-3">
      <Donut items={items} total={total} centerLabel={centerLabel} size={size} legend="none" />
      <ul className="flex min-w-0 flex-1 flex-col gap-1.5">
        {items.map((it, i) => (
          <li key={it.key} className="flex items-center justify-between gap-2 text-[11.5px]">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colorOf(it, i) }} aria-hidden="true" />
              <span className="truncate text-slate-700" title={it.label}>
                {shortLabels?.[it.key] ?? it.label}
              </span>
            </span>
            <span className="shrink-0 font-extrabold text-[#0b1f3a]">{r0(it.pct)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Share of a group selecting something, one row per group with its N. */
export function ShareRows({ rows, hi, color = "#2f6fed", limit }: { rows: GroupShare[]; hi: boolean; color?: string; limit?: number }) {
  const shown = limit ? rows.slice(0, limit) : rows;
  return (
    <ul className="flex flex-col gap-2">
      {shown.map((r) => (
        <li key={r.key} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_40px] items-center gap-2 text-xs">
          <span className="truncate font-semibold text-slate-700">
            {r.label} <span className="font-normal text-slate-500">(N={r.n})</span>
          </span>
          {r.sufficient ? (
            <span className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${Math.max(r.pct, r.pct > 0 ? 3 : 0)}%`,
                  backgroundColor: color,
                }}
              />
            </span>
          ) : (
            <span className="text-[10.5px] text-slate-400">{hi ? "प्रतिक्रियाएं कम" : "Too few"}</span>
          )}
          <span className="text-right font-extrabold text-[#0b1f3a]">{r.sufficient ? `${r0(r.pct)}%` : "—"}</span>
        </li>
      ))}
    </ul>
  );
}

function Diff({ v, hi }: { v: number; hi: boolean }) {
  if (v === 0) return <span className="text-slate-500">0</span>;
  return (
    <span className={cn("font-extrabold", v > 0 ? "text-[#1677ff]" : "text-[#ea580c]")}>
      {v > 0 ? "▲ +" : "▼ "}
      {v}
      <span className="sr-only">{hi ? " प्रतिशत अंक" : " percentage points"}</span>
    </span>
  );
}

/** A vs B table for one metric: shares for both sides and the percentage-point difference. */
export function CompareTable({
  metric,
  aLabel,
  bLabel,
  diffLabel,
  hi,
}: {
  metric: MetricCompare;
  aLabel: string;
  bLabel: string;
  diffLabel: string;
  hi: boolean;
}) {
  const rows: CompareRow[] = metric.rows;
  return (
    <div className="min-w-0 rounded-xl border border-slate-100 bg-[#fbfcfe] p-3">
      <p className="mb-2 text-[13px] font-extrabold text-[#0b1f3a]">{hi ? COMPARE_METRIC_LABELS[metric.key].hi : COMPARE_METRIC_LABELS[metric.key].en}</p>
      {!metric.sufficient ? (
        <p className="py-3 text-xs text-slate-500">
          {hi ? "इस विषय के लिए दोनों ओर पर्याप्त प्रतिक्रियाएं उपलब्ध नहीं हैं" : "Not enough responses on both sides for this topic"} ({aLabel}: N=
          {metric.baseA} · {bLabel}: N={metric.baseB})
        </p>
      ) : (
        <table className="w-full table-fixed text-xs">
          <thead>
            <tr className="text-slate-500">
              <th className="w-[38%] pb-1.5 text-left font-semibold">{hi ? "विकल्प" : "Option"}</th>
              <th className="pb-1.5 text-right font-semibold">
                <span className="block truncate">{aLabel}</span>
                <span className="block text-[10px] font-normal">N={metric.baseA}</span>
              </th>
              <th className="pb-1.5 text-right font-semibold">
                <span className="block truncate">{bLabel}</span>
                <span className="block text-[10px] font-normal">N={metric.baseB}</span>
              </th>
              <th className="pb-1.5 text-right font-semibold">{diffLabel}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-t border-slate-100">
                <th scope="row" className="truncate py-1.5 pr-1 text-left font-semibold text-slate-700">
                  {r.label}
                </th>
                <td className="py-1.5 text-right font-bold text-[#0b1f3a]">{r0(r.a.pct)}%</td>
                <td className="py-1.5 text-right font-bold text-[#0b1f3a]">{r0(r.b.pct)}%</td>
                <td className="py-1.5 text-right">
                  <Diff v={r.diff} hi={hi} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

/** Period × option table for "समय के साथ बदलाव" (periods with too few responses shown as —). */
export function TimeTable({ series, hi }: { series: TimeSeriesResult; hi: boolean }) {
  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <table className="w-full min-w-[420px] text-xs">
        <thead>
          <tr className="text-slate-500">
            <th className="py-1.5 pr-2 text-left font-semibold">{hi ? "अवधि" : "Period"}</th>
            <th className="py-1.5 pr-2 text-right font-semibold">N</th>
            {series.columns.map((c, i) => (
              <th key={c.key} className="px-1 py-1.5 text-right font-semibold">
                <span className="inline-flex items-center gap-1">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: colorOf(c, i) }} aria-hidden="true" />
                  <span className="max-w-[80px] truncate">{c.label}</span>
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {series.buckets.map((b) => (
            <tr key={b.key} className="border-t border-slate-100">
              <th scope="row" className="whitespace-nowrap py-1.5 pr-2 text-left font-semibold text-slate-700">
                {b.label}
              </th>
              <td className="py-1.5 pr-2 text-right text-slate-600">{formatNumber(b.n)}</td>
              {b.values.map((v, i) => (
                <td key={i} className="px-1 py-1.5 text-right font-bold text-[#0b1f3a]">
                  {v === null ? <span className="font-normal text-slate-400">—</span> : `${r0(v)}%`}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
