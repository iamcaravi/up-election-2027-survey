import Image from "next/image";
import {
  Briefcase,
  TrendingUp,
  Compass,
  GraduationCap,
  Heart,
  Zap,
  Droplets,
  ShieldCheck,
  Wheat,
  Bus,
  Waves,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import type { CrossTab, DistItem, Distribution } from "@/lib/scoped-survey";
import { cn, formatNumber } from "@/lib/utils";

// Pure SVG/CSS chart primitives (no client JS, no chart library) shared by
// the Result and Analysis pages. Every chart prints its numbers as text too,
// so nothing relies on color alone.

export const round = (n: number) => Math.round(n);

const ISSUE_STYLE: Record<string, { Icon: LucideIcon; color: string; bg: string }> = {
  rojgar: { Icon: Briefcase, color: "#ea580c", bg: "#fff7ed" },
  mahangai: { Icon: TrendingUp, color: "#10b981", bg: "#ecfdf5" },
  sadak: { Icon: Compass, color: "#3b82f6", bg: "#eff6ff" },
  shiksha: { Icon: GraduationCap, color: "#a855f7", bg: "#faf5ff" },
  swasthya: { Icon: Heart, color: "#f43f5e", bg: "#fff1f2" },
  bijli: { Icon: Zap, color: "#f59e0b", bg: "#fffbeb" },
  pani: { Icon: Droplets, color: "#06b6d4", bg: "#ecfeff" },
  kanoon_vyavastha: { Icon: ShieldCheck, color: "#6366f1", bg: "#eef2ff" },
  krishi: { Icon: Wheat, color: "#84cc16", bg: "#f7fee7" },
  parivahan: { Icon: Bus, color: "#0284c7", bg: "#f0f9ff" },
  jal_nikasi: { Icon: Waves, color: "#0891b2", bg: "#ecfeff" },
  other: { Icon: HelpCircle, color: "#64748b", bg: "#f8fafc" },
};

export function issueStyle(key: string) {
  return ISSUE_STYLE[key] ?? { Icon: HelpCircle, color: "#64748b", bg: "#f8fafc" };
}

const FALLBACK_COLORS = ["#ea580c", "#dc2626", "#2563eb", "#10b981", "#a855f7", "#0891b2", "#f59e0b", "#64748b"];
export function colorOf(item: { color?: string | null }, i: number) {
  return item.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-xs text-slate-500">{children}</p>;
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full" style={{ width: `${Math.max(pct, pct > 0 ? 3 : 0)}%`, backgroundColor: color }} />
    </div>
  );
}

export function PartyBars({ dist, limit, compact }: { dist: Distribution; limit?: number; compact?: boolean }) {
  const items = limit ? dist.items.slice(0, limit) : dist.items;
  return (
    <ul className={cn("flex flex-col", compact ? "gap-2" : "gap-3")}>
      {items.map((p, i) => {
        const color = colorOf(p, i);
        return (
          <li key={p.key} className="flex items-center gap-2.5 sm:gap-3">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-white shadow-2xs"
              style={{ borderColor: `${color}55` }}
            >
              {p.logoUrl ? (
                <Image src={p.logoUrl} alt="" width={22} height={22} className="object-contain" />
              ) : (
                <span className="text-[9px] font-bold" style={{ color }}>
                  {p.label.slice(0, 4)}
                </span>
              )}
            </span>
            <span className="w-16 shrink-0 truncate text-sm font-bold text-slate-800">{p.label}</span>
            <Bar pct={p.pct} color={color} />
            <span className="w-8 shrink-0 text-right text-sm font-bold text-slate-900">{formatNumber(p.count)}</span>
            <span className="w-11 shrink-0 text-right text-sm font-black text-slate-900">{round(p.pct)}%</span>
          </li>
        );
      })}
    </ul>
  );
}

