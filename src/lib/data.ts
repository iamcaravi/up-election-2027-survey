import "server-only";
import { prisma } from "./prisma";

export async function getHomeStats() {
  const [constituencies, districts, responses, activeSurveys] = await Promise.all([
    prisma.constituency.count(),
    prisma.district.count(),
    prisma.surveyResponse.count({ where: { status: "VALID" } }),
    prisma.survey.count({ where: { isActive: true } }),
  ]);
  return { constituencies, districts, responses, activeSurveys };
}

export async function getDistricts() {
  const districts = await prisma.district.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { constituencies: true } } },
  });
  return districts;
}

export async function getDistrictBySlug(slug: string) {
  const district = await prisma.district.findUnique({
    where: { slug },
    include: {
      constituencies: {
        orderBy: { number: "asc" },
        include: {
          _count: { select: { surveyResponses: true, candidates: true } },
        },
      },
    },
  });
  return district;
}

export async function getConstituencyBySlug(slug: string) {
  const constituency = await prisma.constituency.findUnique({
    where: { slug },
    include: {
      district: true,
      candidates: {
        where: { isActive: true },
        include: { party: true },
        orderBy: [{ confidenceScore: "asc" }, { name: "asc" }],
      },
      surveys: { where: { isActive: true }, take: 1 },
      _count: { select: { surveyResponses: true } },
    },
  });
  return constituency;
}

export async function getTrendingConstituencies(limit = 6) {
  const rows = await prisma.constituency.findMany({
    include: {
      district: true,
      _count: { select: { surveyResponses: true } },
    },
  });
  return rows
    .filter((r) => r._count.surveyResponses > 0)
    .sort((a, b) => b._count.surveyResponses - a._count.surveyResponses)
    .slice(0, limit);
}

export async function searchAll(query: string) {
  const q = query.trim();
  if (!q) return { districts: [], constituencies: [], candidates: [] };

  const [districts, constituencies, candidates] = await Promise.all([
    prisma.district.findMany({
      where: { name: { contains: q } },
      take: 5,
    }),
    prisma.constituency.findMany({
      where: { name: { contains: q } },
      include: { district: true },
      take: 8,
    }),
    prisma.candidate.findMany({
      where: { name: { contains: q }, isActive: true },
      include: { constituency: { include: { district: true } }, party: true },
      take: 8,
    }),
  ]);
  return { districts, constituencies, candidates };
}

export async function getFullSurveyForConstituency(constituencyId: string) {
  const survey = await prisma.survey.findFirst({
    where: { constituencyId, isActive: true },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { options: { where: { isActive: true }, orderBy: { order: "asc" } } },
      },
    },
  });
  return survey;
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
