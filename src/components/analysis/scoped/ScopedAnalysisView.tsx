import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ChartLine,
  CheckCircle2,
  ChevronRight,
  Clock,
  Flag,
  Lightbulb,
  Map as MapIcon,
  MapPin,
  MapPinned,
  Network,
  ShieldCheck,
  Target,
  UserCheck,
  UserRound,
  Users,
} from "lucide-react";
import type { ResolvedScope, ScopeAnalysis } from "@/lib/scoped-survey";
import { MIN_GROUP_N } from "@/lib/scoped-survey";
import { areaUnitOf, formatIstDate, mlaStance, reportableFindings, todayIst, type AnalysisExtras } from "@/lib/analysis-engine";
import { ALL_STATES_PARAM, analysisQuery } from "@/lib/analysis-params";
import { analysisModules } from "@/lib/analysis-modules";
import { resultsPath } from "@/lib/routes";
import { cn, formatNumber } from "@/lib/utils";
import { ScopeContent, ScopeNavProvider } from "@/components/scope/ScopeNav";
import { Donut, PartyBars, StackedCrossTab } from "@/components/scope/charts";
import { AnalysisMobileNav, AnalysisSideNav } from "./dashboard/AnalysisNav";
import { AnalysisFilters } from "./dashboard/AnalysisFilters";
import { DeepHubProvider, PanelSlot, Tile, type PanelDef } from "./dashboard/DeepHub";
import { CollapsibleCard, DetailDialog, SegTabs } from "./dashboard/interactive";
import { Card, CardHeader, EmphasizeNumbers, Empty, FooterLink, KpiCard, PillLink, CARD } from "./dashboard/ui";
import { ColumnChart, IssueRows, MiniDonut, PartyColumns, TrendLine } from "./dashboard/charts";
import { FactsGrid, FindingCards, GeoTable, InsightList, LevelCompare, Methodology, QualityDetails, SampleNote } from "./dashboard/blocks";
import { CrossModule } from "./dashboard/modules/CrossModule";
import { IssueModule } from "./dashboard/modules/IssueModule";
import { GeoModule } from "./dashboard/modules/GeoModule";
import { TimeModule } from "./dashboard/modules/TimeModule";
import { AskCard, AskPanel } from "./dashboard/modules/AskModule";
import { ReportBuilder, ReportCard } from "./dashboard/modules/ReportModule";

// THE canonical public Analysis page (State / District / Assembly), laid out
// after the approved Analysis reference: compact sidebar, scope header with the
// current MLA, filter bar, KPI row, a summary dashboard (profile · findings ·
// trend, then party · MLA · issues · demographics) and — below it — deep
// modules that open one at a time. Everything is computed from real survey
// responses of the selected scope; descriptive only, never a forecast, and
// entirely free (modules can be switched via src/lib/analysis-modules.ts).

const FINDING_ORDER = ["issue", "party", "demographic", "mla"] as const;
const FINDING_DOT = ["bg-[#16a34a]", "bg-[#f97316]", "bg-[#2f6fed]", "bg-[#ec4899]"];

export function ScopedAnalysisView({ scope, data, extras, hi }: { scope: ResolvedScope; data: ScopeAnalysis | null; extras: AnalysisExtras | null; hi: boolean }) {
  const T = (h: string, e: string) => (hi ? h : e);
  const year = scope.election?.year ?? 2027;
  const hasData = !!data && !!extras && data.total > 0;
  const query = analysisQuery(scope.params, data?.filters);
  const today = todayIst();
  const unit = areaUnitOf(scope);
  const flags = analysisModules;

  const navIds = hasData
    ? [
        "summary",
        flags.areaProfile && "profile",
        flags.keyFindings && "findings",
        flags.responseTrend && "trend",
        flags.partySupport && "party",
        flags.mlaOpinion && "mla",
        flags.issueOverview && "issues",
        flags.demographics && "demographics",
        flags.crossAnalysis && "cross",
        flags.geographicComparison && "geo",
        (flags.timeComparison || flags.periodComparison) && "time",
        flags.dataQuality && "quality",
        flags.askData && "ask",
        flags.detailedExport && "report",
      ].filter((x): x is string => !!x)
    : ["summary"];

  return (
    <ScopeNavProvider>
      <div className="bg-[#f4f7fc] pb-8 text-slate-800 lg:pb-10">
        <div className="mx-auto max-w-[1440px] px-3 pt-3 sm:px-5 sm:pt-5 lg:px-6">
          <div className="lg:grid lg:grid-cols-[196px_minmax(0,1fr)] lg:items-start lg:gap-5 xl:gap-6">
            <AnalysisSideNav hi={hi} ids={navIds} />
            <div className="min-w-0">
              <AnalysisMobileNav hi={hi} ids={navIds} />
              <Header scope={scope} data={data} extras={extras} hi={hi} year={year} today={today} />
              <ScopeContent hi={hi}>
                {!hasData ? (
                  <NoData scope={scope} data={data} hi={hi} />
                ) : (
                  <Dashboard scope={scope} data={data!} extras={extras!} hi={hi} query={query} today={today} unit={unit} T={T} />
                )}
              </ScopeContent>
            </div>
          </div>
        </div>
      </div>
    </ScopeNavProvider>
  );
}

// ── Header: breadcrumb · title · MLA card · filters · KPIs ──────────────────

