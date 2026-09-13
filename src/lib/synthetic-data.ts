import "server-only";

import { randomUUID } from "node:crypto";
import { prisma } from "./prisma";

// Admin-generated demo/testing dataset — see the "Demo Data Mode" admin
// screen (src/app/admin/synthetic-data/page.tsx). Every row this module
// writes is tagged `dataSource: SYNTHETIC_DATA_SOURCE` so it can never be
// mistaken for (or silently mixed with) real survey responses: the public
// aggregation layer (public-survey-results.ts / public-statewide-results.ts)
// always filters on this field, switching between "real" and
// "synthetic_demo" based on the SYNTHETIC_DATA_MODE site setting.
export const SYNTHETIC_DATA_SOURCE = "synthetic_demo";
export const REAL_DATA_SOURCE = "real";
export const SYNTHETIC_DATA_MODE_KEY = "SYNTHETIC_DATA_MODE";

const GENERATED_QUESTION_KEYS = ["party_preference", "top_issue", "age_group", "gender", "social_category", "religion"] as const;
type GeneratedQuestionKey = (typeof GENERATED_QUESTION_KEYS)[number];

// One plausible statewide vote-share "shape" per constituency — picked at
// random per constituency, then perturbed with noise (see withNoise) so no
// two constituencies come out identical even when they share an archetype.
// Every archetype's weights are written to sum to 1 before noise is applied.
const PARTY_ARCHETYPES: Record<string, Record<string, number>> = {
  bjpLead: { bjp: 0.40, sp: 0.24, congress: 0.08, bsp: 0.10, rld: 0.03, sbsp: 0.03, "jansatta-dal-loktantrik-party": 0.02, "apna-dal": 0.02, "nishad-party": 0.02, other: 0.03, undecided: 0.03 },
  spLead: { sp: 0.42, bjp: 0.26, congress: 0.07, bsp: 0.10, rld: 0.03, sbsp: 0.02, "jansatta-dal-loktantrik-party": 0.02, "apna-dal": 0.02, "nishad-party": 0.02, other: 0.02, undecided: 0.02 },
  congressLead: { congress: 0.30, bjp: 0.27, sp: 0.20, bsp: 0.08, rld: 0.03, sbsp: 0.02, "jansatta-dal-loktantrik-party": 0.02, "apna-dal": 0.02, "nishad-party": 0.02, other: 0.02, undecided: 0.02 },
  bspLead: { bsp: 0.34, bjp: 0.25, sp: 0.20, congress: 0.08, rld: 0.02, sbsp: 0.02, "jansatta-dal-loktantrik-party": 0.02, "apna-dal": 0.02, "nishad-party": 0.02, other: 0.02, undecided: 0.01 },
  closeTwoWay: { bjp: 0.34, sp: 0.32, congress: 0.10, bsp: 0.10, rld: 0.02, sbsp: 0.02, "jansatta-dal-loktantrik-party": 0.02, "apna-dal": 0.02, "nishad-party": 0.02, other: 0.02, undecided: 0.02 },
  threeWay: { bjp: 0.28, sp: 0.26, bsp: 0.24, congress: 0.09, rld: 0.02, sbsp: 0.02, "jansatta-dal-loktantrik-party": 0.02, "apna-dal": 0.02, "nishad-party": 0.02, other: 0.02, undecided: 0.01 },
  fourWay: { bjp: 0.24, sp: 0.23, bsp: 0.21, congress: 0.18, rld: 0.03, sbsp: 0.02, "jansatta-dal-loktantrik-party": 0.02, "apna-dal": 0.02, "nishad-party": 0.02, other: 0.02, undecided: 0.01 },
  rldPocket: { rld: 0.22, bjp: 0.28, sp: 0.24, congress: 0.08, bsp: 0.08, sbsp: 0.02, "jansatta-dal-loktantrik-party": 0.02, "apna-dal": 0.02, "nishad-party": 0.02, other: 0.01, undecided: 0.01 },
  sbspPocket: { sbsp: 0.20, bjp: 0.30, sp: 0.24, congress: 0.08, bsp: 0.08, rld: 0.02, "jansatta-dal-loktantrik-party": 0.02, "apna-dal": 0.02, "nishad-party": 0.02, other: 0.01, undecided: 0.01 },
};

