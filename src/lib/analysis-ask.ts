import "server-only";

import { getConstituencyDisplayName } from "./constituency-hindi";
import { getDistrictDisplayName } from "./district-hindi";
import { MIN_GROUP_N, applyFilters, distribution, istDayStart, mlaDistribution, type Distribution, type QuestionKey, type ResponseRecord } from "./scoped-survey";
import { compareAreas, formatIstDate, mlaStance, resolvePeriods, periodComparison, type AnalysisContext } from "./analysis-engine";
import { AREA_UNIT_LABELS, COMPARE_METRIC_LABELS, type AreaUnit, type AskAnswer, type PeriodPreset } from "./analysis-dimensions";

// "डेटा से पूछें" — a deterministic question parser over the survey dataset.
// It recognises an area, a respondent group, a topic (issues / party / MLA /
// responses) and a time window, then answers ONLY with aggregates computed
// from the same eligible responses as the rest of the Analysis page. There is
// no language model: nothing is generated beyond the numbers. Questions asking
// for forecasts, winners, seats or voting advice are declined.

const DAY = 24 * 60 * 60 * 1000;
export const MAX_QUESTION_LENGTH = 300;

const PREDICTION_PATTERNS = [
  /जीत/,
  /हार(ेग|ेंग|ेगा|ेगी|ने\s*वाल)/,
  /विजय|विजेता/,
  /सरकार\s*(कौन|किसकी|किसका|बनाएग|बनेग|बनाएंग)/,
  /सत्ता\s*में/,
  /मुख्यमंत्री\s*(कौन|बनेग)/,
  /(कितनी|कौन|किसको|किसे)\s*सीट/,
  /सीटें?\s*(मिल|आएंग|आएग)/,
  /किस(े|को)\s*वोट/,
  /वोट\s*(किसे|किसको)/,
  /भविष्यवाणी|अनुमान\s*लगा|पूर्वानुमान/,
  /\b(win|wins|winning|winner|won|lose|loses|losing|predict\w*|forecast\w*|seats?|exit\s*poll)\b/i,
  /who\s+(should|will|shall)\b.*\bvote/i,
];

const TOPIC_PATTERNS: Record<"issue" | "party" | "mla" | "responses", RegExp> = {
  issue: /मुद्द|समस्या|प्राथमिकता|\bissues?\b|\bproblems?\b|\bpriorit/i,
  party: /पार्टी|\bदल\b|समर्थन|\bpart(y|ies)\b|\bsupport\b/i,
  mla: /विधायक|एमएलए|\bmla\b/i,
  responses: /कितनी\s*प्रतिक्रिया|कितने\s*(लोग|उत्तरदाता)|प्रतिक्रियाओं|responses?\b|how\s+many|कितनी\s*response/i,
};
const COMPARE_PATTERN = /तुलना|बनाम|\bvs\.?\b|compare|comparison|अंतर|फर्क|फ़र्क|difference/i;
const CONSTITUENCY_HINT = /विधानसभा|constituency|assembly|\bac\b/i;

const GROUP_ALIASES: Record<string, Record<string, string[]>> = {
  gender: {
    male: ["पुरुष", "पुरुषों", "आदमी", "male", "men", "man"],
    female: ["महिला", "महिलाओं", "महिलाएं", "महिलाएँ", "स्त्री", "औरत", "female", "women", "woman"],
  },
  social_category: {
    general: ["सामान्य वर्ग", "सामान्य", "general"],
    obc: ["ओबीसी", "पिछड़ा", "पिछड़े", "obc"],
    sc: ["एससी", "अनुसूचित जाति", "sc"],
    st: ["एसटी", "अनुसूचित जनजाति", "st"],
  },
  religion: {
    hindu: ["हिंदू", "हिन्दू", "hindu"],
    muslim: ["मुस्लिम", "मुसलमान", "muslim"],
    sikh: ["सिख", "sikh"],
    christian: ["ईसाई", "christian"],
    buddhist: ["बौद्ध", "buddhist"],
    jain: ["जैन", "jain"],
  },
};

function normalize(s: string) {
  return s.normalize("NFC").toLowerCase().replace(/[–—−]/g, "-").replace(/\s+/g, " ").trim();
}

const WORD_CHAR = /[a-z0-9ऀ-ॿ]/;

