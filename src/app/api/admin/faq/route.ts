import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession, hasAdminRole, logAudit } from "@/lib/auth";

// FAQ content is a genuine editorial surface, not survey/moderation data —
// MODERATOR (survey-response review) is intentionally excluded from writes,
// same reasoning as the "System" vs "Surveys & Data" nav split already in
// AdminSidebar. Reading the full list (including unpublished drafts) is
// fine for any authenticated admin, matching every other list GET in this
// app (e.g. GET /api/admin/parties).
const WRITE_ROLES = ["ADMIN", "EDITOR"] as const;

const createSchema = z.object({
  category: z.string().trim().min(1).max(60),
  categoryLabel: z.string().trim().min(1).max(80),
  question: z.string().trim().min(1).max(300),
  answer: z.string().trim().min(1).max(3000),
  // Optional Hindi counterparts — see prisma/schema.prisma's FaqItem doc
  // comment. Left blank, the public site falls back to the English fields
  // above for Hindi visitors, same as any other missing translation.
  categoryLabelHi: z.string().trim().max(80).optional(),
  questionHi: z.string().trim().max(300).optional(),
  answerHi: z.string().trim().max(3000).optional(),
  published: z.boolean().optional(),
});

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.faqItem.findMany({ orderBy: [{ category: "asc" }, { displayOrder: "asc" }] });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasAdminRole(session, WRITE_ROLES)) {
    return NextResponse.json({ error: "Only Admin/Editor accounts can manage FAQ content." }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }
  const data = parsed.data;

  const maxOrder = await prisma.faqItem.aggregate({ _max: { displayOrder: true }, where: { category: data.category } });
  const item = await prisma.faqItem.create({
    data: {
      category: data.category,
      categoryLabel: data.categoryLabel,
      question: data.question,
      answer: data.answer,
      categoryLabelHi: data.categoryLabelHi || null,
      questionHi: data.questionHi || null,
      answerHi: data.answerHi || null,
      published: data.published ?? true,
      displayOrder: (maxOrder._max.displayOrder ?? 0) + 1,
      updatedBy: session.email,
    },
  });

  await logAudit({
    adminUserId: session.sub,
    action: "CREATE",
    entityType: "FaqItem",
    entityId: item.id,
    metadata: { category: item.category, question: item.question },
  });

  return NextResponse.json(item, { status: 201 });
}
