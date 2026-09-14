// Seeds realistic, clearly-marked SYNTHETIC survey responses so the Analysis
// dashboard has meaningful data to develop/test against, across all four
// target states (Uttar Pradesh, Punjab, Goa, Uttarakhand).
//
// MARKER: every row this script writes has SurveyResponse.dataSource set to
// the existing "synthetic_demo" string (the same marker the admin-only
// per-constituency generator in src/lib/synthetic-data.ts already uses — no
// new schema field, no new marker invented). Real responses default to
// "real" and are NEVER read, touched, or deleted by this script — every
// query here is explicitly filtered by dataSource.
//
// IDEMPOTENT: constituency selection is fully deterministic (same districts/
// constituencies chosen every run), and each run first deletes only the
// synthetic_demo rows already sitting in those exact constituencies before
// re-inserting — so running this twice reaches the same end state rather
// than doubling records.
//
// NOTE: src/lib/synthetic-data.ts cannot be imported from a plain script —
// it starts with `import "server-only"`, which throws outside a React
// Server Component. This script is therefore self-contained (it does not
// reuse that module's generator, which is also UP-party-hardcoded and would
// silently drop most answers for Punjab/Goa/Uttarakhand — see the audit
// notes in the final report).
//
// Run: npm run seed:analysis-demo

import { randomUUID } from "node:crypto";
import { prisma } from "../src/lib/prisma";

const SYNTHETIC_DATA_SOURCE = "synthetic_demo";
const REAL_DATA_SOURCE = "real";
const ELIGIBLE_STATUS = "VALID";

const CONSTITUENCIES_PER_STATE = 7;
const TOTAL_RESPONSES_PER_STATE = 220;
const MONTHS_BACK = 8;

type StateSlug = "uttar-pradesh" | "punjab" | "goa" | "uttarakhand";
const TARGET_STATE_SLUGS: StateSlug[] = ["uttar-pradesh", "punjab", "goa", "uttarakhand"];

// ---------------------------------------------------------------------------
// Synthetic distributions — believable, state-differentiated, never a
// 90%+/identical-across-states shape. Every key below is a REAL seeded
// option key (verified against prisma/data/state-seeds.ts and the live DB
// before writing this file) — nothing invented.
// ---------------------------------------------------------------------------

const PARTY_BASE_WEIGHTS: Record<StateSlug, Record<string, number>> = {
  "uttar-pradesh": { bjp: 0.38, sp: 0.3, congress: 0.1, bsp: 0.12, rld: 0.03, other: 0.03, undecided: 0.03, nota: 0.01 },
  punjab: { aap: 0.36, congress: 0.26, bjp: 0.16, sad: 0.14, other: 0.03, undecided: 0.03, nota: 0.02 },
  goa: { bjp: 0.34, congress: 0.28, aap: 0.16, mgp: 0.12, other: 0.04, undecided: 0.04, nota: 0.02 },
  uttarakhand: { bjp: 0.4, congress: 0.28, aap: 0.16, bsp: 0.08, other: 0.03, undecided: 0.03, nota: 0.02 },
};

// Which party gains / declines over the MONTHS_BACK window, and by roughly
// how many percentage points per month — enough for a visible, non-identical
// trend line and non-trivial momentum per state (never framed as "will win").
const TREND_DRIFT: Record<StateSlug, { gaining: string; declining: string; ppPerMonth: number }> = {
  "uttar-pradesh": { gaining: "sp", declining: "bjp", ppPerMonth: 0.9 },
  punjab: { gaining: "congress", declining: "aap", ppPerMonth: 0.8 },
  goa: { gaining: "aap", declining: "bjp", ppPerMonth: 0.7 },
  uttarakhand: { gaining: "congress", declining: "bjp", ppPerMonth: 0.6 },
};

// Mild, not-extreme demographic correlations (additive weight nudges).
const YOUTH_LEANING_PARTY: Record<StateSlug, string> = { "uttar-pradesh": "sp", punjab: "aap", goa: "aap", uttarakhand: "aap" };
const OLDER_LEANING_PARTY: Record<StateSlug, string> = { "uttar-pradesh": "bjp", punjab: "sad", goa: "congress", uttarakhand: "bjp" };
const WOMEN_LEANING_PARTY: Record<StateSlug, string> = { "uttar-pradesh": "bsp", punjab: "congress", goa: "congress", uttarakhand: "congress" };

