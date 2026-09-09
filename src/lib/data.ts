import "server-only";
import { prisma } from "./prisma";

export async function getHomeStats() {
  const [states, constituencies, districts, responses, activeSurveys] = await Promise.all([
    prisma.state.count({ where: { isActive: true } }),
    prisma.constituency.count(),
    prisma.district.count(),
    prisma.surveyResponse.count({ where: { status: "VALID" } }),
    prisma.survey.count({ where: { isActive: true } }),
  ]);
  return { states, constituencies, districts, responses, activeSurveys };
}

export async function getStates() {
  return prisma.state.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    include: { _count: { select: { districts: true, constituencies: true } }, elections: { where: { isActive: true }, orderBy: { year: "desc" } } },
  });
}

export async function getStateBySlug(slug: string) {
  return prisma.state.findUnique({ where: { slug } });
}

export async function getElectionsForState(stateId: string) {
  return prisma.election.findMany({ where: { stateId, isActive: true }, orderBy: { year: "desc" } });
}

// Resolves the state, then either the named election (by slug) or, if
// omitted, the most recent active election for that state.
export async function getStateAndElection(stateSlug: string, electionSlug?: string) {
  const state = await prisma.state.findUnique({ where: { slug: stateSlug } });
  if (!state) return null;

  const election = electionSlug
    ? await prisma.election.findUnique({ where: { stateId_slug: { stateId: state.id, slug: electionSlug } } })
    : await prisma.election.findFirst({ where: { stateId: state.id, isActive: true }, orderBy: { year: "desc" } });

  if (!election || election.stateId !== state.id) return { state, election: null };
  return { state, election };
}

export async function getDistricts(stateSlug: string) {
  const state = await prisma.state.findUnique({ where: { slug: stateSlug } });
  if (!state) return { state: null, districts: [] };
  const districts = await prisma.district.findMany({
    where: { stateId: state.id },
    orderBy: { name: "asc" },
    include: { _count: { select: { constituencies: true } } },
  });
  return { state, districts };
}

// Districts with total survey-response counts across their constituencies —
// used for the state map explorer.
export async function getDistrictsWithResponseCounts(stateSlug: string) {
  const state = await prisma.state.findUnique({ where: { slug: stateSlug } });
  if (!state) return { state: null, districts: [] };
  const districts = await prisma.district.findMany({
    where: { stateId: state.id },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { constituencies: true } },
      constituencies: { select: { _count: { select: { surveyResponses: true } } } },
    },
  });
  return {
    state,
    districts: districts.map((d) => ({
      slug: d.slug,
      name: d.name,
      constituencyCount: d._count.constituencies,
      responseCount: d.constituencies.reduce((sum, c) => sum + c._count.surveyResponses, 0),
    })),
  };
}

// District detail, scoped to a state and (when provided) a specific election
// — only constituencies with an active ElectionConstituency link to that
// election are returned, so a constituency that isn't actually contesting
// this election never bleeds into the page.
export async function getDistrictBySlug(stateSlug: string, slug: string, electionId?: string) {
  const state = await prisma.state.findUnique({ where: { slug: stateSlug } });
  if (!state) return null;
  const district = await prisma.district.findUnique({
    where: { stateId_slug: { stateId: state.id, slug } },
    include: {
      constituencies: {
        where: electionId
          ? { electionConstituencies: { some: { electionId, isActive: true } } }
          : undefined,
        orderBy: { number: "asc" },
        include: { _count: { select: { surveyResponses: true, candidates: true } } },
      },
    },
  });
  return district;
}

// Constituency detail, scoped to a state and (optionally) a specific
// election. When electionSlug is omitted, the state's current active
// election is used so existing single-election callers keep working.
export async function getConstituencyBySlug(stateSlug: string, slug: string, electionSlug?: string) {
  const state = await prisma.state.findUnique({ where: { slug: stateSlug } });
  if (!state) return null;

  const constituency = await prisma.constituency.findUnique({
    where: { stateId_slug: { stateId: state.id, slug } },
    include: { district: true, state: true },
  });
  if (!constituency) return null;

  const election = electionSlug
    ? await prisma.election.findUnique({ where: { stateId_slug: { stateId: state.id, slug: electionSlug } } })
    : await prisma.election.findFirst({ where: { stateId: state.id, isActive: true }, orderBy: { year: "desc" } });

  if (!election) {
    return { ...constituency, election: null, candidates: [], surveys: [], _count: { surveyResponses: 0 } };
  }

  // A constituency that exists in this state but isn't actually contesting
  // this election (no active ElectionConstituency link) must not resolve —
  // callers should treat this as "not found" rather than render empty data.
  const membership = await prisma.electionConstituency.findUnique({
    where: { electionId_constituencyId: { electionId: election.id, constituencyId: constituency.id } },
  });
  if (!membership || !membership.isActive) return null;

  const [candidates, surveys, responseCount] = await Promise.all([
    prisma.candidate.findMany({
      where: { constituencyId: constituency.id, electionId: election.id, isActive: true },
      include: { party: true },
      orderBy: [{ confidenceScore: "asc" }, { name: "asc" }],
    }),
    prisma.survey.findMany({
      where: { constituencyId: constituency.id, electionId: election.id, isActive: true },
      take: 1,
    }),
    prisma.surveyResponse.count({
      where: { constituencyId: constituency.id, survey: { electionId: election.id } },
    }),
  ]);

  return { ...constituency, election, candidates, surveys, _count: { surveyResponses: responseCount } };
}

