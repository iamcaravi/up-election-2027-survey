import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession, logAudit } from "@/lib/auth";
import { slugify, isValidSlug } from "@/lib/slugify";
import { RESERVED_STATUSES } from "@/lib/enums";
import { assertDistrictInState, getConstituencyDeletionBlockers } from "@/lib/admin-guards";

const CONSTITUENCY_TYPES = ["ASSEMBLY", "LOK_SABHA"] as const;

// stateId is intentionally NOT accepted — a constituency's state is
// immutable after creation. districtId MAY be changed (correcting a
// mis-assigned district), but only to another district in the SAME state —
// enforced below, never trusted from the client alone.
const updateSchema = z.object({
  districtId: z.string().min(1).optional(),
  number: z.number().int().min(1).optional(),
  name: z.string().trim().min(2).max(120).optional(),
  slug: z.string().trim().min(2).max(80).optional(),
  type: z.enum(CONSTITUENCY_TYPES).optional(),
  reservedStatus: z.enum(RESERVED_STATUSES).optional(),
  currentMlaName: z.string().trim().max(120).nullable().optional(),
  currentMlaParty: z.string().trim().max(120).nullable().optional(),
  historicalNotes: z.string().trim().max(4000).nullable().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const constituency = await prisma.constituency.findUnique({
    where: { id },
    include: {
      state: { select: { id: true, name: true, slug: true } },
      district: { select: { id: true, name: true, slug: true } },
      electionConstituencies: { include: { election: { select: { id: true, name: true, year: true, isActive: true } } } },
      _count: { select: { candidates: true, surveys: true, surveyResponses: true } },
    },
  });
  if (!constituency) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(constituency);
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

  const existing = await prisma.constituency.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (data.districtId !== undefined && data.districtId !== existing.districtId) {
    const districtBlocker = await assertDistrictInState(prisma, existing.stateId, data.districtId);
    if (districtBlocker) return NextResponse.json(districtBlocker, { status: districtBlocker.error.includes("not found") ? 404 : 400 });
  }

  let slug: string | undefined;
  if (data.slug !== undefined) {
    slug = slugify(data.slug);
    if (!isValidSlug(slug)) {
      return NextResponse.json({ error: "Slug must be lowercase letters, numbers and single hyphens only." }, { status: 400 });
    }
    if (slug !== existing.slug) {
      const clash = await prisma.constituency.findUnique({ where: { stateId_slug: { stateId: existing.stateId, slug } } });
      if (clash) return NextResponse.json({ error: `A constituency with slug "${slug}" already exists in this state.` }, { status: 409 });
    }
  }

  if (data.number !== undefined && data.number !== existing.number) {
    const clash = await prisma.constituency.findUnique({ where: { stateId_number: { stateId: existing.stateId, number: data.number } } });
    if (clash) return NextResponse.json({ error: `A constituency with number ${data.number} already exists in this state.` }, { status: 409 });
  }

  const constituency = await prisma.constituency.update({
    where: { id },
    data: {
      districtId: data.districtId,
      number: data.number,
      name: data.name,
      slug,
      type: data.type,
      reservedStatus: data.reservedStatus,
      currentMlaName: data.currentMlaName,
      currentMlaParty: data.currentMlaParty,
      historicalNotes: data.historicalNotes,
    },
  });

  await logAudit({ adminUserId: session.sub, action: "UPDATE", entityType: "Constituency", entityId: id, metadata: data });

  return NextResponse.json(constituency);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const existing = await prisma.constituency.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const blocker = await getConstituencyDeletionBlockers(prisma, id);
  if (blocker) return NextResponse.json(blocker, { status: 409 });

  await prisma.constituency.delete({ where: { id } });
  await logAudit({ adminUserId: session.sub, action: "DELETE", entityType: "Constituency", entityId: id, metadata: { name: existing.name } });

  return NextResponse.json({ ok: true });
}
