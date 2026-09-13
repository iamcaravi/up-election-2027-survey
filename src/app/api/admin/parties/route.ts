import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession, logAudit } from "@/lib/auth";
import { slugify, isValidSlug } from "@/lib/slugify";

const createSchema = z.object({
  nameEnglish: z.string().trim().min(1).max(150),
  nameHindi: z.string().trim().max(150).optional(),
  shortName: z.string().trim().min(1).max(50),
  slug: z.string().trim().min(1).max(80).optional(),
  colorHex: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  logoUrl: z.string().trim().max(500).optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parties = await prisma.party.findMany({ orderBy: { displayOrder: "asc" } });
  return NextResponse.json(parties);
}

// A newly-created party is not featured for any state until an admin adds it
// via PUT /api/admin/states/[id]/parties — creating one here never
// auto-surfaces it in any public survey.
export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }
  const data = parsed.data;

  const slug = data.slug ? slugify(data.slug) : slugify(data.shortName);
  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: "Slug must be lowercase letters, numbers and single hyphens only." }, { status: 400 });
  }

  const [slugClash, shortNameClash] = await Promise.all([
    prisma.party.findUnique({ where: { slug } }),
    prisma.party.findUnique({ where: { shortName: data.shortName } }),
  ]);
  if (slugClash) return NextResponse.json({ error: `A party with slug "${slug}" already exists.` }, { status: 409 });
  if (shortNameClash) return NextResponse.json({ error: `A party with short name "${data.shortName}" already exists.` }, { status: 409 });

  const maxOrder = await prisma.party.aggregate({ _max: { displayOrder: true } });
  const party = await prisma.party.create({
    data: {
      nameEnglish: data.nameEnglish,
      nameHindi: data.nameHindi || null,
      shortName: data.shortName,
      slug,
      colorHex: data.colorHex ?? "#6b7280",
      logoUrl: data.logoUrl || null,
      isActive: data.isActive ?? true,
      displayOrder: (maxOrder._max.displayOrder ?? 0) + 1,
    },
  });

  await logAudit({
    adminUserId: session.sub,
    action: "CREATE",
    entityType: "Party",
    entityId: party.id,
    metadata: { nameEnglish: party.nameEnglish, shortName: party.shortName, slug: party.slug },
  });

  return NextResponse.json(party, { status: 201 });
}
