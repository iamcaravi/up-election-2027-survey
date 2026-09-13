import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminSession, logAudit } from "@/lib/auth";
import { CANONICAL_SPECIAL_PARTIES } from "@/lib/enums";

const MAX_FEATURED_PARTIES = 5;
const SPECIAL_SLUGS = new Set(CANONICAL_SPECIAL_PARTIES.map((p) => p.slug));

const putSchema = z.object({
  // The state's full featured-party list, in display order. Replaces
  // whatever was featured before — a partyId left out is un-featured (its
  // StateParty row is set isFeatured: false, never deleted, so re-adding it
  // later doesn't lose history).
  featured: z.array(z.object({ partyId: z.string().min(1) })).max(MAX_FEATURED_PARTIES),
});

// GET returns every active party with a flag/order for whether (and where)
// it's featured in this state — enough for the admin UI to render a single
// checklist without a second round-trip.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: stateId } = await params;

  const state = await prisma.state.findUnique({ where: { id: stateId } });
  if (!state) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [parties, stateParties] = await Promise.all([
    prisma.party.findMany({ where: { isActive: true, slug: { notIn: [...SPECIAL_SLUGS] } }, orderBy: { displayOrder: "asc" } }),
    prisma.stateParty.findMany({ where: { stateId, isFeatured: true }, orderBy: { displayOrder: "asc" } }),
  ]);
  const featuredOrder = new Map(stateParties.map((sp, i) => [sp.partyId, i]));

  return NextResponse.json({
    maxFeatured: MAX_FEATURED_PARTIES,
    parties: parties.map((p) => ({ ...p, isFeatured: featuredOrder.has(p.id), displayOrderInState: featuredOrder.get(p.id) ?? null })),
  });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: stateId } = await params;

  const state = await prisma.state.findUnique({ where: { id: stateId } });
  if (!state) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = putSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }
  const { featured } = parsed.data;

  const partyIds = featured.map((f) => f.partyId);
  if (new Set(partyIds).size !== partyIds.length) {
    return NextResponse.json({ error: "A party cannot be featured twice." }, { status: 400 });
  }

  const parties = await prisma.party.findMany({ where: { id: { in: partyIds } } });
  if (parties.length !== partyIds.length) {
    return NextResponse.json({ error: "One or more selected parties do not exist." }, { status: 404 });
  }
  if (parties.some((p) => SPECIAL_SLUGS.has(p.slug))) {
    return NextResponse.json(
      { error: "Other/NOTA/Undecided are always included automatically and cannot be featured explicitly." },
      { status: 400 }
    );
  }

  // Un-feature anything not in the new list, then upsert the new list with
  // its display order — all in one transaction so a state's featured set
  // never observably passes through an inconsistent intermediate state.
  await prisma.$transaction([
    prisma.stateParty.updateMany({ where: { stateId, partyId: { notIn: partyIds } }, data: { isFeatured: false } }),
    ...featured.map((f, i) =>
      prisma.stateParty.upsert({
        where: { stateId_partyId: { stateId, partyId: f.partyId } },
        update: { isFeatured: true, displayOrder: i },
        create: { stateId, partyId: f.partyId, isFeatured: true, displayOrder: i },
      })
    ),
  ]);

  await logAudit({
    adminUserId: session.sub,
    action: "UPDATE",
    entityType: "StateParty",
    entityId: stateId,
    metadata: { featuredPartyIds: partyIds },
  });

  return NextResponse.json({ ok: true });
}
