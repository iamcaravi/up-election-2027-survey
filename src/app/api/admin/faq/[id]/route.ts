import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession, hasAdminRole, logAudit } from "@/lib/auth";

const WRITE_ROLES = ["ADMIN", "EDITOR"] as const;

const updateSchema = z.object({
  category: z.string().trim().min(1).max(60).optional(),
  categoryLabel: z.string().trim().min(1).max(80).optional(),
  question: z.string().trim().min(1).max(300).optional(),
  answer: z.string().trim().min(1).max(3000).optional(),
  // Optional Hindi counterparts — see prisma/schema.prisma's FaqItem doc
  // comment. An empty string clears the field back to "use the English
  // fallback" rather than being rejected as invalid.
  categoryLabelHi: z.string().trim().max(80).optional(),
  questionHi: z.string().trim().max(300).optional(),
  answerHi: z.string().trim().max(3000).optional(),
  published: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const item = await prisma.faqItem.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

// Every content-changing edit snapshots the pre-edit row into FaqItemVersion
// first — cheap, append-only, and is what makes Admin → FAQ → History →
// Restore possible without a heavier versioning system.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminRole(session, WRITE_ROLES)) {
    return NextResponse.json({ error: "Only Admin/Editor accounts can manage FAQ content." }, { status: 403 });
  }
  const { id } = await params;

  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }
  const data = parsed.data;

  const existing = await prisma.faqItem.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only snapshot when the visible content itself changes — a pure
  // publish/unpublish or reorder toggle isn't a content edit worth a
  // version entry.
  const contentChanged =
    (data.question !== undefined && data.question !== existing.question) ||
    (data.answer !== undefined && data.answer !== existing.answer) ||
    (data.category !== undefined && data.category !== existing.category) ||
    (data.questionHi !== undefined && data.questionHi !== (existing.questionHi ?? "")) ||
    (data.answerHi !== undefined && data.answerHi !== (existing.answerHi ?? ""));

  if (contentChanged) {
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
  }

  const item = await prisma.faqItem.update({
    where: { id },
    data: {
      ...data,
      ...(data.categoryLabelHi !== undefined ? { categoryLabelHi: data.categoryLabelHi || null } : {}),
      ...(data.questionHi !== undefined ? { questionHi: data.questionHi || null } : {}),
      ...(data.answerHi !== undefined ? { answerHi: data.answerHi || null } : {}),
      updatedBy: session.email,
    },
  });

  await logAudit({ adminUserId: session.sub, action: "UPDATE", entityType: "FaqItem", entityId: id, metadata: data });

  return NextResponse.json(item);
}

// FaqItem has no downstream references (unlike Party/Candidate), so a real
// delete is safe — but it's still preceded by a version snapshot, so a
// mistaken delete can be undone via Admin → FAQ → History → Restore, which
// recreates the item from that snapshot.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminRole(session, WRITE_ROLES)) {
    return NextResponse.json({ error: "Only Admin/Editor accounts can manage FAQ content." }, { status: 403 });
  }
  const { id } = await params;

  const existing = await prisma.faqItem.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
  await prisma.faqItem.delete({ where: { id } });

  await logAudit({
    adminUserId: session.sub,
    action: "DELETE",
    entityType: "FaqItem",
    entityId: id,
    metadata: { question: existing.question },
  });

  return NextResponse.json({ ok: true });
}
