import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession, logAudit } from "@/lib/auth";
import { assertElectionConstituencyMembership, assertNoConflictingActiveSurvey } from "@/lib/admin-guards";
import { createDefaultSurveyQuestions } from "@/lib/survey-template";
import { syncCandidateChoiceOptions } from "@/lib/survey-sync";

const createSchema = z.object({
  electionId: z.string().min(1),
  constituencyId: z.string().min(1),
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).optional(),
  minimumSampleSize: z.number().int().min(1).max(100000).optional(),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional(),
});

// stateId is required, never defaulted — every survey list is scoped to a
// caller-specified state, exactly like every other admin hierarchy list.
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stateId = req.nextUrl.searchParams.get("stateId");
  if (!stateId) {
    return NextResponse.json({ error: "Missing required ?stateId= parameter." }, { status: 400 });
  }
  const electionId = req.nextUrl.searchParams.get("electionId");
  const districtId = req.nextUrl.searchParams.get("districtId");
  const constituencyId = req.nextUrl.searchParams.get("constituencyId");
  const q = req.nextUrl.searchParams.get("q")?.trim();

  const surveys = await prisma.survey.findMany({
    where: {
      constituency: { stateId, ...(districtId ? { districtId } : {}) },
      ...(electionId ? { electionId } : {}),
      ...(constituencyId ? { constituencyId } : {}),
      ...(q ? { title: { contains: q } } : {}),
    },
    include: {
      election: { select: { id: true, name: true, year: true } },
      constituency: { select: { id: true, name: true, number: true, district: { select: { id: true, name: true } } } },
      _count: { select: { responses: true, questions: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  // Never expose raw SurveyResponse rows here — only the aggregate count
  // from _count is included above.
  return NextResponse.json(surveys);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }
  const data = parsed.data;

  // Never trust the frontend selectors: re-verify election exists,
  // constituency exists, both belong to the same state, and an active
  // ElectionConstituency membership actually links them.
  const membershipBlocker = await assertElectionConstituencyMembership(prisma, data.electionId, data.constituencyId);
  if (membershipBlocker) {
    return NextResponse.json(membershipBlocker, { status: membershipBlocker.error.includes("not found") ? 404 : 400 });
  }

  // One active survey per (election, constituency) — the seed script has
  // always relied on this being true; enforce it explicitly for admin-
  // created surveys too rather than silently allowing conflicting surveys.
  const conflictBlocker = await assertNoConflictingActiveSurvey(prisma, data.electionId, data.constituencyId);
  if (conflictBlocker) return NextResponse.json(conflictBlocker, { status: 409 });

  const survey = await prisma.survey.create({
    data: {
      electionId: data.electionId,
      constituencyId: data.constituencyId,
      title: data.title,
      description: data.description || null,
      type: "CONSTITUENCY",
      status: "ACTIVE",
      isActive: data.isActive ?? true,
      minimumSampleSize: data.minimumSampleSize,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
    },
  });

  // Same standard question template every survey has always used (see
  // src/lib/survey-template.ts) — no ad-hoc/hardcoded question set here.
  await createDefaultSurveyQuestions(prisma, survey.id);

  // Immediately pull in any candidates already declared for this exact
  // (election, constituency) pair — never candidates from another election
  // or constituency (syncCandidateChoiceOptions enforces that scoping).
  await syncCandidateChoiceOptions(data.constituencyId, data.electionId);

  await logAudit({
    adminUserId: session.sub,
    action: "CREATE",
    entityType: "Survey",
    entityId: survey.id,
    metadata: { title: survey.title, electionId: data.electionId, constituencyId: data.constituencyId },
  });

  return NextResponse.json(survey, { status: 201 });
}