// Loose statewide-plausible base rates for the demographic questions — also
// perturbed per constituency so every seat's profile looks distinct.
const DEMOGRAPHIC_BASE_WEIGHTS: Record<Exclude<GeneratedQuestionKey, "party_preference">, Record<string, number>> = {
  top_issue: {
    rojgar: 0.19, mahangai: 0.16, sadak: 0.12, shiksha: 0.11, swasthya: 0.1,
    kanoon_vyavastha: 0.09, krishi: 0.08, bijli: 0.06, pani: 0.04, jal_nikasi: 0.03, parivahan: 0.01, other: 0.01,
  },
  age_group: { "18-24": 0.17, "25-34": 0.27, "35-44": 0.24, "45-54": 0.17, "55-64": 0.1, "65+": 0.04, prefer_not_to_say: 0.01 },
  gender: { male: 0.51, female: 0.47, other: 0.005, prefer_not_to_say: 0.015 },
  social_category: { obc: 0.42, general: 0.24, sc: 0.24, st: 0.03, prefer_not_to_say: 0.07 },
  religion: { hindu: 0.78, muslim: 0.16, sikh: 0.015, christian: 0.01, buddhist: 0.01, jain: 0.005, other: 0.01, prefer_not_to_say: 0.01 },
};

function randomInt(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}

function pickArchetype(): Record<string, number> {
  const keys = Object.keys(PARTY_ARCHETYPES);
  return PARTY_ARCHETYPES[keys[randomInt(0, keys.length - 1)]];
}

// Multiplies every weight by an independent random factor and renormalizes
// — this is what makes two constituencies sharing an archetype still end up
// with different-looking numbers ("controlled statistical noise").
function withNoise(weights: Record<string, number>, spread = 0.35): Record<string, number> {
  const noisy: Record<string, number> = {};
  let sum = 0;
  for (const [key, weight] of Object.entries(weights)) {
    const factor = 1 - spread / 2 + Math.random() * spread;
    const value = Math.max(0.001, weight * factor);
    noisy[key] = value;
    sum += value;
  }
  for (const key of Object.keys(noisy)) noisy[key] /= sum;
  return noisy;
}

// Largest-remainder rounding: converts weights into integer counts that sum
// EXACTLY to `total` (never off-by-one), so every percentage the UI computes
// from these counts is internally consistent by construction.
function distributeCounts(weights: Record<string, number>, total: number): Record<string, number> {
  const entries = Object.entries(weights);
  const raw = entries.map(([key, weight]) => ({ key, exact: weight * total }));
  const counts: Record<string, number> = {};
  let assigned = 0;
  for (const { key, exact } of raw) {
    const floor = Math.floor(exact);
    counts[key] = floor;
    assigned += floor;
  }
  let remainder = total - assigned;
  const byFraction = raw
    .map(({ key, exact }) => ({ key, fraction: exact - Math.floor(exact) }))
    .sort((a, b) => b.fraction - a.fraction);
  for (let i = 0; i < byFraction.length && remainder > 0; i++, remainder--) {
    counts[byFraction[i].key] += 1;
  }
  return counts;
}