// religion key -> { favoured party, penalised party, shift amount } — kept
// modest (0.08-0.12) so no group becomes a monolithic bloc.
const RELIGION_PARTY_TILT: Record<StateSlug, Record<string, { favour: string; penalise: string; amount: number }>> = {
  "uttar-pradesh": { muslim: { favour: "sp", penalise: "bjp", amount: 0.12 } },
  punjab: { sikh: { favour: "sad", penalise: "aap", amount: 0.08 } },
  goa: { christian: { favour: "congress", penalise: "bjp", amount: 0.1 } },
  uttarakhand: { muslim: { favour: "congress", penalise: "bjp", amount: 0.1 } },
};

const AGE_WEIGHTS: Record<string, number> = {
  "18-24": 0.18,
  "25-34": 0.28,
  "35-44": 0.24,
  "45-54": 0.15,
  "55-64": 0.09,
  "65+": 0.05,
  prefer_not_to_say: 0.01,
};
const GENDER_WEIGHTS: Record<string, number> = { female: 0.46, male: 0.52, other: 0.01, prefer_not_to_say: 0.01 };

// Real-world-plausible and genuinely different per state (no invented
// categories — only option keys that exist in every state's seeded survey).
const RELIGION_WEIGHTS: Record<StateSlug, Record<string, number>> = {
  "uttar-pradesh": { hindu: 0.76, muslim: 0.18, sikh: 0.02, christian: 0.01, jain: 0.01, buddhist: 0.01, other: 0.005, prefer_not_to_say: 0.005 },
  punjab: { sikh: 0.55, hindu: 0.35, muslim: 0.03, christian: 0.03, jain: 0.01, buddhist: 0.01, other: 0.01, prefer_not_to_say: 0.01 },
  goa: { hindu: 0.62, christian: 0.28, muslim: 0.06, other: 0.01, sikh: 0.01, jain: 0.01, buddhist: 0.005, prefer_not_to_say: 0.005 },
  uttarakhand: { hindu: 0.78, muslim: 0.14, sikh: 0.03, christian: 0.02, jain: 0.01, buddhist: 0.01, other: 0.005, prefer_not_to_say: 0.005 },
};

const ISSUE_KEYS = ["bijli", "jal_nikasi", "kanoon_vyavastha", "krishi", "mahangai", "other", "pani", "parivahan", "rojgar", "sadak", "shiksha", "swasthya"];
const YOUNG_ISSUE_TILT = ["rojgar", "shiksha"];
const OLDER_ISSUE_TILT = ["swasthya", "kanoon_vyavastha"];

// Each party's supporters skew toward 2-3 "signature" issues — this is what
// makes Key Issues by Party / Party x Issue / the heatmap show real
// differences rather than an identical issue mix per party.
const PARTY_ISSUE_FOCUS: Record<StateSlug, Record<string, string[]>> = {
  "uttar-pradesh": { bjp: ["kanoon_vyavastha", "sadak", "bijli"], sp: ["rojgar", "mahangai", "krishi"], bsp: ["shiksha", "swasthya"], congress: ["mahangai", "rojgar"], rld: ["krishi", "pani"] },
  punjab: { aap: ["bijli", "shiksha", "rojgar"], congress: ["mahangai", "krishi"], bjp: ["kanoon_vyavastha", "sadak"], sad: ["krishi", "pani"] },
  goa: { bjp: ["sadak", "kanoon_vyavastha"], congress: ["mahangai", "rojgar"], aap: ["shiksha", "swasthya"], mgp: ["krishi", "parivahan"] },
  uttarakhand: { bjp: ["sadak", "kanoon_vyavastha"], congress: ["mahangai", "rojgar"], aap: ["shiksha", "swasthya"], bsp: ["pani", "krishi"] },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function weightedPick(weights: Record<string, number>): string {
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let r = Math.random() * total;
  for (const [key, w] of entries) {
    r -= w;
    if (r <= 0) return key;
  }
  return entries[entries.length - 1][0];
}

function monthBuckets(monthsBack: number): { year: number; month: number }[] {
  const now = new Date();
  const buckets: { year: number; month: number }[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ year: d.getFullYear(), month: d.getMonth() });
  }
  return buckets;
}

function randomDateInMonth(year: number, month: number): Date {
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  const lastDay = isCurrentMonth ? now.getDate() : new Date(year, month + 1, 0).getDate();
  const day = 1 + Math.floor(Math.random() * lastDay);
  const hour = Math.floor(Math.random() * 24);
  const minute = Math.floor(Math.random() * 60);
  return new Date(year, month, day, hour, minute);
}

interface SurveyOptionMaps {
  surveyId: string;
  partyQuestionId: string;
  partyOptionByKey: Map<string, string>;
  issueQuestionId: string;
  issueOptionByKey: Map<string, string>;
  ageQuestionId: string;
  ageOptionByKey: Map<string, string>;
  genderQuestionId: string;
  genderOptionByKey: Map<string, string>;
  religionQuestionId: string;
  religionOptionByKey: Map<string, string>;
}