/** Whole-word match ("st" never matches inside "last", a place name never inside another word). */
function findAlias(text: string, alias: string, taken: boolean[]): number {
  let from = 0;
  for (;;) {
    const at = text.indexOf(alias, from);
    if (at < 0) return -1;
    const before = text[at - 1];
    const after = text[at + alias.length];
    const boundaryOk = (!before || !WORD_CHAR.test(before)) && (!after || !WORD_CHAR.test(after));
    const free = !taken.slice(at, at + alias.length).some(Boolean);
    if (boundaryOk && free) return at;
    from = at + 1;
  }
}

interface AreaHit {
  level: AreaUnit;
  id: string;
  label: string;
}

function detectAreas(ctx: AnalysisContext, text: string, taken: boolean[]): AreaHit[] {
  const ds = ctx.ds;
  const aliases = new Map<string, AreaHit[]>();
  const add = (alias: string, hit: AreaHit) => {
    const a = normalize(alias);
    if (a.length < 3) return;
    const list = aliases.get(a) ?? aliases.set(a, []).get(a)!;
    if (!list.some((h) => h.level === hit.level && h.id === hit.id)) list.push(hit);
  };
  if (ctx.scope.level === "none") {
    for (const [id, name] of ds.stateNames) add(name, { level: "state", id, label: name });
  }
  for (const d of ds.areaNames?.districts ?? []) {
    const hit = { level: "district" as const, id: d.id, label: ds.districtNames.get(d.id) ?? d.name };
    [d.name, d.slug.replace(/-/g, " "), getDistrictDisplayName(d.slug, d.name, "hi")].forEach((a) => add(a, hit));
  }
  for (const c of ds.areaNames?.constituencies ?? []) {
    const hit = { level: "constituency" as const, id: c.id, label: ds.constituencyInfo.get(c.id)?.name ?? c.name };
    [c.name, c.slug.replace(/-/g, " "), getConstituencyDisplayName(c.slug, c.name, "hi")].forEach((a) => add(a, hit));
  }
  const preferConstituency = CONSTITUENCY_HINT.test(text);
  const hits: AreaHit[] = [];
  for (const alias of [...aliases.keys()].sort((a, b) => b.length - a.length)) {
    const at = findAlias(text, alias, taken);
    if (at < 0) continue;
    const options = aliases.get(alias)!;
    const pick =
      options.find((o) => o.level === (preferConstituency ? "constituency" : "district")) ??
      options.find((o) => o.level === "state") ??
      options[0];
    if (hits.some((h) => h.level === pick.level && h.id === pick.id)) continue;
    for (let i = at; i < at + alias.length; i++) taken[i] = true;
    hits.push(pick);
    if (hits.length >= 3) break;
  }
  return hits;
}

interface GroupHit {
  q: QuestionKey;
  key: string;
  label: string;
}

function detectGroup(ctx: AnalysisContext, text: string, taken: boolean[]): GroupHit | null {
  const meta = ctx.ds.meta;
  const age = /(\d{2})\s*(?:-|से|to)\s*(\d{2})|(\d{2})\s*\+|(\d{2})\s*(?:से\s*(?:अधिक|ऊपर|ज़्यादा|ज्यादा)|and above|or above|plus)/i.exec(text);
  if (age) {
    const start = age[1] ?? age[3] ?? age[4];
    const key = [...meta.age_group.keys()].find((k) => k.startsWith(start));
    if (key) return { q: "age_group", key, label: meta.age_group.get(key)!.label };
  }
  for (const [q, groups] of Object.entries(GROUP_ALIASES)) {
    for (const [key, list] of Object.entries(groups)) {
      const m = meta[q as QuestionKey].get(key);
      if (!m) continue;
      for (const alias of [...list].sort((a, b) => b.length - a.length)) {
        const at = findAlias(text, alias, taken);
        if (at >= 0) {
          for (let i = at; i < at + alias.length; i++) taken[i] = true;
          return { q: q as QuestionKey, key, label: m.label };
        }
      }
    }
  }
  return null;
}

