import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession, logAudit } from "@/lib/auth";
import { slugify, isValidSlug } from "@/lib/slugify";

const createSchema = z.object({
  stateId: z.string().min(1),
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(80).optional(),
  code: z.string().trim().max(20).optional(),
});

// stateId is required, never defaulted — an omitted scope is exactly the
// ambiguity a multi-state platform must never accept.
export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stateId = req.nextUrl.searchParams.get("stateId");
  const q = req.nextUrl.searchParams.get("q")?.trim();

  if (!stateId) {
    return NextResponse.json({ error: "Missing required ?stateId= parameter." }, { status: 400 });
  }

  const districts = await prisma.district.findMany({
    where: {
      stateId,
      ...(q ? { name: { contains: q } } : {}),
    },
    include: { _count: { select: { constituencies: true } } },
    orderBy: { name: "asc" },
    take: 500,
  });
  return NextResponse.json(districts);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }
  const data = parsed.data;

  const state = await prisma.state.findUnique({ where: { id: data.stateId } });
  if (!state) return NextResponse.json({ error: "State not found." }, { status: 404 });

  const slug = data.slug ? slugify(data.slug) : slugify(data.name);
  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Slug must be lowercase letters, numbers and single hyphens only." }, { status: 400 });
  }

  const clash = await prisma.district.findUnique({ where: { stateId_slug: { stateId: state.id, slug } } });
  if (clash) {
    return NextResponse.json({ error: `A district with slug "${slug}" already exists in ${state.name}.` }, { status: 409 });
  }

  const district = await prisma.district.create({
    data: { stateId: state.id, name: data.name, slug, code: data.code || null },
  });

  await logAudit({
    adminUserId: session.sub,
    action: "CREATE",
    entityType: "District",
    entityId: district.id,
    metadata: { name: district.name, stateId: state.id, slug: district.slug },
  });

  return NextResponse.json(district, { status: 201 });
}
