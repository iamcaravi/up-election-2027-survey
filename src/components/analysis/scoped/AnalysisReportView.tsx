import type { ReactNode } from "react";
import type { ResolvedScope, ScopeAnalysis } from "@/lib/scoped-survey";
import { MIN_GROUP_N } from "@/lib/scoped-survey";
import { formatIstDate, mlaStance, reportableFindings, type AnalysisExtras, type staticModules } from "@/lib/analysis-engine";
import { REPORT_MODULE_LABELS, type ReportModule } from "@/lib/analysis-params";
import { DIMENSION_LABELS, AREA_UNIT_LABELS } from "@/lib/analysis-dimensions";
import { formatNumber } from "@/lib/utils";
import { ColumnBars, Donut, HeatTable, IssueBars, PartyBars, StackedCrossTab } from "@/components/scope/charts";
import { CompareTable, ShareRows, TimeTable, TrendLine } from "./dashboard/charts";
import { FactsGrid, FindingCards, GeoTable, InsightList, LevelCompare, Methodology, QualityDetails } from "./dashboard/blocks";

// Printable custom report: the same data as the Analysis page, every module
// expanded, limited to the modules the user picked (and to those with data).
// The browser's print dialog saves it as a PDF (correct Devanagari shaping).

type Static = ReturnType<typeof staticModules>;

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="break-inside-avoid rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="mb-4 text-lg font-black text-[#0b1f3a]">
        {n}. {title}
      </h2>
      {children}
    </section>
  );
}

function Sub({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="break-inside-avoid">
      <p className="mb-2 text-[13px] font-extrabold text-[#0b1f3a]">{title}</p>
      {children}
    </div>
  );
}

