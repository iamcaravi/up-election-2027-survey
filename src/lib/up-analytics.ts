import "server-only";

import { prisma } from "./prisma";
import { getSiteSetting } from "./data";
import { ELIGIBLE_RESPONSE_STATUS } from "./enums";
import { REAL_DATA_SOURCE, SYNTHETIC_DATA_MODE_KEY, SYNTHETIC_DATA_SOURCE } from "./synthetic-data";

// Real-data-only support for the state-wide "उत्तर प्रदेश चुनाव विश्लेषण"
// landing page (src/app/[state]/elections/[election]/analysis/page.tsx).
// Deliberately does NOT compute a district → region (Western UP / Awadh /
// Purvanchal / Bundelkhand / Central UP) mapping: that classification isn't
// part of the data model (Constituency/District carry no region field), and
// inventing one here would mean shipping a geography claim the app can't
// actually back with its own data — so this only ever aggregates by the
// district a constituency is *actually* linked to in the database.

// Below this many valid responses, a constituency/district is never labeled
// with a "leading party" — an early trickle of responses isn't a claim worth
// making, however the UI still shows its real response count.
const LEADING_PARTY_MIN_SAMPLE = 10;

export interface ConstituencyExplorerItem {
  id: string;
  slug: string;
  name: string;
  number: number;
  districtName: string;
  districtSlug: string;
  responseCount: number;
  leadingPartyLabel: string | null;
}

export interface DistrictSummaryItem {
  districtName: string;
  districtSlug: string;
  constituencyCount: number;
  responseCount: number;
  leadingPartyLabel: string | null;
}

export interface UpConstituencyExplorerData {
  isSynthetic: boolean;
  constituencies: ConstituencyExplorerItem[];
  districts: DistrictSummaryItem[];
}

export async function getUpConstituencyExplorer(electionId: string, stateId: string): Promise<UpConstituencyExplorerData> {
  const isSynthetic = await getSiteSetting<boolean>(SYNTHETIC_DATA_MODE_KEY, false);
  const activeDataSource = isSynthetic ? SYNTHETIC_DATA_SOURCE : REAL_DATA_SOURCE;

  // Prisma's groupBy() only reliably accepts scalar-field filters in `where`
  // (unlike findMany, which can filter through relations) — so the election
  // is resolved to its own survey ids first, and every grouped/aggregated
  // query below filters on the scalar `surveyId`/`responseId` fields rather
  // than nesting a `survey: { electionId }`/`response: { ... }` relation
  // filter inside a groupBy.
  const electionSurveys = await prisma.survey.findMany({ where: { electionId }, select: { id: true } });
  const surveyIds = electionSurveys.map((s) => s.id);

  const [constituencies, responseCounts, partyAnswers] = await Promise.all([
    prisma.constituency.findMany({
      where: { stateId },
      include: { district: true },
      orderBy: { number: "asc" },
    }),
    surveyIds.length
      ? prisma.surveyResponse.groupBy({
          by: ["constituencyId"],
          where: { status: ELIGIBLE_RESPONSE_STATUS, dataSource: activeDataSource, surveyId: { in: surveyIds } },
          _count: { _all: true },
        })
      : Promise.resolve([]),
    surveyIds.length
      ? prisma.surveyAnswer.findMany({
          where: {
            response: { status: ELIGIBLE_RESPONSE_STATUS, dataSource: activeDataSource, surveyId: { in: surveyIds } },
            question: { key: "party_preference" },
            optionId: { not: null },
          },
          select: {
            response: { select: { constituencyId: true } },
            option: { select: { key: true, label: true, party: { select: { nameEnglish: true } } } },
          },
        })
      : Promise.resolve([]),
  ]);

  const responseCountByConstituency = new Map(responseCounts.map((r) => [r.constituencyId, r._count._all]));

  const partyCountByConstituency = new Map<string, Map<string, { label: string; count: number }>>();
  for (const answer of partyAnswers) {
    const constituencyId = answer.response.constituencyId;
    const option = answer.option;
    if (!option || option.key === "other" || option.key === "nota" || option.key === "undecided") continue;
    const label = option.party?.nameEnglish ?? option.label;
    let byParty = partyCountByConstituency.get(constituencyId);
    if (!byParty) {
      byParty = new Map();
      partyCountByConstituency.set(constituencyId, byParty);
    }
    const existing = byParty.get(option.key);
    if (existing) existing.count += 1;
    else byParty.set(option.key, { label, count: 1 });
  }

  function pickLeader(byParty: Map<string, { label: string; count: number }> | undefined, totalResponses: number): string | null {
    if (totalResponses < LEADING_PARTY_MIN_SAMPLE || !byParty || byParty.size === 0) return null;
    let best: { label: string; count: number } | null = null;
    for (const entry of byParty.values()) {
      if (!best || entry.count > best.count) best = entry;
    }
    return best?.label ?? null;
  }

  const constituencyItems: ConstituencyExplorerItem[] = constituencies.map((c) => {
    const responseCount = responseCountByConstituency.get(c.id) ?? 0;
    return {
      id: c.id,
      slug: c.slug,
      name: c.name,
      number: c.number,
      districtName: c.district.name,
      districtSlug: c.district.slug,
      responseCount,
      leadingPartyLabel: pickLeader(partyCountByConstituency.get(c.id), responseCount),
    };
  });

  const districtAgg = new Map<
    string,
    { districtName: string; constituencyCount: number; responseCount: number; partyCounts: Map<string, { label: string; count: number }> }
  >();
  for (const item of constituencyItems) {
    let d = districtAgg.get(item.districtSlug);
    if (!d) {
      d = { districtName: item.districtName, constituencyCount: 0, responseCount: 0, partyCounts: new Map() };
      districtAgg.set(item.districtSlug, d);
    }
    d.constituencyCount += 1;
    d.responseCount += item.responseCount;
    const byParty = partyCountByConstituency.get(item.id);
    if (byParty) {
      for (const [key, entry] of byParty) {
        const existing = d.partyCounts.get(key);
        if (existing) existing.count += entry.count;
        else d.partyCounts.set(key, { ...entry });
      }
    }
  }

  const districts: DistrictSummaryItem[] = Array.from(districtAgg.entries())
    .map(([districtSlug, d]) => ({
      districtName: d.districtName,
      districtSlug,
      constituencyCount: d.constituencyCount,
      responseCount: d.responseCount,
      leadingPartyLabel: pickLeader(d.partyCounts, d.responseCount),
    }))
    .sort((a, b) => b.responseCount - a.responseCount);

  return { isSynthetic, constituencies: constituencyItems, districts };
}