async function loadSurveyOptionMaps(constituencyId: string): Promise<SurveyOptionMaps | null> {
  const survey = await prisma.survey.findFirst({ where: { constituencyId }, select: { id: true } });
  if (!survey) return null;

  const questions = await prisma.surveyQuestion.findMany({
    where: { surveyId: survey.id, key: { in: ["party_preference", "top_issue", "age_group", "gender", "religion"] } },
    select: { id: true, key: true, options: { where: { isActive: true }, select: { id: true, key: true } } },
  });

  const byKey = new Map(questions.map((q) => [q.key, q]));
  const party = byKey.get("party_preference");
  const issue = byKey.get("top_issue");
  const age = byKey.get("age_group");
  const gender = byKey.get("gender");
  const religion = byKey.get("religion");
  if (!party || !issue || !age || !gender || !religion) return null;

  return {
    surveyId: survey.id,
    partyQuestionId: party.id,
    partyOptionByKey: new Map(party.options.map((o) => [o.key, o.id])),
    issueQuestionId: issue.id,
    issueOptionByKey: new Map(issue.options.map((o) => [o.key, o.id])),
    ageQuestionId: age.id,
    ageOptionByKey: new Map(age.options.map((o) => [o.key, o.id])),
    genderQuestionId: gender.id,
    genderOptionByKey: new Map(gender.options.map((o) => [o.key, o.id])),
    religionQuestionId: religion.id,
    religionOptionByKey: new Map(religion.options.map((o) => [o.key, o.id])),
  };
}