export function IssueBars({ dist, limit }: { dist: Distribution; limit?: number }) {
  const items = limit ? dist.items.slice(0, limit) : dist.items;
  return (
    <ol className="flex flex-col gap-3">
      {items.map((it, idx) => {
        const s = issueStyle(it.key);
        return (
          <li key={it.key} className="flex items-center gap-2 sm:gap-2.5">
            <span className="w-4 shrink-0 text-xs font-bold text-slate-500">{idx + 1}</span>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: s.bg, color: s.color }}>
              <s.Icon size={14} strokeWidth={2.4} aria-hidden="true" />
            </span>
            <span className="w-20 shrink-0 truncate text-xs font-bold text-slate-800 sm:w-24 sm:text-sm">{it.label}</span>
            <Bar pct={it.pct} color={s.color} />
            <span className="w-8 shrink-0 text-right text-xs font-bold text-slate-900 sm:text-sm">{formatNumber(it.count)}</span>
            <span className="w-11 shrink-0 text-right text-xs font-black text-slate-900 sm:text-sm">{round(it.pct)}%</span>
          </li>
        );
      })}
    </ol>
  );
}

/** Donut for a few-category part-to-whole distribution + a legend with % and counts. */
export function Donut({
  items,
  total,
  centerLabel,
  size = 160,
  legend = "below",
}: {
  items: DistItem[];
  total: number;
  centerLabel: string;
  size?: number;
  legend?: "below" | "side" | "none";
}) {
  const r = 62;
  const c = 2 * Math.PI * r;
  let acc = 0;
  const slices = items.map((it, i) => {
    const f = total > 0 ? it.count / total : 0;
    const s = { key: it.key, color: colorOf(it, i), dash: `${f * c} ${c}`, offset: -acc * c };
    acc += f;
    return s;
  });
  const chart = (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90" role="img" aria-label={`${centerLabel}: ${total}`}>
        <circle cx="80" cy="80" r={r} stroke="#f1f5f9" strokeWidth="18" fill="transparent" />
        {total > 0 &&
          slices.map((s) => (
            <circle key={s.key} cx="80" cy="80" r={r} stroke={s.color} strokeWidth="18" strokeDasharray={s.dash} strokeDashoffset={s.offset} fill="transparent" />
          ))}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black leading-none text-slate-900 sm:text-3xl">{formatNumber(total)}</span>
        <span className="mt-1 text-[11px] font-medium text-slate-500">{centerLabel}</span>
      </div>
    </div>
  );
  if (legend === "none") return chart;
  const list = (
    <ul className="flex w-full flex-col gap-2">
      {items.map((it, i) => (
        <li key={it.key} className="flex items-center justify-between gap-3 text-xs sm:text-[13px]">
          <span className="flex min-w-0 items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: colorOf(it, i) }} aria-hidden="true" />
            <span className="truncate font-medium text-slate-700">{it.label}</span>
          </span>
          <span className="shrink-0 font-bold text-slate-900">
            {round(it.pct)}% <span className="font-normal text-slate-500">({formatNumber(it.count)})</span>
          </span>
        </li>
      ))}
    </ul>
  );
  return legend === "side" ? (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      {chart}
      <div className="w-full min-w-0 flex-1">{list}</div>
    </div>
  ) : (
    <div className="flex flex-col items-center gap-4">
      {chart}
      <div className="w-full max-w-[300px]">{list}</div>
    </div>
  );
}

