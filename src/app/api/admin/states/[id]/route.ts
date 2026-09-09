import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession, logAudit } from "@/lib/auth";
import { slugify, isValidSlug } from "@/lib/slugify";
import { getStateDeletionBlockers } from "@/lib/admin-guards";

const updateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  slug: z.string().trim().min(2).max(80).optional(),
  code: z.string().trim().min(1).max(10).optional(),
  shortName: z.string().trim().max(50).nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const state = await prisma.state.findUnique({
    where: { id },
    include: { _count: { select: { elections: true, districts: true, constituencies: true } } },
  });
  if (!state) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(state);
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

  const existing = await prisma.state.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let slug: string | undefined;
  if (data.slug !== undefined) {
    slug = slugify(data.slug);
    if (!isValidSlug(slug)) {
      return NextResponse.json({ error: "Slug must be lowercase letters, numbers and single hyphens only." }, { status: 400 });
    }
    if (slug !== existing.slug) {
      const clash = await prisma.state.findUnique({ where: { slug } });
      if (clash) return NextResponse.json({ error: `A state with slug "${slug}" already exists.` }, { status: 409 });
    }
  }

  let code: string | undefined;
  if (data.code !== undefined) {
    code = data.code.toUpperCase();
    if (code !== existing.code) {
      const clash = await prisma.state.findUnique({ where: { code } });
      if (clash) return NextResponse.json({ error: `A state with code "${code}" already exists.` }, { status: 409 });
    }
  }

  const state = await prisma.state.update({
    where: { id },
    data: {
      name: data.name,
      slug,
      code,
      shortName: data.shortName,
      isActive: data.isActive,
    },
  });

  await logAudit({
    adminUserId: session.sub,
    action: "UPDATE",
    entityType: "State",
    entityId: id,
    metadata: data,
  });

  return NextResponse.json(state);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.state.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const blocker = await getStateDeletionBlockers(prisma, id);
  if (blocker) return NextResponse.json(blocker, { status: 409 });

  await prisma.state.delete({ where: { id } });
  await logAudit({ adminUserId: session.sub, action: "DELETE", entityType: "State", entityId: id, metadata: { name: existing.name } });

  return NextResponse.json({ ok: true });
}
