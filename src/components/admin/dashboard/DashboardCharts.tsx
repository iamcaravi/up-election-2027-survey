"use client";

import { Bar, BarChart, CartesianGrid, Pie, PieChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const DONUT_COLORS = ["#2563eb", "#f97316", "#dc2626", "#7c3aed", "#94a3b8", "#16a34a"];

export function DailyResponsesChart({ data }: { data: { label: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--muted)" }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--muted)" }} width={40} />
        <Tooltip
          cursor={{ fill: "var(--surface-2)" }}
          contentStyle={{ borderRadius: 10, borderColor: "var(--border)", fontSize: 13 }}
          formatter={(value) => [`${value} responses`, ""]}
        />
        <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PartySupportDonut({
  data,
  total,
  centerLabel,
}: {
  data: { name: string; value: number; color: string | null }[];
  total: number;
  centerLabel: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="100%" paddingAngle={2} stroke="none">
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={entry.color ?? DONUT_COLORS[index % DONUT_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-display text-lg font-extrabold text-ink">{total.toLocaleString("en-IN")}</span>
          <span className="text-[11px] text-muted">{centerLabel}</span>
        </div>
      </div>
      <ul className="w-full min-w-0 space-y-1.5">
        {data.map((entry, index) => (
          <li key={entry.name} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: entry.color ?? DONUT_COLORS[index % DONUT_COLORS.length] }}
              />
              <span className="truncate">{entry.name}</span>
            </span>
            <span className="shrink-0 font-bold text-ink">{total > 0 ? Math.round((entry.value / total) * 100) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
