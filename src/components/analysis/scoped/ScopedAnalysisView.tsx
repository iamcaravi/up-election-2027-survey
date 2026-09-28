import Link from "next/link";
import type { ReactNode } from "react";
import {
  Award,
  BarChart3,
  Calendar,
  CheckCircle2,
  Download,
  Lightbulb,
  ListChecks,
  MapPinned,
  Smile,
  TrendingUp,
  UserCheck,
  Users,
  Vote,
} from "lucide-react";
import type { ResolvedScope, ScopeAnalysis, Finding } from "@/lib/scoped-survey";
import { MIN_GROUP_N } from "@/lib/scoped-survey";
import { analysisQuery } from "@/lib/analysis-params";
import { resultsPath } from "@/lib/routes";
import { cn, formatNumber } from "@/lib/utils";
import { ScopeHero } from "@/components/scope/ScopeHeader";
import { ScopeContent, ScopeNavProvider, ScopeSelectors } from "@/components/scope/ScopeNav";
import { ColumnBars, Donut, EmptyNote, HeatTable, IssueBars, LineTrend, PartyBars, StackedCrossTab, colorOf, round } from "@/components/scope/charts";
import { AnalysisFiltersRow, PanelTabs } from "./AnalysisControls";

// THE canonical public Analysis experience (State / District / Assembly).
// Answers "इन परिणामों को अलग-अलग तरीकों से समझने पर क्या पता चलता है?" —
// trends, demographics, cross-analysis, geography and comparisons, all
// computed from real responses of the selected scope. Descriptive only: no
// forecasts, no winners.

const SECTIONS = [
  { id: "overview", hi: "मुख्य अवलोकन", en: "Overview" },
  { id: "demographics", hi: "जनसांख्यिकीय विश्लेषण", en: "Demographics" },
  { id: "party", hi: "पार्टी समर्थन", en: "Party support" },
  { id: "mla", hi: "विधायक के कार्य", en: "MLA performance" },
  { id: "issues", hi: "मुख्य मुद्दे", en: "Main issues" },
  { id: "compare", hi: "तुलनात्मक विश्लेषण", en: "Comparison" },
] as const;

