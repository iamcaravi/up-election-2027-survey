import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession, logAudit } from "@/lib/auth";
import { assertNoConflictingActiveSurvey, getSurveyDeletionBlockers } from "@/lib/admin-guards";

// electionId/constituencyId are intentionally NOT accepted here — a
// survey's election/constituency is immutable after creation (same
// convention as Election.stateId, District.stateId). Re-pointing a survey
// at a different election/constituency after it may already have
// responses would silently corrupt what those historical answers mean.
const updateSchema = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  status: z.enum(["ACTIVE", "CLOSED", "DRAFT"]).optional(),
  isActive: z.boolean().optional(),
  minimumSampleSize: z.number().int().min(1).max(100000).nullable().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const survey = await prisma.survey.findUnique({
    where: { id },
    include: {
      election: { select: { id: true, name: true, year: true, state: { select: { id: true, name: true, slug: true } } } },
      constituency: {
        select: { id: true, name: true, number: true, district: { select: { id: true, name: true } } },
      },
      questions: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" } } },
      },
      _count: { select: { responses: true } },
    },
  });
  if (!survey) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Aggregate response count only (from _count above) — never the raw
  // SurveyResponse rows themselves.
  return NextResponse.json(survey);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await prisma.survey.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Re-activating a survey must not silently create a second active survey
  // for the same (election, constituency) pair.
  if (data.isActive === true && !existing.isActive && existing.constituencyId) {
    const conflictBlocker = await assertNoConflictingActiveSurvey(prisma, existing.electionId, existing.constituencyId, id);
    if (conflictBlocker) return NextResponse.json(conflictBlocker, { status: 409 });
  }

  const survey = await prisma.survey.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      status: data.status,
      isActive: data.isActive,
      minimumSampleSize: data.minimumSampleSize,
      startsAt: data.startsAt === undefined ? undefined : data.startsAt ? new Date(data.startsAt) : null,
      endsAt: data.endsAt === undefined ? undefined : data.endsAt ? new Date(data.endsAt) : null,
    },
  });

  await logAudit({
    adminUserId: session.sub,
    action: "UPDATE",
    entityType: "Survey",
    entityId: id,
    metadata: data,
  });

  return NextResponse.json(survey);
}

// Hard-deletes a survey ONLY when it has zero responses — a survey with any
// responses must be disabled (PATCH isActive:false) instead, never deleted,
// so historical respondent data is never cascade-destroyed.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.survey.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const blocker = await getSurveyDeletionBlockers(prisma, id);
  if (blocker) return NextResponse.json(blocker, { status: 409 });

  const questionIds = (await prisma.surveyQuestion.findMany({ where: { surveyId: id }, select: { id: true } })).map(
    (q) => q.id
  );

  await prisma.$transaction([
    prisma.surveyOption.deleteMany({ where: { questionId: { in: questionIds } } }),
    prisma.surveyQuestion.deleteMany({ where: { surveyId: id } }),
    prisma.survey.delete({ where: { id } }),
  ]);

  await logAudit({ adminUserId: session.sub, action: "DELETE", entityType: "Survey", entityId: id, metadata: { title: existing.title } });

  return NextResponse.json({ ok: true });
}
