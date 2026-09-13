import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession, logAudit } from "@/lib/auth";
import { slugify, isValidSlug } from "@/lib/slugify";

const updateSchema = z.object({
  nameEnglish: z.string().trim().min(1).max(150).optional(),
  nameHindi: z.string().trim().max(150).nullable().optional(),
  shortName: z.string().trim().min(1).max(50).optional(),
  slug: z.string().trim().min(1).max(80).optional(),
  colorHex: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  logoUrl: z.string().trim().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const party = await prisma.party.findUnique({ where: { id } });
  if (!party) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(party);
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

  const existing = await prisma.party.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let slug: string | undefined;
  if (data.slug !== undefined) {
    slug = slugify(data.slug);
    if (!isValidSlug(slug)) {
      return NextResponse.json({ error: "Slug must be lowercase letters, numbers and single hyphens only." }, { status: 400 });
    }
    if (slug !== existing.slug) {
      const clash = await prisma.party.findUnique({ where: { slug } });
      if (clash) return NextResponse.json({ error: `A party with slug "${slug}" already exists.` }, { status: 409 });
    }
  }

  if (data.shortName !== undefined && data.shortName !== existing.shortName) {
    const clash = await prisma.party.findUnique({ where: { shortName: data.shortName } });
    if (clash) return NextResponse.json({ error: `A party with short name "${data.shortName}" already exists.` }, { status: 409 });
  }

  const party = await prisma.party.update({
    where: { id },
    data: {
      nameEnglish: data.nameEnglish,
      nameHindi: data.nameHindi,
      shortName: data.shortName,
      slug,
      colorHex: data.colorHex,
      logoUrl: data.logoUrl,
      isActive: data.isActive,
    },
  });

  await logAudit({ adminUserId: session.sub, action: "UPDATE", entityType: "Party", entityId: id, metadata: data });

  return NextResponse.json(party);
}

// Parties are never hard-deleted — they may be referenced by historical
// candidates/survey options/responses. "Delete" from the admin UI just
// deactivates the party (isActive: false), which also drops it out of every
// state's featured list the next time that state's survey options resync.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.party.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const party = await prisma.party.update({ where: { id }, data: { isActive: false } });
  await logAudit({ adminUserId: session.sub, action: "DEACTIVATE", entityType: "Party", entityId: id, metadata: { shortName: existing.shortName } });

  return NextResponse.json(party);
}
