// Small, PURE presentation helpers that turn already-computed analysis data
// into 1–3 short "what am I looking at" bullets for the Analysis dashboard.
// Nothing here queries the database or recomputes a percentage — every
// function takes data that has already been aggregated (with privacy
// suppression already applied) elsewhere in state-analysis.ts, and only
// picks/phrases which numbers to surface. If the underlying data doesn't
// support a reading, the function returns an empty array — callers must
// render the existing "not enough data" state instead, never a placeholder.
import type { PublicAnalyticsBucket, PublicDistribution } from "./public-analytics-core";
import type { DemographicGroupPartyRow, IssuePartyMatrixRow, PartyMomentumItem, PartySegmentMeta, PartyTopIssues, VotePreferenceTrend } from "./state-analysis";
import { resolveOptionLabel } from "./option-labels";

type T = Record<string, unknown> & { analysisHub: Record<string, string>; surveyQuestions: { options: Record<string, string> } };

export function fmt(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce((acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)), template);
}

function nameOf(label: string, nameHindi: string | null | undefined, locale: "hi" | "en"): string {
  return locale === "hi" && nameHindi ? nameHindi : label;
}

// Issue/demographic group labels (unlike party labels, which have a real
// nameHindi field) only ever have ONE stored label — see option-labels.ts
// for why. Reuses the same survey-question dictionary the input form uses.
function groupNameOf(key: string, label: string, t: T, locale: "hi" | "en"): string {
  return resolveOptionLabel(key, { label }, locale, t.surveyQuestions.options);
}

const MONTH_LABELS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_LABELS_HI = ["जन", "फ़र", "मार्च", "अप्रैल", "मई", "जून", "जुल", "अग", "सित", "अक्तू", "नव", "दिस"];

// Short axis-tick label ("Apr") for a "YYYY-MM" month key — shared by the
// trend chart's XAxis and anywhere else a compact month label is needed.
export function monthLabel(monthKey: string, locale: "hi" | "en"): string {
  const [, monthStr] = monthKey.split("-");
  const monthIndex = Number(monthStr) - 1;
  const labels = locale === "hi" ? MONTH_LABELS_HI : MONTH_LABELS_EN;
  return labels[monthIndex] ?? monthKey;
}

// Full "April 2026" label for a "YYYY-MM" month key — used by the trend
// chart's hover label and the Party Momentum month picker/subtitles.
export function fullMonthLabel(monthKey: string, locale: "hi" | "en"): string {
  const [yearStr, monthStr] = monthKey.split("-");
  const date = new Date(Number(yearStr), Number(monthStr) - 1, 1);
  if (Number.isNaN(date.getTime())) return monthKey;
  return new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", { month: "long", year: "numeric" }).format(date);
}

// Party Support / Current Vote Share — same underlying distribution, so one
// reading serves both halves of the Party Landscape module.
export function buildPartySupportReading(buckets: PublicAnalyticsBucket[], t: T, locale: "hi" | "en"): string[] {
  const available = buckets
    .filter((b): b is Extract<PublicAnalyticsBucket, { state: "available" }> => b.state === "available")
    .sort((a, b) => b.percentage - a.percentage);
  if (available.length === 0) return [];

  const lines: string[] = [];
  const [first, second, third] = available;
  if (second && Math.abs(first.percentage - second.percentage) <= 2) {
    lines.push(
      fmt(t.analysisHub.readingCloseRace, {
        partyA: nameOf(first.label, first.nameHindi, locale),
        partyB: nameOf(second.label, second.nameHindi, locale),
        pctA: first.percentage,
        pctB: second.percentage,
      })
    );
  } else {
    lines.push(fmt(t.analysisHub.readingLeadingParty, { party: nameOf(first.label, first.nameHindi, locale), percentage: first.percentage }));
  }
  if (third) {
    lines.push(fmt(t.analysisHub.readingThirdParty, { party: nameOf(third.label, third.nameHindi, locale), percentage: third.percentage }));
  }
  return lines.slice(0, 2);
}