export function AnalysisReportView({
  scope,
  data,
  extras,
  extra,
  modules,
  hi,
}: {
  scope: ResolvedScope;
  data: ScopeAnalysis | null;
  extras: AnalysisExtras | null;
  extra: Static | null;
  modules: ReportModule[];
  hi: boolean;
}) {
  const T = (h: string, e: string) => (hi ? h : e);
  const L = (m: ReportModule) => (hi ? REPORT_MODULE_LABELS[m].hi : REPORT_MODULE_LABELS[m].en);
  const place = scope.constituency?.name ?? scope.district?.name ?? scope.state?.name ?? T("सभी राज्य", "All states");
  const loc = hi ? "hi" : "en";

  if (!data || !extras || data.total === 0)
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 text-center text-slate-600">
        <h1 className="text-2xl font-black text-[#0b1f3a]">{T("विश्लेषण रिपोर्ट", "Analysis report")} — {place}</h1>
        <p className="mt-3">{T("इस चयन के लिए अभी पर्याप्त सर्वेक्षण डेटा उपलब्ध नहीं है।", "Not enough survey data is available for this selection yet.")}</p>
      </div>
    );

  const tooFew = T("प्रतिक्रियाएं कम", "Too few");
  const periodText =
    data.filters.period === "7d"
      ? T("पिछले 7 दिन", "Last 7 days")
      : data.filters.period === "30d"
        ? T("पिछले 30 दिन", "Last 30 days")
        : data.filters.period === "custom" && data.filters.from && data.filters.to
          ? `${formatIstDate(data.filters.from, loc, false)} – ${formatIstDate(data.filters.to, loc)}`
          : T("सभी समय", "All time");
  const stance = mlaStance(data.mla);
  const sections: { key: ReportModule; node: ReactNode }[] = [];
  const has = (m: ReportModule) => modules.includes(m);

  if (has("scope"))
    sections.push({
      key: "scope",
      node: (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
          {[
            [T("राज्य", "State"), scope.state?.name ?? T("सभी राज्य (समग्र)", "All states (combined)")],
            [T("जिला", "District"), scope.district?.name ?? T("सभी जिले", "All districts")],
            [T("विधानसभा क्षेत्र", "Constituency"), scope.constituency ? `${scope.constituency.name} (${scope.constituency.number})` : T("सभी विधानसभा क्षेत्र", "All constituencies")],
            [T("उत्तरदाता समूह", "Respondent group"), data.segmentOptions.find((o) => o.value === data.filters.segment)?.label ?? T("सभी उत्तरदाता", "All respondents")],
            [T("अवधि", "Period"), periodText],
            ...(extras.mla ? [[T("वर्तमान विधायक", "Current MLA"), `${extras.mla.name}${extras.mla.party ? ` — ${extras.mla.party}` : ""}`]] : []),
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-[11px] font-semibold text-slate-500">{k}</dt>
              <dd className="font-bold text-[#0b1f3a]">{v}</dd>
            </div>
          ))}
        </dl>
      ),
    });

  if (has("summary"))
    sections.push({
      key: "summary",
      node: (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
            {[
              [T("कुल प्रतिक्रियाएं", "Total responses"), formatNumber(extras.kpis.total)],
              [T("पूर्ण प्रतिक्रियाएं", "Complete"), `${formatNumber(extras.kpis.complete)} (${Math.round(extras.kpis.completionRate)}%)`],
              [T("सर्वे अवधि", "Survey period"), extras.kpis.firstResponseAt ? `${formatIstDate(extras.kpis.firstResponseAt, loc, false)} – ${formatIstDate(extras.kpis.lastResponseAt!, loc)}` : "—"],
              [extras.kpis.coverage.label, `${extras.kpis.coverage.covered}/${extras.kpis.coverage.total}`],
              [extras.kpis.areas.label, `${extras.kpis.areas.covered}/${extras.kpis.areas.total}`],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <p className="text-[11px] font-semibold text-slate-500">{k}</p>
                <p className="text-sm font-black text-[#0b1f3a]">{v}</p>
              </div>
            ))}
          </div>
          <p className="text-sm leading-relaxed text-slate-700">{extras.profile.summary.join(" ")}</p>
          <FactsGrid profile={extras.profile} />
          {data.trend && (
            <Sub title={T("प्रतिक्रियाओं का समयानुसार रुझान", "Responses over time")}>
              <TrendLine points={data.trend.points} hi={hi} width={720} height={200} />
            </Sub>
          )}
        </div>
      ),
    });

  if (has("party") && data.party.answered)
    sections.push({
      key: "party",
      node: (
        <div className="grid grid-cols-1 items-center gap-5 sm:grid-cols-[minmax(0,1fr)_auto]">
          <PartyBars dist={data.party} />
          <Donut items={data.party.items} total={data.party.answered} centerLabel={T("कुल उत्तर", "answers")} size={150} legend="none" />
          <p className="text-[11px] text-slate-500 sm:col-span-2">{T(`आधार: ${data.party.answered} उत्तरदाता। यह केवल सर्वे में उत्तरदाताओं की पसंद है, चुनाव परिणाम का अनुमान नहीं।`, `Base: ${data.party.answered} respondents. Survey choice only, not an election forecast.`)}</p>
        </div>
      ),
    });

  if (has("mla") && data.mla.answered && data.mla.answered < MIN_GROUP_N)
    sections.push({
      key: "mla",
      node: (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-slate-700">
            {T(
              `केवल ${data.mla.answered} ${data.mla.answered === 1 ? "प्रतिक्रिया उपलब्ध है" : "प्रतिक्रियाएं उपलब्ध हैं"} — प्रतिशत दिखाने के लिए पर्याप्त प्रतिक्रियाएं उपलब्ध नहीं हैं।`,
              `Only ${data.mla.answered} ${data.mla.answered === 1 ? "response" : "responses"} available — not enough to show percentages.`
            )}
          </p>
          <ul className="flex flex-col gap-1 text-sm">
            {data.mla.items.map((i) => (
              <li key={i.key} className="flex justify-between gap-3 border-b border-slate-100 py-1">
                <span className="text-slate-700">{i.label}</span>
                <span className="font-bold text-[#0b1f3a]">{i.count}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
    });
  else if (has("mla") && data.mla.answered)
    sections.push({
      key: "mla",
      node: (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-700">
            {T(
              `सकारात्मक ${Math.round(stance.pos)}% · नकारात्मक ${Math.round(stance.neg)}% · तटस्थ ${Math.round(stance.neu)}% (N=${stance.answered})`,
              `Positive ${Math.round(stance.pos)}% · negative ${Math.round(stance.neg)}% · neutral ${Math.round(stance.neu)}% (N=${stance.answered})`
            )}
          </p>
          <Donut items={data.mla.items} total={data.mla.answered} centerLabel={T("कुल उत्तर", "answers")} legend="side" size={140} />
        </div>
      ),
    });

  if (has("issues") && data.issues.answered)
    sections.push({
      key: "issues",
      node: (
        <div className="flex flex-col gap-5">
          <IssueBars dist={data.issues} />
          <p className="text-[11px] text-slate-500">{T(`आधार: ${data.issues.answered} उत्तरदाता; बहुविकल्पीय, इसलिए कुल 100% से अधिक हो सकता है।`, `Base: ${data.issues.answered}; multi-select, totals can exceed 100%.`)}</p>
          {data.issueCategories?.length ? (
            <Sub title={T("मुद्दों का वर्गीकरण", "Issue categories")}>
              <ColumnBars items={data.issueCategories} />
            </Sub>
          ) : null}
          {extra?.issues.map((d) => (
            <Sub key={d.issue.key} title={T(`${d.issue.label} — विस्तृत (${Math.round(d.overall.pct)}%, ${d.overall.count}/${d.overall.answered})`, `${d.issue.label} — detail (${Math.round(d.overall.pct)}%, ${d.overall.count}/${d.overall.answered})`)}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {d.breakdowns.map((b) => (
                  <div key={b.dim} className="rounded-xl border border-slate-100 p-3">
                    <p className="mb-2 text-xs font-bold text-slate-700">{b.dim === "area" && b.unit ? T(AREA_UNIT_LABELS[b.unit].hi, AREA_UNIT_LABELS[b.unit].en) : T(DIMENSION_LABELS[b.dim].hi, DIMENSION_LABELS[b.dim].en)}</p>
                    <ShareRows rows={b.rows} hi={hi} limit={10} />
                  </div>
                ))}
              </div>
            </Sub>
          ))}
        </div>
      ),
    });

  if (has("demographics"))
    sections.push({
      key: "demographics",
      node: (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(["gender", "age_group", "social_category", "religion"] as const)
            .filter((k) => data.demographics[k].answered)
            .map((k) => (
              <Sub key={k} title={`${T(DIMENSION_LABELS[k].hi, DIMENSION_LABELS[k].en)} (N=${data.demographics[k].answered})`}>
                <Donut items={data.demographics[k].items} total={data.demographics[k].answered} centerLabel={T("उत्तर", "answers")} size={120} legend="side" />
              </Sub>
            ))}
        </div>
      ),
    });

  if (has("cross"))
    sections.push({
      key: "cross",
      node: (
        <div className="flex flex-col gap-5">
          {[
            { t: T("आयु वर्ग × पार्टी समर्थन", "Age × Party"), tab: data.crossAgeParty, heat: false },
            { t: T("लिंग × पार्टी समर्थन", "Gender × Party"), tab: data.crossGenderParty, heat: false },
            { t: T("सामाजिक श्रेणी × पार्टी समर्थन", "Category × Party"), tab: data.crossCategoryParty, heat: false },
            { t: T("आयु वर्ग × मुख्य मुद्दे", "Age × Issues"), tab: data.crossAgeIssue, heat: true },
            { t: T("लिंग × मुख्य मुद्दे", "Gender × Issues"), tab: data.crossGenderIssue, heat: true },
            { t: T("पार्टी × विधायक पर राय", "Party × MLA opinion"), tab: data.crossPartyMla, heat: false },
          ].map((c) => (
            <Sub key={c.t} title={c.t}>
              {!c.tab.meaningful ? (
                <p className="text-xs text-slate-500">{T("इस तुलना के लिए पर्याप्त प्रतिक्रियाएं उपलब्ध नहीं हैं।", "Not enough responses for this comparison.")}</p>
              ) : c.heat ? (
                <HeatTable tab={c.tab} hi={hi} insufficientLabel={tooFew} />
              ) : (
                <StackedCrossTab tab={c.tab} hi={hi} insufficientLabel={tooFew} />
              )}
            </Sub>
          ))}
          <p className="text-[11px] text-slate-500">{T(`न्यूनतम ${MIN_GROUP_N} प्रतिक्रियाओं वाले समूह ही दिखाए गए; यह केवल वर्णनात्मक है।`, `Only groups with at least ${MIN_GROUP_N} responses are drawn; descriptive only.`)}</p>
        </div>
      ),
    });

  if (has("geo") && (data.geo || data.comparison.length))
    sections.push({
      key: "geo",
      node: (
        <div className="flex flex-col gap-5">
          {data.geo && <GeoTable geo={data.geo} hi={hi} />}
          {data.comparison.length > 0 && (
            <Sub title={T("राज्य बनाम जिला बनाम विधानसभा", "State vs district vs constituency")}>
              <LevelCompare levels={data.comparison} hi={hi} />
            </Sub>
          )}
        </div>
      ),
    });

  const timeParts = extra ? extra.time.filter((t) => t.enough) : [];
  if (has("time") && (timeParts.length || extra?.period?.enough))
    sections.push({
      key: "time",
      node: (
        <div className="flex flex-col gap-5">
          {timeParts.map((t) => (
            <Sub key={t.metric} title={{ party: T("पार्टी समर्थन — समय के साथ", "Party support over time"), mla: T("विधायक पर राय — समय के साथ", "MLA opinion over time"), issues: T("मुख्य मुद्दे — समय के साथ", "Main issues over time") }[t.metric]}>
              <TimeTable series={t} hi={hi} />
            </Sub>
          ))}
          {extra?.period?.enough && (
            <Sub title={T(`पिछले 7 दिन (N=${extra.period.b.n}) बनाम उससे पहले के 7 दिन (N=${extra.period.a.n}) — सर्वे प्रतिक्रियाओं में बदलाव`, `Last 7 days (N=${extra.period.b.n}) vs previous 7 (N=${extra.period.a.n}) — change in survey responses`)}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {extra.period.metrics.map((m) => (
                  <CompareTable key={m.key} metric={m} aLabel="A" bLabel="B" diffLabel={T("बदलाव (B−A)", "Change (B−A)")} hi={hi} />
                ))}
              </div>
            </Sub>
          )}
          <p className="text-[11px] text-slate-500">{T("यह सर्वे प्रतिक्रियाओं की समय के अनुसार तुलना है, कोई पूर्वानुमान नहीं।", "Survey responses compared over time; not a forecast.")}</p>
        </div>
      ),
    });

  if (has("quality")) sections.push({ key: "quality", node: <QualityDetails q={extras.quality} hi={hi} /> });

  const findings = reportableFindings(data, extras.advanced);
  if (has("insights") && (findings.length || data.insights.length))
    sections.push({
      key: "insights",
      node: (
        <div className="flex flex-col gap-4">
          {findings.length > 0 && <FindingCards items={findings} />}
          {data.insights.length > 0 && <InsightList items={data.insights} />}
        </div>
      ),
    });

  return (
    <div className="mx-auto max-w-5xl px-4 pb-10 sm:px-6">
      <header className="mb-5 border-b border-slate-200 pb-4">
        <p className="text-[13px] font-bold text-[#ea580c]">votersurvey.in · {T("विश्लेषण रिपोर्ट", "Analysis report")}</p>
        <h1 className="mt-1 text-2xl font-black text-[#0b1f3a] sm:text-3xl">
          {place} — {scope.level === "none" ? T("समग्र सर्वेक्षण विश्लेषण", "Overall survey analysis") : T(`विधानसभा सर्वेक्षण विश्लेषण ${scope.election?.year ?? 2027}`, `Assembly survey analysis ${scope.election?.year ?? 2027}`)}
        </h1>
        <p className="mt-1 text-xs text-slate-500">{T("यह रिपोर्ट सर्वेक्षण प्रतिक्रियाओं पर आधारित है। यह किसी भी प्रकार का चुनावी अनुमान नहीं है।", "This report is based on survey responses. It is not an election forecast of any kind.")}</p>
      </header>
      <div className="flex flex-col gap-4">
        {sections.map((s, i) => (
          <Section key={s.key} n={i + 1} title={L(s.key)}>
            {s.node}
          </Section>
        ))}
        <Methodology hi={hi} data={data} className="rounded-2xl border border-slate-200 bg-white p-4" />
      </div>
    </div>
  );
}