function detectPeriod(text: string): { preset: PeriodPreset; compare: boolean; side: "a" | "b" } | null {
  const month = /(पिछले|पिछला|इस|इसी)\s*(महीन|माह)|(last|this|previous)\s+month/i;
  const week = /(पिछले|पिछला|इस|इसी)\s*(सप्ताह|हफ्त|हफ़्त)|(last|this|previous)\s+week/i;
  const last7 = /(पिछले|last)\s*7\s*(दिन|days)/i;
  const both = (re: RegExp) => /(पिछल|last|previous)/i.test(text.match(new RegExp(re.source, "gi"))?.join(" ") ?? "") && /(इस|this)/i.test(text.match(new RegExp(re.source, "gi"))?.join(" ") ?? "");
  const side = (re: RegExp): "a" | "b" => (/(पिछल|last|previous)/i.test(text.match(re)?.[0] ?? "") ? "a" : "b");
  if (last7.test(text)) return { preset: "last7", compare: COMPARE_PATTERN.test(text), side: "b" };
  if (month.test(text)) return { preset: "month", compare: both(month) || COMPARE_PATTERN.test(text), side: side(month) };
  if (week.test(text)) return { preset: "week", compare: both(week) || COMPARE_PATTERN.test(text), side: side(week) };
  return null;
}

function bars(d: Distribution, limit = 6) {
  return d.items
    .filter((i) => i.count > 0 && i.key !== "prefer_not_to_say")
    .slice(0, limit)
    .map((i) => ({ key: i.key, label: i.label, count: i.count, pct: i.pct, color: i.color ?? null }));
}

const EXAMPLES_HI = ["गोंडा में सबसे बड़ा मुद्दा क्या है?", "35–44 आयु वर्ग में पार्टी समर्थन कैसा है?", "महिलाओं में सबसे अधिक चुना गया मुद्दा कौन सा है?"];
const EXAMPLES_EN = ["What is the biggest issue in Gonda?", "What is party support among the 35–44 age group?", "Which issue do women select most?"];