// Expands {key: count} into an array of length = sum(counts), each key
// repeated exactly `count` times, then shuffles it — used so each synthetic
// response gets one answer per question while the aggregate counts land on
// the exact target distribution.
function expandShuffled(counts: Record<string, number>): string[] {
  const arr: string[] = [];
  for (const [key, count] of Object.entries(counts)) {
    for (let i = 0; i < count; i++) arr.push(key);
  }
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function batchCreate<T>(
  model: { createMany: (args: { data: T[] }) => Promise<unknown> },
  rows: T[],
  batchSize: number
) {
  for (let i = 0; i < rows.length; i += batchSize) {
    await model.createMany({ data: rows.slice(i, i + batchSize) });
  }
}

interface QuestionOptionMap {
  questionId: string;
  optionIdByKey: Record<string, string>;
}

async function getQuestionOptionMaps(surveyId: string): Promise<Partial<Record<GeneratedQuestionKey, QuestionOptionMap>>> {
  const questions = await prisma.surveyQuestion.findMany({
    where: { surveyId, key: { in: [...GENERATED_QUESTION_KEYS] } },
    include: { options: { select: { id: true, key: true } } },
  });
  const map: Partial<Record<GeneratedQuestionKey, QuestionOptionMap>> = {};
  for (const question of questions) {
    map[question.key as GeneratedQuestionKey] = {
      questionId: question.id,
      optionIdByKey: Object.fromEntries(question.options.map((o) => [o.key, o.id])),
    };
  }
  return map;
}

/** Deletes only this constituency's synthetic (never real) responses — used before regenerating so "Regenerate One Constituency" is idempotent. */
export async function clearSyntheticDataForConstituency(constituencyId: string): Promise<number> {
  const responses = await prisma.surveyResponse.findMany({
    where: { constituencyId, dataSource: SYNTHETIC_DATA_SOURCE },
    select: { id: true },
  });
  if (responses.length === 0) return 0;
  const ids = responses.map((r) => r.id);
  await prisma.surveyAnswer.deleteMany({ where: { responseId: { in: ids } } });
  await prisma.surveyResponse.deleteMany({ where: { id: { in: ids } } });
  return ids.length;
}

/** Deletes every synthetic response/answer in the database, in id-batches (never touches real responses). */
export async function clearAllSyntheticData(): Promise<number> {
  let totalDeleted = 0;
  for (;;) {
    const batch = await prisma.surveyResponse.findMany({
      where: { dataSource: SYNTHETIC_DATA_SOURCE },
      select: { id: true },
      take: 1000,
    });
    if (batch.length === 0) break;
    const ids = batch.map((r) => r.id);
    await prisma.surveyAnswer.deleteMany({ where: { responseId: { in: ids } } });
    await prisma.surveyResponse.deleteMany({ where: { id: { in: ids } } });
    totalDeleted += ids.length;
  }
  return totalDeleted;
}

/** Generates 500–1500 synthetic responses (party/issue/demographic answers) for one constituency's active survey. Replaces any synthetic data already there for that constituency. */
export async function generateSyntheticDataForConstituency(constituencyId: string): Promise<{ constituencyId: string; responsesCreated: number } | null> {
  const survey = await prisma.survey.findFirst({
    where: { constituencyId },
    orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
  });
  if (!survey) return null;

  await clearSyntheticDataForConstituency(constituencyId);

  const qMap = await getQuestionOptionMaps(survey.id);
  const total = randomInt(500, 1500);

  const partyCounts = distributeCounts(withNoise(pickArchetype()), total);
  const issueCounts = distributeCounts(withNoise(DEMOGRAPHIC_BASE_WEIGHTS.top_issue, 0.6), total);
  const ageCounts = distributeCounts(withNoise(DEMOGRAPHIC_BASE_WEIGHTS.age_group, 0.3), total);
  const genderCounts = distributeCounts(withNoise(DEMOGRAPHIC_BASE_WEIGHTS.gender, 0.1), total);
  const socialCounts = distributeCounts(withNoise(DEMOGRAPHIC_BASE_WEIGHTS.social_category, 0.3), total);
  const religionCounts = distributeCounts(withNoise(DEMOGRAPHIC_BASE_WEIGHTS.religion, 0.2), total);

  const assignments: Record<GeneratedQuestionKey, string[]> = {
    party_preference: expandShuffled(partyCounts),
    top_issue: expandShuffled(issueCounts),
    age_group: expandShuffled(ageCounts),
    gender: expandShuffled(genderCounts),
    social_category: expandShuffled(socialCounts),
    religion: expandShuffled(religionCounts),
  };

  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  const responseRows: { id: string; surveyId: string; constituencyId: string; status: string; dataSource: string; createdAt: Date }[] = [];
  const answerRows: { id: string; responseId: string; questionId: string; optionId: string }[] = [];

  for (let i = 0; i < total; i++) {
    const responseId = randomUUID();
    responseRows.push({
      id: responseId,
      surveyId: survey.id,
      constituencyId,
      status: "VALID",
      dataSource: SYNTHETIC_DATA_SOURCE,
      createdAt: new Date(now - Math.floor(Math.random() * thirtyDaysMs)),
    });

    for (const key of GENERATED_QUESTION_KEYS) {
      const questionMap = qMap[key];
      const optionKey = assignments[key][i];
      const optionId = questionMap?.optionIdByKey[optionKey];
      if (!questionMap || !optionId) continue;
      answerRows.push({ id: randomUUID(), responseId, questionId: questionMap.questionId, optionId });
    }
  }

  await batchCreate(prisma.surveyResponse, responseRows, 2000);
  await batchCreate(prisma.surveyAnswer, answerRows, 3000);

  return { constituencyId, responsesCreated: total };
}

/** Regenerates synthetic data for every constituency in the state. Sequential (SQLite is single-writer) — expect this to take a few minutes across all 403 seats. */
export async function generateSyntheticDataForAllConstituencies(
  onProgress?: (done: number, totalConstituencies: number, lastConstituencyId: string) => void
): Promise<{ constituenciesProcessed: number; responsesCreated: number }> {
  const constituencies = await prisma.constituency.findMany({ select: { id: true } });
  let responsesCreated = 0;
  let done = 0;
  for (const { id } of constituencies) {
    const result = await generateSyntheticDataForConstituency(id);
    if (result) responsesCreated += result.responsesCreated;
    done += 1;
    onProgress?.(done, constituencies.length, id);
  }
  return { constituenciesProcessed: done, responsesCreated };
}