async function pickTargetConstituencies(stateId: string, count: number) {
  const districts = await prisma.district.findMany({ where: { stateId }, orderBy: { name: "asc" }, select: { id: true, name: true } });
  const picked: { id: string; slug: string; name: string; districtName: string }[] = [];
  let districtIndex = 0;
  let roundsWithoutPick = 0;
  while (picked.length < count && districts.length > 0 && roundsWithoutPick < districts.length + 1) {
    const district = districts[districtIndex % districts.length];
    const alreadyPickedFromDistrict = picked.filter((p) => p.districtName === district.name).length;
    const candidate = await prisma.constituency.findFirst({
      where: { districtId: district.id },
      orderBy: { number: "asc" },
      skip: alreadyPickedFromDistrict,
      select: { id: true, slug: true, name: true },
    });
    districtIndex += 1;
    if (candidate && !picked.some((p) => p.id === candidate.id)) {
      picked.push({ ...candidate, districtName: district.name });
      roundsWithoutPick = 0;
    } else {
      roundsWithoutPick += 1;
    }
  }
  return picked;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=== Analysis demo data seed ===\n");

  const realBefore = await prisma.surveyResponse.count({ where: { dataSource: REAL_DATA_SOURCE } });
  const syntheticBefore = await prisma.surveyResponse.count({ where: { dataSource: SYNTHETIC_DATA_SOURCE } });
  console.log(`REAL RESPONSES BEFORE: ${realBefore}`);
  console.log(`SYNTHETIC RESPONSES BEFORE: ${syntheticBefore}\n`);

  const months = monthBuckets(MONTHS_BACK);
  // Mildly increasing volume toward the present — realistic for a growing
  // survey rather than a flat/uniform spread.
  const monthWeights = [0.08, 0.09, 0.11, 0.12, 0.13, 0.14, 0.15, 0.18].slice(0, months.length);
  const monthWeightSum = monthWeights.reduce((a, b) => a + b, 0);

  const report: Record<string, { responses: number; constituencies: string[]; months: string[]; parties: string[] }> = {};
  let totalInserted = 0;

  for (const stateSlug of TARGET_STATE_SLUGS) {
    const state = await prisma.state.findUnique({ where: { slug: stateSlug }, select: { id: true, name: true } });
    if (!state) {
      console.log(`SKIP ${stateSlug}: state not found in DB.`);
      continue;
    }
    const election = await prisma.election.findFirst({ where: { stateId: state.id, isActive: true }, select: { id: true, slug: true } });
    if (!election) {
      console.log(`SKIP ${stateSlug}: no active election found — not fabricating one.`);
      continue;
    }

    const constituencies = await pickTargetConstituencies(state.id, CONSTITUENCIES_PER_STATE);
    if (constituencies.length === 0) {
      console.log(`SKIP ${stateSlug}: no constituencies found.`);
      continue;
    }

    // Idempotency: clear only THIS run's exact target constituencies' prior
    // synthetic rows before re-inserting — never touches real data (filtered
    // by dataSource) and never touches constituencies outside this list.
    const constituencyIds = constituencies.map((c) => c.id);
    const priorSynthetic = await prisma.surveyResponse.findMany({
      where: { dataSource: SYNTHETIC_DATA_SOURCE, constituencyId: { in: constituencyIds } },
      select: { id: true },
    });
    if (priorSynthetic.length > 0) {
      const priorIds = priorSynthetic.map((r) => r.id);
      await prisma.surveyAnswer.deleteMany({ where: { responseId: { in: priorIds } } });
      await prisma.surveyResponse.deleteMany({ where: { id: { in: priorIds } } });
    }

    // Uneven weighting across the chosen constituencies (not a flat split) —
    // a couple of "hub" seats get more responses, matching a realistic
    // partial-rollout survey rather than perfectly uniform coverage.
    const constituencyShape = [1.4, 1.25, 1.1, 1.0, 0.9, 0.8, 0.7].slice(0, constituencies.length);
    const shapeSum = constituencyShape.reduce((a, b) => a + b, 0);

    const partyBase = PARTY_BASE_WEIGHTS[stateSlug];
    const religionWeights = RELIGION_WEIGHTS[stateSlug];
    const drift = TREND_DRIFT[stateSlug];
    const youthParty = YOUTH_LEANING_PARTY[stateSlug];
    const olderParty = OLDER_LEANING_PARTY[stateSlug];
    const womenParty = WOMEN_LEANING_PARTY[stateSlug];
    const religionTilt = RELIGION_PARTY_TILT[stateSlug];
    const issueFocus = PARTY_ISSUE_FOCUS[stateSlug];

    const responseRows: { id: string; surveyId: string; constituencyId: string; status: string; dataSource: string; createdAt: Date }[] = [];
    const answerRows: { id: string; responseId: string; questionId: string; optionId: string }[] = [];
    const partiesUsed = new Set<string>();
    const monthsUsed = new Set<string>();

    for (let ci = 0; ci < constituencies.length; ci++) {
      const constituency = constituencies[ci];
      const maps = await loadSurveyOptionMaps(constituency.id);
      if (!maps) {
        console.log(`  (skipping ${constituency.name} — survey questions not fully seeded there)`);
        continue;
      }

      const constituencyCount = Math.round((TOTAL_RESPONSES_PER_STATE * constituencyShape[ci]) / shapeSum);

      for (let i = 0; i < constituencyCount; i++) {
        // Month (weighted toward recent).
        let mr = Math.random() * monthWeightSum;
        let monthIdx = months.length - 1;
        for (let m = 0; m < monthWeights.length; m++) {
          mr -= monthWeights[m];
          if (mr <= 0) {
            monthIdx = m;
            break;
          }
        }
        const bucket = months[monthIdx];
        const createdAt = randomDateInMonth(bucket.year, bucket.month);
        monthsUsed.add(`${bucket.year}-${String(bucket.month + 1).padStart(2, "0")}`);

        // Demographics.
        const age = weightedPick(AGE_WEIGHTS);
        const gender = weightedPick(GENDER_WEIGHTS);
        const religion = weightedPick(religionWeights);

        // Party weights: base + month drift + demographic tilts.
        const partyWeights: Record<string, number> = { ...partyBase };
        const bump = (key: string, amount: number) => {
          if (key in partyWeights) partyWeights[key] = Math.max(0.01, partyWeights[key] + amount);
        };
        if (drift) {
          const t = months.length > 1 ? monthIdx / (months.length - 1) : 0.5;
          const totalSwing = (drift.ppPerMonth * (months.length - 1)) / 100;
          const shift = totalSwing * (t - 0.5);
          bump(drift.gaining, shift);
          bump(drift.declining, -shift);
        }
        if (age === "18-24" || age === "25-34") bump(youthParty, 0.08);
        if (age === "55-64" || age === "65+") bump(olderParty, 0.06);
        if (gender === "female") bump(womenParty, 0.05);
        const tilt = religionTilt[religion];
        if (tilt) {
          bump(tilt.favour, tilt.amount);
          bump(tilt.penalise, -tilt.amount);
        }

        const partyKey = weightedPick(partyWeights);
        partiesUsed.add(partyKey);

        // Issues: baseline probability per issue + this party's focus boost
        // + a mild age tilt — sampled independently (multi-select), never
        // treated as mutually exclusive, with 1-4 selections per response.
        const issueProb: Record<string, number> = {};
        for (const key of ISSUE_KEYS) issueProb[key] = 0.12;
        for (const key of issueFocus[partyKey] ?? []) issueProb[key] = (issueProb[key] ?? 0.12) + 0.38;
        const ageTiltIssues = age === "18-24" || age === "25-34" ? YOUNG_ISSUE_TILT : age === "55-64" || age === "65+" ? OLDER_ISSUE_TILT : [];
        for (const key of ageTiltIssues) issueProb[key] = (issueProb[key] ?? 0.12) + 0.15;

        let selectedIssues = ISSUE_KEYS.filter((key) => Math.random() < Math.min(0.9, issueProb[key]));
        if (selectedIssues.length === 0) {
          selectedIssues = [Object.entries(issueProb).sort((a, b) => b[1] - a[1])[0][0]];
        }
        if (selectedIssues.length > 4) {
          selectedIssues = selectedIssues.sort((a, b) => issueProb[b] - issueProb[a]).slice(0, 4);
        }

        const responseId = randomUUID();
        responseRows.push({
          id: responseId,
          surveyId: maps.surveyId,
          constituencyId: constituency.id,
          status: ELIGIBLE_STATUS,
          dataSource: SYNTHETIC_DATA_SOURCE,
          createdAt,
        });

        const partyOptionId = maps.partyOptionByKey.get(partyKey);
        if (partyOptionId) answerRows.push({ id: randomUUID(), responseId, questionId: maps.partyQuestionId, optionId: partyOptionId });

        const ageOptionId = maps.ageOptionByKey.get(age);
        if (ageOptionId) answerRows.push({ id: randomUUID(), responseId, questionId: maps.ageQuestionId, optionId: ageOptionId });

        const genderOptionId = maps.genderOptionByKey.get(gender);
        if (genderOptionId) answerRows.push({ id: randomUUID(), responseId, questionId: maps.genderQuestionId, optionId: genderOptionId });

        const religionOptionId = maps.religionOptionByKey.get(religion);
        if (religionOptionId) answerRows.push({ id: randomUUID(), responseId, questionId: maps.religionQuestionId, optionId: religionOptionId });

        for (const issueKey of selectedIssues) {
          const issueOptionId = maps.issueOptionByKey.get(issueKey);
          if (issueOptionId) answerRows.push({ id: randomUUID(), responseId, questionId: maps.issueQuestionId, optionId: issueOptionId });
        }
      }
    }

    // Bulk insert in chunks.
    const CHUNK = 500;
    for (let i = 0; i < responseRows.length; i += CHUNK) {
      await prisma.surveyResponse.createMany({ data: responseRows.slice(i, i + CHUNK) });
    }
    for (let i = 0; i < answerRows.length; i += CHUNK) {
      await prisma.surveyAnswer.createMany({ data: answerRows.slice(i, i + CHUNK) });
    }

    totalInserted += responseRows.length;
    report[stateSlug] = {
      responses: responseRows.length,
      constituencies: constituencies.map((c) => c.name),
      months: Array.from(monthsUsed).sort(),
      parties: Array.from(partiesUsed).sort(),
    };
    console.log(`${state.name}: inserted ${responseRows.length} synthetic responses across ${constituencies.length} constituencies (${constituencies.map((c) => c.name).join(", ")}).`);
  }

  const realAfter = await prisma.surveyResponse.count({ where: { dataSource: REAL_DATA_SOURCE } });
  const syntheticAfter = await prisma.surveyResponse.count({ where: { dataSource: SYNTHETIC_DATA_SOURCE } });

  console.log("\n=== Summary ===");
  console.log(`REAL RESPONSES BEFORE: ${realBefore}`);
  console.log(`SYNTHETIC RESPONSES BEFORE: ${syntheticBefore}`);
  console.log(`SYNTHETIC INSERTED THIS RUN: ${totalInserted}`);
  console.log(`REAL RESPONSES AFTER: ${realAfter}`);
  console.log(`SYNTHETIC RESPONSES AFTER: ${syntheticAfter}`);
  console.log(`\nREAL RESPONSES UNCHANGED: ${realBefore === realAfter ? "YES" : "NO — INVESTIGATE IMMEDIATELY"}`);

  console.log("\n=== Per-state detail ===");
  for (const [slug, info] of Object.entries(report)) {
    console.log(`\n${slug}:`);
    console.log(`  responses: ${info.responses}`);
    console.log(`  constituencies (${info.constituencies.length}): ${info.constituencies.join(", ")}`);
    console.log(`  months covered (${info.months.length}): ${info.months.join(", ")}`);
    console.log(`  parties represented: ${info.parties.join(", ")}`);
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
