import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession, logAudit } from "@/lib/auth";
import { slugify, isValidSlug } from "@/lib/slugify";
import { getDistrictDeletionBlockers } from "@/lib/admin-guards";

// stateId is intentionally NOT accepted here — a district's state is
// immutable after creation, so an update can never silently move a
// district (and its constituencies) to a different state.
const updateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  slug: z.string().trim().min(2).max(80).optional(),
  code: z.string().trim().max(20).nullable().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const district = await prisma.district.findUnique({
    where: { id },
    include: { state: { select: { id: true, name: true, slug: true } }, _count: { select: { constituencies: true } } },
  });
  if (!district) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(district);
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

  const existing = await prisma.district.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let slug: string | undefined;
  if (data.slug !== undefined) {
    slug = slugify(data.slug);
    if (!isValidSlug(slug)) {
      return NextResponse.json({ error: "Slug must be lowercase letters, numbers and single hyphens only." }, { status: 400 });
    }
    if (slug !== existing.slug) {
      const clash = await prisma.district.findUnique({ where: { stateId_slug: { stateId: existing.stateId, slug } } });
      if (clash) return NextResponse.json({ error: `A district with slug "${slug}" already exists in this state.` }, { status: 409 });
    }
  }

  const district = await prisma.district.update({
    where: { id },
    data: { name: data.name, slug, code: data.code },
  });

  await logAudit({ adminUserId: session.sub, action: "UPDATE", entityType: "District", entityId: id, metadata: data });

  return NextResponse.json(district);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.district.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const blocker = await getDistrictDeletionBlockers(prisma, id);
  if (blocker) return NextResponse.json(blocker, { status: 409 });

  await prisma.district.delete({ where: { id } });
  await logAudit({ adminUserId: session.sub, action: "DELETE", entityType: "District", entityId: id, metadata: { name: existing.name } });

  return NextResponse.json({ ok: true });
}