// Every state's current active election, keyed by stateId — used to resolve
// an /elections/[slug] segment for search results and trending lists without
// hard-coding any one state's election.
async function getActiveElectionSlugsByState(): Promise<Map<string, string>> {
  const elections = await prisma.election.findMany({
    where: { isActive: true },
    orderBy: { year: "desc" },
    select: { stateId: true, slug: true },
  });
  const map = new Map<string, string>();
  for (const e of elections) {
    if (!map.has(e.stateId)) map.set(e.stateId, e.slug);
  }
  return map;
}

// Scoped to a single state — trending must never rank constituencies from
// different states against each other. Sorts/limits in SQL rather than
// pulling every constituency into memory.
// All constituencies actively contesting a given election, across every
// district — scoped via ElectionConstituency so a constituency that exists
// in the state but isn't part of this election never appears.
export async function getConstituenciesForElection(electionId: string) {
  const links = await prisma.electionConstituency.findMany({
    where: { electionId, isActive: true },
    include: {
      constituency: {
        include: { district: true, _count: { select: { surveyResponses: true, candidates: true } } },
      },
    },
    orderBy: { constituency: { number: "asc" } },
  });
  return links.map((l) => l.constituency);
}

export async function getTrendingConstituencies(stateId: string, limit = 6) {
  const [rows, electionSlugsByState] = await Promise.all([
    prisma.constituency.findMany({
      where: { stateId, surveyResponses: { some: {} } },
      include: {
        district: true,
        state: true,
        _count: { select: { surveyResponses: true } },
      },
      orderBy: { surveyResponses: { _count: "desc" } },
      take: limit,
    }),
    getActiveElectionSlugsByState(),
  ]);
  return rows.map((r) => ({ ...r, electionSlug: electionSlugsByState.get(r.stateId) ?? null }));
}

export async function searchAll(query: string) {
  const q = query.trim();
  if (!q) return { districts: [], constituencies: [], candidates: [] };

  const [districts, constituencies, candidates, electionSlugsByState] = await Promise.all([
    prisma.district.findMany({
      where: { name: { contains: q } },
      include: { state: true },
      take: 5,
    }),
    prisma.constituency.findMany({
      where: { name: { contains: q } },
      include: { district: true, state: true },
      take: 8,
    }),
    prisma.candidate.findMany({
      where: { name: { contains: q }, isActive: true },
      include: { constituency: { include: { district: true, state: true } }, party: true },
      take: 8,
    }),
    getActiveElectionSlugsByState(),
  ]);
  return {
    districts: districts.map((d) => ({ ...d, electionSlug: electionSlugsByState.get(d.stateId) ?? null })),
    constituencies: constituencies.map((c) => ({ ...c, electionSlug: electionSlugsByState.get(c.stateId) ?? null })),
    candidates: candidates.map((c) => ({
      ...c,
      electionSlug: electionSlugsByState.get(c.constituency.stateId) ?? null,
    })),
  };
}

export async function getFullSurveyForConstituency(constituencyId: string, electionId: string) {
  const survey = await prisma.survey.findFirst({
    where: { constituencyId, electionId, isActive: true },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { options: { where: { isActive: true }, orderBy: { order: "asc" } } },
      },
    },
  });
  return survey;
}

// Finds the election a constituency is actively contesting — used by admin
// flows (candidate creation, imports) where the election isn't explicit in
// the request but must still be recorded correctly.
export async function getActiveElectionForConstituency(constituencyId: string) {
  const ec = await prisma.electionConstituency.findFirst({
    where: { constituencyId, isActive: true },
    include: { election: true },
    orderBy: { election: { year: "desc" } },
  });
  return ec?.election ?? null;
}

// A small, real cross-state sample of active surveys for the homepage
// "जनता का मूड" section — state/election/district/constituency context plus
// a real (possibly zero) valid-response count. Never returns fabricated data;
// an empty array means the section should render its empty state.
export async function getFeaturedActiveSurveys(limit = 6) {
  const surveys = await prisma.survey.findMany({
    where: { isActive: true, status: "ACTIVE" },
    include: {
      election: { include: { state: true } },
      constituency: { include: { district: true } },
      _count: { select: { responses: { where: { status: "VALID" } } } },
    },
    orderBy: { createdAt: "asc" },
    take: limit,
  });
  return surveys.map((s) => ({
    id: s.id,
    title: s.title,
    stateName: s.election.state.name,
    stateSlug: s.election.state.slug,
    electionSlug: s.election.slug,
    electionName: s.election.name,
    districtName: s.constituency?.district?.name ?? null,
    constituencyName: s.constituency?.name ?? null,
    constituencySlug: s.constituency?.slug ?? null,
    responseCount: s._count.responses,
  }));
}

// Real, already-recorded 2022 result fields on Constituency (result2022Winner*),
// grouped by state and party — used for the homepage's historical-elections
// section. Never fabricated: constituencies with no recorded 2022 winner are
// simply excluded from the tally.
export async function getHistoricalWinnersSummary() {
  const rows = await prisma.constituency.groupBy({
    by: ["stateId", "result2022WinnerParty"],
    where: { result2022WinnerParty: { not: null } },
    _count: { _all: true },
  });

  const byState = new Map<string, { totalSeats: number; parties: Array<{ party: string; seats: number }> }>();
  for (const row of rows) {
    if (!row.result2022WinnerParty) continue;
    const entry = byState.get(row.stateId) ?? { totalSeats: 0, parties: [] };
    entry.totalSeats += row._count._all;
    entry.parties.push({ party: row.result2022WinnerParty, seats: row._count._all });
    byState.set(row.stateId, entry);
  }
  for (const entry of byState.values()) {
    entry.parties.sort((a, b) => b.seats - a.seats);
  }
  return byState;
}

export async function getSiteSetting<T = unknown>(key: string, fallback: T): Promise<T> {
  const row = await prisma.siteSetting.findUnique({ where: { key } });
  if (!row) return fallback;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return fallback;
  }
}