export function askData(ctx: AnalysisContext, question: string): AskAnswer {
  const hi = ctx.locale === "hi";
  const T = (h: string, e: string) => (hi ? h : e);
  const text = normalize(question).slice(0, MAX_QUESTION_LENGTH);
  const insufficient = (understood: string[], basis?: string): AskAnswer => ({
    status: "insufficient",
    heading: T("पर्याप्त डेटा नहीं", "Not enough data"),
    lines: [T("उपलब्ध डेटा इस प्रश्न का विश्वसनीय उत्तर देने के लिए पर्याप्त नहीं है।", "The available data is not sufficient to answer this question reliably.")],
    understood,
    basis,
  });

  if (!text) return { status: "unsupported", heading: T("प्रश्न लिखें", "Type a question"), lines: [], understood: [] };
  if (PREDICTION_PATTERNS.some((re) => re.test(text)))
    return {
      status: "refused",
      heading: T("यह प्रश्न इस सुविधा के दायरे में नहीं है", "This question is outside what this tool answers"),
      lines: [
        T(
          "यह सुविधा चुनाव परिणाम, सीटों या विजेता का अनुमान नहीं लगाती और न ही किसी को वोट देने की सलाह देती है। यह केवल उपलब्ध सर्वे प्रतिक्रियाओं का विवरण देती है — जैसे मुद्दे, पार्टी समर्थन या विधायक पर राय।",
          "This tool does not estimate election results, seats or winners, and does not give voting advice. It only describes the available survey responses — such as issues, party support or MLA opinion."
        ),
      ],
      understood: [],
    };

  const taken = new Array<boolean>(text.length).fill(false);
  const areas = detectAreas(ctx, text, taken);
  const group = detectGroup(ctx, text, taken);
  const period = detectPeriod(text);
  const topics = (Object.keys(TOPIC_PATTERNS) as (keyof typeof TOPIC_PATTERNS)[]).filter((k) => TOPIC_PATTERNS[k].test(text));
  const wantsCompare = COMPARE_PATTERN.test(text);

  const understood: string[] = [];
  const unitLabel = (l: AreaUnit) => T(AREA_UNIT_LABELS[l].hi, AREA_UNIT_LABELS[l].en);
  areas.forEach((a) => understood.push(`${T("क्षेत्र", "Area")}: ${a.label} (${unitLabel(a.level)})`));
  if (group) understood.push(`${T("समूह", "Group")}: ${group.label}`);
  if (ctx.filters.segment !== "all" || ctx.filters.period !== "all") understood.push(T("ऊपर चुने गए फ़िल्टर लागू", "Page filters applied"));

  if (!areas.length && !group && !period && !topics.length)
    return {
      status: "unsupported",
      heading: T("प्रश्न समझ नहीं आया", "Question not understood"),
      lines: [
        T("कृपया किसी क्षेत्र, समूह, मुद्दे, पार्टी समर्थन, विधायक पर राय या समय अवधि के बारे में पूछें। उदाहरण:", "Please ask about an area, group, issues, party support, MLA opinion or a time period. For example:"),
        ...(hi ? EXAMPLES_HI : EXAMPLES_EN),
      ],
      understood,
    };

  const segmentOnly = applyFilters(ctx.ds.records, { segment: ctx.filters.segment, period: "all" });
  const inArea = (rs: ResponseRecord[], a: AreaHit) => rs.filter((r) => (a.level === "state" ? r.stateId : a.level === "district" ? r.districtId : r.constituencyId) === a.id);
  const inGroup = (rs: ResponseRecord[]) => (group ? rs.filter((r) => r.answers[group.q]?.includes(group.key)) : rs);

  // Two areas → area vs area.
  if (areas.length >= 2 || (wantsCompare && areas.length >= 2)) {
    understood.push(`${T("विषय", "Topic")}: ${T("क्षेत्रों की तुलना", "Area comparison")}`);
    const cmp = compareAreas(ctx, `${areas[0].level}:${areas[0].id}`, `${areas[1].level}:${areas[1].id}`);
    if ("error" in cmp) return insufficient(understood);
    if (!cmp.enough) return insufficient(understood, `${cmp.a.label}: N=${cmp.a.n} · ${cmp.b.label}: N=${cmp.b.n}`);
    const want = topics.includes("mla") ? "mla" : topics.includes("party") ? "party" : topics.includes("issue") ? "issues" : null;
    const metrics = cmp.metrics.filter((m) => m.sufficient && (want ? m.key === want : m.key !== "gender" && m.key !== "age_group"));
    if (!metrics.length) return insufficient(understood, `${cmp.a.label}: N=${cmp.a.n} · ${cmp.b.label}: N=${cmp.b.n}`);
    return {
      status: "ok",
      heading: `${cmp.a.label} ${T("बनाम", "vs")} ${cmp.b.label}`,
      lines: [
        T(`${cmp.a.label} में ${cmp.a.n} और ${cmp.b.label} में ${cmp.b.n} मान्य प्रतिक्रियाएं।`, `${cmp.a.n} valid responses in ${cmp.a.label} and ${cmp.b.n} in ${cmp.b.label}.`),
        ...metrics.map((m) => {
          const top = [...m.rows].sort((x, y) => Math.abs(y.diff) - Math.abs(x.diff))[0];
          return top
            ? T(
                `${COMPARE_METRIC_LABELS[m.key].hi}: सबसे बड़ा अंतर ${top.label} में — ${cmp.a.label} ${Math.round(top.a.pct)}% बनाम ${cmp.b.label} ${Math.round(top.b.pct)}%।`,
                `${COMPARE_METRIC_LABELS[m.key].en}: largest gap for ${top.label} — ${cmp.a.label} ${Math.round(top.a.pct)}% vs ${cmp.b.label} ${Math.round(top.b.pct)}%.`
              )
            : "";
        }),
      ].filter(Boolean),
      understood,
      table: {
        columns: [T("विषय", "Topic"), T("विकल्प", "Option"), `${cmp.a.label} %`, `${cmp.b.label} %`, T("अंतर (अंक)", "Diff (pts)")],
        rows: metrics.flatMap((m) => m.rows.slice(0, 6).map((r) => [T(COMPARE_METRIC_LABELS[m.key].hi, COMPARE_METRIC_LABELS[m.key].en), r.label, Math.round(r.a.pct), Math.round(r.b.pct), r.diff > 0 ? `+${r.diff}` : r.diff])),
      },
      basis: `${cmp.a.label}: N=${cmp.a.n} · ${cmp.b.label}: N=${cmp.b.n}`,
    };
  }

  // Period vs period ("पिछले महीने और इस महीने …").
  if (period?.compare && !areas.length && !group) {
    const cmp = periodComparison(ctx, period.preset);
    if (!cmp) return insufficient(understood);
    const range = (s: { from: string; to: string }) => `${formatIstDate(s.from, ctx.locale, false)} – ${formatIstDate(s.to, ctx.locale)}`;
    understood.push(`${T("अवधि", "Period")}: ${range(cmp.a)} ${T("बनाम", "vs")} ${range(cmp.b)}`);
    const lines = [
      T(
        `पहली अवधि (${range(cmp.a)}) में ${cmp.a.n} और दूसरी अवधि (${range(cmp.b)}) में ${cmp.b.n} मान्य प्रतिक्रियाएं मिलीं।`,
        `${cmp.a.n} valid responses in the first period (${range(cmp.a)}) and ${cmp.b.n} in the second (${range(cmp.b)}).`
      ),
    ];
    if (!cmp.enough) return { ...insufficient(understood, `N=${cmp.a.n} · N=${cmp.b.n}`), lines: [...lines, ...insufficient(understood).lines] };
    const want = topics.includes("mla") ? "mla" : topics.includes("issue") ? "issues" : topics.includes("party") ? "party" : null;
    const metrics = cmp.metrics.filter((m) => m.sufficient && (want ? m.key === want : m.key === "party" || m.key === "issues"));
    if (!metrics.length) return { ...insufficient(understood, `N=${cmp.a.n} · N=${cmp.b.n}`), lines: [...lines, ...insufficient(understood).lines] };
    return {
      status: "ok",
      heading: T("अवधि के अनुसार सर्वे प्रतिक्रियाओं में बदलाव", "Change in survey responses between periods"),
      lines,
      understood,
      table: {
        columns: [T("विषय", "Topic"), T("विकल्प", "Option"), T("पहली अवधि %", "Period 1 %"), T("दूसरी अवधि %", "Period 2 %"), T("बदलाव (अंक)", "Change (pts)")],
        rows: metrics.flatMap((m) => m.rows.slice(0, 6).map((r) => [T(COMPARE_METRIC_LABELS[m.key].hi, COMPARE_METRIC_LABELS[m.key].en), r.label, Math.round(r.a.pct), Math.round(r.b.pct), r.diff > 0 ? `+${r.diff}` : r.diff])),
      },
      basis: `N=${cmp.a.n} · N=${cmp.b.n}`,
    };
  }

  // One area / group / period → describe that subset.
  let pool: ResponseRecord[];
  if (period) {
    const p = resolvePeriods(period.preset, ctx.now)!;
    const w = p[period.side];
    const start = istDayStart(w.from);
    const end = istDayStart(w.to) + DAY;
    pool = (areas[0] ? inArea(segmentOnly, areas[0]) : ctx.scopeAnyTime).filter((r) => r.createdAt >= start && r.createdAt < end);
    understood.push(`${T("अवधि", "Period")}: ${formatIstDate(w.from, ctx.locale, false)} – ${formatIstDate(w.to, ctx.locale)}`);
  } else {
    pool = areas[0] ? inArea(ctx.stateAll, areas[0]) : ctx.records;
  }
  pool = inGroup(pool);
  const groupText = group ? (group.q === "age_group" ? T(`${group.label} आयु वर्ग`, `the ${group.label} age group`) : T(`${group.label} उत्तरदाताओं`, `${group.label} respondents`)) : null;
  const where =
    [areas[0]?.label, groupText].filter(Boolean).join(" · ") || ctx.scope.constituency?.name || ctx.scope.district?.name || ctx.scope.state?.name || T("सभी राज्य", "All states");
  const topic = topics.includes("issue") ? "issue" : topics.includes("mla") ? "mla" : topics.includes("party") ? "party" : topics.includes("responses") ? "responses" : "summary";
  understood.push(
    `${T("विषय", "Topic")}: ${
      { issue: T("मुख्य मुद्दे", "Main issues"), party: T("पार्टी समर्थन", "Party support"), mla: T("विधायक पर राय", "MLA opinion"), responses: T("प्रतिक्रियाएं", "Responses"), summary: T("सारांश", "Summary") }[topic]
    }`
  );

  if (topic === "responses")
    return {
      status: "ok",
      heading: `${where} — ${T("प्रतिक्रियाएं", "Responses")}`,
      lines: [T(`${where} में ${pool.length} मान्य प्रतिक्रियाएं दर्ज हैं।`, `${where} has ${pool.length} valid responses.`)],
      understood,
      basis: `N=${pool.length}`,
    };

  const describe = (q: "top_issue" | "party_preference" | "mla_satisfaction") => (q === "mla_satisfaction" ? mlaDistribution(pool, ctx.locale) : distribution(pool, q, ctx.ds.meta, "count"));
  if (topic === "summary") {
    const issues = describe("top_issue");
    const party = describe("party_preference");
    const stance = mlaStance(describe("mla_satisfaction"));
    if (pool.length < MIN_GROUP_N) return insufficient(understood, `N=${pool.length}`);
    const lines = [T(`${where} में ${pool.length} मान्य प्रतिक्रियाएं।`, `${pool.length} valid responses for ${where}.`)];
    if (issues.items[0]) lines.push(T(`सबसे अधिक चुना गया मुद्दा: ${issues.items[0].label} (${Math.round(issues.items[0].pct)}%, N=${issues.answered})।`, `Most selected issue: ${issues.items[0].label} (${Math.round(issues.items[0].pct)}%, N=${issues.answered}).`));
    if (party.items[0]) lines.push(T(`पार्टी समर्थन में सबसे अधिक चुना गया: ${party.items[0].label} (${Math.round(party.items[0].pct)}%, N=${party.answered})।`, `Most chosen on party support: ${party.items[0].label} (${Math.round(party.items[0].pct)}%, N=${party.answered}).`));
    if (stance.answered) lines.push(T(`विधायक के कार्यों पर: ${Math.round(stance.pos)}% सकारात्मक, ${Math.round(stance.neg)}% नकारात्मक, ${Math.round(stance.neu)}% तटस्थ (N=${stance.answered})।`, `MLA's work: ${Math.round(stance.pos)}% positive, ${Math.round(stance.neg)}% negative, ${Math.round(stance.neu)}% neutral (N=${stance.answered}).`));
    return { status: "ok", heading: `${where} — ${T("सारांश", "Summary")}`, lines, understood, basis: `N=${pool.length}` };
  }

  const q = topic === "issue" ? "top_issue" : topic === "party" ? "party_preference" : "mla_satisfaction";
  const d = describe(q);
  if (d.answered < MIN_GROUP_N) return insufficient(understood, `N=${d.answered}`);
  const top = [...d.items].filter((i) => i.count > 0).sort((x, y) => y.count - x.count)[0];
  const lines: string[] = [];
  if (topic === "issue" && top)
    lines.push(T(`${where} में मुद्दों का उत्तर देने वाले ${d.answered} में से ${top.count} उत्तरदाताओं (${Math.round(top.pct)}%) ने ${top.label} चुना — यह सबसे अधिक चुना गया मुद्दा है।`, `In ${where}, ${top.count} of ${d.answered} respondents (${Math.round(top.pct)}%) chose ${top.label} — the most selected issue.`));
  if (topic === "party" && top)
    lines.push(T(`${where} में पार्टी समर्थन के प्रश्न का उत्तर देने वाले ${d.answered} में से ${top.count} (${Math.round(top.pct)}%) ने ${top.label} चुना।`, `In ${where}, ${top.count} of ${d.answered} respondents (${Math.round(top.pct)}%) chose ${top.label} on party support.`));
  if (topic === "mla") {
    const s = mlaStance(d);
    lines.push(T(`${where} में विधायक के कार्यों पर ${Math.round(s.pos)}% ने सकारात्मक, ${Math.round(s.neg)}% ने नकारात्मक और ${Math.round(s.neu)}% ने तटस्थ राय दी।`, `In ${where}, ${Math.round(s.pos)}% were positive about the MLA's work, ${Math.round(s.neg)}% negative and ${Math.round(s.neu)}% neutral.`));
  }
  if (topic === "issue") lines.push(T("एक उत्तरदाता एक से अधिक मुद्दे चुन सकता है।", "Respondents can choose more than one issue."));
  return {
    status: "ok",
    heading: `${where} — ${{ issue: T("सबसे अधिक चुने गए मुद्दे", "Most selected issues"), party: T("पार्टी समर्थन", "Party support"), mla: T("विधायक के कार्यों पर राय", "Opinion on MLA's work") }[topic]}`,
    lines,
    understood,
    bars: bars(d, topic === "mla" ? 4 : 6),
    basis: T(`आधार: ${d.answered} उत्तरदाता`, `Base: ${d.answered} respondents`),
  };
}