function Header({ scope, data, extras, hi, year, today }: { scope: ResolvedScope; data: ScopeAnalysis | null; extras: AnalysisExtras | null; hi: boolean; year: number; today: string }) {
  const crumbs: { label: string; href?: string }[] = [];
  if (scope.level === "none") crumbs.push({ label: hi ? "सभी राज्य (समग्र)" : "All states (combined)" });
  if (scope.state) crumbs.push({ label: scope.state.name, href: scope.district ? `/analysis${analysisQuery({ state: scope.state.slug })}` : undefined });
  if (scope.state && scope.district) crumbs.push({ label: scope.district.name, href: scope.constituency ? `/analysis${analysisQuery({ state: scope.state.slug, district: scope.district.slug })}` : undefined });
  if (scope.constituency) crumbs.push({ label: scope.constituency.name });
  const k = extras?.kpis;
  const filters = data?.filters ?? { segment: "all", period: "all" };
  const segmentOptions = data?.segmentOptions ?? [{ value: "all", label: hi ? "सभी उत्तरदाता" : "All respondents" }];

  return (
    <section id="summary" className="scroll-mt-24">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,300px)] xl:grid-cols-[minmax(0,1fr)_minmax(250px,300px)_200px] xl:items-start">
        <div className="min-w-0 md:col-span-2 xl:col-span-1">
          <nav aria-label={hi ? "दायरा" : "Scope"}>
            <ol className="flex flex-wrap items-center gap-1 text-[13px] font-semibold">
              {crumbs.map((c, i) => (
                <li key={i} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight size={14} className="text-slate-400" aria-hidden="true" />}
                  {c.href ? (
                    <Link href={c.href} className="text-[#1677ff] hover:underline">
                      {c.label}
                    </Link>
                  ) : (
                    <span className={i === crumbs.length - 1 ? "text-[#1677ff]" : "text-slate-600"} aria-current={i === crumbs.length - 1 ? "page" : undefined}>
                      {c.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
          <h1 className="mt-1.5 text-[23px] font-black leading-tight tracking-tight text-[#0b1f3a] sm:text-[28px] xl:text-[30px]">
            {scope.level === "none" ? (hi ? "समग्र सर्वेक्षण विश्लेषण" : "Overall Survey Analysis") : hi ? `विधानसभा सर्वेक्षण विश्लेषण ${year}` : `Assembly Survey Analysis ${year}`}
            <span className="sr-only"> — {scope.constituency?.name ?? scope.district?.name ?? scope.state?.name ?? ""}</span>
          </h1>
          <p className="mt-1 max-w-3xl text-[12.5px] leading-relaxed text-slate-600 sm:text-[13px]">
            {hi
              ? "यह पेज सर्वेक्षण प्रतिक्रियाओं पर आधारित विश्लेषण प्रस्तुत करता है। यह किसी भी प्रकार का चुनावी अनुमान नहीं है।"
              : "This page presents an analysis based on survey responses. It is not an election forecast of any kind."}
          </p>
        </div>
        <ContextCard scope={scope} extras={extras} hi={hi} />
        {data && (
          <div className="hidden xl:block">
            <AnalysisFilters key={scopeKey(scope, filters)} hi={hi} variant="header" scope={scope.params} options={scope.options} filters={filters} segmentOptions={segmentOptions} today={today} />
          </div>
        )}
      </div>

      <div className="mt-3">
        <AnalysisFilters
          key={scopeKey(scope, filters)}
          hi={hi}
          variant="bar"
          scope={scope.params}
          options={scope.options}
          filters={filters}
          segmentOptions={segmentOptions}
          today={today}
        />
      </div>

      {data && (data.filters.segment !== "all" || data.filters.period !== "all") && (
        <p className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-3.5 py-2 text-[12.5px] text-blue-900">
          {hi ? "फ़िल्टर लागू: " : "Filter applied: "}
          {[
            data.filters.segment !== "all" ? data.segmentOptions.find((o) => o.value === data.filters.segment)?.label : null,
            periodLabel(data.filters, hi),
          ]
            .filter(Boolean)
            .join(" · ")}{" "}
          — N={formatNumber(data.total)}
        </p>
      )}

      {k && (
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 xl:grid-cols-5">
          <KpiCard
            tone="blue"
            icon={<Users size={20} />}
            label={hi ? "कुल प्रतिक्रियाएं" : "Total responses"}
            value={formatNumber(k.total)}
            sub={hi ? `+${formatNumber(k.last7Days)} पिछले 7 दिनों में` : `+${formatNumber(k.last7Days)} in last 7 days`}
            subClass="text-emerald-600"
          />
          <KpiCard
            tone="green"
            icon={<CheckCircle2 size={20} />}
            label={hi ? "पूर्ण प्रतिक्रियाएं" : "Complete responses"}
            value={formatNumber(k.complete)}
            sub={hi ? `${Math.round(k.completionRate)}% पूर्णता दर` : `${Math.round(k.completionRate)}% completion rate`}
            subClass="text-emerald-700"
          />
          <KpiCard
            tone="amber"
            icon={<Clock size={20} />}
            label={hi ? "सर्वे अवधि" : "Survey period"}
            value={<span className="text-[14px] sm:text-[16px]">{k.firstResponseAt ? `${formatIstDate(k.firstResponseAt, hi ? "hi" : "en", false)} – ${formatIstDate(k.lastResponseAt!, hi ? "hi" : "en")}` : "—"}</span>}
            sub={`${k.days ? (hi ? `${k.days} दिन` : `${k.days} days`) : "—"} · ${k.surveyActive ? (hi ? "सर्वे सक्रिय" : "Survey open") : hi ? "सर्वे बंद" : "Survey closed"}`}
          />
          <KpiCard tone="red" icon={<MapPin size={20} />} label={k.coverage.label} value={`${formatNumber(k.coverage.covered)} / ${formatNumber(k.coverage.total)}`} sub={k.coverage.sub} />
          <KpiCard tone="purple" icon={<MapPinned size={20} />} label={k.areas.label} value={`${formatNumber(k.areas.covered)} / ${formatNumber(k.areas.total)}`} sub={k.areas.sub} />
          {analysisModules.dataQuality && data && data.total > 0 && (
            <a
              href="#quality"
              className="flex items-center justify-center gap-2 rounded-2xl border border-[#dbe7fb] bg-white p-3 text-[13px] font-bold text-[#1677ff] shadow-[0_1px_2px_rgba(15,31,75,0.04)] hover:bg-[#f5f9ff] xl:hidden"
            >
              <Activity size={18} aria-hidden="true" />
              {hi ? "और देखें" : "More"}
            </a>
          )}
        </div>
      )}

      {extras && (extras.quality.sample.level === "very_small" || extras.quality.sample.level === "small") && (
        <div className="mt-3">
          <SampleNote sample={extras.quality.sample} />
        </div>
      )}
    </section>
  );
}

function scopeKey(scope: ResolvedScope, f: { segment: string; period: string; from?: string; to?: string }) {
  return analysisQuery(scope.params, f);
}

function periodLabel(f: ScopeAnalysis["filters"], hi: boolean) {
  if (f.period === "7d") return hi ? "पिछले 7 दिन" : "Last 7 days";
  if (f.period === "30d") return hi ? "पिछले 30 दिन" : "Last 30 days";
  if (f.period === "custom" && f.from && f.to) return `${formatIstDate(f.from, hi ? "hi" : "en", false)} – ${formatIstDate(f.to, hi ? "hi" : "en")}`;
  return null;
}

function ContextCard({ scope, extras, hi }: { scope: ResolvedScope; extras: AnalysisExtras | null; hi: boolean }) {
  const mla = extras?.mla;
  if (mla)
    return (
      <div className={cn(CARD, "flex min-w-0 items-center gap-3 p-3.5")}>
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 bg-white"
          style={{ borderColor: `${mla.color ?? "#f97316"}55` }}
          aria-hidden="true"
        >
          {mla.logoUrl ? (
            <Image src={mla.logoUrl} alt="" width={34} height={34} className="object-contain" />
          ) : (
            <span className="text-xs font-black" style={{ color: mla.color ?? "#f97316" }}>
              {(mla.partyShort ?? mla.name).slice(0, 3)}
            </span>
          )}
        </span>
        <div className="min-w-0">
          <p className="text-[11.5px] font-bold text-slate-500">{hi ? "वर्तमान विधायक" : "Current MLA"}</p>
          <p className="truncate text-[15px] font-black leading-tight text-[#0b1f3a]">{mla.name}</p>
          {mla.party && <p className="truncate text-xs text-slate-600">{mla.party}</p>}
        </div>
      </div>
    );
  const k = extras?.kpis;
  return (
    <div className={cn(CARD, "flex min-w-0 items-center gap-3 p-3.5")}>
      <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full", k?.surveyActive ? "bg-[#e7f8ef] text-[#16a34a]" : "bg-slate-100 text-slate-500")} aria-hidden="true">
        <Activity size={22} />
      </span>
      <div className="min-w-0">
        <p className="text-[11.5px] font-bold text-slate-500">{hi ? "सर्वेक्षण स्थिति" : "Survey status"}</p>
        <p className="text-[15px] font-black leading-tight text-[#0b1f3a]">{k?.surveyActive ? (hi ? "सक्रिय" : "Open") : hi ? "बंद / उपलब्ध नहीं" : "Closed / unavailable"}</p>
        <p className="truncate text-xs text-slate-600">
          {k?.lastResponseAt
            ? `${hi ? "अंतिम प्रतिक्रिया" : "Last response"}: ${formatIstDate(k.lastResponseAt, hi ? "hi" : "en")}`
            : scope.constituency
              ? hi
                ? "वर्तमान विधायक की सत्यापित जानकारी उपलब्ध नहीं"
                : "Verified MLA details not available"
              : hi
                ? "अभी कोई प्रतिक्रिया नहीं"
                : "No responses yet"}
        </p>
      </div>
    </div>
  );
}

function NoData({ scope, data, hi }: { scope: ResolvedScope; data: ScopeAnalysis | null; hi: boolean }) {
  const filtered = !!data && (data.filters.segment !== "all" || data.filters.period !== "all");
  return (
    <div className={cn(CARD, "mt-4 px-5 py-12 text-center")}>
      <p className="text-base font-bold text-slate-700">
        {filtered
          ? hi
            ? "चुने गए फ़िल्टर के लिए कोई प्रतिक्रिया उपलब्ध नहीं है।"
            : "No responses match the selected filters."
          : scope.level === "none"
            ? hi
              ? "अभी पर्याप्त सर्वेक्षण डेटा उपलब्ध नहीं है।"
              : "Not enough survey data is available yet."
            : hi
              ? "इस क्षेत्र के लिए अभी पर्याप्त सर्वेक्षण डेटा उपलब्ध नहीं है।"
              : "Not enough survey data is available for this area yet."}
      </p>
      <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
        {hi
          ? "जैसे-जैसे लोग सर्वे में भाग लेंगे, यहां विश्लेषण दिखाई देगा। ऊपर कोई दूसरा राज्य, जिला या विधानसभा क्षेत्र चुनें या फ़िल्टर बदलें।"
          : "Analysis will appear here as people take part in the survey. Choose another state, district or constituency above, or change the filters."}
      </p>
    </div>
  );
}

// ── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({
  scope,
  data,
  extras,
  hi,
  query,
  today,
  unit,
  T,
}: {
  scope: ResolvedScope;
  data: ScopeAnalysis;
  extras: AnalysisExtras;
  hi: boolean;
  query: string;
  today: string;
  unit: ReturnType<typeof areaUnitOf>;
  T: (h: string, e: string) => string;
}) {
  const flags = analysisModules;
  const noData = T("इस विश्लेषण के लिए अभी पर्याप्त डेटा उपलब्ध नहीं है।", "Not enough data for this analysis yet.");
  const closeLabel = T("बंद करें", "Close");
  const place = scope.constituency?.name ?? scope.district?.name ?? scope.state?.name ?? T("सभी राज्य", "All states");
  const stance = mlaStance(data.mla);
  // One suppression rule for page, dialog, PDF and Excel (reportableFindings).
  const safeHeadline = reportableFindings(data);
  const safeAdvanced = reportableFindings({ ...data, findings: [] }, extras.advanced);
  const headline = FINDING_ORDER.map((icon) => safeHeadline.find((f) => f.icon === icon)).filter((f): f is NonNullable<typeof f> => !!f);
  const compact = [...headline, ...safeAdvanced].slice(0, 4);
  const allFindings = [...safeHeadline, ...safeAdvanced];
  // Same small-sample rule as the rest of Analysis: no opinion shares below MIN_GROUP_N answers.
  const mlaEnough = data.mla.answered >= MIN_GROUP_N;
  const unitName = unit ? (hi ? { state: "राज्यों", district: "जिलों", constituency: "विधानसभा क्षेत्रों" }[unit] : { state: "states", district: "districts", constituency: "constituencies" }[unit]) : null;
  const defaultRef = scope.constituency ? `constituency:${scope.constituency.id}` : scope.district ? `district:${scope.district.id}` : undefined;
  const scopeSummary = [
    `${T("राज्य", "State")}: ${scope.state?.name ?? T("सभी राज्य", "All states")}`,
    `${T("जिला", "District")}: ${scope.district?.name ?? T("सभी", "All")}`,
    `${T("विधानसभा", "Constituency")}: ${scope.constituency?.name ?? T("सभी", "All")}`,
    `${T("अवधि", "Period")}: ${periodLabel(data.filters, hi) ?? T("सभी समय", "All time")}`,
    `${T("समूह", "Group")}: ${data.segmentOptions.find((o) => o.value === data.filters.segment)?.label ?? T("सभी उत्तरदाता", "All respondents")}`,
  ];

  const deepPanels: Record<string, PanelDef> = {};
  if (flags.issueIntelligence)
    deepPanels["issue-analysis"] = {
      title: T("मुद्दा विश्लेषण (विस्तृत)", "Issue intelligence"),
      sub: T("कोई मुद्दा चुनें — आयु, लिंग, सामाजिक श्रेणी, धर्म, क्षेत्र और पार्टी समर्थन के अनुसार", "Pick an issue — by age, gender, social category, religion, area and party support"),
      node: (
        <IssueModule
          hi={hi}
          query={query}
          issues={data.issues.items.map((i) => ({ key: i.key, label: i.label, count: i.count, pct: i.pct }))}
          answered={data.issues.answered}
          categories={data.issueCategories?.map((c) => ({ key: c.key, label: c.label, count: c.count, pct: c.pct })) ?? null}
        />
      ),
    };
  if (flags.crossAnalysis)
    deepPanels.cross = {
      title: T("क्रॉस विश्लेषण", "Cross-analysis"),
      sub: T(`कोई भी दो आयाम चुनें; न्यूनतम ${MIN_GROUP_N} प्रतिक्रियाओं वाले समूह ही दिखाए जाते हैं`, `Pick any two dimensions; only groups with at least ${MIN_GROUP_N} responses are drawn`),
      node: <CrossModule hi={hi} query={query} unit={unit} initial={extras.initialCross} />,
    };
  if (flags.geographicComparison)
    deepPanels.geo = {
      title: scope.level === "none" ? T("राज्यवार तुलना", "State-wise comparison") : T("भौगोलिक तुलना", "Geographic comparison"),
      sub: data.geo && unitName ? T(`${data.geo.rows.length}/${data.geo.totalUnits} ${unitName} में प्रतिक्रियाएं`, `${data.geo.rows.length}/${data.geo.totalUnits} ${unitName} with responses`) : T("स्तर तुलना और दो क्षेत्रों की तुलना", "Level comparison and area vs area"),
      node: (
        <GeoModule
          hi={hi}
          query={query}
          unit={unit}
          summary={data.geo ? <GeoTable geo={data.geo} hi={hi} /> : null}
          levels={data.comparison.length ? <LevelCompare levels={data.comparison} hi={hi} /> : null}
          defaultRef={defaultRef}
        />
      ),
    };
  if (flags.timeComparison || flags.periodComparison)
    deepPanels.time = {
      title: T("समय एवं अवधि तुलना", "Time & period comparison"),
      sub: T("सर्वे प्रतिक्रियाओं की समय के अनुसार तुलना — कोई पूर्वानुमान नहीं", "Survey responses compared over time — not a forecast"),
      node: <TimeModule hi={hi} query={query} today={today} />,
    };

  const lowerPanels: Record<string, PanelDef> = {};
  if (flags.dataQuality) lowerPanels.quality = { title: T("डेटा गुणवत्ता", "Data quality"), sub: T("नमूना आकार, पूर्णता, कवरेज और छूटे मान", "Sample size, completeness, coverage and missing values"), node: <QualityDetails q={extras.quality} hi={hi} /> };
  if (flags.askData) lowerPanels["ask-answer"] = { title: T("डेटा से पूछें — उत्तर", "Ask the data — answer"), node: <AskPanel hi={hi} query={query} /> };
  if (flags.detailedExport) lowerPanels["report-builder"] = { title: T("अनुकूलित रिपोर्ट", "Custom report"), sub: T("मॉड्यूल चुनें और PDF या Excel रिपोर्ट बनाएं", "Choose modules and build a PDF or Excel report"), node: <ReportBuilder hi={hi} query={query} scopeSummary={scopeSummary} /> };

  return (
    <DeepHubProvider panelIds={[...Object.keys(deepPanels), ...Object.keys(lowerPanels)]}>
      {/* Row 2: profile · findings · trend */}
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)]">
        {flags.areaProfile && (
          <CollapsibleCard
            id="profile"
            className="md:col-span-2 xl:col-span-1"
            toggleLabel={T("प्रोफ़ाइल दिखाएं/छिपाएं", "Show/hide profile")}
            header={<CardHeader icon={<UserRound size={19} />} tone="orange" title={extras.profile.title} />}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,168px)]">
              <p className="text-[13px] leading-[1.75] text-slate-600">
                {extras.profile.summary.map((s, i) => (
                  <span key={i}>
                    <EmphasizeNumbers text={s} />{" "}
                  </span>
                ))}
              </p>
              <div className="min-w-0 rounded-xl border border-[#e8eef7] bg-[#f7faff] p-3">
                <p className="mb-2 flex items-center gap-1.5 text-[12px] font-extrabold text-[#0b1f3a]">
                  <MapPin size={14} className="text-[#f97316]" aria-hidden="true" />
                  {T("क्षेत्र परिचय", "Area context")}
                </p>
                <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-1.5 text-[12px]">
                  {extras.profile.context.map((c) => (
                    <div key={c.label} className="contents">
                      <dt className="text-slate-500">{c.label}</dt>
                      <dd className="truncate text-right font-bold text-[#0b1f3a]">{c.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <DetailDialog variant="outline" trigger={T("विस्तृत प्रोफ़ाइल देखें", "View detailed profile")} title={`${extras.profile.title} — ${place}`} closeLabel={closeLabel}>
                <div className="flex flex-col gap-5">
                  <FactsGrid profile={extras.profile} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      { t: T("लिंग वितरण", "Gender"), d: extras.profile.gender },
                      { t: T("सामाजिक श्रेणी वितरण", "Social category"), d: extras.profile.category },
                    ].map((x) => (
                      <div key={x.t} className="rounded-xl border border-slate-100 p-3">
                        <p className="mb-2 text-[13px] font-extrabold text-[#0b1f3a]">
                          {x.t} <span className="font-normal text-slate-500">(N={x.d.answered})</span>
                        </p>
                        {x.d.answered ? <ColumnChart items={x.d.items} /> : <Empty>{noData}</Empty>}
                      </div>
                    ))}
                  </div>
                  <SampleNote sample={extras.quality.sample} />
                </div>
              </DetailDialog>
            </div>
          </CollapsibleCard>
        )}

        {flags.keyFindings && (
          <CollapsibleCard
            id="findings"
            toggleLabel={T("निष्कर्ष दिखाएं/छिपाएं", "Show/hide findings")}
            header={
              <CardHeader
                icon={<Lightbulb size={19} />}
                tone="amber"
                title={T("मुख्य निष्कर्ष", "Key findings")}
                sub={T("डेटा आधारित प्रमुख अवलोकन", "Key observations from the data")}
                action={
                  allFindings.length + data.insights.length > 0 ? (
                    <DetailDialog variant="pill" trigger={T("सभी देखें", "View all")} title={T("मुख्य निष्कर्ष — सभी", "All key findings")} sub={T("प्रत्येक निष्कर्ष उपलब्ध प्रतिक्रियाओं (N) पर आधारित, वर्णनात्मक", "Each is descriptive and based on the available responses (N)")} closeLabel={closeLabel}>
                      <div className="flex flex-col gap-5">
                        {allFindings.length > 0 && <FindingCards items={allFindings} />}
                        {data.insights.length > 0 && (
                          <div>
                            <p className="mb-2 text-[13px] font-extrabold text-[#0b1f3a]">{T("प्रमुख अंतर्दृष्टि", "Key insights")}</p>
                            <InsightList items={data.insights} />
                          </div>
                        )}
                      </div>
                    </DetailDialog>
                  ) : undefined
                }
              />
            }
          >
            {compact.length ? (
              <ol className="flex flex-col gap-3">
                {compact.map((f, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black text-white", FINDING_DOT[i])} aria-hidden="true">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-extrabold leading-snug text-[#0b1f3a]">{f.title}</p>
                      <p className="mt-0.5 text-[12px] text-slate-500">{f.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <Empty>{noData}</Empty>
            )}
          </CollapsibleCard>
        )}

        {flags.responseTrend && (
          <Card id="trend">
            <CardHeader
              icon={<ChartLine size={19} />}
              tone="blue"
              title={T("प्रतिक्रिया ट्रेंड", "Response trend")}
              sub={
                data.trend
                  ? hi
                    ? `${data.trend.granularity === "day" ? "दैनिक" : data.trend.granularity === "week" ? "साप्ताहिक" : "मासिक"} प्रतिक्रियाएं`
                    : `${data.trend.granularity === "day" ? "Daily" : data.trend.granularity === "week" ? "Weekly" : "Monthly"} responses`
                  : undefined
              }
              action={flags.timeComparison ? <PillLink href="#time">{T("सभी देखें", "View all")}</PillLink> : undefined}
            />
            {data.trend ? <TrendLine points={data.trend.points} hi={hi} /> : <Empty>{noData}</Empty>}
          </Card>
        )}
      </div>

      {/* Row 3: party · MLA · issues · demographics */}
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {flags.partySupport && (
          <Card id="party" className="flex flex-col">
            <CardHeader icon={<Flag size={19} />} tone="orange" title={T("पार्टी समर्थन", "Party support")} sub={T(`उत्तरदाताओं में प्रतिशत (N=${data.party.answered})`, `Share of respondents (N=${data.party.answered})`)} />
            <div className="flex-1">{data.party.answered ? <PartyColumns items={data.party.items} /> : <Empty>{noData}</Empty>}</div>
            {data.party.answered > 0 && (
              <DetailDialog trigger={T("विस्तृत विश्लेषण", "Detailed analysis")} title={T("पार्टी-वार समर्थन", "Party-wise support")} sub={T(`आधार: ${data.party.answered} उत्तरदाता`, `Base: ${data.party.answered} respondents`)} closeLabel={closeLabel}>
                <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <PartyBars dist={data.party} />
                  <Donut items={data.party.items} total={data.party.answered} centerLabel={T("कुल उत्तर", "answers")} size={170} legend="none" />
                </div>
                <p className="mt-4 text-[11px] text-slate-500">{T("यह केवल सर्वे में उत्तरदाताओं की पसंद है, चुनाव परिणाम का अनुमान नहीं।", "This is only respondents' choice in the survey, not an election forecast.")}</p>
              </DetailDialog>
            )}
          </Card>
        )}

        {flags.mlaOpinion && (
          <Card id="mla" className="flex flex-col">
            <CardHeader
              icon={<UserCheck size={19} />}
              tone="green"
              title={T("विधायक के कार्यों पर राय", "Opinion on MLA's work")}
              sub={
                extras.mlaSince
                  ? T(
                      `यह प्रश्न ${formatIstDate(extras.mlaSince, "hi")} से पूछा जा रहा है (N=${data.mla.answered})`,
                      `Asked since ${formatIstDate(extras.mlaSince, "en")} (N=${data.mla.answered})`
                    )
                  : scope.level === "constituency" && extras.mla
                    ? extras.mla.name
                    : T("अपने क्षेत्र के विधायक पर राय", "On their own MLA")
              }
            />
            <div className="flex-1">
              {!data.mla.answered ? (
                <Empty>{noData}</Empty>
              ) : mlaEnough ? (
                <MiniDonut
                  items={data.mla.items}
                  total={data.mla.answered}
                  centerLabel={T("प्रतिक्रियाएं", "responses")}
                  shortLabels={
                    hi
                      ? { satisfied: "बहुत खुश", somewhat_satisfied: "कुछ हद तक खुश", dissatisfied: "खुश नहीं", undecided: "कह नहीं सकते" }
                      : { satisfied: "Very happy", somewhat_satisfied: "Somewhat happy", dissatisfied: "Not happy", undecided: "Can't say" }
                  }
                />
              ) : (
                <SmallSample n={data.mla.answered} hi={hi} />
              )}
            </div>
            {data.mla.answered > 0 && (
              <DetailDialog trigger={T("विस्तृत विश्लेषण", "Detailed analysis")} title={T("विधायक के कार्यों पर राय", "Opinion on MLA's work")} sub={T(`आधार: ${data.mla.answered} उत्तर`, `Base: ${data.mla.answered} answers`)} closeLabel={closeLabel}>
                {mlaEnough ? (
                  <div className="flex flex-col gap-5">
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { l: T("सकारात्मक", "Positive"), v: stance.pos, c: "text-[#16a34a]" },
                        { l: T("नकारात्मक", "Negative"), v: stance.neg, c: "text-[#dc2626]" },
                        { l: T("तटस्थ", "Neutral"), v: stance.neu, c: "text-slate-600" },
                      ].map((s) => (
                        <div key={s.l} className="rounded-xl border border-slate-100 bg-[#fbfcfe] p-3 text-center">
                          <p className={cn("text-xl font-black", s.c)}>{Math.round(s.v)}%</p>
                          <p className="text-[11px] font-semibold text-slate-500">{s.l}</p>
                        </div>
                      ))}
                    </div>
                    <Donut items={data.mla.items} total={data.mla.answered} centerLabel={T("कुल उत्तर", "answers")} legend="side" />
                    <div>
                      <p className="mb-2 text-[13px] font-extrabold text-[#0b1f3a]">{T("पार्टी समर्थन के अनुसार विधायक पर राय", "MLA opinion by party support")}</p>
                      {data.crossPartyMla.meaningful ? (
                        <StackedCrossTab tab={data.crossPartyMla} hi={hi} insufficientLabel={T("प्रतिक्रियाएं कम", "Too few")} />
                      ) : (
                        <Empty>{T("इस तुलना के लिए पर्याप्त प्रतिक्रियाएं उपलब्ध नहीं हैं।", "Not enough responses for this comparison.")}</Empty>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">{T("सकारात्मक = “बहुत खुश” + “कुछ हद तक खुश”; तटस्थ = “कह नहीं सकते”।", "Positive = “very happy” + “somewhat happy”; neutral = “can't say”.")}</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <SmallSample n={data.mla.answered} hi={hi} />
                    <div>
                      <p className="mb-2 text-[13px] font-extrabold text-[#0b1f3a]">{T("प्राप्त उत्तर (संख्या)", "Answers received (counts)")}</p>
                      <ul className="flex flex-col divide-y divide-slate-100 rounded-xl border border-slate-100 bg-[#fbfcfe]">
                        {data.mla.items.map((i) => (
                          <li key={i.key} className="flex items-center justify-between gap-3 px-3 py-2 text-[13px]">
                            <span className="text-slate-700">{i.label}</span>
                            <span className="font-extrabold text-[#0b1f3a]">{formatNumber(i.count)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {T(
                        `${MIN_GROUP_N} से कम उत्तर होने पर प्रतिशत या अनुपात नहीं दिखाए जाते — केवल संख्या।`,
                        `With fewer than ${MIN_GROUP_N} answers, no percentages or proportions are shown — counts only.`
                      )}
                    </p>
                  </div>
                )}
              </DetailDialog>
            )}
          </Card>
        )}

        {flags.issueOverview && (
          <Card id="issues" className="flex flex-col">
            <CardHeader icon={<Target size={19} />} tone="purple" title={T("मुख्य मुद्दे", "Main issues")} sub={T(`बहुविकल्पीय · उत्तरदाताओं का % (N=${data.issues.answered})`, `Multi-select · % of respondents (N=${data.issues.answered})`)} />
            <div className="flex-1">{data.issues.answered ? <IssueRows items={data.issues.items} /> : <Empty>{noData}</Empty>}</div>
            {data.issues.answered > 0 && flags.issueIntelligence && <FooterLink href="#issue-analysis">{T("सभी मुद्दे देखें", "View all issues")}</FooterLink>}
          </Card>
        )}

        {flags.demographics && (
          <Card id="demographics" className="flex flex-col">
            <CardHeader icon={<Users size={19} />} tone="sky" title={T("जनसांख्यिकीय वितरण", "Demographic profile")} sub={T("जिन्होंने जानकारी दी (वैकल्पिक)", "Of those who shared (optional)")} />
            <div className="flex-1">
              {(["age_group", "gender", "social_category", "religion"] as const).some((k) => data.demographics[k].answered) ? (
                <SegTabs
                  tabs={(["age_group", "gender", "social_category", "religion"] as const)
                    .filter((k) => data.demographics[k].answered > 0)
                    .map((k) => ({
                      key: k,
                      label: { age_group: T("आयु", "Age"), gender: T("लिंग", "Gender"), social_category: T("सामाजिक श्रेणी", "Category"), religion: T("धर्म", "Religion") }[k],
                      content: (() => {
                        const d = data.demographics[k];
                        const skipped = d.items.find((i) => i.key === "prefer_not_to_say");
                        return (
                          <div>
                            <ColumnChart items={d.items.filter((i) => i.key !== "prefer_not_to_say")} />
                            <p className="mt-2 text-[10.5px] text-slate-500">
                              {T(`आधार: ${d.answered} उत्तरदाता`, `Base: ${d.answered} respondents`)}
                              {skipped ? T(` · बताना नहीं चाहते: ${skipped.count} (${Math.round(skipped.pct)}%)`, ` · Prefer not to say: ${skipped.count} (${Math.round(skipped.pct)}%)`) : ""}
                            </p>
                          </div>
                        );
                      })(),
                    }))}
                />
              ) : (
                <Empty>{noData}</Empty>
              )}
            </div>
            <DetailDialog trigger={T("सभी देखें", "View all")} title={T("उत्तरदाताओं की प्रोफ़ाइल (वैकल्पिक)", "Respondent profile (optional)")} sub={T("जिन्होंने जानकारी दी, उनके आधार पर", "Based on those who shared the information")} closeLabel={closeLabel}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {(["gender", "age_group", "social_category", "religion"] as const).map((k) => (
                  <div key={k} className="rounded-xl border border-slate-100 p-3">
                    <p className="mb-3 text-[13px] font-extrabold text-[#0b1f3a]">
                      {{ gender: T("लिंग", "Gender"), age_group: T("आयु वर्ग", "Age group"), social_category: T("सामाजिक श्रेणी", "Social category"), religion: T("धर्म", "Religion") }[k]}{" "}
                      <span className="font-normal text-slate-500">(N={data.demographics[k].answered})</span>
                    </p>
                    {data.demographics[k].answered ? <Donut items={data.demographics[k].items} total={data.demographics[k].answered} centerLabel={T("उत्तर", "answers")} size={130} legend="side" /> : <Empty>{noData}</Empty>}
                  </div>
                ))}
              </div>
            </DetailDialog>
          </Card>
        )}
      </div>

      {/* Row 4: deep-analysis tiles (+ the open module) */}
      {Object.keys(deepPanels).length > 0 && (
        <div className="mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {deepPanels["issue-analysis"] && (
              <Tile
                id="issue-analysis"
                icon={<Target size={22} />}
                tone="orange"
                title={T("मुद्दा विश्लेषण (विस्तृत)", "Issue intelligence")}
                desc={T("हर मुद्दे का आयु, लिंग, सामाजिक श्रेणी और क्षेत्र के अनुसार विश्लेषण।", "Every issue by age, gender, social category and area.")}
                meta={extras.previews.issueTop ? T(`शीर्ष: ${extras.previews.issueTop.label} (${Math.round(extras.previews.issueTop.pct)}%)`, `Top: ${extras.previews.issueTop.label} (${Math.round(extras.previews.issueTop.pct)}%)`) : undefined}
                cta={T("देखें", "Open")}
              />
            )}
            {deepPanels.cross && (
              <Tile
                id="cross"
                icon={<Network size={22} />}
                tone="green"
                title={T("क्रॉस विश्लेषण", "Cross-analysis")}
                desc={T("किसी भी दो पहलुओं का गतिशील विश्लेषण (जैसे आयु × पार्टी, लिंग × मुद्दा)।", "Any two dimensions, dynamically (e.g. age × party, gender × issue).")}
                meta={T("8 आयाम · 9 तैयार संयोजन", "8 dimensions · 9 presets")}
                cta={T("देखें", "Open")}
              />
            )}
            {deepPanels.geo && (
              <Tile
                id="geo"
                icon={<MapIcon size={22} />}
                tone="sky"
                title={scope.level === "none" ? T("राज्यवार तुलना", "State comparison") : T("भौगोलिक तुलना", "Geographic comparison")}
                desc={
                  scope.level === "none"
                    ? T("राज्यों की तुलना विभिन्न मानकों पर।", "States compared on several measures.")
                    : scope.level === "constituency"
                      ? T("राज्य, जिला और विधानसभा स्तर की तुलना तथा दो क्षेत्रों की आमने-सामने तुलना।", "State vs district vs constituency, and any two areas side by side.")
                      : T("जिलों और विधानसभा क्षेत्रों की तुलना विभिन्न मानकों पर।", "Districts and constituencies compared on several measures.")
                }
                meta={extras.previews.geoUnits && unitName ? T(`${extras.previews.geoUnits} ${unitName} में प्रतिक्रियाएं`, `${extras.previews.geoUnits} ${unitName} with responses`) : undefined}
                cta={T("देखें", "Open")}
              />
            )}
            {deepPanels.time && (
              <Tile
                id="time"
                icon={<Clock size={22} />}
                tone="purple"
                title={T("समय एवं अवधि तुलना", "Time & period comparison")}
                desc={T("दो अलग-अलग समय अवधि के सर्वे प्रतिक्रियाओं की तुलना।", "Compare survey responses between two periods.")}
                meta={extras.previews.timeDays ? T(`${extras.previews.timeDays} दिनों का डेटा`, `${extras.previews.timeDays} days of data`) : undefined}
                cta={T("देखें", "Open")}
              />
            )}
          </div>
          <PanelSlot panels={deepPanels} closeLabel={closeLabel} />
        </div>
      )}

      {/* Row 5: data quality · ask the data · report download (+ open panel) */}
      <div className="mt-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)_minmax(0,1fr)]">
          {lowerPanels.quality && (
            <Tile
              id="quality"
              icon={<ShieldCheck size={22} />}
              tone="green"
              title={T("डेटा गुणवत्ता", "Data quality")}
              desc={T("प्रतिक्रिया गुणवत्ता, पूर्णता दर, भौगोलिक कवरेज और नमूना आकार का विश्लेषण।", "Response quality, completion rate, geographic coverage and sample size.")}
              meta={T(`पूर्णता दर ${Math.round(extras.quality.completionRate)}% · N=${extras.quality.total}`, `Completion ${Math.round(extras.quality.completionRate)}% · N=${extras.quality.total}`)}
              cta={T("देखें", "Open")}
            />
          )}
          {flags.askData && <AskCard hi={hi} />}
          {flags.detailedExport && <ReportCard hi={hi} query={query} disabled={!data.total} />}
        </div>
        <PanelSlot panels={lowerPanels} closeLabel={closeLabel} />
      </div>

      {/* Method note + link to the concise Result */}
      <div className={cn(CARD, "mt-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between")}>
        <Methodology hi={hi} data={data} className="max-w-4xl" />
        <Link href={scope.params.state === ALL_STATES_PARAM ? resultsPath() : resultsPath(scope.params)} className="shrink-0 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-semibold text-[#1677ff] hover:bg-slate-50">
          {T("संक्षिप्त परिणाम देखें →", "Concise results →")}
        </Link>
      </div>
    </DeepHubProvider>
  );
}

/** Small-sample state: the count only, never a share (N below MIN_GROUP_N). */
function SmallSample({ n, hi }: { n: number; hi: boolean }) {
  return (
    <div className="flex min-h-[116px] items-center gap-3.5 rounded-xl border border-dashed border-slate-200 bg-[#fbfcfe] px-3.5 py-3">
      <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full border-[6px] border-slate-100 bg-white" aria-hidden="true">
        <span className="text-lg font-black leading-none text-[#0b1f3a]">{n}</span>
      </span>
      <div className="min-w-0">
        <p className="text-[13.5px] font-extrabold leading-snug text-[#0b1f3a]">
          {hi ? `केवल ${n} ${n === 1 ? "प्रतिक्रिया उपलब्ध है" : "प्रतिक्रियाएं उपलब्ध हैं"}` : `Only ${n} ${n === 1 ? "response" : "responses"} available`}
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
          {hi ? "प्रतिशत दिखाने के लिए पर्याप्त प्रतिक्रियाएं उपलब्ध नहीं हैं।" : "Not enough responses to show percentages."}
        </p>
      </div>
    </div>
  );
}