// Generalizes state-analysis.ts's computePartyMomentum to ANY month index,
// not just the latest — powers the Party Momentum month picker on the
// client (state-analysis.ts can't be imported there, it's server-only).
// Same methodology as the original: percentage-point delta vs the
// immediately preceding month, .5pp threshold for up/down vs "stable", and
// a party missing from the previous month is "new" rather than a fabricated
// delta. `index` must have a previous month (index >= 1) to produce a
// comparison.
export function computeMomentumForMonthIndex(trend: VotePreferenceTrend, index: number): PartyMomentumItem[] {
  if (!trend.hasEnoughData || index < 1 || index >= trend.months.length) return [];
  const current = trend.months[index];
  const previous = trend.months[index - 1];
  const prevByKey = new Map(previous.parties.map((p) => [p.key, p]));

  return current.parties
    .map((p) => {
      const prev = prevByKey.get(p.key);
      const changePp = prev ? Math.round((p.percentage - prev.percentage) * 10) / 10 : null;
      const direction: PartyMomentumItem["direction"] = changePp === null ? "new" : changePp > 0.5 ? "up" : changePp < -0.5 ? "down" : "stable";
      return {
        partyKey: p.key,
        label: p.label,
        nameHindi: p.nameHindi,
        colorHex: p.colorHex,
        currentPct: p.percentage,
        previousPct: prev ? prev.percentage : null,
        changePp,
        direction,
      };
    })
    .sort((a, b) => b.currentPct - a.currentPct);
}

// Party Momentum / trend — biggest riser and biggest faller, expressed as
// percentage-point movement (never a raw count delta, never a prediction).
export function buildMomentumReading(momentum: PartyMomentumItem[], t: T, locale: "hi" | "en"): string[] {
  const risers = momentum.filter((m) => m.direction === "up" && m.changePp !== null).sort((a, b) => (b.changePp ?? 0) - (a.changePp ?? 0));
  const fallers = momentum.filter((m) => m.direction === "down" && m.changePp !== null).sort((a, b) => (a.changePp ?? 0) - (b.changePp ?? 0));
  const lines: string[] = [];
  if (risers[0]) {
    lines.push(fmt(t.analysisHub.takeawayMomentumRise, { party: nameOf(risers[0].label, risers[0].nameHindi, locale), pp: Math.abs(risers[0].changePp ?? 0) }));
  }
  if (fallers[0] && fallers[0].partyKey !== risers[0]?.partyKey) {
    lines.push(fmt(t.analysisHub.takeawayMomentumFall, { party: nameOf(fallers[0].label, fallers[0].nameHindi, locale), pp: Math.abs(fallers[0].changePp ?? 0) }));
  }
  return lines.slice(0, 2);
}

// Key Issues by Party Supporters — compares the #1 issue of the two largest
// (non-suppressed) parties.
export function buildPartyIssueReading(parties: PartyTopIssues[], t: T, locale: "hi" | "en"): string[] {
  const usable = parties.filter((p) => !p.lowData && p.topIssues.length > 0).sort((a, b) => b.respondentCount - a.respondentCount);
  if (usable.length === 0) return [];
  const lines: string[] = [];
  const top = usable[0];
  lines.push(
    fmt(t.analysisHub.readingPartyTopIssue, {
      party: nameOf(top.partyLabel, top.partyNameHindi, locale),
      issue: groupNameOf(top.topIssues[0].key, top.topIssues[0].label, t, locale),
      percentage: top.topIssues[0].percentage,
    })
  );
  if (usable[1] && usable[1].topIssues[0].key !== top.topIssues[0].key) {
    lines.push(
      fmt(t.analysisHub.readingPartyTopIssue, {
        party: nameOf(usable[1].partyLabel, usable[1].partyNameHindi, locale),
        issue: groupNameOf(usable[1].topIssues[0].key, usable[1].topIssues[0].label, t, locale),
        percentage: usable[1].topIssues[0].percentage,
      })
    );
  }
  return lines.slice(0, 2);
}

