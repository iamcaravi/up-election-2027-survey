import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession, logAudit } from "@/lib/auth";
import { syncCandidateChoiceOptions } from "@/lib/survey-sync";
import { CANDIDATE_STATUSES, CONFIDENCE_SCORES } from "@/lib/enums";

const updateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  partyId: z.string().nullable().optional(),
  status: z.enum(CANDIDATE_STATUSES).optional(),
  confidenceScore: z.enum(CONFIDENCE_SCORES).optional(),
  currentOffice: z.string().max(200).nullable().optional(),
  background: z.string().max(2000).nullable().optional(),
  sourceNotes: z.string().max(2000).nullable().optional(),
  photoUrl: z.string().url().nullable().optional(),
  photoSourceUrl: z.string().url().nullable().optional(),
  photoSourceName: z.string().max(200).nullable().optional(),
  photoLicense: z.string().max(200).nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }

  const existing = await prisma.candidate.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data = parsed.data;
  const photoChanged = data.photoUrl !== undefined && data.photoUrl !== existing.photoUrl;

  const candidate = await prisma.candidate.update({
    where: { id },
    data: {
      ...data,
      photoRetrievedAt: photoChanged ? new Date() : undefined,
      photoVerified: photoChanged ? false : undefined,
    },
  });

  if (photoChanged && data.photoUrl) {
    await prisma.imageSource.create({
      data: {
        candidateId: id,
        imageUrl: data.photoUrl,
        sourceUrl: data.photoSourceUrl || data.photoUrl,
        sourceName: data.photoSourceName || "Unknown",
        license: data.photoLicense ?? undefined,
        status: "PENDING",
      },
    });
  }

  await syncCandidateChoiceOptions(existing.constituencyId);
  await logAudit({
    adminUserId: session.sub,
    action: "UPDATE",
    entityType: "Candidate",
    entityId: id,
    metadata: data,
  });

  return NextResponse.json(candidate);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.candidate.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.candidate.update({ where: { id }, data: { isActive: false } });
  await syncCandidateChoiceOptions(existing.constituencyId);
  await logAudit({ adminUserId: session.sub, action: "DEACTIVATE", entityType: "Candidate", entityId: id });

  return NextResponse.json({ ok: true });
}
