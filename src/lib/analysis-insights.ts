import type { StateAnalysisData } from "./state-analysis";
import { formatNumber } from "./utils";

// The Key Takeaway engine (Analysis spec Section 14). Every insight below is
// derived strictly from fields already present on StateAnalysisData — itself
// entirely computed from real SurveyResponse/SurveyAnswer rows — so this file
// never invents a number. An insight is only produced when its underlying
// data actually clears the platform's privacy/sample threshold (checked via
// each aggregation's own `lowData`/"available" flags before this runs); when
// none qualify, the caller shows the existing honest empty state. Order below
// is priority order — the caller slices to ~5–7 so the section stays useful
// rather than a wall of text.

export interface Insight {
  id: string;
  headline: string;
  percentage: number | null;
}

type T = Record<string, unknown> & {
  analysisHub: Record<string, string>;
};

function fmt(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce((acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)), template);
}

export function buildAnalysisInsights(data: StateAnalysisData, t: T, locale: "hi" | "en"): Insight[] {
  const candidates: Insight[] = [];
  const name = (label: string, nameHindi: string | null | undefined) => (locale === "hi" && nameHindi ? nameHindi : label);

  // 1. Leading party overall.
  if (data.statewide.partyPreference.state === "available") {
    const available = data.statewide.partyPreference.buckets.filter((b) => b.state === "available");
    if (available.length > 0) {
      const leader = available.reduce((a, b) => (b.percentage > a.percentage ? b : a));
      candidates.push({
        id: "leading-party",
        headline: fmt(t.analysisHub.takeawayLeadingParty, { party: name(leader.label, leader.nameHindi), percentage: leader.percentage }),
        percentage: leader.percentage,
      });
    }
  }

  // 2 & 3. Biggest month-over-month rise / fall (Party Momentum).
  const risers = data.partyMomentum.filter((m) => m.direction === "up" && m.changePp !== null).sort((a, b) => (b.changePp ?? 0) - (a.changePp ?? 0));
  const fallers = data.partyMomentum.filter((m) => m.direction === "down" && m.changePp !== null).sort((a, b) => (a.changePp ?? 0) - (b.changePp ?? 0));
  if (risers.length > 0) {
    const top = risers[0];
    candidates.push({
      id: "momentum-rise",
      headline: fmt(t.analysisHub.takeawayMomentumRise, { party: name(top.label, top.nameHindi), pp: Math.abs(top.changePp ?? 0) }),
      percentage: top.changePp,
    });
  }
  if (fallers.length > 0 && fallers[0].partyKey !== risers[0]?.partyKey) {
    const top = fallers[0];
    candidates.push({
      id: "momentum-fall",
      headline: fmt(t.analysisHub.takeawayMomentumFall, { party: name(top.label, top.nameHindi), pp: Math.abs(top.changePp ?? 0) }),
      percentage: top.changePp,
    });
  }

  // 4. Top issue overall.
  if (data.statewide.demographics.top_issue.state === "available") {
    const available = data.statewide.demographics.top_issue.buckets.filter((b) => b.state === "available");
    if (available.length > 0) {
      const top = available.reduce((a, b) => (b.percentage > a.percentage ? b : a));
      candidates.push({
        id: "top-issue",
        headline: fmt(t.analysisHub.takeawayTopIssue, { issue: top.label, percentage: top.percentage }),
        percentage: top.percentage,
      });
    }
  }

  // 5. Top issue for the party with the strongest single-issue concentration.
  const partyIssueLeaders = data.keyIssuesByParty
    .filter((p) => p.topIssues.length > 0 && p.respondentCount > 0)
    .map((p) => ({ party: p, issue: p.topIssues[0] }))
    .sort((a, b) => b.issue.percentage - a.issue.percentage);
  if (partyIssueLeaders.length > 0) {
    const { party, issue } = partyIssueLeaders[0];
    candidates.push({
      id: "top-issue-by-party",
      headline: fmt(t.analysisHub.takeawayTopIssueByParty, {
        party: name(party.partyLabel, party.partyNameHindi),
        issue: issue.label,
        percentage: issue.percentage,
      }),
      percentage: issue.percentage,
    });
  }

  // 6. Largest gender gap for any single party (only when both gender groups
  // clear the privacy/sample threshold).
  const genderRowsByKey = new Map(data.genderPartyRows.map((r) => [r.groupKey, r]));
  const male = genderRowsByKey.get("male");
  const female = genderRowsByKey.get("female");
  if (male && female && !male.lowData && !female.lowData) {
    const malePctByParty = new Map(male.parties.map((p) => [p.key, p]));
    let biggest: { party: (typeof female.parties)[number]; diff: number } | null = null;
    for (const fp of female.parties) {
      const mp = malePctByParty.get(fp.key);
      if (!mp) continue;
      const diff = fp.percentage - mp.percentage;
      if (!biggest || Math.abs(diff) > Math.abs(biggest.diff)) biggest = { party: fp, diff };
    }
    if (biggest && Math.abs(biggest.diff) >= 3) {
      const key = biggest.diff > 0 ? "takeawayGenderGapHigher" : "takeawayGenderGapLower";
      candidates.push({
        id: "gender-gap",
        headline: fmt(t.analysisHub[key], { party: name(biggest.party.label, biggest.party.nameHindi), pp: Math.abs(Math.round(biggest.diff * 10) / 10) }),
        percentage: Math.round(biggest.diff * 10) / 10,
      });
    }
  }

  // 7. Age group with the largest spread between its most- and
  // least-supported party (a simple, honest "polarization" signal — never
  // phrased as a prediction).
  const usableAgeRows = data.agePartyRows.filter((r) => !r.lowData && r.sampleSize > 0);
  if (usableAgeRows.length > 0) {
    let widest: { row: (typeof usableAgeRows)[number]; spread: number } | null = null;
    for (const row of usableAgeRows) {
      if (row.parties.length < 2) continue;
      const max = row.parties.reduce((a, b) => (b.percentage > a.percentage ? b : a));
      const min = row.parties.reduce((a, b) => (b.percentage < a.percentage ? b : a));
      const spread = max.percentage - min.percentage;
      if (!widest || spread > widest.spread) widest = { row, spread };
    }
    if (widest && widest.spread >= 10) {
      candidates.push({
        id: "age-spread",
        headline: fmt(t.analysisHub.takeawayAgeSpread, { group: widest.row.groupLabel }),
        percentage: widest.spread,
      });
    }
  }

  // 8. Religion/community group with the single highest reported support for
  // any one party (only from groups that clear the privacy/sample threshold).
  const usableReligionRows = data.religionPartyRows.filter((r) => !r.lowData && r.sampleSize > 0);
  if (usableReligionRows.length > 0) {
    let best: { group: string; party: (typeof usableReligionRows)[number]["parties"][number] } | null = null;
    for (const row of usableReligionRows) {
      for (const party of row.parties) {
        if (!best || party.percentage > best.party.percentage) best = { group: row.groupLabel, party };
      }
    }
    if (best && best.party.percentage > 0) {
      candidates.push({
        id: "religion-leader",
        headline: fmt(t.analysisHub.takeawayReligionLeader, {
          group: best.group,
          party: name(best.party.label, best.party.nameHindi),
          percentage: best.party.percentage,
        }),
        percentage: best.party.percentage,
      });
    }
  }

  // 9. Caste/social-category group with the single highest reported support
  // for any one party (mirrors the religion-leader check above).
  const usableCasteRows = data.castePartyRows.filter((r) => !r.lowData && r.sampleSize > 0);
  if (usableCasteRows.length > 0) {
    let best: { group: string; party: (typeof usableCasteRows)[number]["parties"][number] } | null = null;
    for (const row of usableCasteRows) {
      for (const party of row.parties) {
        if (!best || party.percentage > best.party.percentage) best = { group: row.groupLabel, party };
      }
    }
    if (best && best.party.percentage > 0) {
      candidates.push({
        id: "caste-leader",
        headline: fmt(t.analysisHub.takeawayCasteLeader, {
          group: best.group,
          party: name(best.party.label, best.party.nameHindi),
          percentage: best.party.percentage,
        }),
        percentage: best.party.percentage,
      });
    }
  }

  // 10. Undecided share.
  if (data.statewide.partyPreference.state === "available") {
    const undecided = data.statewide.partyPreference.buckets.find((b) => b.key === "undecided" && b.state === "available");
    if (undecided && undecided.state === "available") {
      candidates.push({
        id: "undecided",
        headline: fmt(t.analysisHub.takeawayUndecided, { percentage: undecided.percentage }),
        percentage: undecided.percentage,
      });
    }
  }

  // 10. Geographic response spread (filler, used only if earlier candidates
  // didn't already fill the section).
  if (data.statewide.respondingConstituencyCount > 0) {
    candidates.push({
      id: "response-spread",
      headline: fmt(t.analysisHub.takeawayResponseSpread, {
        count: formatNumber(data.statewide.respondingConstituencyCount),
        total: formatNumber(data.statewide.totalConstituencies),
      }),
      percentage: null,
    });
  }

  return candidates.slice(0, 8);
}
