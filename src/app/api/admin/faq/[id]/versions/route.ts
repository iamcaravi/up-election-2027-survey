import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession, hasAdminRole, logAudit } from "@/lib/auth";

const WRITE_ROLES = ["ADMIN", "EDITOR"] as const;

// `id` in the route is the FaqItem id these versions belong to (or belonged
// to, if the item was since deleted — versions outlive their parent).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const versions = await prisma.faqItemVersion.findMany({ where: { faqItemId: id }, orderBy: { createdAt: "desc" } });
  return NextResponse.json(versions);
}

const restoreSchema = z.object({ versionId: z.string().min(1) });

// Restoring snapshots the CURRENT state first (so restoring is itself
// undoable), then either updates the live item back to the version's
// content, or — if the item was deleted since — recreates it with a fresh
// id in the same category, at the end of that category's order.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminRole(session, WRITE_ROLES)) {
    return NextResponse.json({ error: "Only Admin/Editor accounts can manage FAQ content." }, { status: 403 });
  }
  const { id } = await params;

  const parsed = restoreSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

  const version = await prisma.faqItemVersion.findUnique({ where: { id: parsed.data.versionId } });
  if (!version || version.faqItemId !== id) return NextResponse.json({ error: "Version not found" }, { status: 404 });

  const existing = await prisma.faqItem.findUnique({ where: { id } });

  if (existing) {
    await prisma.faqItemVersion.create({
      data: {
        faqItemId: existing.id,
        category: existing.category,
        question: existing.question,
        answer: existing.answer,
        questionHi: existing.questionHi,
        answerHi: existing.answerHi,
        createdBy: session.email,
      },
    });
    const restored = await prisma.faqItem.update({
      where: { id },
      data: {
        category: version.category,
        question: version.question,
        answer: version.answer,
        questionHi: version.questionHi,
        answerHi: version.answerHi,
        updatedBy: session.email,
      },
    });
    await logAudit({ adminUserId: session.sub, action: "RESTORE", entityType: "FaqItem", entityId: id, metadata: { versionId: version.id } });
    return NextResponse.json(restored);
  }

  const maxOrder = await prisma.faqItem.aggregate({ _max: { displayOrder: true }, where: { category: version.category } });
  const recreated = await prisma.faqItem.create({
    data: {
      category: version.category,
      categoryLabel: version.category,
      question: version.question,
      answer: version.answer,
      questionHi: version.questionHi,
      answerHi: version.answerHi,
      published: false,
      displayOrder: (maxOrder._max.displayOrder ?? 0) + 1,
      updatedBy: session.email,
    },
  });
  await logAudit({
    adminUserId: session.sub,
    action: "RESTORE_DELETED",
    entityType: "FaqItem",
    entityId: recreated.id,
    metadata: { versionId: version.id, originalId: id },
  });
  return NextResponse.json(recreated, { status: 201 });
}