// Issue x Party heatmap / Party x Issue comparison — for the single most-
// mentioned issue, which party's supporters selected it most vs least
// (among cells that cleared the privacy threshold).
export function buildHeatmapReading(rows: IssuePartyMatrixRow[], segments: PartySegmentMeta[], t: T, locale: "hi" | "en"): string[] {
  if (rows.length === 0) return [];
  const row = rows[0];
  const usableCells = row.cells.filter((c) => !c.lowData);
  if (usableCells.length < 2) return [];
  const max = usableCells.reduce((a, b) => (b.percentage > a.percentage ? b : a));
  const min = usableCells.reduce((a, b) => (b.percentage < a.percentage ? b : a));
  if (max.partyKey === min.partyKey) return [];
  const maxParty = segments.find((s) => s.key === max.partyKey);
  const minParty = segments.find((s) => s.key === min.partyKey);
  if (!maxParty || !minParty) return [];
  return [
    fmt(t.analysisHub.readingHeatmapGap, {
      issue: groupNameOf(row.issueKey, row.issueLabel, t, locale),
      partyA: nameOf(maxParty.label, maxParty.nameHindi, locale),
      pctA: max.percentage,
      partyB: nameOf(minParty.label, minParty.nameHindi, locale),
      pctB: min.percentage,
    }),
  ];
}

// Demographic x Party (Age/Gender/Religion/Caste) — the single reported
// leader within one group. Reused across all four dimensions instead of
// four separate implementations.
export function buildDemographicLeaderReading(row: DemographicGroupPartyRow, t: T, locale: "hi" | "en"): string | null {
  if (row.lowData || row.parties.length === 0) return null;
  const leader = row.parties.reduce((a, b) => (b.percentage > a.percentage ? b : a));
  if (leader.percentage <= 0) return null;
  return fmt(t.analysisHub.groupLeaderNote, {
    group: groupNameOf(row.groupKey, row.groupLabel, t, locale),
    party: nameOf(leader.label, leader.nameHindi, locale),
    percentage: leader.percentage,
  });
}

// The 40%-column reading for a Demographic x Party chart (Age/Gender/
// Religion/Caste) — one leader-party line per group, largest groups first,
// so the summary column surfaces the most representative comparisons first
// rather than an arbitrary/alphabetical order. Same per-row leader logic as
// buildDemographicLeaderReading, just applied across the whole dimension and
// capped to a handful of lines so the column stays scannable.
export function buildDemographicPartyReading(rows: DemographicGroupPartyRow[], t: T, locale: "hi" | "en", limit = 4): string[] {
  return rows
    .filter((r) => !r.lowData && r.sampleSize > 0)
    .slice()
    .sort((a, b) => b.sampleSize - a.sampleSize)
    .slice(0, limit)
    .map((row) => buildDemographicLeaderReading(row, t, locale))
    .filter((line): line is string => Boolean(line));
}

// Respondent Profile (Age/Gender/Religion/Social Category composition) — the
// largest group, and the runner-up when one exists, phrased as a plain
// "who took this survey" fact rather than anything about party preference.
export function buildDistributionInsight(distribution: PublicDistribution, t: T, locale: "hi" | "en"): string | null {
  if (distribution.state !== "available") return null;
  const available = distribution.buckets
    .filter((b): b is Extract<PublicAnalyticsBucket, { state: "available" }> => b.state === "available")
    .sort((a, b) => b.percentage - a.percentage);
  if (available.length === 0) return null;
  const top = available[0];
  if (top.percentage <= 0) return null;
  if (!available[1]) {
    return fmt(t.analysisHub.distributionInsightSingle, { label: groupNameOf(top.key, top.label, t, locale), percentage: top.percentage });
  }
  const second = available[1];
  return fmt(t.analysisHub.distributionInsight, {
    topLabel: groupNameOf(top.key, top.label, t, locale),
    topPercentage: top.percentage,
    secondLabel: groupNameOf(second.key, second.label, t, locale),
    secondPercentage: second.percentage,
  });
}
