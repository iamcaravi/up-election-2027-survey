import { NextRequest, NextResponse } from "next/server";
import { getServerLocale } from "@/lib/i18n/locale-cookie";
import { MIN_GROUP_N, type CrossTab, type Distribution } from "@/lib/scoped-survey";
import { getAnalysisPageData, mlaStance, reportableFindings, resolveAnalysisScope, staticModules } from "@/lib/analysis-engine";
import { readAnalysisParams, readReportModules } from "@/lib/analysis-params";
import { AREA_UNIT_LABELS, COMPARE_METRIC_LABELS, DIMENSION_LABELS } from "@/lib/analysis-dimensions";
import { buildXlsx, type Cell, type Sheet } from "@/lib/xlsx";

// XLSX export of the canonical Analysis for exactly the requested scope and
// filters — same aggregation as the page, so the file matches what is shown.
// `?modules=` limits the sheets (custom report). Aggregates only: no
// respondent rows, identifiers or timestamps of individuals are ever written.

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const locale = await getServerLocale();
    const hi = locale === "hi";
    const sp = req.nextUrl.searchParams;
    const { scope: requested, filters } = readAnalysisParams(sp);
    const modules = readReportModules(sp);
    const scope = await resolveAnalysisScope(requested, locale);
    const page = await getAnalysisPageData(scope, locale, filters);
    if (!page || page.analysis.total === 0) return NextResponse.json({ error: hi ? "डेटा उपलब्ध नहीं है।" : "No data available." }, { status: 404 });
    const { analysis: a, extras: x, ctx } = page;
    const extra = staticModules(ctx, a);
    const has = (m: (typeof modules)[number]) => modules.includes(m);

    const L = (h: string, e: string) => (hi ? h : e);
    const dist = (d: Distribution, col: string): Cell[][] => [
      [col, L("संख्या", "Count"), L("प्रतिशत", "Percent")],
      ...d.items.map((i) => [i.label, i.count, i.pct]),
      [],
      [L(`आधार (उत्तर देने वाले उत्तरदाता): ${d.answered}`, `Base (respondents who answered): ${d.answered}`)],
    ];
    const cross = (title: string, t: CrossTab): Cell[][] => [
      [title],
      [L("समूह", "Group"), "N", ...t.columns.map((c) => `${c.label} %`)],
      ...t.rows.map((r) => [r.label, r.n, ...(r.sufficient ? r.cells.map((c) => c.pct) : t.columns.map(() => L("पर्याप्त नहीं", "too few")))]),
      [],
    ];
    const segLabel = a.segmentOptions.find((o) => o.value === a.filters.segment)?.label ?? a.filters.segment;
    const periodLabel =
      a.filters.period === "custom"
        ? `${a.filters.from} – ${a.filters.to}`
        : ({ all: L("सभी समय", "All time"), "30d": L("पिछले 30 दिन", "Last 30 days"), "7d": L("पिछले 7 दिन", "Last 7 days") }[a.filters.period] ?? a.filters.period);
    const stance = mlaStance(a.mla);

    const sheets: Sheet[] = [
      {
        name: L("अवलोकन", "Overview"),
        rows: [
          [L("विवरण", "Field"), L("मान", "Value")],
          [L("दायरा", "Scope"), scope.level === "none" ? L("समग्र विश्लेषण (सभी उपलब्ध राज्य)", "Overall analysis (all available states)") : L("क्षेत्र-विशिष्ट", "Scoped")],
          [L("राज्य", "State"), scope.state?.name ?? L("सभी राज्य", "All states")],
          [L("जिला", "District"), scope.district?.name ?? L("सभी", "All")],
          [L("विधानसभा क्षेत्र", "Constituency"), scope.constituency ? `${scope.constituency.name} (${scope.constituency.number})` : L("सभी", "All")],
          ...(x.mla ? [[L("वर्तमान विधायक", "Current MLA"), `${x.mla.name}${x.mla.party ? ` — ${x.mla.party}` : ""}`]] : []),
          [L("उत्तरदाता समूह", "Respondent group"), segLabel],
          [L("समय अवधि", "Period"), periodLabel],
          [L("कुल प्रतिक्रियाएं", "Total responses"), a.total],
          [L("पूर्ण प्रतिक्रियाएं", "Complete responses"), x.kpis.complete],
          [L("पूर्णता दर %", "Completion rate %"), x.kpis.completionRate],
          [L("पहली प्रतिक्रिया", "First response"), a.firstResponseAt],
          [L("अंतिम प्रतिक्रिया", "Last response"), a.lastResponseAt],
          [L("सर्वेक्षण स्थिति", "Survey status"), a.surveyActive ? L("सक्रिय", "Active") : L("बंद", "Closed")],
          [L("नमूना टिप्पणी", "Sample note"), x.quality.sample.message],
          [L("स्रोत", "Source"), L("votersurvey.in पर उपयोगकर्ताओं की मान्य प्रतिक्रियाएं; आधिकारिक चुनाव परिणाम या पूर्वानुमान नहीं।", "Valid user responses on votersurvey.in; not an official result or forecast.")],
          [L("गोपनीयता", "Privacy"), L("केवल समेकित आंकड़े; कोई व्यक्तिगत जानकारी नहीं।", "Aggregated figures only; no personal data.")],
          [L("निर्यात समय", "Exported at"), new Date().toISOString()],
        ],
      },
    ];

    if (has("summary"))
      sheets.push({
        name: L("प्रतिक्रिया सारांश", "Responses Summary"),
        rows: [
          [L("सूचक", "Measure"), L("मान", "Value")],
          [L("कुल प्रतिक्रियाएं", "Total responses"), a.total],
          [L("आज की प्रतिक्रियाएं", "Today's responses"), a.today],
          [L("पिछले 7 दिन", "Last 7 days"), a.last7Days],
          [x.kpis.coverage.label, `${x.kpis.coverage.covered}/${x.kpis.coverage.total}`],
          [x.kpis.areas.label, `${x.kpis.areas.covered}/${x.kpis.areas.total}`],
          [],
          [L("प्रोफ़ाइल", "Profile"), L("मान", "Value"), L("विवरण", "Detail")],
          ...x.profile.facts.map((f) => [f.label, f.value, f.detail]),
          [],
          [L("सारांश", "Summary")],
          ...x.profile.summary.map((s) => [s]),
          [],
          [L("अवधि", "Period"), L("प्रतिक्रियाएं", "Responses")],
          ...(a.trend ? a.trend.points.map((p) => [p.label, p.count]) : []),
        ],
      });
    if (has("party") && a.party.answered) sheets.push({ name: L("पार्टी समर्थन", "Party Support"), rows: dist(a.party, L("पार्टी", "Party")) });
    if (has("mla") && a.mla.answered)
      sheets.push({
        name: L("विधायक पर राय", "MLA Opinion"),
        rows:
          a.mla.answered >= MIN_GROUP_N
            ? [
                ...dist(a.mla, L("राय", "Opinion")),
                [],
                [L("सकारात्मक %", "Positive %"), stance.pos],
                [L("नकारात्मक %", "Negative %"), stance.neg],
                [L("तटस्थ %", "Neutral %"), stance.neu],
              ]
            : [
                // Same small-sample rule as the page: counts only below MIN_GROUP_N answers.
                [L("राय", "Opinion"), L("संख्या", "Count")],
                ...a.mla.items.map((i) => [i.label, i.count]),
                [],
                [L(`केवल ${a.mla.answered} उत्तर — प्रतिशत दिखाने के लिए पर्याप्त प्रतिक्रियाएं उपलब्ध नहीं हैं।`, `Only ${a.mla.answered} answers — not enough to show percentages.`)],
              ],
      });
    if (has("issues") && a.issues.answered)
      sheets.push({
        name: L("मुद्दे", "Issues"),
        rows: [
          ...dist(a.issues, L("मुद्दा", "Issue")),
          [L("प्रतिशत उत्तरदाताओं के आधार पर; एक से अधिक विकल्प चुने जा सकते हैं।", "Share of respondents; multiple choices allowed.")],
          [],
          [L("मुद्दा श्रेणी", "Issue category"), L("संख्या", "Count"), L("प्रतिशत", "Percent")],
          ...(a.issueCategories ?? []).map((c) => [c.label, c.count, c.pct]),
          ...extra.issues.flatMap((d) => [
            [],
            [L(`${d.issue.label} — विस्तृत`, `${d.issue.label} — detail`), `${d.overall.count}/${d.overall.answered}`, d.overall.pct],
            [L("आयाम", "Dimension"), L("समूह", "Group"), "N", L("चुना", "Chose"), "%"],
            ...d.breakdowns.flatMap((b) =>
              b.rows.map((r) => [
                b.dim === "area" && b.unit ? L(AREA_UNIT_LABELS[b.unit].hi, AREA_UNIT_LABELS[b.unit].en) : L(DIMENSION_LABELS[b.dim].hi, DIMENSION_LABELS[b.dim].en),
                r.label,
                r.n,
                r.count,
                r.sufficient ? r.pct : L("पर्याप्त नहीं", "too few"),
              ])
            ),
          ]),
        ],
      });
    if (has("demographics"))
      for (const k of ["age_group", "gender", "social_category", "religion"] as const)
        if (a.demographics[k].answered)
          sheets.push({
            name: { age_group: L("आयु", "Age"), gender: L("लिंग", "Gender"), social_category: L("सामाजिक श्रेणी", "Social Category"), religion: L("धर्म", "Religion") }[k],
            rows: dist(a.demographics[k], L("समूह", "Group")),
          });
    if (has("cross"))
      sheets.push({
        name: L("क्रॉस विश्लेषण", "Cross Analysis"),
        rows: [
          ...cross(L("आयु वर्ग × पार्टी", "Age × Party"), a.crossAgeParty),
          ...cross(L("लिंग × पार्टी", "Gender × Party"), a.crossGenderParty),
          ...cross(L("सामाजिक श्रेणी × पार्टी", "Category × Party"), a.crossCategoryParty),
          ...cross(L("आयु वर्ग × मुद्दे", "Age × Issues"), a.crossAgeIssue),
          ...cross(L("लिंग × मुद्दे", "Gender × Issues"), a.crossGenderIssue),
          ...cross(L("पार्टी × विधायक पर राय", "Party × MLA opinion"), a.crossPartyMla),
        ],
      });
    if (has("geo") && (a.geo || a.comparison.length))
      sheets.push({
        name: L("भौगोलिक तुलना", "Geographic Comparison"),
        rows: [
          ...(a.geo
            ? [
                [L("क्षेत्र", "Area"), "N", L("सर्वाधिक समर्थन", "Highest support"), "%", L("शीर्ष मुद्दा", "Top issue"), "%", L("विधायक से संतुष्ट %", "Satisfied with MLA %")],
                ...a.geo.rows.map((r) => [r.label, r.n, r.topParty?.label, r.topParty?.pct, r.topIssue?.label, r.topIssue?.pct, r.satisfiedPct]),
                [],
              ]
            : []),
          ...(a.comparison.length ? [[L("स्तर", "Level"), L("नाम", "Name"), "N", L("पार्टी", "Party"), "%"], ...a.comparison.flatMap((l) => l.party.map((p) => [l.level, l.label, l.n, p.label, p.pct]))] : []),
        ],
      });
    const series = extra.time.filter((t) => t.enough);
    if (has("time") && (a.trend || series.length || extra.period?.enough))
      sheets.push({
        name: L("समय विश्लेषण", "Time Analysis"),
        rows: [
          [L("अवधि", "Period"), L("प्रतिक्रियाएं", "Responses")],
          ...(a.trend ? a.trend.points.map((p) => [p.label, p.count]) : []),
          ...series.flatMap((t) => [
            [],
            [{ party: L("पार्टी समर्थन — समय के साथ %", "Party support over time %"), mla: L("विधायक पर राय — समय के साथ %", "MLA opinion over time %"), issues: L("मुख्य मुद्दे — समय के साथ %", "Main issues over time %") }[t.metric]],
            [L("अवधि", "Period"), "N", ...t.columns.map((c) => c.label)],
            ...t.buckets.map((b) => [b.label, b.n, ...b.values.map((v) => (v === null ? L("पर्याप्त नहीं", "too few") : v))]),
          ]),
          ...(extra.period?.enough
            ? [
                [],
                [L("अवधि तुलना (सर्वे प्रतिक्रियाओं में बदलाव)", "Period comparison (change in survey responses)")],
                [L("अवधि A", "Period A"), `${extra.period.a.from} – ${extra.period.a.to}`, `N=${extra.period.a.n}`],
                [L("अवधि B", "Period B"), `${extra.period.b.from} – ${extra.period.b.to}`, `N=${extra.period.b.n}`],
                [L("विषय", "Topic"), L("विकल्प", "Option"), "A %", "B %", L("बदलाव (अंक)", "Change (pts)")],
                ...extra.period.metrics.filter((m) => m.sufficient).flatMap((m) => m.rows.map((r) => [L(COMPARE_METRIC_LABELS[m.key].hi, COMPARE_METRIC_LABELS[m.key].en), r.label, r.a.pct, r.b.pct, r.diff])),
              ]
            : []),
        ],
      });
    if (has("quality"))
      sheets.push({
        name: L("डेटा गुणवत्ता", "Data Quality"),
        rows: [
          [L("सूचक", "Measure"), L("मान", "Value")],
          [L("कुल प्रतिक्रियाएं", "Total responses"), x.quality.total],
          [L("पूर्ण प्रतिक्रियाएं", "Complete"), x.quality.complete],
          [L("अपूर्ण प्रतिक्रियाएं", "Incomplete"), x.quality.incomplete],
          [L("पूर्णता दर %", "Completion rate %"), x.quality.completionRate],
          ...x.quality.recency.map((r) => [r.label, r.count]),
          [L("कोई प्रोफ़ाइल जानकारी देने वाले", "Shared any profile detail"), x.quality.demographicAny.count],
          [L("चारों प्रोफ़ाइल प्रश्नों के उत्तर", "Answered all four profile questions"), x.quality.demographicAll.count],
          ...(x.quality.geo
            ? [
                [L(`प्रतिक्रिया वाले ${x.quality.geo.label}`, `${x.quality.geo.label} with responses`), `${x.quality.geo.covered}/${x.quality.geo.total}`],
                [L(`कम से कम 5 प्रतिक्रियाओं वाले ${x.quality.geo.label}`, `${x.quality.geo.label} with ≥5 responses`), x.quality.geo.reliable],
              ]
            : []),
          [L("नमूना टिप्पणी", "Sample note"), x.quality.sample.message],
          [],
          [L("प्रश्न", "Question"), L("उत्तर दिए", "Answered"), L("छूटे", "Missing"), L("प्रतिशत", "Percent")],
          ...x.quality.perQuestion.map((q) => [q.label, q.answered, q.missing, q.pct]),
        ],
      });
    if (has("insights"))
      sheets.push({
        name: L("मुख्य निष्कर्ष", "Key Insights"),
        rows: [[L("निष्कर्ष", "Finding"), L("विवरण", "Detail")], ...reportableFindings(a, x.advanced).map((f) => [f.title, f.text]), [], ...a.insights.map((t) => [t])],
      });

    const file = buildXlsx(sheets);
    const name = ["votersurvey-analysis", scope.params.state, scope.params.district, scope.params.constituency].filter(Boolean).join("-");
    return new NextResponse(new Blob([file.buffer as ArrayBuffer]), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${name}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Analysis export failed:", error);
    return NextResponse.json({ error: "Export failed." }, { status: 500 });
  }
}