export function ScopedAnalysisView({
  scope,
  data,
  hi,
  printMode = false,
}: {
  scope: ResolvedScope;
  data: ScopeAnalysis | null;
  hi: boolean;
  printMode?: boolean;
}) {
  const year = scope.election?.year ?? 2027;
  const place = scope.constituency?.name ?? scope.district?.name ?? scope.state?.name ?? "";
  const hasData = !!data && data.total > 0;
  const filtered = !!data && (data.filters.segment !== "all" || data.filters.period !== "all");
  const noData = hi ? "इस विश्लेषण के लिए अभी पर्याप्त डेटा उपलब्ध नहीं है।" : "Not enough data for this analysis yet.";
  const notEnough = hi ? "इस विश्लेषण के लिए पर्याप्त प्रतिक्रियाएं उपलब्ध नहीं हैं।" : "Not enough responses for this analysis.";
  const tooFew = hi ? "प्रतिक्रियाएं पर्याप्त नहीं" : "Too few responses";
  const segLabel = data?.segmentOptions.find((o) => o.value === data.filters.segment)?.label;

  const controls =
    !printMode && (
      <div className="w-full shrink-0 rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-2xs sm:p-4 lg:w-[600px]">
        <ScopeSelectors
          key={JSON.stringify(scope.params)}
          hi={hi}
          basePath="/analysis"
          value={scope.params}
          options={scope.options}
          keep={data ? { segment: data.filters.segment, period: data.filters.period } : undefined}
        />
        {data && (
          <div className="mt-2.5">
            <AnalysisFiltersRow hi={hi} scope={scope.params} filters={data.filters} segmentOptions={data.segmentOptions} exportDisabled={!hasData} />
          </div>
        )}
      </div>
    );

  const body = (
    <div className={cn("min-h-screen bg-[#f4f7fb] pb-12 text-slate-800", printMode && "min-h-0 bg-white")}>
      <ScopeHero
        scope={scope}
        hi={hi}
        leaf={hi ? "विश्लेषण" : "Analysis"}
        titleFallback={hi ? "विस्तृत विश्लेषण" : "Detailed Analysis"}
        subtitle={hi ? `विधानसभा चुनाव सर्वेक्षण ${year} — विस्तृत विश्लेषण` : `Assembly Election Survey ${year} — Detailed Analysis`}
        description={
          scope.level === "none"
            ? hi
              ? "राज्य, जिला या विधानसभा क्षेत्र चुनकर सर्वेक्षण परिणामों का विस्तृत विश्लेषण देखें — अलग-अलग समूहों की राय, मुद्दे, रुझान और तुलना।"
              : "Choose a state, district or constituency for a detailed analysis — group-wise opinion, issues, trends and comparisons."
            : hi
              ? `यहाँ ${place} के सर्वेक्षण परिणामों का विस्तृत विश्लेषण है — अलग-अलग समूहों की राय, प्रमुख मुद्दे, विधायक के कार्यों पर राय और पार्टी समर्थन के अनुसार विस्तृत आंकड़े।`
              : `A detailed analysis of ${place}'s survey results — group-wise opinion, key issues, MLA opinion and party support.`
        }
        aside={controls || undefined}
        below={
          data ? (
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 lg:grid-cols-4">
              <Kpi icon={<Users size={20} />} tone="bg-violet-100 text-violet-600" value={formatNumber(data.total)} label={hi ? "कुल प्रतिक्रियाएं" : "Total responses"} sub={filtered ? (hi ? "चुने गए फ़िल्टर में" : "In selected filter") : hi ? "अब तक प्राप्त" : "So far"} />
              <Kpi icon={<Calendar size={20} />} tone="bg-orange-100 text-orange-500" value={formatNumber(data.today)} label={hi ? "आज की प्रतिक्रियाएं" : "Today's responses"} sub={hi ? "आज प्राप्त" : "Received today"} />
              <Kpi
                icon={<TrendingUp size={20} />}
                tone="bg-emerald-100 text-emerald-600"
                value={data.surveyActive ? (hi ? "सक्रिय" : "Active") : hi ? "बंद" : "Closed"}
                valueClass={data.surveyActive ? "text-emerald-600" : "text-slate-500"}
                label={hi ? "सर्वेक्षण स्थिति" : "Survey status"}
                sub={data.surveyActive ? (hi ? "मत देना जारी है" : "Voting open") : hi ? "सर्वे बंद है" : "Survey closed"}
              />
              {scope.level === "constituency" ? (
                <Kpi icon={<Vote size={20} />} tone="bg-blue-100 text-blue-600" value={formatNumber(data.last7Days)} label={hi ? "पिछले 7 दिन" : "Last 7 days"} sub={hi ? "पिछले 7 दिनों की प्रतिक्रियाएं" : "Responses in the last 7 days"} />
              ) : (
                <Kpi
                  icon={<MapPinned size={20} />}
                  tone="bg-blue-100 text-blue-600"
                  value={`${formatNumber(data.respondingConstituencies)}/${formatNumber(data.constituenciesInScope)}`}
                  label={hi ? "सर्वे में शामिल क्षेत्र" : "Areas with responses"}
                  sub={hi ? "प्रतिक्रिया वाले विधानसभा क्षेत्र" : "Constituencies with responses"}
                />
              )}
            </div>
          ) : undefined
        }
      />

      <div className="mx-auto mt-5 max-w-7xl px-4 sm:px-6 lg:px-8">
        {!printMode && hasData && (
          <nav aria-label={hi ? "विश्लेषण अनुभाग" : "Analysis sections"} className="mb-5 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <ul className="flex min-w-max gap-2 rounded-2xl border border-slate-200/80 bg-white p-1.5 shadow-2xs sm:min-w-0 sm:justify-between">
              {SECTIONS.map((s, i) => (
                <li key={s.id} className="sm:flex-1">
                  <a
                    href={`#${s.id}`}
                    className={cn(
                      "block whitespace-nowrap rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40",
                      i === 0 ? "bg-[#1677ff] text-white" : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    {hi ? s.hi : s.en}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <ScopeContent hi={hi}>
          {scope.level === "none" ? (
            <Notice text={hi ? "विश्लेषण देखने के लिए राज्य चुनें।" : "Select a state to view the analysis."} />
          ) : !hasData ? (
            <Notice
              text={
                filtered
                  ? hi
                    ? "चुने गए फ़िल्टर के लिए कोई प्रतिक्रिया उपलब्ध नहीं है।"
                    : "No responses match the selected filters."
                  : hi
                    ? "इस क्षेत्र के लिए अभी पर्याप्त सर्वेक्षण डेटा उपलब्ध नहीं है।"
                    : "Not enough survey data is available for this area yet."
              }
            />
          ) : (
            <div className="flex flex-col gap-5">
              {filtered && (
                <p className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm text-blue-900">
                  {hi ? "फ़िल्टर लागू: " : "Filter applied: "}
                  {[data!.filters.segment !== "all" ? segLabel : null, data!.filters.period === "7d" ? (hi ? "पिछले 7 दिन" : "Last 7 days") : data!.filters.period === "30d" ? (hi ? "पिछले 30 दिन" : "Last 30 days") : null]
                    .filter(Boolean)
                    .join(" · ")}{" "}
                  — N={formatNumber(data!.total)}
                </p>
              )}

              {/* Overview: findings + response trend */}
              <div id="overview" className="grid scroll-mt-24 grid-cols-1 gap-5 lg:grid-cols-2">
                <Section title={hi ? "मुख्य निष्कर्ष" : "Key findings"} sub={hi ? "उपलब्ध आंकड़ों के अनुसार" : "From the available data"}>
                  {data!.findings.length ? <Findings items={data!.findings} /> : <EmptyNote>{noData}</EmptyNote>}
                </Section>
                <Section
                  title={hi ? "प्रतिक्रियाओं का समयानुसार रुझान" : "Responses over time"}
                  sub={
                    data!.trend
                      ? hi
                        ? `${data!.trend.granularity === "day" ? "दैनिक" : data!.trend.granularity === "week" ? "साप्ताहिक" : "मासिक"} प्रतिक्रियाएं`
                        : `${data!.trend.granularity === "day" ? "Daily" : data!.trend.granularity === "week" ? "Weekly" : "Monthly"} responses`
                      : undefined
                  }
                >
                  {data!.trend ? <LineTrend points={data!.trend.points} hi={hi} /> : <EmptyNote>{noData}</EmptyNote>}
                </Section>
              </div>

              {/* Party + MLA */}
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <Section
                  id="party"
                  title={hi ? "पार्टी-वार समर्थन" : "Party-wise support"}
                  sub={hi ? "सर्वे में किस पार्टी को कितने उत्तरदाताओं का समर्थन मिला?" : "How many respondents chose each party?"}
                  foot={hi ? `आधार: ${formatNumber(data!.party.answered)} उत्तरदाता` : `Base: ${formatNumber(data!.party.answered)} respondents`}
                >
                  {data!.party.answered ? (
                    <div className="grid grid-cols-1 items-center gap-5 sm:grid-cols-[minmax(0,1fr)_auto]">
                      <PartyBars dist={data!.party} compact />
                      <Donut items={data!.party.items} total={data!.party.answered} centerLabel={hi ? "कुल उत्तर" : "answers"} size={150} legend="none" />
                    </div>
                  ) : (
                    <EmptyNote>{noData}</EmptyNote>
                  )}
                </Section>
                <Section
                  id="mla"
                  title={scope.level === "constituency" ? (hi ? "वर्तमान विधायक के कार्यों पर राय" : "Opinion on the current MLA") : hi ? "वर्तमान विधायकों के कार्यों पर राय" : "Opinion on current MLAs"}
                  sub={
                    scope.level === "constituency" && scope.constituency?.currentMlaName
                      ? `${hi ? "विधायक" : "MLA"}: ${scope.constituency.currentMlaName}`
                      : hi
                        ? "उत्तरदाताओं की अपने क्षेत्र के विधायक पर राय"
                        : "Respondents' opinion of their own MLA"
                  }
                  foot={hi ? `आधार: ${formatNumber(data!.mla.answered)} उत्तर` : `Base: ${formatNumber(data!.mla.answered)} answers`}
                >
                  {data!.mla.answered ? <Donut items={data!.mla.items} total={data!.mla.answered} centerLabel={hi ? "कुल उत्तर" : "answers"} legend="side" /> : <EmptyNote>{noData}</EmptyNote>}
                </Section>
              </div>

              {/* Issues + categories */}
              <div id="issues" className="grid scroll-mt-24 grid-cols-1 gap-5 lg:grid-cols-2">
                <Section
                  title={hi ? "मुख्य मुद्दे (बहुविकल्पीय)" : "Main issues (multi-select)"}
                  sub={hi ? `${place} के उत्तरदाताओं के लिए सबसे महत्वपूर्ण मुद्दे` : `Most important issues for respondents in ${place}`}
                  foot={
                    hi
                      ? `प्रतिशत उत्तरदाताओं के आधार पर (आधार: ${formatNumber(data!.issues.answered)}); एक से अधिक विकल्प चुने जा सकते हैं, इसलिए कुल 100% से अधिक हो सकता है।`
                      : `Share of respondents (base ${formatNumber(data!.issues.answered)}); multiple choices allowed, so totals can exceed 100%.`
                  }
                >
                  {data!.issues.answered ? <IssueBars dist={data!.issues} /> : <EmptyNote>{noData}</EmptyNote>}
                </Section>
                <Section
                  title={hi ? "मुद्दों का वर्गीकरण" : "Issue categories"}
                  sub={hi ? "मुद्दों को श्रेणियों में समूहित किया गया (किसी भी श्रेणी का मुद्दा चुनने वाले उत्तरदाता)" : "Issues grouped into categories (respondents selecting any issue in a category)"}
                  foot={hi ? `आधार: ${formatNumber(data!.issueCategoryAnswered)} उत्तरदाता` : `Base: ${formatNumber(data!.issueCategoryAnswered)} respondents`}
                >
                  {data!.issueCategories?.length ? <ColumnBars items={data!.issueCategories} /> : <EmptyNote>{noData}</EmptyNote>}
                </Section>
              </div>

              {/* Demographics + cross-analysis */}
              <div id="demographics" className="grid scroll-mt-24 grid-cols-1 gap-5 lg:grid-cols-2">
                <Section title={hi ? "उत्तरदाताओं की प्रोफ़ाइल (वैकल्पिक)" : "Respondent profile (optional)"} sub={hi ? "जिन्होंने जानकारी दी, उनके आधार पर" : "Based on those who shared the information"}>
                  <PanelTabs
                    printMode={printMode}
                    tabs={(["gender", "age_group", "social_category", "religion"] as const)
                      .filter((k) => data!.demographics[k].answered > 0)
                      .map((k) => ({
                        key: k,
                        label: { gender: hi ? "लिंग" : "Gender", age_group: hi ? "आयु वर्ग" : "Age", social_category: hi ? "सामाजिक श्रेणी" : "Social category", religion: hi ? "धर्म" : "Religion" }[k],
                        content: (
                          <div>
                            <Donut items={data!.demographics[k].items} total={data!.demographics[k].answered} centerLabel={hi ? "उत्तर" : "answers"} size={140} legend="side" />
                            <p className="mt-3 text-[11px] text-slate-500">
                              {hi ? `आधार: ${data!.demographics[k].answered} उत्तरदाता जिन्होंने यह जानकारी दी` : `Base: ${data!.demographics[k].answered} respondents who answered`}
                            </p>
                          </div>
                        ),
                      }))}
                  />
                  {DEMO_EMPTY(data!) && <EmptyNote>{noData}</EmptyNote>}
                </Section>
                <Section title={hi ? "क्रॉस विश्लेषण" : "Cross-analysis"} sub={hi ? `समूहों के अनुसार वितरण; न्यूनतम ${MIN_GROUP_N} प्रतिक्रियाओं वाले समूह ही दिखाए गए` : `Distribution by group; only groups with at least ${MIN_GROUP_N} responses are drawn`}>
                  <PanelTabs
                    printMode={printMode}
                    tabs={[
                      { key: "age-party", label: hi ? "आयु वर्ग × पार्टी समर्थन" : "Age × Party", tab: data!.crossAgeParty, kind: "stack" as const },
                      { key: "gender-party", label: hi ? "लिंग × पार्टी समर्थन" : "Gender × Party", tab: data!.crossGenderParty, kind: "stack" as const },
                      { key: "category-party", label: hi ? "श्रेणी × पार्टी समर्थन" : "Category × Party", tab: data!.crossCategoryParty, kind: "stack" as const },
                      { key: "age-issue", label: hi ? "आयु वर्ग × मुख्य मुद्दे" : "Age × Issues", tab: data!.crossAgeIssue, kind: "heat" as const },
                      { key: "gender-issue", label: hi ? "लिंग × मुख्य मुद्दे" : "Gender × Issues", tab: data!.crossGenderIssue, kind: "heat" as const },
                      { key: "party-mla", label: hi ? "पार्टी × विधायक पर राय" : "Party × MLA opinion", tab: data!.crossPartyMla, kind: "stack" as const },
                    ].map((t) => ({
                      key: t.key,
                      label: t.label,
                      content: !t.tab.meaningful ? (
                        <EmptyNote>{notEnough}</EmptyNote>
                      ) : t.kind === "heat" ? (
                        <HeatTable tab={t.tab} hi={hi} insufficientLabel={tooFew} />
                      ) : (
                        <StackedCrossTab tab={t.tab} hi={hi} insufficientLabel={tooFew} />
                      ),
                    }))}
                  />
                  <p className="mt-3 text-[11px] text-slate-500">
                    {hi ? "यह केवल वर्णनात्मक है; इससे कारण-परिणाम का निष्कर्ष नहीं निकाला जाना चाहिए।" : "Descriptive only; does not imply cause and effect."}
                  </p>
                </Section>
              </div>

              {/* Comparison: geography + levels */}
              <div id="compare" className="grid scroll-mt-24 grid-cols-1 gap-5 lg:grid-cols-3">
                <Section
                  className="lg:col-span-2"
                  title={hi ? "भौगोलिक तुलना" : "Geographic comparison"}
                  sub={
                    data!.geo
                      ? hi
                        ? `${data!.geo.unit === "district" ? "जिलों" : "विधानसभा क्षेत्रों"} के अनुसार — ${data!.geo.rows.length}/${data!.geo.totalUnits} में प्रतिक्रियाएं`
                        : `By ${data!.geo.unit === "district" ? "district" : "constituency"} — ${data!.geo.rows.length}/${data!.geo.totalUnits} with responses`
                      : undefined
                  }
                >
                  {data!.geo ? <GeoTable geo={data!.geo} hi={hi} /> : data!.comparison.length ? <LevelCompare levels={data!.comparison} hi={hi} /> : <EmptyNote>{noData}</EmptyNote>}
                </Section>
                <Section title={hi ? "प्रमुख अंतर्दृष्टि" : "Key insights"} sub={hi ? "केवल उपलब्ध आंकड़ों पर आधारित, वर्णनात्मक" : "Descriptive, from available data only"}>
                  {data!.insights.length ? (
                    <ul className="flex flex-col gap-3">
                      {data!.insights.map((t, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-700">
                          <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" aria-hidden="true" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyNote>{noData}</EmptyNote>
                  )}
                </Section>
              </div>

              {data!.geo && data!.comparison.length > 0 && (
                <Section title={hi ? "राज्य बनाम जिला बनाम विधानसभा" : "State vs District vs Assembly"} sub={hi ? "प्रत्येक स्तर का नमूना आकार (N) दिखाया गया है" : "Sample size (N) shown for each level"}>
                  <LevelCompare levels={data!.comparison} hi={hi} />
                </Section>
              )}

              {/* Quality + issue trend + export */}
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                <Section title={hi ? "प्रतिक्रिया गुणवत्ता" : "Response quality"} sub={hi ? "प्रत्येक प्रश्न का उत्तर देने वाले उत्तरदाता" : "Respondents answering each question"}>
                  <ul className="flex flex-col gap-2">
                    {data!.quality.map((q) => (
                      <li key={q.key} className="grid grid-cols-[110px_minmax(0,1fr)_44px] items-center gap-2 text-xs">
                        <span className="truncate font-semibold text-slate-700">{q.label}</span>
                        <span className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                          <span className="block h-full rounded-full bg-[#1677ff]" style={{ width: `${q.pct}%` }} />
                        </span>
                        <span className="text-right font-bold text-slate-900">{round(q.pct)}%</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-[11px] text-slate-500">
                    {hi
                      ? `पूर्ण प्रोफ़ाइल (चारों जनसांख्यिकीय प्रश्न): ${data!.profileComplete.count} (${round(data!.profileComplete.pct)}%)`
                      : `Complete profile (all four demographic questions): ${data!.profileComplete.count} (${round(data!.profileComplete.pct)}%)`}
                  </p>
                </Section>
                <Section title={hi ? "समय के साथ मुद्दों का रुझान" : "Issue trend over time"} sub={hi ? `प्रति अवधि उत्तरदाताओं का प्रतिशत (न्यूनतम ${MIN_GROUP_N} प्रति अवधि)` : `Share of respondents per period (min ${MIN_GROUP_N} each)`}>
                  {data!.issueTrend ? <IssueTrendTable trend={data!.issueTrend} hi={hi} /> : <EmptyNote>{noData}</EmptyNote>}
                </Section>
                {!printMode ? (
                  <section className="flex flex-col justify-between rounded-2xl border border-orange-200/80 bg-gradient-to-br from-[#fff7ed] to-[#fffaf5] p-5 shadow-2xs">
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600" aria-hidden="true">
                        <Download size={20} />
                      </span>
                      <div>
                        <h2 className="text-lg font-black text-slate-900">{hi ? "डेटा डाउनलोड करें" : "Download data"}</h2>
                        <p className="mt-1 text-xs text-slate-600">
                          {hi ? `इस क्षेत्र (${place}) के सभी आंकड़े Excel या PDF में डाउनलोड करें।` : `Download all figures for ${place} as Excel or PDF.`}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-col gap-2">
                      <a
                        href={`/api/analysis/export${analysisQuery(scope.params, data!.filters)}`}
                        download
                        className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
                      >
                        {hi ? "Excel डाउनलोड करें (.xlsx)" : "Download Excel (.xlsx)"}
                      </a>
                      <a
                        href={`/analysis/report${analysisQuery(scope.params, data!.filters)}`}
                        target="_blank"
                        rel="noopener"
                        className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
                      >
                        {hi ? "PDF डाउनलोड करें (.pdf)" : "Download PDF (.pdf)"}
                      </a>
                    </div>
                  </section>
                ) : (
                  <Methodology hi={hi} data={data!} />
                )}
              </div>

              {!printMode && (
                <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs sm:flex-row sm:items-center">
                  <p className="text-sm text-slate-600">{hi ? "संक्षिप्त परिणाम देखना चाहते हैं?" : "Want the concise results?"}</p>
                  <Link href={resultsPath(scope.params)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-[#1677ff] hover:bg-slate-50">
                    {hi ? "परिणाम पर वापस जाएं →" : "Back to results →"}
                  </Link>
                </div>
              )}
              {printMode ? null : <Methodology hi={hi} data={data!} />}
            </div>
          )}
        </ScopeContent>
      </div>
    </div>
  );

  return printMode ? body : <ScopeNavProvider>{body}</ScopeNavProvider>;
}

function DEMO_EMPTY(d: ScopeAnalysis) {
  return (["gender", "age_group", "social_category", "religion"] as const).every((k) => d.demographics[k].answered === 0);
}

function Kpi({ icon, tone, value, label, sub, valueClass }: { icon: ReactNode; tone: string; value: string; label: string; sub: string; valueClass?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-2xs sm:p-4">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-12 sm:w-12 ${tone}`} aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0">
        <div className={`text-xl font-black leading-tight text-slate-900 sm:text-2xl ${valueClass ?? ""}`}>{value}</div>
        <div className="text-xs font-bold leading-tight text-slate-700 sm:text-[13px]">{label}</div>
        <div className="mt-0.5 truncate text-[10.5px] text-slate-500">{sub}</div>
      </div>
    </div>
  );
}

function Section({ id, title, sub, foot, className, children }: { id?: string; title: string; sub?: string; foot?: string; className?: string; children: ReactNode }) {
  return (
    <section id={id} className={cn("scroll-mt-24 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs sm:p-5", className)}>
      <div className="mb-4 flex items-start gap-2.5">
        <span className="mt-1 h-5 w-1.5 shrink-0 rounded-full bg-[#1677ff]" aria-hidden="true" />
        <div className="min-w-0">
          <h2 className="text-lg font-black leading-tight tracking-tight text-slate-900">{title}</h2>
          {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
        </div>
      </div>
      {children}
      {foot && <p className="mt-4 border-t border-slate-100 pt-3 text-[11px] text-slate-500">{foot}</p>}
    </section>
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

function Findings({ items }: { items: Finding[] }) {
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((f, i) => {
        const { Icon, tone } = FINDING_ICON[f.icon];
        return (
          <li key={i} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone}`} aria-hidden="true">
              <Icon size={18} />
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

function GeoTable({ geo, hi }: { geo: NonNullable<ScopeAnalysis["geo"]>; hi: boolean }) {
  const max = Math.max(1, ...geo.rows.map((r) => r.n));
  return (
    <div className="max-h-[420px] overflow-auto">
      <table className="w-full min-w-[520px] text-left text-xs">
        <thead className="sticky top-0 bg-white">
          <tr className="border-b border-slate-100 text-slate-500">
            <th className="py-2 pr-2 font-semibold">{geo.unit === "district" ? (hi ? "जिला" : "District") : hi ? "विधानसभा क्षेत्र" : "Constituency"}</th>
            <th className="py-2 pr-2 font-semibold">{hi ? "प्रतिक्रियाएं (N)" : "Responses (N)"}</th>
            <th className="py-2 pr-2 font-semibold">{hi ? "सर्वे में सर्वाधिक समर्थन" : "Highest survey support"}</th>
            <th className="py-2 pr-2 font-semibold">{hi ? "शीर्ष मुद्दा" : "Top issue"}</th>
            <th className="py-2 font-semibold">{hi ? "विधायक से संतुष्ट*" : "Satisfied with MLA*"}</th>
          </tr>
        </thead>
        <tbody>
          {geo.rows.map((r) => (
            <tr key={r.key} className="border-b border-slate-50">
              <th scope="row" className="py-2 pr-2 font-semibold text-slate-800">{r.label}</th>
              <td className="py-2 pr-2">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-16 overflow-hidden rounded-full bg-slate-100">
                    <span className="block h-full rounded-full bg-[#1677ff]" style={{ width: `${(r.n / max) * 100}%` }} />
                  </span>
                  <span className="font-bold text-slate-900">{r.n}</span>
                </span>
              </td>
              <td className="py-2 pr-2 text-slate-700">{r.topParty ? `${r.topParty.label} (${round(r.topParty.pct)}%)` : "—"}</td>
              <td className="py-2 pr-2 text-slate-700">{r.topIssue ? `${r.topIssue.label} (${round(r.topIssue.pct)}%)` : "—"}</td>
              <td className="py-2 text-slate-700">{r.satisfiedPct === null ? "—" : `${round(r.satisfiedPct)}%`}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-[11px] text-slate-500">
        {hi
          ? "*“बहुत खुश” + “कुछ हद तक खुश”। छोटे N वाले क्षेत्रों के आंकड़े सावधानी से पढ़ें।"
          : "*“Very happy” + “Somewhat happy”. Read small-N areas with caution."}
      </p>
    </div>
  );
}

function LevelCompare({ levels, hi }: { levels: ScopeAnalysis["comparison"]; hi: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {levels.map((l) => (
        <div key={l.level} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
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
                <span className="text-right font-bold text-slate-900">{round(p.pct)}%</span>
              </li>
            ))}
          </ul>
          {l.topIssues.length > 0 && (
            <p className="mt-2 text-[11px] text-slate-600">
              {hi ? "शीर्ष मुद्दे: " : "Top issues: "}
              {l.topIssues.map((i) => `${i.label} ${round(i.pct)}%`).join(", ")}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function IssueTrendTable({ trend, hi }: { trend: NonNullable<ScopeAnalysis["issueTrend"]>; hi: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[300px] text-xs">
        <thead>
          <tr className="text-slate-500">
            <th className="py-1.5 text-left font-semibold">{hi ? "मुद्दा" : "Issue"}</th>
            {trend.buckets.map((b) => (
              <th key={b} className="px-1 py-1.5 text-right font-semibold">
                {b}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {trend.series.map((s) => (
            <tr key={s.key} className="border-t border-slate-50">
              <th scope="row" className="py-1.5 text-left font-semibold text-slate-700">
                <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} aria-hidden="true" />
                {s.label}
              </th>
              {s.values.map((v, i) => (
                <td key={i} className="px-1 py-1.5 text-right font-bold text-slate-900">
                  {v === null ? "—" : `${round(v)}%`}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Methodology({ hi, data }: { hi: boolean; data: ScopeAnalysis }) {
  const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(hi ? "hi-IN" : "en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "—");
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 text-xs leading-relaxed text-slate-600 shadow-2xs sm:p-5">
      <p className="mb-1 flex items-center gap-2 text-sm font-bold text-slate-800">
        <Lightbulb size={16} className="text-amber-500" aria-hidden="true" />
        {hi ? "पद्धति और स्रोत" : "Method & source"}
      </p>
      <p>
        {hi
          ? `यह votersurvey.in पर उपयोगकर्ताओं द्वारा स्वेच्छा से भेजी गई मान्य (VALID) प्रतिक्रियाओं पर आधारित है; यह कोई आधिकारिक चुनाव परिणाम या पूर्वानुमान नहीं है। सर्वे अवधि: ${fmt(data.firstResponseAt)} – ${fmt(data.lastResponseAt)}। प्रत्येक प्रश्न का प्रतिशत उसी प्रश्न का उत्तर देने वाले उत्तरदाताओं के आधार पर है।`
          : `Based on valid responses voluntarily submitted on votersurvey.in; not an official election result or forecast. Survey period: ${fmt(data.firstResponseAt)} – ${fmt(data.lastResponseAt)}. Each percentage uses respondents who answered that question as the base.`}
        {data.isSynthetic ? (hi ? " (डेमो डेटा मोड सक्रिय)" : " (Demo data mode active)") : ""}
      </p>
    </section>
  );
}

function Notice({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <p className="text-base font-semibold text-slate-700">{text}</p>
    </div>
  );
}