/** 100% stacked horizontal bars for a cross-tab (group → distribution of a target), with N per row. */
export function StackedCrossTab({ tab, hi, insufficientLabel }: { tab: CrossTab; hi: boolean; insufficientLabel: string }) {
  return (
    <div>
      <ul className="mb-3 flex flex-wrap gap-x-3 gap-y-1">
        {tab.columns.map((col, i) => (
          <li key={col.key} className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colorOf(col, i) }} aria-hidden="true" />
            {col.label}
          </li>
        ))}
      </ul>
      <ul className="flex flex-col gap-2.5">
        {tab.rows.map((row) => (
          <li key={row.key} className="grid grid-cols-[84px_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[110px_minmax(0,1fr)]">
            <span className="truncate text-xs font-semibold text-slate-700">
              {row.label} <span className="font-normal text-slate-500">(N={row.n})</span>
            </span>
            {row.sufficient ? (
              <div
                className="flex h-4 w-full overflow-hidden rounded-md bg-slate-100"
                role="img"
                aria-label={`${row.label}: ${row.cells.map((c) => `${c.label} ${round(c.pct)}%`).join(", ")}`}
              >
                {row.cells.map((c, i) =>
                  c.pct > 0 ? (
                    <span
                      key={c.key}
                      title={`${c.label}: ${round(c.pct)}% (${c.count})`}
                      className="h-full"
                      style={{ width: `${c.pct}%`, backgroundColor: colorOf(tab.columns[i], i) }}
                    />
                  ) : null
                )}
              </div>
            ) : (
              <span className="text-[11px] text-slate-500">{insufficientLabel}</span>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-slate-500">
        {hi ? "प्रत्येक पंक्ति = उस समूह के उत्तरदाता (100%)" : "Each row = respondents in that group (100%)"}
      </p>
    </div>
  );
}

/** Heat-map table for group × issue (respondent share within each group). */
export function HeatTable({ tab, hi, insufficientLabel }: { tab: CrossTab; hi: boolean; insufficientLabel: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] border-separate border-spacing-1 text-xs">
        <thead>
          <tr>
            <th className="text-left font-semibold text-slate-500">{hi ? "समूह (N)" : "Group (N)"}</th>
            {tab.columns.map((c) => (
              <th key={c.key} className="px-1 text-center font-semibold text-slate-600">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tab.rows.map((row) => (
            <tr key={row.key}>
              <th scope="row" className="whitespace-nowrap pr-2 text-left font-semibold text-slate-700">
                {row.label} <span className="font-normal text-slate-500">({row.n})</span>
              </th>
              {row.sufficient ? (
                row.cells.map((c) => (
                  <td
                    key={c.key}
                    className="rounded-md px-1 py-1.5 text-center font-bold"
                    style={{
                      backgroundColor: `rgba(37, 99, 235, ${0.08 + (c.pct / 100) * 0.62})`,
                      color: c.pct > 55 ? "#fff" : "#0b1f3a",
                    }}
                  >
                    {round(c.pct)}%
                  </td>
                ))
              ) : (
                <td colSpan={tab.columns.length} className="px-1 text-slate-500">
                  {insufficientLabel}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Simple responsive SVG line (counts over time) with labelled points. */
export function LineTrend({ points, hi }: { points: { label: string; count: number }[]; hi: boolean }) {
  const W = 600;
  const H = 180;
  const P = { l: 30, r: 12, t: 14, b: 28 };
  const max = Math.max(1, ...points.map((p) => p.count));
  const x = (i: number) => P.l + (points.length === 1 ? 0 : (i / (points.length - 1)) * (W - P.l - P.r));
  const y = (v: number) => P.t + (1 - v / max) * (H - P.t - P.b);
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.count).toFixed(1)}`).join(" ");
  const area = `${path} L${x(points.length - 1).toFixed(1)},${H - P.b} L${x(0).toFixed(1)},${H - P.b} Z`;
  const step = Math.ceil(points.length / 7);
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label={(hi ? "समय के अनुसार प्रतिक्रियाएं: " : "Responses over time: ") + points.map((p) => `${p.label} ${p.count}`).join(", ")}
    >
      <defs>
        <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((f) => (
        <g key={f}>
          <line x1={P.l} x2={W - P.r} y1={y(max * f)} y2={y(max * f)} stroke="#e2e8f0" strokeDasharray="3 4" />
          <text x={P.l - 6} y={y(max * f) + 4} textAnchor="end" fontSize="11" fill="#64748b">
            {Math.round(max * f)}
          </text>
        </g>
      ))}
      <path d={area} fill="url(#trendFill)" />
      <path d={path} fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.count)} r="3.5" fill="#7c3aed">
            <title>{`${p.label}: ${p.count}`}</title>
          </circle>
          {i % step === 0 || i === points.length - 1 ? (
            <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="#64748b">
              {p.label}
            </text>
          ) : null}
        </g>
      ))}
    </svg>
  );
}

/** Vertical bars with % labels (used for issue categories). */
export function ColumnBars({ items }: { items: DistItem[] }) {
  const max = Math.max(1, ...items.map((i) => i.pct));
  return (
    <div className="flex h-48 items-end gap-2 sm:gap-3" role="img" aria-label={items.map((i) => `${i.label} ${round(i.pct)}%`).join(", ")}>
      {items.map((it, i) => (
        <div key={it.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
          <span className="text-[11px] font-bold text-slate-800">{round(it.pct)}%</span>
          <div className="w-full max-w-[56px] rounded-t-md" style={{ height: `${(it.pct / max) * 70}%`, backgroundColor: FALLBACK_COLORS[i % FALLBACK_COLORS.length] }} />
          <span className="line-clamp-2 h-8 text-center text-[10.5px] leading-tight text-slate-600">{it.label}</span>
        </div>
      ))}
    </div>
  );
}
