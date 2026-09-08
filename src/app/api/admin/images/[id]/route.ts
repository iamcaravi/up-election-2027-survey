import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession, logAudit } from "@/lib/auth";
import { IMAGE_REVIEW_STATUSES } from "@/lib/enums";

const schema = z.object({ status: z.enum(IMAGE_REVIEW_STATUSES), notes: z.string().max(1000).optional() });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const imageSource = await prisma.imageSource.update({
    where: { id },
    data: {
      status: parsed.data.status,
      notes: parsed.data.notes,
      reviewedBy: session.email,
      reviewedAt: new Date(),
    },
  });

  if (parsed.data.status === "VERIFIED") {
    await prisma.candidate.update({ where: { id: imageSource.candidateId }, data: { photoVerified: true } });
  } else if (parsed.data.status === "REJECTED") {
    await prisma.candidate.update({
      where: { id: imageSource.candidateId },
      data: { photoVerified: false, photoUrl: null },
    });
  }

  await logAudit({
    adminUserId: session.sub,
    action: "IMAGE_REVIEW",
    entityType: "ImageSource",
    entityId: id,
    metadata: { status: parsed.data.status },
  });

  return NextResponse.json(imageSource);
}
