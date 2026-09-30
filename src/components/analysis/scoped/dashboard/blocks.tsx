import { AlertTriangle, Award, BarChart3, CheckCircle2, Info, ListChecks, MapPinned, Smile, UserCheck } from "lucide-react";
import type { Finding, ScopeAnalysis } from "@/lib/scoped-survey";
import type { AreaProfile, DataQuality } from "@/lib/analysis-engine";
import { colorOf } from "@/components/scope/charts";
import { cn, formatNumber } from "@/lib/utils";

// Content blocks shared by the interactive dashboard (inside dialogs/panels)
// and the printable report. Server-safe: no hooks, no server-only imports.

const r0 = (n: number) => Math.round(n);

export function GeoTable({ geo, hi }: { geo: NonNullable<ScopeAnalysis["geo"]>; hi: boolean }) {
  const max = Math.max(1, ...geo.rows.map((r) => r.n));
  const unit = geo.unit === "state" ? (hi ? "राज्य" : "State") : geo.unit === "district" ? (hi ? "जिला" : "District") : hi ? "विधानसभा क्षेत्र" : "Constituency";
  return (
    <div>
      {/* Desktop/tablet: table */}
      <div className="hidden max-h-[440px] overflow-auto sm:block">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-slate-100 text-slate-500">
              <th className="py-2 pr-2 font-semibold">{unit}</th>
              <th className="py-2 pr-2 font-semibold">{hi ? "प्रतिक्रियाएं (N)" : "Responses (N)"}</th>
              <th className="py-2 pr-2 font-semibold">{hi ? "सर्वे में सर्वाधिक समर्थन" : "Highest survey support"}</th>
              <th className="py-2 pr-2 font-semibold">{hi ? "शीर्ष मुद्दा" : "Top issue"}</th>
              <th className="py-2 font-semibold">{hi ? "विधायक से संतुष्ट*" : "Satisfied with MLA*"}</th>
            </tr>
          </thead>
          <tbody>
            {geo.rows.map((r) => (
              <tr key={r.key} className="border-b border-slate-50">
                <th scope="row" className="py-2 pr-2 font-semibold text-slate-800">
                  {r.label}
                </th>
                <td className="py-2 pr-2">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-16 overflow-hidden rounded-full bg-slate-100">
                      <span className="block h-full rounded-full bg-[#2f6fed]" style={{ width: `${(r.n / max) * 100}%` }} />
                    </span>
                    <span className="font-bold text-slate-900">{r.n}</span>
                  </span>
                </td>
                <td className="py-2 pr-2 text-slate-700">{r.topParty ? `${r.topParty.label} (${r0(r.topParty.pct)}%)` : "—"}</td>
                <td className="py-2 pr-2 text-slate-700">{r.topIssue ? `${r.topIssue.label} (${r0(r.topIssue.pct)}%)` : "—"}</td>
                <td className="py-2 text-slate-700">{r.satisfiedPct === null ? "—" : `${r0(r.satisfiedPct)}%`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile: stacked cards */}
      <ul className="flex flex-col gap-2 sm:hidden">
        {geo.rows.map((r) => (
          <li key={r.key} className="rounded-xl border border-slate-100 bg-[#fbfcfe] p-3 text-xs">
            <p className="flex items-center justify-between gap-2 font-bold text-slate-800">
              <span className="truncate">{r.label}</span>
              <span className="shrink-0 text-slate-500">N={r.n}</span>
            </p>
            <dl className="mt-1.5 grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-1 text-slate-600">
              <dt>{hi ? "सर्वाधिक समर्थन" : "Top support"}</dt>
              <dd className="truncate text-right font-semibold text-slate-800">{r.topParty ? `${r.topParty.label} (${r0(r.topParty.pct)}%)` : "—"}</dd>
              <dt>{hi ? "शीर्ष मुद्दा" : "Top issue"}</dt>
              <dd className="truncate text-right font-semibold text-slate-800">{r.topIssue ? `${r.topIssue.label} (${r0(r.topIssue.pct)}%)` : "—"}</dd>
              <dt>{hi ? "विधायक से संतुष्ट*" : "Satisfied with MLA*"}</dt>
              <dd className="text-right font-semibold text-slate-800">{r.satisfiedPct === null ? "—" : `${r0(r.satisfiedPct)}%`}</dd>
            </dl>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-slate-500">
        {hi ? "*“बहुत खुश” + “कुछ हद तक खुश”। छोटे N वाले क्षेत्रों के आंकड़े सावधानी से पढ़ें।" : "*“Very happy” + “Somewhat happy”. Read small-N areas with caution."}
      </p>
    </div>
  );
}

export function LevelCompare({ levels, hi }: { levels: ScopeAnalysis["comparison"]; hi: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {levels.map((l) => (
        <div key={l.level} className="min-w-0 rounded-xl border border-slate-100 bg-[#fbfcfe] p-3">
          <p className="text-sm font-bold text-slate-900">
            {l.label} <span className="font-normal text-slate-500">(N={l.n})</span>
          </p>
          <p className="mb-2 text-[11px] text-slate-500">
            {l.level === "state" ? (hi ? "राज्य" : "State") : l.level === "district" ? (hi ? "जिला" : "District") : hi ? "विधानसभा क्षेत्र" : "Constituency"}
          </p>
          <ul className="flex flex-col gap-1.5">
            {l.party.map((p, i) => (
              <li key={p.key} className="grid grid-cols-[56px_minmax(0,1fr)_36px] items-center gap-2 text-xs">
                <span className="truncate font-semibold text-slate-700">{p.label}</span>
                <span className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <span className="block h-full rounded-full" style={{ width: `${p.pct}%`, backgroundColor: colorOf(p, i) }} />
                </span>
                <span className="text-right font-bold text-slate-900">{r0(p.pct)}%</span>
              </li>
            ))}
          </ul>
          {l.topIssues.length > 0 && (
            <p className="mt-2 text-[11px] text-slate-600">
              {hi ? "शीर्ष मुद्दे: " : "Top issues: "}
              {l.topIssues.map((i) => `${i.label} ${r0(i.pct)}%`).join(", ")}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

const SAMPLE_TONE: Record<DataQuality["sample"]["level"], string> = {
  none: "border-slate-200 bg-slate-50 text-slate-700",
  very_small: "border-amber-200 bg-amber-50 text-amber-900",
  small: "border-amber-200 bg-amber-50 text-amber-900",
  moderate: "border-blue-100 bg-blue-50 text-blue-900",
  large: "border-blue-100 bg-blue-50 text-blue-900",
};

export function SampleNote({ sample }: { sample: DataQuality["sample"] }) {
  const Icon = sample.level === "very_small" || sample.level === "small" ? AlertTriangle : Info;
  return (
    <p className={cn("flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs leading-relaxed", SAMPLE_TONE[sample.level])}>
      <Icon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      {sample.message}
    </p>
  );
}

export function QualityDetails({ q, hi }: { q: DataQuality; hi: boolean }) {
  const maxRecency = Math.max(1, ...q.recency.map((r) => r.count));
  return (
    <div className="flex flex-col gap-4">
      <SampleNote sample={q.sample} />
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {[
          { l: hi ? "कुल प्रतिक्रियाएं" : "Total responses", v: formatNumber(q.total) },
          { l: hi ? "पूर्ण प्रतिक्रियाएं" : "Complete", v: formatNumber(q.complete) },
          { l: hi ? "अपूर्ण प्रतिक्रियाएं" : "Incomplete", v: formatNumber(q.incomplete) },
          { l: hi ? "पूर्णता दर" : "Completion rate", v: `${r0(q.completionRate)}%` },
        ].map((s) => (
          <div key={s.l} className="rounded-xl border border-slate-100 bg-[#fbfcfe] p-3">
            <p className="text-[11px] font-semibold text-slate-500">{s.l}</p>
            <p className="mt-0.5 text-lg font-black text-[#0b1f3a]">{s.v}</p>
          </div>
        ))}
      </div>
      <p className="-mt-2 text-[11px] text-slate-500">
        {hi
          ? "पूर्ण = प्रतिक्रिया के समय पूछे जा रहे सभी मुख्य प्रश्नों (विधायक, पार्टी, मुद्दे) का उत्तर — बाद में जोड़ा गया प्रश्न पुरानी प्रतिक्रियाओं के विरुद्ध नहीं गिना जाता। केवल मान्य (VALID) प्रतिक्रियाएं शामिल हैं।"
          : "Complete = answered every main question (MLA, party, issues) being asked at the time — a question added later is not held against earlier responses. Only valid (VALID) responses are included."}
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="min-w-0">
          <p className="mb-2 text-[13px] font-extrabold text-[#0b1f3a]">{hi ? "प्रश्नवार उत्तर / छूटे मान" : "Answered / missing per question"}</p>
          <ul className="flex flex-col gap-2">
            {q.perQuestion.map((row) => (
              <li key={row.key} className="grid grid-cols-[96px_minmax(0,1fr)_40px_52px] items-center gap-2 text-xs">
                <span className="min-w-0 font-semibold text-slate-700">
                  <span className="block truncate">{row.label}</span>
                  {row.since && (
                    <span className="block truncate text-[10px] font-normal text-slate-500">
                      {hi ? "से पूछा गया: " : "asked since "}
                      {new Date(row.since).toLocaleDateString(hi ? "hi-IN" : "en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })}
                    </span>
                  )}
                </span>
                <span className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <span className="block h-full rounded-full bg-[#2f6fed]" style={{ width: `${row.pct}%` }} />
                </span>
                <span className="text-right font-bold text-[#0b1f3a]">{r0(row.pct)}%</span>
                <span className="text-right text-[11px] text-slate-500">
                  {hi ? "छूटे" : "miss"} {row.missing}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[10.5px] text-slate-500">
            {hi ? "प्रतिशत = जिन प्रतिक्रियाओं के समय प्रश्न पूछा जा रहा था, उनमें से उत्तर देने वाले। जनसांख्यिकीय प्रश्न वैकल्पिक हैं।" : "Percent = answered, out of responses submitted while the question was being asked. Profile questions are optional."}
          </p>
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <div>
            <p className="mb-2 text-[13px] font-extrabold text-[#0b1f3a]">{hi ? "समय के अनुसार प्रतिक्रियाएं" : "Responses by recency"}</p>
            <ul className="flex flex-col gap-2">
              {q.recency.map((r) => (
                <li key={r.key} className="grid grid-cols-[110px_minmax(0,1fr)_36px] items-center gap-2 text-xs">
                  <span className="truncate font-semibold text-slate-700">{r.label}</span>
                  <span className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <span className="block h-full rounded-full bg-[#16a34a]" style={{ width: `${(r.count / maxRecency) * 100}%` }} />
                  </span>
                  <span className="text-right font-bold text-[#0b1f3a]">{r.count}</span>
                </li>
              ))}
            </ul>
          </div>
          <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1.5 rounded-xl border border-slate-100 bg-[#fbfcfe] p-3 text-xs">
            <dt className="text-slate-600">{hi ? "कोई भी प्रोफ़ाइल जानकारी देने वाले" : "Shared any profile detail"}</dt>
            <dd className="text-right font-bold text-[#0b1f3a]">
              {q.demographicAny.count} ({r0(q.demographicAny.pct)}%)
            </dd>
            <dt className="text-slate-600">{hi ? "चारों प्रोफ़ाइल प्रश्नों के उत्तर" : "Answered all four profile questions"}</dt>
            <dd className="text-right font-bold text-[#0b1f3a]">
              {q.demographicAll.count} ({r0(q.demographicAll.pct)}%)
            </dd>
            {q.geo && (
              <>
                <dt className="text-slate-600">{hi ? `प्रतिक्रिया वाले ${q.geo.label}` : `${q.geo.label} with responses`}</dt>
                <dd className="text-right font-bold text-[#0b1f3a]">
                  {q.geo.covered}/{q.geo.total}
                </dd>
                <dt className="text-slate-600">{hi ? `कम से कम 5 प्रतिक्रियाओं वाले ${q.geo.label}` : `${q.geo.label} with at least 5 responses`}</dt>
                <dd className="text-right font-bold text-[#0b1f3a]">{q.geo.reliable}</dd>
              </>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}

export function FactsGrid({ profile }: { profile: AreaProfile }) {
  return (
    <dl className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
      {profile.facts.map((f) => (
        <div key={f.key} className="min-w-0 rounded-xl border border-slate-100 bg-[#fbfcfe] p-3">
          <dt className="text-[11px] font-semibold text-slate-500">{f.label}</dt>
          <dd className="mt-0.5 text-[15px] font-black leading-snug text-[#0b1f3a]">{f.value}</dd>
          <dd className="mt-0.5 text-[11px] text-slate-500">{f.detail}</dd>
        </div>
      ))}
    </dl>
  );
}

const FINDING_ICON: Record<Finding["icon"], { Icon: typeof Award; tone: string }> = {
  party: { Icon: Award, tone: "bg-orange-100 text-orange-600" },
  mla: { Icon: Smile, tone: "bg-emerald-100 text-emerald-600" },
  issue: { Icon: ListChecks, tone: "bg-blue-100 text-blue-600" },
  demographic: { Icon: UserCheck, tone: "bg-violet-100 text-violet-600" },
  geo: { Icon: MapPinned, tone: "bg-sky-100 text-sky-600" },
  compare: { Icon: BarChart3, tone: "bg-pink-100 text-pink-600" },
};

export function FindingCards({ items }: { items: Finding[] }) {
  return (
    <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {items.map((f, i) => {
        const { Icon, tone } = FINDING_ICON[f.icon];
        return (
          <li key={i} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-[#fbfcfe] p-3">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone}`} aria-hidden="true">
              <Icon size={17} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold leading-snug text-slate-900">{f.title}</p>
              <p className="mt-0.5 text-xs text-slate-500">{f.text}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function InsightList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((t, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-700">
          <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-500" aria-hidden="true" />
          {t}
        </li>
      ))}
    </ul>
  );
}

export function Methodology({ hi, data, className }: { hi: boolean; data: ScopeAnalysis; className?: string }) {
  const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(hi ? "hi-IN" : "en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "—");
  return (
    <p className={cn("text-xs leading-relaxed text-slate-600", className)}>
      <strong className="text-slate-800">{hi ? "पद्धति और स्रोत: " : "Method & source: "}</strong>
      {hi
        ? `यह votersurvey.in पर उपयोगकर्ताओं द्वारा स्वेच्छा से भेजी गई मान्य (VALID) प्रतिक्रियाओं पर आधारित है; यह कोई आधिकारिक चुनाव परिणाम या पूर्वानुमान नहीं है। सर्वे अवधि: ${fmt(data.firstResponseAt)} – ${fmt(data.lastResponseAt)}। प्रत्येक प्रश्न का प्रतिशत उसी प्रश्न का उत्तर देने वाले उत्तरदाताओं के आधार पर है।`
        : `Based on valid responses voluntarily submitted on votersurvey.in; not an official election result or forecast. Survey period: ${fmt(data.firstResponseAt)} – ${fmt(data.lastResponseAt)}. Each percentage uses respondents who answered that question as the base.`}
      {data.isSynthetic ? (hi ? " (डेमो डेटा मोड सक्रिय)" : " (Demo data mode active)") : ""}
    </p>
  );
}
