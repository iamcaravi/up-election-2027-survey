import { NextRequest, NextResponse } from "next/server";
import { getServerLocale } from "@/lib/i18n/locale-cookie";
import { getScopedAnalysis, resolveScope, type CrossTab, type Distribution } from "@/lib/scoped-survey";
import { readAnalysisParams } from "@/lib/analysis-params";
import { buildXlsx, type Cell, type Sheet } from "@/lib/xlsx";

// XLSX export of the canonical Analysis for exactly the requested scope and
// filters — same aggregation as the page, so the file matches what is shown.

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const locale = await getServerLocale();
    const hi = locale === "hi";
    const { scope: requested, filters } = readAnalysisParams(req.nextUrl.searchParams);
    const scope = await resolveScope(requested, locale);
    const a = await getScopedAnalysis(scope, locale, filters);
    if (!a) return NextResponse.json({ error: hi ? "डेटा उपलब्ध नहीं है।" : "No data available." }, { status: 404 });

    const L = (h: string, e: string) => (hi ? h : e);
    const dist = (title: string, d: Distribution, col: string): Cell[][] => [
      [col, L("संख्या", "Count"), L("प्रतिशत", "Percent")],
      ...d.items.map((i) => [i.label, i.count, i.pct]),
      [],
      [L(`आधार (उत्तर देने वाले उत्तरदाता): ${d.answered}`, `Base (respondents who answered): ${d.answered}`)],
      [title],
    ];
    const cross = (title: string, t: CrossTab): Cell[][] => [
      [title],
      [L("समूह", "Group"), "N", ...t.columns.map((c) => `${c.label} %`)],
      ...t.rows.map((r) => [r.label, r.n, ...(r.sufficient ? r.cells.map((c) => c.pct) : t.columns.map(() => L("पर्याप्त नहीं", "too few")))]),
      [],
    ];
    const segLabel = a.segmentOptions.find((o) => o.value === a.filters.segment)?.label ?? a.filters.segment;
    const periodLabel = { all: L("सभी समय", "All time"), "30d": L("पिछले 30 दिन", "Last 30 days"), "7d": L("पिछले 7 दिन", "Last 7 days") }[a.filters.period] ?? a.filters.period;

    const sheets: Sheet[] = [
      {
        name: L("सारांश", "Summary"),
        rows: [
          [L("विवरण", "Field"), L("मान", "Value")],
          [L("दायरा", "Scope"), scope.level === "none" ? L("समग्र विश्लेषण (सभी उपलब्ध राज्य)", "Overall analysis (all available states)") : L("क्षेत्र-विशिष्ट", "Scoped")],
          [L("राज्य", "State"), scope.state?.name ?? L("सभी राज्य", "All states")],
          [L("जिला", "District"), scope.district?.name ?? L("सभी", "All")],
          [L("विधानसभा क्षेत्र", "Constituency"), scope.constituency ? `${scope.constituency.name} (${scope.constituency.number})` : L("सभी", "All")],
          [L("उत्तरदाता समूह", "Respondent group"), segLabel],
          [L("समय अवधि", "Period"), periodLabel],
          [L("कुल प्रतिक्रियाएं", "Total responses"), a.total],
          [L("आज की प्रतिक्रियाएं", "Today's responses"), a.today],
          [L("पिछले 7 दिन", "Last 7 days"), a.last7Days],
          [L("प्रतिक्रिया वाले विधानसभा क्षेत्र", "Constituencies with responses"), `${a.respondingConstituencies}/${a.constituenciesInScope}`],
          [L("पहली प्रतिक्रिया", "First response"), a.firstResponseAt],
          [L("अंतिम प्रतिक्रिया", "Last response"), a.lastResponseAt],
          [L("सर्वेक्षण स्थिति", "Survey status"), a.surveyActive ? L("सक्रिय", "Active") : L("बंद", "Closed")],
          [L("स्रोत", "Source"), L("votersurvey.in पर उपयोगकर्ताओं की मान्य प्रतिक्रियाएं; आधिकारिक चुनाव परिणाम या पूर्वानुमान नहीं।", "Valid user responses on votersurvey.in; not an official result or forecast.")],
          [L("निर्यात समय", "Exported at"), new Date().toISOString()],
        ],
      },
      { name: L("पार्टी समर्थन", "Party support"), rows: dist(L("पार्टी समर्थन", "Party support"), a.party, L("पार्टी", "Party")) },
      { name: L("विधायक पर राय", "MLA opinion"), rows: dist(L("विधायक के कार्यों पर राय", "MLA opinion"), a.mla, L("राय", "Opinion")) },
      {
        name: L("मुख्य मुद्दे", "Main issues"),
        rows: [
          ...dist(L("मुख्य मुद्दे (बहुविकल्पीय)", "Main issues (multi-select)"), a.issues, L("मुद्दा", "Issue")),
          [L("प्रतिशत उत्तरदाताओं के आधार पर; एक से अधिक विकल्प चुने जा सकते हैं।", "Share of respondents; multiple choices allowed.")],
          [],
          [L("मुद्दा श्रेणी", "Issue category"), L("संख्या", "Count"), L("प्रतिशत", "Percent")],
          ...(a.issueCategories ?? []).map((c) => [c.label, c.count, c.pct]),
        ],
      },
      {
        name: L("जनसांख्यिकी", "Demographics"),
        rows: [
          [L("आयाम", "Dimension"), L("समूह", "Group"), L("संख्या", "Count"), L("प्रतिशत", "Percent"), L("आधार", "Base")],
          ...(["gender", "age_group", "social_category", "religion"] as const).flatMap((k) =>
            a.demographics[k].items.map((i) => [
              { gender: L("लिंग", "Gender"), age_group: L("आयु वर्ग", "Age"), social_category: L("सामाजिक श्रेणी", "Social category"), religion: L("धर्म", "Religion") }[k],
              i.label,
              i.count,
              i.pct,
              a.demographics[k].answered,
            ])
          ),
        ],
      },
      {
        name: L("क्रॉस विश्लेषण", "Cross-analysis"),
        rows: [
          ...cross(L("आयु वर्ग × पार्टी", "Age × Party"), a.crossAgeParty),
          ...cross(L("लिंग × पार्टी", "Gender × Party"), a.crossGenderParty),
          ...cross(L("सामाजिक श्रेणी × पार्टी", "Category × Party"), a.crossCategoryParty),
          ...cross(L("आयु वर्ग × मुद्दे", "Age × Issues"), a.crossAgeIssue),
          ...cross(L("लिंग × मुद्दे", "Gender × Issues"), a.crossGenderIssue),
          ...cross(L("पार्टी × विधायक पर राय", "Party × MLA opinion"), a.crossPartyMla),
        ],
      },
      {
        name: L("भौगोलिक तुलना", "Geography"),
        rows: a.geo
          ? [
              [L("क्षेत्र", "Area"), "N", L("सर्वाधिक समर्थन", "Highest support"), "%", L("शीर्ष मुद्दा", "Top issue"), "%", L("विधायक से संतुष्ट %", "Satisfied with MLA %")],
              ...a.geo.rows.map((r) => [r.label, r.n, r.topParty?.label, r.topParty?.pct, r.topIssue?.label, r.topIssue?.pct, r.satisfiedPct]),
            ]
          : [[L("इस क्षेत्र-स्तर के लिए भौगोलिक विभाजन उपलब्ध नहीं है।", "No geographic breakdown for this level.")]],
      },
      {
        name: L("स्तर तुलना", "Level comparison"),
        rows: a.comparison.length
          ? [
              [L("स्तर", "Level"), L("नाम", "Name"), "N", L("पार्टी", "Party"), "%"],
              ...a.comparison.flatMap((l) => l.party.map((p) => [l.level, l.label, l.n, p.label, p.pct])),
            ]
          : [[L("तुलना के लिए पर्याप्त स्तर उपलब्ध नहीं।", "Not enough levels to compare.")]],
      },
      {
        name: L("समय रुझान", "Trend"),
        rows: a.trend ? [[L("अवधि", "Period"), L("प्रतिक्रियाएं", "Responses")], ...a.trend.points.map((p) => [p.label, p.count])] : [[L("अपर्याप्त डेटा", "Insufficient data")]],
      },
      {
        name: L("गुणवत्ता", "Quality"),
        rows: [[L("प्रश्न", "Question"), L("उत्तर दिए", "Answered"), L("प्रतिशत", "Percent")], ...a.quality.map((q) => [q.label, q.answered, q.pct])],
      },
      {
        name: L("निष्कर्ष", "Findings"),
        rows: [[L("निष्कर्ष", "Finding"), L("विवरण", "Detail")], ...a.findings.map((f) => [f.title, f.text]), [], ...a.insights.map((t) => [t])],
      },
    ];

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
