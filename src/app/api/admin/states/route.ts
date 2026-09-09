import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession, logAudit } from "@/lib/auth";
import { slugify, isValidSlug } from "@/lib/slugify";

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(80).optional(),
  code: z.string().trim().min(1).max(10),
  shortName: z.string().trim().max(50).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim();
  const states = await prisma.state.findMany({
    where: q
      ? { OR: [{ name: { contains: q } }, { slug: { contains: q } }, { code: { contains: q } }] }
      : undefined,
    include: {
      _count: { select: { elections: true, districts: true, constituencies: true } },
    },
    orderBy: { name: "asc" },
    take: 200,
  });
  return NextResponse.json(states);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }
  const data = parsed.data;

  const slug = data.slug ? slugify(data.slug) : slugify(data.name);
  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Slug must be lowercase letters, numbers and single hyphens only." }, { status: 400 });
  }

  const code = data.code.toUpperCase();

  const [slugClash, codeClash] = await Promise.all([
    prisma.state.findUnique({ where: { slug } }),
    prisma.state.findUnique({ where: { code } }),
  ]);
  if (slugClash) {
    return NextResponse.json({ error: `A state with slug "${slug}" already exists.` }, { status: 409 });
  }
  if (codeClash) {
    return NextResponse.json({ error: `A state with code "${code}" already exists.` }, { status: 409 });
  }

  const state = await prisma.state.create({
    data: {
      name: data.name,
      slug,
      code,
      shortName: data.shortName || null,
      isActive: data.isActive ?? true,
    },
  });

  await logAudit({
    adminUserId: session.sub,
    action: "CREATE",
    entityType: "State",
    entityId: state.id,
    metadata: { name: state.name, slug: state.slug, code: state.code },
  });

  return NextResponse.json(state, { status: 201 });
}
